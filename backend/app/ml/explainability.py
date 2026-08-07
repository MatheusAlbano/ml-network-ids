"""
Módulo de explicabilidade (XAI) usando SHAP. Calcula, para uma predição
individual, quais features mais contribuíram para a decisão do modelo,
e gera uma explicação em linguagem simples.
"""

from functools import lru_cache

import joblib
import numpy as np
import pandas as pd
import shap

from app.core.config import MODEL_PATH


@lru_cache(maxsize=1)
def get_pipeline():
    """Carrega o pipeline treinado uma única vez (reaproveita o cache do predict.py seria ideal,
    mas mantemos independente aqui para o módulo funcionar de forma isolada e testável)."""
    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def get_explainer() -> shap.TreeExplainer:
    """
    Constrói o SHAP TreeExplainer uma única vez, usando apenas o
    classificador (último passo do pipeline) — o SHAP trabalha sobre
    o modelo em si, não sobre o pipeline de pré-processamento.
    """
    pipeline = get_pipeline()
    classifier = pipeline.named_steps["classifier"]
    return shap.TreeExplainer(classifier)


def _map_transformed_name_to_original(transformed_name: str) -> str:
    """
    Converte um nome de coluna pós-ColumnTransformer (ex: 'categorical__proto_tcp'
    ou 'numeric__dur') de volta para o nome da feature original ('proto' ou 'dur').
    """
    # Remove o prefixo do transformador (ex: 'categorical__', 'numeric__')
    _, _, name_without_prefix = transformed_name.partition("__")

    if transformed_name.startswith("numeric__"):
        return name_without_prefix

    # Para categóricas, o OneHotEncoder gera algo como 'proto_tcp' — a feature
    # original é tudo antes do último '_' que corresponde a um valor conhecido.
    # Como sabemos que só proto/service/state são categóricas, comparamos prefixos.
    for original_feature in ["proto", "service", "state"]:
        if name_without_prefix.startswith(f"{original_feature}_"):
            return original_feature

    return name_without_prefix


def explain_prediction(input_df: pd.DataFrame, top_n: int = 3) -> dict:
    """
    Calcula a explicação SHAP para uma única predição.

    Returns:
        dict com 'top_features' (lista de contribuições agregadas por
        feature original) e 'explanation_text' (frase em linguagem simples).
    """
    pipeline = get_pipeline()
    explainer = get_explainer()

    preprocessor = pipeline.named_steps["preprocessor"]
    transformed_input = preprocessor.transform(input_df)
    transformed_feature_names = preprocessor.get_feature_names_out()

    shap_values = explainer.shap_values(transformed_input)

    # Diferentes versões do SHAP/LightGBM retornam formatos distintos para
    # classificação binária: pode vir uma lista [classe_0, classe_1], ou um
    # único array já referente à classe positiva (Ataque). Tratamos os dois casos.
    if isinstance(shap_values, list):
        attack_shap_values = shap_values[1][0]
    else:
        attack_shap_values = shap_values[0]

    # Agrega contribuições de colunas one-hot de volta para a feature original
    aggregated_contributions: dict[str, float] = {}
    for name, value in zip(transformed_feature_names, attack_shap_values):
        original_name = _map_transformed_name_to_original(name)
        aggregated_contributions[original_name] = (
            aggregated_contributions.get(original_name, 0.0) + float(value)
        )

    sorted_contributions = sorted(
        aggregated_contributions.items(), key=lambda item: abs(item[1]), reverse=True
    )

    top_features = []
    for feature_name, contribution in sorted_contributions[:top_n]:
        raw_value = input_df.iloc[0][feature_name]
        top_features.append(
            {
                "feature": feature_name,
                "value": raw_value if isinstance(raw_value, str) else float(raw_value),
                "contribution": round(contribution, 4),
                "direction": "aumenta" if contribution > 0 else "diminui",
            }
        )

    explanation_text = _build_explanation_text(top_features)

    return {"top_features": top_features, "explanation_text": explanation_text}


def _build_explanation_text(top_features: list[dict]) -> str:
    """Monta a frase em linguagem simples a partir das top features."""
    if not top_features:
        return "Não foi possível determinar os principais fatores desta predição."

    increasing = [f["feature"] for f in top_features if f["direction"] == "aumenta"]
    decreasing = [f["feature"] for f in top_features if f["direction"] == "diminui"]

    parts = []
    if increasing:
        parts.append(f"os valores de {', '.join(increasing)} aumentaram a suspeita de ataque")
    if decreasing:
        parts.append(f"os valores de {', '.join(decreasing)} indicaram tráfego normal")

    return "Esta conexão foi classificada principalmente porque " + "; e ".join(parts) + "."


if __name__ == "__main__":
    # Teste isolado do módulo, sem depender da API — usa um exemplo do schema
    import json
    from app.core.config import SCHEMA_PATH

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = json.load(f)

    example_input = {}
    for feature in schema["features"]:
        if feature["type"] == "categorical":
            example_input[feature["name"]] = feature["allowed_values"][0]
        else:
            example_input[feature["name"]] = feature["example"]

    df = pd.DataFrame([example_input])
    result = explain_prediction(df)

    print("Top features:")
    for f in result["top_features"]:
        print(f"  {f['feature']} = {f['value']} ({f['direction']}, contribuição: {f['contribution']})")
    print(f"\nExplicação: {result['explanation_text']}")