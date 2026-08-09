"""Schemas Pydantic para o endpoint de upload de CSV em lote."""

from pydantic import BaseModel


class BatchRowResult(BaseModel):
    row_index: int
    predicted_class: str
    probability_attack: float
    risk_level: str


class BatchRowError(BaseModel):
    row_index: int
    error: str


class BatchPredictionResponse(BaseModel):
    total_rows: int
    processed_rows: int
    failed_rows: int
    total_attacks: int
    total_normal: int
    attack_rate: float
    processing_time_ms: float
    results: list[BatchRowResult]
    errors: list[BatchRowError]