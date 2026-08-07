"""Endpoint de status do sistema — útil para monitoramento e checagem rápida."""

import json
from fastapi import APIRouter

from app.core.config import METADATA_PATH

router = APIRouter()


@router.get("/status", tags=["Sistema"])
def get_status() -> dict:
    """Retorna informações sobre o modelo atualmente em produção."""
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    return {
        "status": "online",
        "model_name": metadata["model_name"],
        "model_metrics": metadata["metrics"],
        "trained_at": metadata["trained_at"],
    }