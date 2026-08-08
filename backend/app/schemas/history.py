"""Schemas Pydantic para os endpoints de histórico."""

from datetime import datetime
from pydantic import BaseModel


class AnalysisHistoryItem(BaseModel):
    id: int
    timestamp: datetime
    predicted_class: str
    probability_attack: float
    risk_level: str
    inference_time_ms: float
    model_used: str
    explanation_text: str

    class Config:
        from_attributes = True  # permite montar o schema a partir do objeto SQLAlchemy


class AnalysisHistoryResponse(BaseModel):
    total: int
    items: list[AnalysisHistoryItem]