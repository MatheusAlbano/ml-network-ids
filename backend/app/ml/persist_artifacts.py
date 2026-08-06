"""
Módulo responsável por gerar o schema de entrada e os metadados do modelo
selecionado, artefatos que serão consumidos pela API (Etapa 11) e pelo
frontend nas etapas futuras.
"""

from pathlib import Path
from datetime import datetime, timezone
import json

import pandas as pd

from data_loader import load_raw_data
from feature_engineering import prepare_dataset, TOP_PROTO_CATEGORIES, CATEGORICAL_COLUMNS

ARTIFACTS_DIR = Path(__file__).resolve().parents[3] / "artifacts"
SCHEMA_PATH = ARTIFACTS_DIR / "input_schema.json"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"
COMPARISON_RESULTS_PATH = ARTIFACTS_DIR / "model_comparison_results.json"


def build_input_schema(X_train: pd.DataFrame) -> dict:
    """
    Constrói o schema de entrada: para cada feature, define nome, tipo,
    e (quando categórica) os valores válidos observados no treino.
    Esse schema será usado para gerar os modelos Pydantic da API.
    """
    schema = {"features": []}

    for column in X_train.columns:
        field = {"name": column}

        if column in CATEGORICAL_COLUMNS:
            field["type"] = "categorical"
            if column == "proto":
                # Valores possíveis após o agrupamento feito na Etapa 7
                field["allowed_values"] = TOP_PROTO_CATEGORIES + ["other"] #type: ignore
            else:
                field["allowed_values"] = sorted(X_train[column].unique().tolist()) #type: ignore
        else:
            field["type"] = "numeric"
            field["min_observed"] = float(X_train[column].min()) #type: ignore
            field["max_observed"] = float(X_train[column].max()) #type: ignore
            field["example"] = float(X_train[column].median()) #type: ignore

        schema["features"].append(field)

    return schema


def build_model_metadata() -> dict:
    """
    Consolida metadados sobre o modelo selecionado na Etapa 9: nome,
    métricas, e informações do dataset usado no treinamento.
    """
    if not COMPARISON_RESULTS_PATH.exists():
        raise FileNotFoundError(
            f"Resultados de comparação não encontrados em {COMPARISON_RESULTS_PATH}. "
            "Rode compare_models.py (Etapa 9) antes desta etapa."
        )

    with open(COMPARISON_RESULTS_PATH, "r", encoding="utf-8") as f:
        comparison = json.load(f)

    best_model_name = comparison["best_model"]
    best_model_metrics = comparison["results"][best_model_name]

    metadata = {
        "model_name": best_model_name,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": "UNSW-NB15",
        "task_type": "binary_classification",
        "target_labels": {"0": "Normal", "1": "Ataque"},
        "metrics": {
            "test_accuracy": best_model_metrics["test_accuracy"],
            "test_precision": best_model_metrics["test_precision"],
            "test_recall": best_model_metrics["test_recall"],
            "test_f1_score": best_model_metrics["test_f1_score"],
            "test_roc_auc": best_model_metrics["test_roc_auc"],
            "cv_f1_score_mean": best_model_metrics["cv_f1_score_mean"],
            "cv_f1_score_std": best_model_metrics["cv_f1_score_std"],
        },
        "model_file": "best_model.joblib",
    }

    return metadata


if __name__ == "__main__":
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    print("Carregando dados de treino para construir o schema...")
    df_train, _ = load_raw_data()
    X_train, _ = prepare_dataset(df_train)

    print("Construindo schema de entrada...")
    schema = build_input_schema(X_train)
    with open(SCHEMA_PATH, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)
    print(f"Schema salvo em: {SCHEMA_PATH}")
    print(f"Total de features no schema: {len(schema['features'])}")

    print("\nConstruindo metadados do modelo...")
    metadata = build_model_metadata()
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"Metadados salvos em: {METADATA_PATH}")
    print(f"\nModelo em produção: {metadata['model_name']}")
    print(f"Test F1-score: {metadata['metrics']['test_f1_score']:.4f}")