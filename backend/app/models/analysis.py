"""
Modelo SQLAlchemy que representa uma análise de predição salva no
histórico. Cada linha corresponde a uma chamada ao /predict.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON #type: ignore

from app.core.database import Base


class AnalysisRecord(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    predicted_class = Column(String, index=True)
    probability_attack = Column(Float)
    risk_level = Column(String, index=True)
    inference_time_ms = Column(Float)
    model_used = Column(String)
    input_summary = Column(JSON)  # guarda os campos de entrada mais relevantes, não os 34 completos
    explanation_text = Column(String)