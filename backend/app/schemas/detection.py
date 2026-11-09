"""
ClassPulse AI — Pydantic Schemas for Detection & Health APIs.
"""
from __future__ import annotations
from typing import List
from pydantic import BaseModel, Field


class Detection(BaseModel):
    label: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    box: List[float] = Field(..., min_length=4, max_length=4, description="[x1, y1, x2, y2]")


class DetectionResponse(BaseModel):
    environment: str
    people_count: int
    chair_count: int
    book_count: int
    laptop_count: int
    tv_count: int
    activity_level: str           # quiet | moderate | busy | packed
    detections: List[Detection]
    commentary: str
    processing_time_ms: float
    approximate: bool = True       # Always true — counts and activities are estimates
    image_width: int = 0
    image_height: int = 0


class HealthResponse(BaseModel):
    status: str
    service: str = "classpulse-backend"


class ReadinessResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str


class ErrorResponse(BaseModel):
    detail: str
