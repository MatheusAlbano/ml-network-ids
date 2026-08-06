"""
Módulo de comparação entre múltiplos modelos de ML para o IDS.
Treina cada modelo com validação cruzada, avalia no conjunto de teste,
e seleciona automaticamente o melhor com base no F1-score.
"""

from pathlib import Path
import time
import json
import joblib
import pandas as pd
import numpy as np

from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    ExtraTreesClassifier,
)
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)

from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier

from data_loader import load_raw_data
from feature_engineering import prepare_dataset, build_preprocessing_pipeline

MODELS_DIR = Path(__file__).resolve().parents[3] / "models"
ARTIFACTS_DIR = Path(__file__).resolve().parents[3] / "artifacts"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

RESULTS_PATH = ARTIFACTS_DIR / "model_comparison_results.json"
BEST_MODEL_PATH = MODELS_DIR / "best_model.joblib"

# Métrica usada para decidir automaticamente o melhor modelo
SELECTION_METRIC = "f1_score"

# SVM tem complexidade O(n^2) a O(n^3) — inviável no dataset completo (175k linhas).
# Usamos uma amostra estratificada menor apenas para este modelo, prática aceita
# na literatura quando SVM é comparado em datasets de grande volume.
SVM_SAMPLE_SIZE = 15000
MODELS_REQUIRING_SAMPLING = {"SVM"}

# Modelos candidatos. SVM usa uma amostra menor internamente (ver nota abaixo).
CANDIDATE_MODELS = {
    "Logistic Regression": LogisticRegression(
        max_iter=1000, class_weight="balanced", random_state=42
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=200, class_weight="balanced", random_state=42, n_jobs=-1
    ),
    "Extra Trees": ExtraTreesClassifier(
        n_estimators=200, class_weight="balanced", random_state=42, n_jobs=-1
    ),
    "Gradient Boosting": GradientBoostingClassifier(random_state=42),
    "XGBoost": XGBClassifier(
        eval_metric="logloss", random_state=42, n_jobs=-1
    ),
    "LightGBM": LGBMClassifier(
        class_weight="balanced", random_state=42, n_jobs=-1, verbose=-1
    ),
    "CatBoost": CatBoostClassifier(
        random_state=42, verbose=False, auto_class_weights="Balanced"
    ),
    "MLP": MLPClassifier(
        hidden_layer_sizes=(64, 32), max_iter=300, random_state=42
    ),
    "SVM": SVC(
        kernel="rbf", class_weight="balanced", probability=True, random_state=42
    ),
}


def build_pipeline_for_model(preprocessor, model) -> Pipeline:
    """Monta um pipeline pré-processamento + modelo específico."""
    return Pipeline(steps=[("preprocessor", preprocessor), ("classifier", model)])

def stratified_sample(X: pd.DataFrame, y: pd.Series, sample_size: int):
    """
    Retorna uma amostra estratificada de X/y (preserva a proporção de classes),
    usada para modelos computacionalmente caros como o SVM.
    """
    df_combined = X.copy()
    df_combined["_target"] = y.values

    sampled = df_combined.groupby("_target", group_keys=False).apply(
        lambda group: group.sample(
            frac=sample_size / len(df_combined), random_state=42
        )
    )

    y_sampled = sampled["_target"]
    X_sampled = sampled.drop(columns=["_target"])
    return X_sampled, y_sampled

def run_cross_validation(pipeline: Pipeline, X_train, y_train, cv_folds: int = 5) -> dict:
    """
    Executa validação cruzada estratificada (mantém a proporção de classes
    em cada fold) e retorna a média de cada métrica.
    """
    skf = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)

    scoring = {
        "accuracy": "accuracy",
        "precision": "precision",
        "recall": "recall",
        "f1_score": "f1",
        "roc_auc": "roc_auc",
    }

    cv_results = cross_validate(
        pipeline, X_train, y_train, cv=skf, scoring=scoring, n_jobs=-1
    )

    return {
        f"cv_{metric}_mean": float(np.mean(cv_results[f"test_{metric}"]))
        for metric in scoring
    } | {
        f"cv_{metric}_std": float(np.std(cv_results[f"test_{metric}"]))
        for metric in scoring
    }


def evaluate_on_test(pipeline: Pipeline, X_test, y_test) -> dict:
    """Avalia o pipeline já treinado no conjunto de teste (holdout)."""
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    return {
        "test_accuracy": float(accuracy_score(y_test, y_pred)),
        "test_precision": float(precision_score(y_test, y_pred)),
        "test_recall": float(recall_score(y_test, y_pred)),
        "test_f1_score": float(f1_score(y_test, y_pred)),
        "test_roc_auc": float(roc_auc_score(y_test, y_proba)),
    }


def run_comparison(X_train, y_train, X_test, y_test) -> dict:
    """Treina e avalia todos os modelos candidatos, retornando os resultados."""
    preprocessor = build_preprocessing_pipeline(X_train)
    all_results = {}

    for name, model in CANDIDATE_MODELS.items():
        print(f"\n{'-' * 60}")
        print(f"Treinando e avaliando: {name}")
        print(f"{'-' * 60}")

        pipeline = build_pipeline_for_model(preprocessor, model)

        # Modelos computacionalmente caros usam amostra estratificada
        if name in MODELS_REQUIRING_SAMPLING:
            print(f"  (usando amostra estratificada de {SVM_SAMPLE_SIZE} registros "
                  f"devido ao alto custo computacional do {name})")
            X_train_used, y_train_used = stratified_sample(X_train, y_train, SVM_SAMPLE_SIZE)
        else:
            X_train_used, y_train_used = X_train, y_train

        start_cv = time.time()
        cv_metrics = run_cross_validation(pipeline, X_train_used, y_train_used)
        cv_time = time.time() - start_cv
        print(f"Validação cruzada concluída em {cv_time:.2f}s")
        print(f"  CV F1-score (média): {cv_metrics['cv_f1_score_mean']:.4f} "
              f"(+/- {cv_metrics['cv_f1_score_std']:.4f})")

        start_fit = time.time()
        pipeline.fit(X_train_used, y_train_used)
        fit_time = time.time() - start_fit

        test_metrics = evaluate_on_test(pipeline, X_test, y_test)
        print(f"Teste F1-score: {test_metrics['test_f1_score']:.4f}")
        print(f"Teste ROC-AUC: {test_metrics['test_roc_auc']:.4f}")

        all_results[name] = {
            **cv_metrics,
            **test_metrics,
            "training_time_seconds": round(fit_time, 2),
            "cv_time_seconds": round(cv_time, 2),
            "trained_on_sample": name in MODELS_REQUIRING_SAMPLING,
        }

        all_results[name]["_pipeline"] = pipeline

    return all_results


def select_best_model(results: dict, metric: str = SELECTION_METRIC) -> str:
    """Seleciona o nome do modelo com maior valor na métrica de teste escolhida."""
    metric_key = f"test_{metric}"
    best_name = max(results, key=lambda name: results[name][metric_key])
    return best_name


if __name__ == "__main__":
    print("Carregando dados...")
    df_train, df_test = load_raw_data()

    print("Aplicando engenharia de atributos...")
    X_train, y_train = prepare_dataset(df_train)
    X_test, y_test = prepare_dataset(df_test)

    results = run_comparison(X_train, y_train, X_test, y_test)

    best_model_name = select_best_model(results)
    best_pipeline = results[best_model_name]["_pipeline"]

    # Remove os objetos de pipeline antes de salvar em JSON (não são serializáveis)
    results_for_json = {
        name: {k: v for k, v in metrics.items() if k != "_pipeline"}
        for name, metrics in results.items()
    }

    print(f"\n{'=' * 60}")
    print("RESUMO COMPARATIVO (ordenado por Test F1-score)")
    print(f"{'=' * 60}")
    summary_df = pd.DataFrame(results_for_json).T.sort_values(
        "test_f1_score", ascending=False
    )
    print(summary_df[["cv_f1_score_mean", "test_f1_score", "test_roc_auc", "training_time_seconds"]])

    print(f"\nMelhor modelo selecionado: {best_model_name}")
    print(f"  Test F1-score: {results[best_model_name]['test_f1_score']:.4f}")
    print(f"  Test ROC-AUC: {results[best_model_name]['test_roc_auc']:.4f}")

    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(
            {"results": results_for_json, "best_model": best_model_name},
            f, indent=2, ensure_ascii=False
        )
    print(f"\nResultados salvos em: {RESULTS_PATH}")

    joblib.dump(best_pipeline, BEST_MODEL_PATH)
    print(f"Melhor modelo salvo em: {BEST_MODEL_PATH}")