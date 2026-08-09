"""Endpoints de estatísticas e resumo para o Dashboard do frontend."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.analysis import AnalysisRecord
from app.api.routes.status import get_status
from app.ml import statistics
from app.schemas.statistics import (
    ConfusionMatrixResponse,
    ROCCurveResponse,
    PrecisionRecallCurveResponse,
    FeatureImportanceItem,
    DashboardSummaryResponse,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummaryResponse:
    """Combina métricas operacionais (do histórico) com métricas do modelo (estáticas)."""
    total_analyses = db.query(AnalysisRecord).count()
    total_attacks = db.query(AnalysisRecord).filter(
        AnalysisRecord.predicted_class == "Ataque"
    ).count()
    total_normal = total_analyses - total_attacks
    attack_rate = (total_attacks / total_analyses) if total_analyses > 0 else 0.0

    last_record = db.query(AnalysisRecord).order_by(
        AnalysisRecord.timestamp.desc()
    ).first()
    last_analysis_at = last_record.timestamp.isoformat() if last_record else None

    model_status = get_status()

    return DashboardSummaryResponse(
        total_analyses=total_analyses,
        total_attacks=total_attacks,
        total_normal=total_normal,
        attack_rate=round(attack_rate, 4),
        last_analysis_at=last_analysis_at,
        model_name=model_status["model_name"],
        model_accuracy=model_status["model_metrics"]["test_accuracy"],
        model_f1_score=model_status["model_metrics"]["test_f1_score"],
        model_roc_auc=model_status["model_metrics"]["test_roc_auc"],
    )


@router.get("/confusion-matrix", response_model=ConfusionMatrixResponse)
def get_confusion_matrix() -> ConfusionMatrixResponse:
    return ConfusionMatrixResponse(**statistics.get_confusion_matrix_data())


@router.get("/roc-curve", response_model=ROCCurveResponse)
def get_roc_curve() -> ROCCurveResponse:
    return ROCCurveResponse(**statistics.get_roc_curve_data())


@router.get("/precision-recall-curve", response_model=PrecisionRecallCurveResponse)
def get_precision_recall_curve() -> PrecisionRecallCurveResponse:
    return PrecisionRecallCurveResponse(**statistics.get_precision_recall_curve_data())


@router.get("/feature-importance", response_model=list[FeatureImportanceItem])
def get_feature_importance() -> list[FeatureImportanceItem]:
    return [FeatureImportanceItem(**item) for item in statistics.get_global_feature_importance()]