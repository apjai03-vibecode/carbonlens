"""Shared Pydantic models for the CarbonLens API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ActivityLog(BaseModel):
    category: str = Field(..., examples=["transport", "food", "energy"])
    activity: str = Field(..., examples=["car_petrol", "beef", "electricity"])
    activity_label: str = Field(..., examples=["Car (petrol), per km"])
    quantity: float
    unit: str
    co2_kg: float
    date: Optional[datetime] = None
    user_id: Optional[str] = Field(
        default=None, description="Firebase Auth UID, if the user is signed in"
    )


class WeeklyTotals(BaseModel):
    transport: float = 0.0
    food: float = 0.0
    energy: float = 0.0


class NudgeRequest(BaseModel):
    totals: WeeklyTotals


class NudgeResponse(BaseModel):
    message: str
    top_category: str
