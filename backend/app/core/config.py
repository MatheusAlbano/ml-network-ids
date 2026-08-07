"""
Configurações centrais da aplicação: caminhos de artefatos e metadados.
Centralizar aqui evita "caminhos mágicos" espalhados pelo código.
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]

MODELS_DIR = BASE_DIR / "models"
ARTIFACTS_DIR = BASE_DIR / "artifacts"

MODEL_PATH = MODELS_DIR / "best_model.joblib"
SCHEMA_PATH = ARTIFACTS_DIR / "input_schema.json"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"

APP_TITLE = "ML Network IDS API"
APP_DESCRIPTION = (
    "API para detecção de intrusão em redes utilizando Machine Learning, "
    "treinada sobre o dataset UNSW-NB15."
)
APP_VERSION = "0.1.0"