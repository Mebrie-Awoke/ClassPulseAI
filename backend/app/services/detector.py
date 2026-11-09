"""
ClassPulse AI — YOLO Object Detector Service.

Loads a YOLOv8 model once at startup and provides structured object detection
for classroom and library environments.

Supported COCO classes:
  0  person
  56 chair
  73 book
  63 laptop
  62 tv / monitor
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# COCO classes actively tracked by ClassPulse AI
TRACKED_CLASSES: dict[int, str] = {
    0: "person",
    56: "chair",
    73: "book",
    63: "laptop",
    62: "tv",
}


@dataclass
class DetectionResult:
    label: str
    confidence: float
    box: List[float]  # [x1, y1, x2, y2] in pixel coordinates of original image


@dataclass
class AnalysisResult:
    detections: List[DetectionResult] = field(default_factory=list)
    people_count: int = 0
    chair_count: int = 0
    book_count: int = 0
    laptop_count: int = 0
    tv_count: int = 0
    processing_time_ms: float = 0.0


class ObjectDetector:
    """Wrapper around YOLOv8 model with validation and safe inference lifecycle."""

    def __init__(self, model_name: str = "yolov8n.pt"):
        self._model_name = model_name
        self._model = None
        self._loaded = False
        self._load_error: Optional[str] = None

    def load(self) -> None:
        """Load and warm-up the YOLO model. Call once during application startup."""
        try:
            from ultralytics import YOLO  # type: ignore
            logger.info(f"Loading YOLO model: {self._model_name}")
            self._model = YOLO(self._model_name)
            
            # Warm-up inference on a dummy frame to initialize PyTorch graph and weights
            dummy = np.zeros((128, 128, 3), dtype=np.uint8)
            self._model(dummy, verbose=False)
            self._loaded = True
            self._load_error = None
            logger.info("YOLO model loaded and warmed up successfully.")
        except Exception as exc:
            self._loaded = False
            self._load_error = str(exc)
            logger.error(f"Failed to initialize YOLO model '{self._model_name}': {exc}", exc_info=True)

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    @property
    def model_name(self) -> str:
        return self._model_name

    def decode_and_validate_image(
        self,
        image_bytes: bytes,
        min_dim: int = 32,
        max_dim: int = 4096,
    ) -> Tuple[np.ndarray, int, int]:
        """
        Decode an image, validate its dimensions, and scale it to the inference limit.

        Raises:
            ValueError: If image is corrupted, unreadable, or below the minimum dimensions.
        """
        img_array = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None or img.size == 0:
            raise ValueError("Corrupted or unsupported image file. OpenCV could not decode the image stream.")

        h, w = img.shape[:2]
        if w < min_dim or h < min_dim:
            raise ValueError(f"Image dimensions too small ({w}x{h}). Minimum required dimension is {min_dim}x{min_dim}px.")

        if w > max_dim or h > max_dim:
            scale = max_dim / max(w, h)
            width = max(1, round(w * scale))
            height = max(1, round(h * scale))
            img = cv2.resize(img, (width, height), interpolation=cv2.INTER_AREA)
            h, w = img.shape[:2]

        return img, w, h

    def detect(
        self,
        img: np.ndarray,
        confidence: float = 0.40,
    ) -> AnalysisResult:
        """
        Run object detection on a validated BGR image array.

        Args:
            img: OpenCV decoded image array (BGR).
            confidence: Minimum confidence threshold (0.0 to 1.0).

        Returns:
            AnalysisResult containing parsed detections and class counts.
        """
        if not self._loaded or self._model is None:
            raise RuntimeError("YOLO model is not loaded and ready for inference.")

        t_start = time.perf_counter()

        # Run model inference with verbose=False to keep logs clean
        results = self._model(img, verbose=False, conf=confidence)

        detections: List[DetectionResult] = []
        counts: dict[str, int] = {name: 0 for name in TRACKED_CLASSES.values()}

        for result in results:
            if result.boxes is None:
                continue
            for box in result.boxes:
                cls_id = int(box.cls[0].item())
                if cls_id not in TRACKED_CLASSES:
                    continue
                label = TRACKED_CLASSES[cls_id]
                conf = float(box.conf[0].item())
                x1, y1, x2, y2 = box.xyxy[0].tolist()

                # Coordinate safety: bound within image bounds
                h, w = img.shape[:2]
                x1_clamped = max(0.0, min(float(x1), float(w)))
                y1_clamped = max(0.0, min(float(y1), float(h)))
                x2_clamped = max(0.0, min(float(x2), float(w)))
                y2_clamped = max(0.0, min(float(y2), float(h)))

                detections.append(DetectionResult(
                    label=label,
                    confidence=round(conf, 3),
                    box=[round(x1_clamped, 1), round(y1_clamped, 1), round(x2_clamped, 1), round(y2_clamped, 1)],
                ))
                counts[label] += 1

        t_end = time.perf_counter()
        processing_ms = round((t_end - t_start) * 1000, 1)

        return AnalysisResult(
            detections=detections,
            people_count=counts["person"],
            chair_count=counts["chair"],
            book_count=counts["book"],
            laptop_count=counts["laptop"],
            tv_count=counts["tv"],
            processing_time_ms=processing_ms,
        )


# Singleton instance shared by route handlers
detector = ObjectDetector()
