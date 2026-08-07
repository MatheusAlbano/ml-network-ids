"""
Endpoint de predição em tempo real. Carrega o pipeline treinado uma
única vez (na primeira chamada) e reutiliza em todas as requisições.
"""

import time
from functools import lru_cache

import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException

from app.core.config import MODEL_PATH, METADATA_PATH
from app.schemas.prediction import NetworkConnectionInput, PredictionResponse, RiskLevel
import json

router = APIRouter()


@lru_cache(maxsize=1)
def get_model():
    """
    Carrega o pipeline treinado (encoding + normalização + modelo) uma
    única vez. O lru_cache garante que chamadas seguintes reutilizem
    o mesmo objeto em memória, evitando recarregar o modelo do disco
    a cada requisição (custoso e desnecessário).
    """
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Modelo não encontrado em {MODEL_PATH}. Rode compare_models.py primeiro."
        )
    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def get_model_name() -> str:
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)
    return metadata["model_name"]


def classify_risk(probability_attack: float) -> RiskLevel:
    """Converte a probabilidade de ataque em um nível de risco categórico."""
    if probability_attack < 0.25:
        return RiskLevel.BAIXO
    elif probability_attack < 0.50:
        return RiskLevel.MEDIO
    elif probability_attack < 0.75:
        return RiskLevel.ALTO
    return RiskLevel.CRITICO


@router.post("/predict", response_model=PredictionResponse, tags=["Predição"])
def predict(connection: NetworkConnectionInput) -> PredictionResponse: #type:ignore
    """
    Recebe as características de uma conexão de rede e retorna a
    classificação (Normal/Ataque), probabilidades, nível de risco
    e tempo de inferência.
    """
    try:
        model = get_model()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Converte os valores do Enum (categóricos) para string simples antes do DataFrame
    input_dict = {
        key: (value.value if hasattr(value, "value") else value)
        for key, value in connection.model_dump().items()
    }
    input_df = pd.DataFrame([input_dict])

    start_time = time.perf_counter()
    probabilities = model.predict_proba(input_df)[0]
    inference_time_ms = (time.perf_counter() - start_time) * 1000

    probability_normal = float(probabilities[0])
    probability_attack = float(probabilities[1])
    predicted_class = "Ataque" if probability_attack >= 0.5 else "Normal"

    return PredictionResponse(
        predicted_class=predicted_class,
        probability_normal=probability_normal,
        probability_attack=probability_attack,
        risk_level=classify_risk(probability_attack),
        inference_time_ms=round(inference_time_ms, 3),
        model_used=get_model_name(),
    )