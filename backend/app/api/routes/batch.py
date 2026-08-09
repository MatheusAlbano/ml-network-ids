"""
Endpoint de upload e processamento de CSV em lote. Recebe um arquivo
com múltiplas conexões de rede, valida e processa todas de uma vez
através do pipeline, e persiste cada resultado no histórico.
"""

import io
import time

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging_config import logger
from app.models.analysis import AnalysisRecord
from app.api.routes.predict import get_model, get_model_name, classify_risk
from app.schemas.batch import BatchPredictionResponse, BatchRowResult, BatchRowError
from app.core.config import SCHEMA_PATH
import json

router = APIRouter()

with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
    _SCHEMA = json.load(f)

_EXPECTED_COLUMNS = {feature["name"] for feature in _SCHEMA["features"]}
_CATEGORICAL_ALLOWED_VALUES = {
    feature["name"]: set(feature["allowed_values"])
    for feature in _SCHEMA["features"]
    if feature["type"] == "categorical"
}


def _validate_csv_columns(df: pd.DataFrame) -> None:
    """Garante que o CSV tem todas as colunas esperadas pelo pipeline."""
    missing_columns = _EXPECTED_COLUMNS - set(df.columns)
    if missing_columns:
        raise HTTPException(
            status_code=422,
            detail=f"Colunas faltando no CSV: {sorted(missing_columns)}",
        )


def _validate_row(row: pd.Series) -> str | None:
    """
    Valida uma linha individual. Retorna a mensagem de erro se inválida,
    ou None se a linha estiver ok.
    """
    for feature_name, allowed_values in _CATEGORICAL_ALLOWED_VALUES.items():
        if row[feature_name] not in allowed_values:
            return f"Valor inválido em '{feature_name}': {row[feature_name]!r}"

    numeric_columns = _EXPECTED_COLUMNS - set(_CATEGORICAL_ALLOWED_VALUES.keys())
    for col in numeric_columns:
        value = row[col]
        if isinstance(value, str):
            # Tolera vírgula como separador decimal (comum em CSVs
            # exportados/editados no Excel com localidade PT-BR)
            value = value.replace(",", ".")
        try:
            float(value)
        except (ValueError, TypeError):
            return f"Valor não-numérico em '{col}': {row[col]!r}"

    return None


@router.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Predição"])
async def predict_batch(
    file: UploadFile = File(..., description="Arquivo CSV com conexões de rede"),
    db: Session = Depends(get_db),
) -> BatchPredictionResponse:
    """
    Processa um arquivo CSV contendo múltiplas conexões de rede,
    retornando a classificação de cada linha e um resumo agregado.
    """
    if not file.filename.endswith(".csv"): #type: ignore
        raise HTTPException(status_code=422, detail="O arquivo deve ser um .csv")

    raw_bytes = await file.read()
    try:
        # encoding='utf-8-sig' remove o BOM (Byte Order Mark) que o Excel
        # costuma inserir ao salvar como "CSV UTF-8", que faz a primeira
        # coluna do cabeçalho ficar com um caractere invisível colado.
        df = pd.read_csv(
            io.BytesIO(raw_bytes), sep=None, engine="python", encoding="utf-8-sig"
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Não foi possível ler o CSV: {e}")
    _validate_csv_columns(df)

    model = get_model()
    model_name = get_model_name()

    results: list[BatchRowResult] = []
    errors: list[BatchRowError] = []
    valid_rows_indices: list[int] = []

    # Primeira passada: valida linha por linha, separando o que é processável
    for idx, row in df.iterrows():
        error_message = _validate_row(row)
        if error_message:
            errors.append(BatchRowError(row_index=idx, error=error_message)) #type: ignore
        else:
            valid_rows_indices.append(idx) #type: ignore

    start_time = time.perf_counter()

    if valid_rows_indices:
        valid_df = df.loc[valid_rows_indices, list(_EXPECTED_COLUMNS)].copy()

        # Aplica a mesma tolerância a vírgula decimal usada na validação,
        # convertendo colunas numéricas antes de passar ao pipeline.
        numeric_columns = _EXPECTED_COLUMNS - set(_CATEGORICAL_ALLOWED_VALUES.keys())
        for col in numeric_columns:
            valid_df[col] = (
                valid_df[col].astype(str).str.replace(",", ".", regex=False).astype(float)
            )

        probabilities = model.predict_proba(valid_df)[:, 1]

        records_to_save = []
        for position, idx in enumerate(valid_rows_indices):
            probability_attack = float(probabilities[position])
            predicted_class = "Ataque" if probability_attack >= 0.5 else "Normal"
            risk_level = classify_risk(probability_attack)

            results.append(
                BatchRowResult(
                    row_index=idx,
                    predicted_class=predicted_class,
                    probability_attack=probability_attack,
                    risk_level=risk_level.value,
                )
            )

            records_to_save.append(
                AnalysisRecord(
                    predicted_class=predicted_class,
                    probability_attack=probability_attack,
                    risk_level=risk_level.value,
                    inference_time_ms=0.0,  # tempo individual não é medido em lote
                    model_used=model_name,
                    input_summary={
                        "proto": df.loc[idx, "proto"],
                        "service": df.loc[idx, "service"],
                        "state": df.loc[idx, "state"],
                        "sttl": float(df.loc[idx, "sttl"]), #type: ignore
                        "source": "batch_upload",
                    },
                    explanation_text="Predição em lote (explicabilidade individual não calculada).",
                )
            )

        db.add_all(records_to_save)
        db.commit()

    processing_time_ms = (time.perf_counter() - start_time) * 1000

    total_attacks = sum(1 for r in results if r.predicted_class == "Ataque")
    total_normal = len(results) - total_attacks

    logger.info(
        f"Predição em lote: arquivo={file.filename}, total={len(df)}, "
        f"processadas={len(results)}, falhas={len(errors)}"
    )

    return BatchPredictionResponse(
        total_rows=len(df),
        processed_rows=len(results),
        failed_rows=len(errors),
        total_attacks=total_attacks,
        total_normal=total_normal,
        attack_rate=round(total_attacks / len(results), 4) if results else 0.0,
        processing_time_ms=round(processing_time_ms, 3),
        results=results,
        errors=errors,
    )