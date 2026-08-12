"""Endpoint que expõe o schema de entrada do modelo, consumido pelo frontend
para gerar o formulário de predição dinamicamente."""

import json
from fastapi import APIRouter

from app.core.config import SCHEMA_PATH

router = APIRouter()


@router.get("/schema", tags=["Sistema"])
def get_input_schema() -> dict:
    """Retorna o schema de entrada (features, tipos, valores válidos) usado pelo modelo."""
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)