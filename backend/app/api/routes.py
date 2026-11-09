"""
ClassPulse AI — API Routes.

Endpoints:
  GET  /api/v1/health   — Liveness check (process alive)
  GET  /api/v1/ready    — Readiness check (YOLO model loaded & ready)
  POST /api/v1/detect   — Validated image upload + serialized YOLO inference
"""
from __future__ import annotations

import asyncio
from collections import defaultdict
import logging
import time
from typing import Dict, List

from fastapi import APIRouter, File, Form, HTTPException, Request, Response, UploadFile, status

from app.schemas.detection import (
    DetectionResponse,
    Detection,
    HealthResponse,
    ReadinessResponse,
    ErrorResponse,
)
from app.services.detector import detector
from app.services.commentary import generate_commentary, estimate_activity_level
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1")

VALID_ENVIRONMENTS = {"classroom", "library"}

# Concurrency semaphore initialized lazily or at module load
_inference_semaphore: asyncio.Semaphore | None = None


def get_inference_semaphore() -> asyncio.Semaphore:
    global _inference_semaphore
    if _inference_semaphore is None:
        settings = get_settings()
        _inference_semaphore = asyncio.Semaphore(settings.max_concurrent_inferences)
    return _inference_semaphore


# ---------------------------------------------------------------------------
# Lightweight In-Memory Rate Limiter (Sliding Window per IP)
# ---------------------------------------------------------------------------
class InMemoryRateLimiter:
    def __init__(self, max_per_minute: int = 60):
        self.max_per_minute = max_per_minute
        self.records: Dict[str, List[float]] = defaultdict(list)
        self._last_cleanup = time.time()

    def check_rate_limit(self, client_ip: str) -> bool:
        now = time.time()
        # Periodic cleanup of expired client records every 5 minutes
        if now - self._last_cleanup > 300:
            self._cleanup(now)

        window_start = now - 60.0
        timestamps = [t for t in self.records[client_ip] if t > window_start]
        self.records[client_ip] = timestamps

        if len(timestamps) >= self.max_per_minute:
            return False

        self.records[client_ip].append(now)
        return True

    def _cleanup(self, now: float) -> None:
        window_start = now - 60.0
        stale_ips = [ip for ip, times in self.records.items() if not times or times[-1] <= window_start]
        for ip in stale_ips:
            del self.records[ip]
        self._last_cleanup = now


rate_limiter = InMemoryRateLimiter()


# ---------------------------------------------------------------------------
# Health & Readiness Checks
# ---------------------------------------------------------------------------
@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness Probe",
    description="Returns HTTP 200 if the FastAPI application process is alive.",
)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="classpulse-backend")


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Readiness Probe",
    description="Returns HTTP 200 if the YOLO model is loaded; returns HTTP 503 if not ready.",
    responses={503: {"model": ReadinessResponse, "description": "Model is not loaded"}},
)
async def readiness_check(response: Response) -> ReadinessResponse:
    if not detector.is_loaded:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return ReadinessResponse(
            status="not_ready",
            model_loaded=False,
            model_name=detector.model_name,
        )
    return ReadinessResponse(
        status="ready",
        model_loaded=True,
        model_name=detector.model_name,
    )


# ---------------------------------------------------------------------------
# Detection Endpoint
# ---------------------------------------------------------------------------
@router.post(
    "/detect",
    response_model=DetectionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid or corrupted image"},
        413: {"model": ErrorResponse, "description": "Image exceeds upload limit (5MB)"},
        415: {"model": ErrorResponse, "description": "Unsupported image format"},
        422: {"model": ErrorResponse, "description": "Invalid environment parameter"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
        503: {"model": ErrorResponse, "description": "Detection model unavailable"},
    },
)
async def detect(
    request: Request,
    image: UploadFile = File(..., description="JPEG or PNG camera frame"),
    environment: str = Form(..., description="'classroom' or 'library'"),
) -> DetectionResponse:
    """
    Receive an image frame, validate it rigorously, run serialized YOLO inference,
    and return structured counts with contextual commentary.
    """
    settings = get_settings()

    # 1. Rate limiting by Client IP
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 60 requests per minute permitted.",
        )

    # 2. Validate environment
    env = environment.lower().strip()
    if env not in VALID_ENVIRONMENTS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Environment '{environment}' is invalid. Allowed values: {', '.join(sorted(VALID_ENVIRONMENTS))}",
        )

    # 3. Validate image MIME type
    content_type = (image.content_type or "").split(";")[0].strip().lower()
    valid_types = {"image/jpeg", "image/png", "image/jpg"}
    is_octet_image = content_type == "application/octet-stream" and image.filename and image.filename.lower().endswith(('.jpg', '.jpeg', '.png'))
    if content_type not in valid_types and not is_octet_image:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type '{image.content_type}'. Send JPEG or PNG.",
        )

    # 4. Read image bytes and validate size boundary
    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image payload is empty.",
        )

    if len(image_bytes) > settings.max_upload_size_bytes:
        max_mb = settings.max_upload_size_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds maximum limit of {max_mb} MB.",
        )

    # 5. Check model readiness
    if not detector.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Detection model is currently initializing. Please retry in a few seconds.",
        )

    # 6. Decode and validate image dimensions (CPU safety)
    try:
        img, width, height = detector.decode_and_validate_image(
            image_bytes,
            min_dim=settings.min_image_dim,
            max_dim=settings.max_image_dim,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    # 7. Run serialized YOLO inference (prevent concurrent CPU/RAM spikes)
    sem = get_inference_semaphore()
    try:
        async with sem:
            # Run CPU inference in worker thread to prevent blocking event loop
            result = await asyncio.to_thread(
                detector.detect,
                img,
                settings.confidence_threshold,
            )
    except Exception as exc:
        logger.error(f"Inference execution failure: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Object detection failed due to an internal server error.",
        )

    # 8. Compute activity estimation and contextual commentary
    activity_level = estimate_activity_level(result.people_count)
    commentary = generate_commentary(
        environment=env,
        people_count=result.people_count,
        chair_count=result.chair_count,
        book_count=result.book_count,
        laptop_count=result.laptop_count,
        activity_level=activity_level,
    )

    detections_out = [
        Detection(label=d.label, confidence=d.confidence, box=d.box)
        for d in result.detections
    ]

    return DetectionResponse(
        environment=env,
        people_count=result.people_count,
        chair_count=result.chair_count,
        book_count=result.book_count,
        laptop_count=result.laptop_count,
        tv_count=result.tv_count,
        activity_level=activity_level,
        detections=detections_out,
        commentary=commentary,
        processing_time_ms=result.processing_time_ms,
        approximate=True,
        image_width=width,
        image_height=height,
    )
