"""Schemas Pydantic para os endpoints de estatísticas do dashboard."""

from pydantic import BaseModel


class ConfusionMatrixResponse(BaseModel):
    true_negative: int
    false_positive: int
    false_negative: int
    true_positive: int


class ROCCurveResponse(BaseModel):
    fpr: list[float]
    tpr: list[float]
    thresholds: list[float]


class PrecisionRecallCurveResponse(BaseModel):
    precision: list[float]
    recall: list[float]


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class DashboardSummaryResponse(BaseModel):
    total_analyses: int
    total_attacks: int
    total_normal: int
    attack_rate: float
    last_analysis_at: str | None
    model_name: str
    model_accuracy: float
    model_f1_score: float
    model_roc_auc: float