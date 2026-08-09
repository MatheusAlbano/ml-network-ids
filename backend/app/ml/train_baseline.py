"""
Módulo de treinamento do modelo baseline (Random Forest) para o IDS.
Consolida o pipeline de pré-processamento + modelo, treina, avalia e persiste.
"""

from pathlib import Path
import time
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)

try:
    from app.ml.data_loader import load_raw_data
    from app.ml.feature_engineering import prepare_dataset, build_preprocessing_pipeline
except ImportError:
    from data_loader import load_raw_data
    from feature_engineering import prepare_dataset, build_preprocessing_pipeline
    
# Onde o modelo treinado será salvo
MODELS_DIR = Path(__file__).resolve().parents[3] / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODELS_DIR / "baseline_random_forest.joblib"


def build_full_pipeline(X_train: pd.DataFrame) -> Pipeline:
    """
    Monta o pipeline completo: pré-processamento (encoding + normalização)
    seguido do classificador. Isso garante que, ao salvar o pipeline,
    o pré-processamento vai sempre junto do modelo.
    """
    preprocessor = build_preprocessing_pipeline(X_train)

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        random_state=42,
        n_jobs=-1,  # usa todos os núcleos de CPU disponíveis
        class_weight="balanced",  # compensa o leve desbalanceamento (32%/68%) visto na Etapa 5
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", model),
        ]
    )
    return pipeline


def evaluate_model(y_true, y_pred, y_proba) -> dict:
    """Calcula todas as métricas de avaliação exigidas pelo projeto."""
    metrics = {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred),
        "recall": recall_score(y_true, y_pred),
        "f1_score": f1_score(y_true, y_pred),
        "roc_auc": roc_auc_score(y_true, y_proba),
    }
    return metrics


def print_evaluation_report(y_true, y_pred, y_proba) -> None:
    """Imprime um relatório completo de avaliação no terminal."""
    metrics = evaluate_model(y_true, y_pred, y_proba)

    print("\n" + "=" * 60)
    print("MÉTRICAS DE AVALIAÇÃO — Modelo Baseline (Random Forest)")
    print("=" * 60)
    for name, value in metrics.items():
        print(f"{name:12s}: {value:.4f}")

    print("\nMatriz de Confusão:")
    cm = confusion_matrix(y_true, y_pred)
    print(f"                 Previsto Normal   Previsto Ataque")
    print(f"Real Normal      {cm[0][0]:<17d} {cm[0][1]:<17d}")
    print(f"Real Ataque      {cm[1][0]:<17d} {cm[1][1]:<17d}")

    print("\nClassification Report completo:")
    print(classification_report(y_true, y_pred, target_names=["Normal", "Ataque"]))


if __name__ == "__main__":
    print("Carregando dados...")
    df_train, df_test = load_raw_data()

    print("Aplicando engenharia de atributos...")
    X_train, y_train = prepare_dataset(df_train)
    X_test, y_test = prepare_dataset(df_test)

    print("Construindo e treinando o pipeline completo...")
    pipeline = build_full_pipeline(X_train)

    start_time = time.time()
    pipeline.fit(X_train, y_train)
    training_time = time.time() - start_time
    print(f"Treinamento concluído em {training_time:.2f} segundos.")

    print("Avaliando no conjunto de teste...")
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]  # probabilidade da classe "ataque"

    print_evaluation_report(y_test, y_pred, y_proba)

    print(f"\nSalvando modelo em: {MODEL_PATH}")
    joblib.dump(pipeline, MODEL_PATH)
    print("Modelo salvo com sucesso.")