"""
Gera as figuras estáticas (matplotlib) utilizadas na seção de Resultados
do TCC: matriz de confusão, curva ROC, curva Precision-Recall, comparação
de modelos e importância de features (SHAP).
"""

import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, roc_curve, auc, precision_recall_curve

try:
    from app.ml.data_loader import load_raw_data
    from app.ml.feature_engineering import prepare_dataset
except ImportError:
    from data_loader import load_raw_data
    from feature_engineering import prepare_dataset

BASE_DIR = Path(__file__).resolve().parents[3]
MODELS_DIR = BASE_DIR / "models"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
FIGURES_DIR = ARTIFACTS_DIR / "report_figures"
FIGURES_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = MODELS_DIR / "best_model.joblib"
COMPARISON_PATH = ARTIFACTS_DIR / "model_comparison_results.json"

plt.rcParams.update({"font.size": 11})


def load_test_predictions():
    """Carrega o conjunto de teste e roda o modelo salvo, retornando y_test, y_pred, y_proba."""
    _, df_test = load_raw_data()
    X_test, y_test = prepare_dataset(df_test)

    model = joblib.load(MODEL_PATH)
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    return X_test, y_test.values, y_pred, y_proba, model


def plot_confusion_matrix(y_test, y_pred):
    cm = confusion_matrix(y_test, y_pred)
    labels = ["Normal", "Ataque"]

    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, cmap="Blues")

    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(labels)
    ax.set_yticklabels(labels)
    ax.set_xlabel("Classe prevista")
    ax.set_ylabel("Classe real")
    ax.set_title("Matriz de Confusão — Modelo LightGBM")

    for i in range(2):
        for j in range(2):
            valor = cm[i, j]
            cor = "white" if valor > cm.max() / 2 else "black"
            ax.text(j, i, f"{valor:,}".replace(",", "."), ha="center", va="center",
                    color=cor, fontsize=13, fontweight="bold")

    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    fig.tight_layout()
    fig.savefig(FIGURES_DIR / "matriz_confusao.png", dpi=150)
    plt.close(fig)
    print("Salvo: matriz_confusao.png")


def plot_roc_curve(y_test, y_proba):
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    roc_auc = auc(fpr, tpr)

    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot(fpr, tpr, color="#3b6ea5", linewidth=2, label=f"ROC (AUC = {roc_auc:.4f})")
    ax.plot([0, 1], [0, 1], color="gray", linestyle="--", linewidth=1, label="Classificador aleatório")

    ax.set_xlabel("Taxa de Falso Positivo")
    ax.set_ylabel("Taxa de Verdadeiro Positivo")
    ax.set_title("Curva ROC — Modelo LightGBM")
    ax.legend(loc="lower right")
    ax.grid(alpha=0.3)

    fig.tight_layout()
    fig.savefig(FIGURES_DIR / "curva_roc.png", dpi=150)
    plt.close(fig)
    print("Salvo: curva_roc.png")


def plot_precision_recall_curve(y_test, y_proba):
    precision, recall, _ = precision_recall_curve(y_test, y_proba)

    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot(recall, precision, color="#2e8b57", linewidth=2)

    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_title("Curva Precision-Recall — Modelo LightGBM")
    ax.grid(alpha=0.3)

    fig.tight_layout()
    fig.savefig(FIGURES_DIR / "curva_precision_recall.png", dpi=150)
    plt.close(fig)
    print("Salvo: curva_precision_recall.png")


def plot_model_comparison():
    with open(COMPARISON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    results = data["results"]
    best_model = data["best_model"]

    nomes = list(results.keys())
    f1_scores = [results[nome]["test_f1_score"] for nome in nomes]

    ordenado = sorted(zip(nomes, f1_scores), key=lambda x: x[1], reverse=True)
    nomes, f1_scores = zip(*ordenado)

    cores = ["#d9822b" if nome == best_model else "#3b6ea5" for nome in nomes]

    fig, ax = plt.subplots(figsize=(10, 6))
    barras = ax.barh(nomes, f1_scores, color=cores, edgecolor="black", linewidth=0.5)
    ax.invert_yaxis()

    ax.set_xlabel("F1-score (conjunto de teste)")
    ax.set_title("Comparação de Modelos — F1-score no Conjunto de Teste")
    ax.set_xlim(0, 1)
    ax.grid(axis="x", linestyle="--", alpha=0.4)

    for barra, valor in zip(barras, f1_scores):
        ax.text(valor + 0.01, barra.get_y() + barra.get_height() / 2,
                 f"{valor:.4f}", va="center", fontsize=9)

    fig.tight_layout()
    fig.savefig(FIGURES_DIR / "comparacao_modelos.png", dpi=150)
    plt.close(fig)
    print("Salvo: comparacao_modelos.png")


def plot_shap_summary(X_test, model, sample_size=1000):
    import shap

    sample = X_test.sample(n=min(sample_size, len(X_test)), random_state=42)

    preprocessor = model.named_steps["preprocessor"]
    classifier = model.named_steps["classifier"]

    transformed_sample = preprocessor.transform(sample)
    feature_names = preprocessor.get_feature_names_out()

    explainer = shap.TreeExplainer(classifier)
    shap_values = explainer.shap_values(transformed_sample)

    if isinstance(shap_values, list):
        shap_values = shap_values[1]

    fig = plt.figure(figsize=(9, 7))
    shap.summary_plot(
        shap_values, transformed_sample, feature_names=feature_names,
        show=False, plot_size=None
    )
    plt.title("Importância das Features (SHAP) — Modelo LightGBM", fontsize=12)
    plt.tight_layout()
    plt.savefig(FIGURES_DIR / "shap_summary.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("Salvo: shap_summary.png")


if __name__ == "__main__":
    print("Carregando dados e modelo...")
    X_test, y_test, y_pred, y_proba, model = load_test_predictions()

    print("\nGerando figuras...")
    plot_confusion_matrix(y_test, y_pred)
    plot_roc_curve(y_test, y_proba)
    plot_precision_recall_curve(y_test, y_proba)
    plot_model_comparison()
    plot_shap_summary(X_test, model)

    print(f"\nTodas as figuras foram salvas em: {FIGURES_DIR}")