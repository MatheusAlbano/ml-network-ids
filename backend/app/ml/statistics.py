"""
Módulo de estatísticas do modelo: matriz de confusão, curva ROC,
curva Precision-Recall e feature importance global. Todos os cálculos
usam o conjunto de teste oficial do UNSW-NB15 e são cacheados em
memória, pois são custosos para recalcular a cada requisição.
"""

from functools import lru_cache

import numpy as np
from sklearn.metrics import confusion_matrix, roc_curve, precision_recall_curve

from app.ml.data_loader import load_raw_data
from app.ml.feature_engineering import prepare_dataset
from app.api.routes.predict import get_model


@lru_cache(maxsize=1)
def _get_test_predictions():
    """
    Carrega o conjunto de teste, roda o modelo salvo, e retorna
    y_test, y_pred e y_proba. Cacheado porque carregar o dataset e
    rodar a predição em ~82 mil linhas não é instantâneo.
    """
    _, df_test = load_raw_data()
    X_test, y_test = prepare_dataset(df_test)

    model = get_model()
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    return y_test.values, y_pred, y_proba


def get_confusion_matrix_data() -> dict:
    """Retorna a matriz de confusão em formato estruturado."""
    y_test, y_pred, _ = _get_test_predictions()
    cm = confusion_matrix(y_test, y_pred) #type: ignore

    return {
        "true_negative": int(cm[0][0]),
        "false_positive": int(cm[0][1]),
        "false_negative": int(cm[1][0]),
        "true_positive": int(cm[1][1]),
    }


def get_roc_curve_data(max_points: int = 100) -> dict:
    """
    Retorna os pontos da curva ROC, reduzidos a no máximo 'max_points'
    para não sobrecarregar o payload JSON (a curva bruta pode ter
    milhares de pontos, um por threshold único observado).
    """
    y_test, _, y_proba = _get_test_predictions()
    fpr, tpr, thresholds = roc_curve(y_test, y_proba) #type: ignore

    # sklearn sempre inclui um threshold = np.inf no primeiro ponto,
    # que não é serializável em JSON. Substituímos por 1.0 (limite
    # superior válido de probabilidade), preservando o significado
    # do ponto (nenhuma amostra classificada como positiva).
    thresholds = np.where(np.isinf(thresholds), 1.0, thresholds)

    indices = np.linspace(0, len(fpr) - 1, min(max_points, len(fpr))).astype(int)

    return {
        "fpr": fpr[indices].tolist(),
        "tpr": tpr[indices].tolist(),
        "thresholds": thresholds[indices].tolist(),
    }


def get_precision_recall_curve_data(max_points: int = 100) -> dict:
    """Retorna os pontos da curva Precision-Recall, também reduzidos."""
    y_test, _, y_proba = _get_test_predictions()
    precision, recall, thresholds = precision_recall_curve(y_test, y_proba) #type: ignore

    indices = np.linspace(0, len(precision) - 1, min(max_points, len(precision))).astype(int)

    return {
        "precision": precision[indices].tolist(),
        "recall": recall[indices].tolist(),
    }


@lru_cache(maxsize=1)
def get_global_feature_importance(top_n: int = 10) -> list[dict]:
    """
    Retorna a importância média (absoluta) de cada feature original,
    calculada via SHAP sobre uma amostra do conjunto de teste — usar
    o conjunto inteiro seria caro demais para essa agregação global.
    """
    from app.ml.explainability import get_pipeline, get_explainer, _map_transformed_name_to_original

    _, df_test = load_raw_data()
    X_test, _ = prepare_dataset(df_test)

    # Amostra para manter o cálculo rápido (SHAP em milhares de linhas é custoso)
    sample = X_test.sample(n=min(2000, len(X_test)), random_state=42)

    pipeline = get_pipeline()
    explainer = get_explainer()
    preprocessor = pipeline.named_steps["preprocessor"]

    transformed_sample = preprocessor.transform(sample)
    transformed_feature_names = preprocessor.get_feature_names_out()

    shap_values = explainer.shap_values(transformed_sample)
    if isinstance(shap_values, list):
        values = shap_values[1]
    else:
        values = shap_values

    mean_abs_shap = np.abs(values).mean(axis=0)

    aggregated: dict[str, float] = {}
    for name, value in zip(transformed_feature_names, mean_abs_shap):
        original_name = _map_transformed_name_to_original(name)
        aggregated[original_name] = aggregated.get(original_name, 0.0) + float(value)

    sorted_importance = sorted(aggregated.items(), key=lambda item: item[1], reverse=True)

    return [
        {"feature": name, "importance": round(value, 4)}
        for name, value in sorted_importance[:top_n]
    ]