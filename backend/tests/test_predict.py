"""
Testes do endpoint POST /predict.

O teste 'test_predict_schema_and_model_are_compatible' é o mais
importante desta suíte: ele teria detectado automaticamente o bug
do preprocessador compartilhado (Etapa 11), sem depender de testes
manuais via Swagger.
"""

import copy


def test_predict_with_valid_payload_returns_200(client, valid_payload):
    response = client.post("/predict", json=valid_payload)
    assert response.status_code == 200


def test_predict_response_has_expected_fields(client, valid_payload):
    response = client.post("/predict", json=valid_payload)
    body = response.json()

    expected_fields = {
        "predicted_class",
        "probability_normal",
        "probability_attack",
        "risk_level",
        "inference_time_ms",
        "model_used",
        "timestamp",
    }
    assert expected_fields.issubset(body.keys())


def test_predict_probabilities_sum_to_one(client, valid_payload):
    """As probabilidades de Normal e Ataque devem somar (aproximadamente) 1."""
    response = client.post("/predict", json=valid_payload)
    body = response.json()

    total = body["probability_normal"] + body["probability_attack"]
    assert abs(total - 1.0) < 1e-6


def test_predict_class_matches_higher_probability(client, valid_payload):
    """A classe prevista deve corresponder à maior das duas probabilidades."""
    response = client.post("/predict", json=valid_payload)
    body = response.json()

    if body["probability_attack"] >= 0.5:
        assert body["predicted_class"] == "Ataque"
    else:
        assert body["predicted_class"] == "Normal"


def test_predict_rejects_invalid_categorical_value(client, valid_payload):
    """Um valor de 'proto' fora do Enum deve ser rejeitado com 422."""
    invalid_payload = copy.deepcopy(valid_payload)
    invalid_payload["proto"] = "protocolo_que_nao_existe"

    response = client.post("/predict", json=invalid_payload)
    assert response.status_code == 422


def test_predict_rejects_missing_field(client, valid_payload):
    """Remover um campo obrigatório deve ser rejeitado com 422."""
    invalid_payload = copy.deepcopy(valid_payload)
    del invalid_payload["dur"]

    response = client.post("/predict", json=invalid_payload)
    assert response.status_code == 422


def test_predict_rejects_wrong_type(client, valid_payload):
    """Enviar texto em um campo numérico deve ser rejeitado com 422."""
    invalid_payload = copy.deepcopy(valid_payload)
    invalid_payload["dur"] = "isso não é um número"

    response = client.post("/predict", json=invalid_payload)
    assert response.status_code == 422


def test_predict_schema_and_model_are_compatible(client, valid_payload):
    """
    Teste de contrato: garante que o número de features que o pipeline
    espera é compatível com o payload gerado a partir do schema salvo.
    Esse é exatamente o teste que teria capturado o bug da Etapa 11
    (preprocessador compartilhado gerando dimensionalidade incorreta).
    """
    response = client.post("/predict", json=valid_payload)

    assert response.status_code == 200, (
        f"Predição falhou com payload gerado a partir do schema oficial. "
        f"Isso indica incompatibilidade entre input_schema.json e o "
        f"pipeline salvo em best_model.joblib. Resposta: {response.text}"
    )