"""
ClassPulse AI — FastAPI Application Entry Point.

Lifecycle:
  - Startup: Loads YOLOv8 model once and warms it up.
  - Shutdown: Releases resources.
  - Middlewares: Production CORS & global exception sanitization.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import get_settings
from app.services.detector import detector

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("classpulse")


# ---------------------------------------------------------------------------
# Application Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info(f"ClassPulse AI starting up on {settings.host}:{settings.port}")
    logger.info(f"Target YOLO model: {settings.yolo_model}")
    
    # Non-fatal load attempt: failure flags readiness as 503 rather than crashing container
    detector.load()
    if detector.is_loaded:
        logger.info("YOLO model ready to serve inference requests.")
    else:
        logger.warning(f"YOLO model failed to load at startup: {detector.load_error}")

    yield

    logger.info("ClassPulse AI backend shutting down.")


# ---------------------------------------------------------------------------
# FastAPI Initialization
# ---------------------------------------------------------------------------
settings = get_settings()

app = FastAPI(
    title="ClassPulse AI — Detection API",
    description="Real-time object detection and contextual commentary for classrooms and libraries.",
    version="1.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global Exception Handler (Prevent Stack Trace Leakage)
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# ---------------------------------------------------------------------------
# Mount Routes
# ---------------------------------------------------------------------------
app.include_router(router)


# Convenience root and probe endpoints for cloud platforms
@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "ClassPulse AI",
        "status": "online",
        "docs": "/docs",
        "health": "/api/v1/health",
        "readiness": "/api/v1/ready",
    }


@app.get("/healthz", include_in_schema=False)
async def healthz():
    """Platform health check alias."""
    return {"status": "ok"}
