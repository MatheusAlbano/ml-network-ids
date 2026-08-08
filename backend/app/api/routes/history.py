"""Endpoints de consulta ao histórico de análises."""

import csv
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session #type: ignore
from sqlalchemy import desc #type: ignore

from app.core.database import get_db
from app.models.analysis import AnalysisRecord
from app.schemas.history import AnalysisHistoryResponse, AnalysisHistoryItem

router = APIRouter()


@router.get("/history", response_model=AnalysisHistoryResponse, tags=["Histórico"])
def get_history(
    db: Session = Depends(get_db),
    predicted_class: str | None = Query(None, description="Filtrar por 'Normal' ou 'Ataque'"),
    risk_level: str | None = Query(None, description="Filtrar por nível de risco"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> AnalysisHistoryResponse:
    """Retorna o histórico de análises, mais recentes primeiro, com filtros opcionais."""
    query = db.query(AnalysisRecord)

    if predicted_class:
        query = query.filter(AnalysisRecord.predicted_class == predicted_class)
    if risk_level:
        query = query.filter(AnalysisRecord.risk_level == risk_level)

    total = query.count()
    records = query.order_by(desc(AnalysisRecord.timestamp)).offset(offset).limit(limit).all()

    return AnalysisHistoryResponse(
        total=total,
        items=[AnalysisHistoryItem.model_validate(r) for r in records],
    )


@router.get("/history/export", tags=["Histórico"])
def export_history_csv(db: Session = Depends(get_db)) -> StreamingResponse:
    """Exporta todo o histórico de análises em formato CSV."""
    records = db.query(AnalysisRecord).order_by(desc(AnalysisRecord.timestamp)).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "id", "timestamp", "predicted_class", "probability_attack",
        "risk_level", "inference_time_ms", "model_used", "explanation_text",
    ])
    for r in records:
        writer.writerow([
            r.id, r.timestamp, r.predicted_class, r.probability_attack,
            r.risk_level, r.inference_time_ms, r.model_used, r.explanation_text,
        ])

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=historico_analises.csv"},
    )