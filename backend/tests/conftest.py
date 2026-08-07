"""
Configurações e fixtures compartilhadas entre os testes da API.
"""

import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Garante que 'app' seja importável quando os testes rodarem a partir da raiz do projeto
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app #type: ignore
from app.core.config import SCHEMA_PATH #type: ignore


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Cliente de teste que simula requisições HTTP à API, sem precisar do uvicorn rodando."""
    return TestClient(app)


@pytest.fixture(scope="session")
def valid_payload() -> dict:
    """
    Monta um payload válido de conexão de rede, usando os valores de
    'example' (numéricos) e o primeiro 'allowed_value' (categóricos)
    do input_schema.json — assim o teste nunca fica desatualizado se
    o schema mudar no futuro.
    """
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = json.load(f)

    payload = {}
    for feature in schema["features"]:
        if feature["type"] == "categorical":
            payload[feature["name"]] = feature["allowed_values"][0]
        else:
            payload[feature["name"]] = feature["example"]

    return payload