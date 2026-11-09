"""
ClassPulse AI — Live Backend Integration Smoke Test.

Run this against a running instance of the backend.

Usage:
  python test_backend.py [optional_url]

Default:
  http://localhost:8000
"""
import sys
import io
import requests
from PIL import Image, ImageDraw

BACKEND_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"


def make_test_image(width=640, height=480):
    img = Image.new("RGB", (width, height), color=(100, 100, 100))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 100, 200, 400], fill=(180, 100, 80))
    draw.rectangle([250, 50, 400, 300], fill=(80, 120, 180))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    buf.seek(0)
    return buf


def test_health():
    print(f"1. Testing GET {BACKEND_URL}/api/v1/health ...")
    r = requests.get(f"{BACKEND_URL}/api/v1/health", timeout=10)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["status"] == "ok"
    print("   ✓ Health endpoint OK")


def test_readiness():
    print(f"2. Testing GET {BACKEND_URL}/api/v1/ready ...")
    r = requests.get(f"{BACKEND_URL}/api/v1/ready", timeout=10)
    assert r.status_code in (200, 503), f"Expected 200 or 503, got {r.status_code}"
    data = r.json()
    print(f"   ✓ Readiness endpoint responded with status='{data.get('status')}', model_loaded={data.get('model_loaded')}")


def test_detect_classroom():
    print(f"3. Testing POST {BACKEND_URL}/api/v1/detect (Classroom) ...")
    img_buf = make_test_image()
    r = requests.post(
        f"{BACKEND_URL}/api/v1/detect",
        files={"image": ("test.jpg", img_buf, "image/jpeg")},
        data={"environment": "classroom"},
        timeout=30,
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["environment"] == "classroom"
    assert "people_count" in data
    assert "activity_level" in data
    assert data["approximate"] is True
    print(f"   ✓ Classroom detect OK: people={data['people_count']}, chairs={data['chair_count']}, activity={data['activity_level']}")
    print(f"     Commentary: \"{data['commentary']}\"")


def test_detect_library():
    print(f"4. Testing POST {BACKEND_URL}/api/v1/detect (Library) ...")
    img_buf = make_test_image()
    r = requests.post(
        f"{BACKEND_URL}/api/v1/detect",
        files={"image": ("test.jpg", img_buf, "image/jpeg")},
        data={"environment": "library"},
        timeout=30,
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["environment"] == "library"
    print(f"   ✓ Library detect OK: commentary=\"{data['commentary']}\"")


def test_invalid_environment():
    print("5. Testing invalid environment validation ...")
    img_buf = make_test_image()
    r = requests.post(
        f"{BACKEND_URL}/api/v1/detect",
        files={"image": ("test.jpg", img_buf, "image/jpeg")},
        data={"environment": "unknown_zone"},
        timeout=10,
    )
    assert r.status_code == 422, f"Expected 422, got {r.status_code}"
    print("   ✓ Invalid environment correctly rejected (422)")


def test_oversized_payload():
    print("6. Testing oversized payload rejection ...")
    huge_bytes = b"0" * (6 * 1024 * 1024)  # 6 MB (limit is 5 MB)
    r = requests.post(
        f"{BACKEND_URL}/api/v1/detect",
        files={"image": ("huge.jpg", huge_bytes, "image/jpeg")},
        data={"environment": "classroom"},
        timeout=10,
    )
    assert r.status_code == 413, f"Expected 413, got {r.status_code}"
    print("   ✓ Payload > 5MB correctly rejected (413 Payload Too Large)")


if __name__ == "__main__":
    print("=" * 65)
    print(f"RoomPulse — Live Backend Smoke Test on {BACKEND_URL}")
    print("=" * 65)

    tests = [
        test_health,
        test_readiness,
        test_detect_classroom,
        test_detect_library,
        test_invalid_environment,
        test_oversized_payload,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as exc:
            print(f"   ✗ FAILED: {exc}")
            failed += 1
        except requests.exceptions.ConnectionError:
            print(f"   ✗ CONNECTION ERROR: Cannot connect to {BACKEND_URL}")
            print("     Start backend: uvicorn app.main:app --host 0.0.0.0 --port 8000")
            sys.exit(1)
        except Exception as exc:
            print(f"   ✗ ERROR: {exc}")
            failed += 1
        print()

    print("=" * 65)
    print(f"Summary: {passed} passed, {failed} failed")
    print("=" * 65)
    sys.exit(0 if failed == 0 else 1)
