"""Schemas for Ask Kolkata Chatbot."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatbotQueryRequest(BaseModel):
    message: str = Field(..., description="User's natural language input prompt")
    session_id: Optional[str] = Field(None, description="Optional conversational session ID")
    current_location: Optional[Dict[str, float]] = Field(
        None, description="Optional current GPS location of user {'lat': ..., 'lon': ...}"
    )


class ChatbotAction(BaseModel):
    type: str = Field(
        ...,
        description="Action type: NAVIGATE, HIGHLIGHT_AREA, HIGHLIGHT_ROUTE, FLY_TO, SELECT_INCIDENT",
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict, description="Structured parameters for frontend execution"
    )


class LocalityMatchInfo(BaseModel):
    matched_name: str
    canonical_locality: str
    latitude: float
    longitude: float
    ward: Optional[str] = ""
    ulb_name: Optional[str] = ""
    district: Optional[str] = ""
    match_type: str = "exact"  # exact, alias, partial, fuzzy, geocoded


class ChatbotQueryResponse(BaseModel):
    message: str = Field(..., description="Deterministic human-readable response")
    intent: str = Field(..., description="Detected intent name")
    locality: Optional[str] = Field(None, description="Primary detected locality name, if any")
    data: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Structured real data payload from existing systems"
    )
    action: Optional[ChatbotAction] = Field(
        None, description="Structured frontend action to trigger on UI/Map"
    )
    timing_ms: Optional[Dict[str, float]] = Field(
        default_factory=dict, description="Execution timing breakdown in milliseconds"
    )
