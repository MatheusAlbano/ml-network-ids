"""Testes do endpoint GET /status."""


def test_status_returns_200(client):
    response = client.get("/status")
    assert response.status_code == 200


def test_status_contains_expected_fields(client):
    response = client.get("/status")
    body = response.json()

    assert "status" in body
    assert "model_name" in body
    assert "model_metrics" in body
    assert body["status"] == "online"


def test_status_metrics_are_valid_ranges(client):
    """Métricas de classificação devem estar sempre entre 0 e 1."""
    response = client.get("/status")
    metrics = response.json()["model_metrics"]

    for metric_name, value in metrics.items():
        assert 0.0 <= value <= 1.0, f"{metric_name} fora do intervalo esperado: {value}"