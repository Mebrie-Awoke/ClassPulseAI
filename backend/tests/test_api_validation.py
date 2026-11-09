"""
Unit and API validation tests for ClassPulse AI backend.
Uses FastAPI TestClient and mock detector to run fast tests without downloading YOLO weights.
"""
import io
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.services.detector import detector, AnalysisResult, DetectionResult


@pytest.fixture
def client():
    return TestClient(app)


def make_valid_image_bytes(width=100, height=100, format="JPEG"):
    buf = io.BytesIO()
    img = Image.new("RGB", (width, height), color=(120, 120, 120))
    img.save(buf, format=format)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Health & Readiness Tests
# ---------------------------------------------------------------------------
def test_liveness_endpoint(client):
    """GET /api/v1/health should always return 200."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_root_endpoint(client):
    """GET / should return service info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] in ("RoomPulse", "ClassPulse AI")


def test_readiness_when_model_loaded(client):
    """GET /api/v1/ready should return 200 when model is marked loaded."""
    with patch.object(detector, "_loaded", True):
        response = client.get("/api/v1/ready")
        assert response.status_code == 200
        assert response.json()["model_loaded"] is True


def test_readiness_when_model_not_loaded(client):
    """GET /api/v1/ready should return 503 when model is not loaded."""
    with patch.object(detector, "_loaded", False):
        response = client.get("/api/v1/ready")
        assert response.status_code == 503
        assert response.json()["model_loaded"] is False


# ---------------------------------------------------------------------------
# Validation Tests for POST /api/v1/detect
# ---------------------------------------------------------------------------
def test_detect_missing_image(client):
    """Missing image payload must return 422 Unprocessable Entity."""
    response = client.post("/api/v1/detect", data={"environment": "classroom"})
    assert response.status_code == 422


def test_detect_missing_environment(client):
    """Missing environment parameter must return 422."""
    img_bytes = make_valid_image_bytes()
    response = client.post(
        "/api/v1/detect",
        files={"image": ("test.jpg", img_bytes, "image/jpeg")},
    )
    assert response.status_code == 422


def test_detect_invalid_environment(client):
    """Invalid environment name must return 422."""
    img_bytes = make_valid_image_bytes()
    response = client.post(
        "/api/v1/detect",
        data={"environment": "cafeteria"},
        files={"image": ("test.jpg", img_bytes, "image/jpeg")},
    )
    assert response.status_code == 422
    assert "cafeteria" in response.json()["detail"]


def test_detect_unsupported_media_type(client):
    """Unsupported image format (e.g. text/plain or pdf) must return 415."""
    response = client.post(
        "/api/v1/detect",
        data={"environment": "classroom"},
        files={"image": ("test.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 415


def test_detect_empty_image(client):
    """0-byte image payload must return 400 Bad Request."""
    response = client.post(
        "/api/v1/detect",
        data={"environment": "classroom"},
        files={"image": ("test.jpg", b"", "image/jpeg")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_detect_corrupted_image(client):
    """Corrupted image bytes that fail OpenCV decode must return 400 Bad Request."""
    response = client.post(
        "/api/v1/detect",
        data={"environment": "classroom"},
        files={"image": ("test.jpg", b"garbage-data-not-a-jpeg", "image/jpeg")},
    )
    assert response.status_code == 400
    assert "corrupted" in response.json()["detail"].lower() or "decode" in response.json()["detail"].lower()


def test_detect_image_too_small(client):
    """Image smaller than minimum dimensions (32x32) must return 400."""
    tiny_img = make_valid_image_bytes(width=16, height=16)
    response = client.post(
        "/api/v1/detect",
        data={"environment": "classroom"},
        files={"image": ("tiny.jpg", tiny_img, "image/jpeg")},
    )
    assert response.status_code == 400
    assert "too small" in response.json()["detail"].lower()


def test_detect_success_with_mock_model(client):
    """Successful detection request with mocked inference returns valid DetectionResponse."""
    mock_result = AnalysisResult(
        detections=[
            DetectionResult(label="person", confidence=0.92, box=[10.0, 10.0, 50.0, 80.0]),
            DetectionResult(label="chair", confidence=0.88, box=[60.0, 20.0, 90.0, 90.0]),
        ],
        people_count=1,
        chair_count=1,
        book_count=0,
        laptop_count=0,
        tv_count=0,
        processing_time_ms=45.2,
    )

    img_bytes = make_valid_image_bytes(width=300, height=300)

    with patch.object(detector, "_loaded", True), \
         patch.object(detector, "detect", return_value=mock_result):
        response = client.post(
            "/api/v1/detect",
            data={"environment": "classroom"},
            files={"image": ("frame.jpg", img_bytes, "image/jpeg")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["environment"] == "classroom"
        assert data["people_count"] == 1
        assert data["chair_count"] == 1
        assert data["activity_level"] == "moderate"
        assert data["approximate"] is True
        assert len(data["detections"]) == 2
        assert len(data["commentary"]) > 0
        assert data["image_width"] == 300
        assert data["image_height"] == 300
