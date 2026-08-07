"""
Schemas Pydantic de entrada e saída da API. O schema de entrada é
construído DINAMICAMENTE a partir do artifacts/input_schema.json
gerado na Etapa 10 — garante que a API nunca fique dessincronizada
do que o pipeline realmente espera.
"""

import json
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, create_model

from app.core.config import SCHEMA_PATH


def _load_input_schema() -> dict:
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _build_categorical_enum(field_name: str, allowed_values: list[str]) -> type[Enum]:
    """Cria dinamicamente um Enum a partir dos valores válidos do schema."""
    enum_members = {value.upper().replace("-", "_"): value for value in allowed_values}
    return Enum(f"{field_name.capitalize()}Enum", enum_members) #type: ignore


def build_network_connection_model() -> type[BaseModel]:
    """
    Constrói o modelo Pydantic 'NetworkConnectionInput' dinamicamente,
    lendo o schema salvo em artifacts/input_schema.json.
    """
    schema = _load_input_schema()
    field_definitions: dict[str, Any] = {}

    for feature in schema["features"]:
        name = feature["name"]

        if feature["type"] == "categorical":
            enum_type = _build_categorical_enum(name, feature["allowed_values"])
            field_definitions[name] = (
                enum_type,
                Field(..., description=f"Valores válidos: {feature['allowed_values']}"),
            )
        else:
            field_definitions[name] = (
                float,
                Field(
                    ...,
                    description=(
                        f"Valor observado no treino entre "
                        f"{feature['min_observed']} e {feature['max_observed']}"
                    ),
                    examples=[feature["example"]],
                ),
            )

    return create_model("NetworkConnectionInput", **field_definitions)


# Modelo de entrada, construído uma única vez na inicialização da API
NetworkConnectionInput = build_network_connection_model()


class RiskLevel(str, Enum):
    BAIXO = "Baixo"
    MEDIO = "Médio"
    ALTO = "Alto"
    CRITICO = "Crítico"


class PredictionResponse(BaseModel):
    predicted_class: str = Field(..., description="'Normal' ou 'Ataque'")
    probability_normal: float
    probability_attack: float
    risk_level: RiskLevel
    inference_time_ms: float
    model_used: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))