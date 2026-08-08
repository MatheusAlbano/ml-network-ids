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
from app.ml.explainability import explain_prediction
import json

from sqlalchemy.orm import Session #type: ignore
from fastapi import Depends

from app.core.database import get_db
from app.core.logging_config import logger #type: ignore
from app.models.analysis import AnalysisRecord

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
def predict(connection: NetworkConnectionInput, db: Session = Depends(get_db)) -> PredictionResponse: #type: ignore
    """..."""  # docstring existente permanece
    try:
        model = get_model()
    except FileNotFoundError as e:
        logger.error(f"Falha ao carregar modelo: {e}")
        raise HTTPException(status_code=503, detail=str(e))

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

    explanation = explain_prediction(input_df)
    risk_level = classify_risk(probability_attack)

    # Persiste a análise no histórico
    record = AnalysisRecord(
        predicted_class=predicted_class,
        probability_attack=probability_attack,
        risk_level=risk_level.value,
        inference_time_ms=round(inference_time_ms, 3),
        model_used=get_model_name(),
        input_summary={
            "proto": input_dict.get("proto"),
            "service": input_dict.get("service"),
            "state": input_dict.get("state"),
            "sttl": input_dict.get("sttl"),
        },
        explanation_text=explanation["explanation_text"],
    )
    db.add(record)
    db.commit()

    logger.info(
        f"Predição realizada: classe={predicted_class}, risco={risk_level.value}, "
        f"tempo={inference_time_ms:.2f}ms"
    )

    return PredictionResponse(
        predicted_class=predicted_class,
        probability_normal=probability_normal,
        probability_attack=probability_attack,
        risk_level=risk_level,
        inference_time_ms=round(inference_time_ms, 3),
        model_used=get_model_name(),
        top_features=explanation["top_features"],
        explanation_text=explanation["explanation_text"],
    )