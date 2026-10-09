"""
Experimentos complementares para o texto do TCC (parecer da banca).

Gera os números que o texto ainda não tem, a partir dos artefatos já treinados:
  1. Desvio padrão da validação cruzada de cada modelo (Tabela 1)
  2. Intervalo de confiança (bootstrap, 95%) do F1 no teste para os três
     melhores modelos e teste de McNemar entre os dois primeiros
     (na execução do TCC, LightGBM e CatBoost)
  3. Tabela de limiares (Precisão, Recall, F1 e taxa de falsos positivos)
  4. Ablação dos atributos de TTL (sttl, dttl, ct_state_ttl)
  5. Tempo de resposta da predição individual, com e sem SHAP
  6. (opcional, --selecao-robusta) seleção do modelo em metade do teste
     e avaliação final na outra metade
  7. Especificação da máquina em que os experimentos rodaram

Pré-requisitos: dataset em dataset/raw/ e os artefatos gerados por
compare_models.py (artifacts/model_comparison_results.json e
models/best_model.joblib).

Uso (na raiz do repositório):
    python backend/app/ml/experimentos_banca.py
    python backend/app/ml/experimentos_banca.py --selecao-robusta

Os resultados são impressos e salvos em artifacts/experimentos_banca.json.
"""

import argparse
import json
import os
import platform
import sys
import time
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from scipy.stats import binomtest
from sklearn.base import clone
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

# Permite importar app.* (usado pela explicabilidade) rodando da raiz do projeto
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.ml.compare_models import (  # noqa: E402
    BEST_MODEL_PATH,
    CANDIDATE_MODELS,
    MODELS_REQUIRING_SAMPLING,
    RESULTS_PATH,
    SVM_SAMPLE_SIZE,
    ARTIFACTS_DIR,
    build_pipeline_for_model,
    stratified_sample,
)
from app.ml.data_loader import load_raw_data  # noqa: E402
from app.ml.feature_engineering import (  # noqa: E402
    build_preprocessing_pipeline,
    prepare_dataset,
)

OUTPUT_PATH = ARTIFACTS_DIR / "experimentos_banca.json"

warnings.filterwarnings("ignore", category=FutureWarning)

TTL_COLUMNS = ["sttl", "dttl", "ct_state_ttl"]
THRESHOLDS = [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80]
N_BOOTSTRAP = 1000
N_TIMING = 200


def fit_model(name, X_train, y_train):
    """Treina um modelo candidato com a mesma configuração de compare_models.py."""
    model = clone(CANDIDATE_MODELS[name])
    pipeline = build_pipeline_for_model(build_preprocessing_pipeline(X_train), model)
    if name in MODELS_REQUIRING_SAMPLING:
        X_train, y_train = stratified_sample(X_train, y_train, SVM_SAMPLE_SIZE)
    pipeline.fit(X_train, y_train)
    return pipeline


def scores(pipeline, X):
    if hasattr(pipeline, "predict_proba"):
        return pipeline.predict_proba(X)[:, 1]
    return pipeline.decision_function(X)


def cv_table():
    with open(RESULTS_PATH, encoding="utf-8") as f:
        results = json.load(f)["results"]
    table = {
        name: {
            "cv_f1_mean": r["cv_f1_score_mean"],
            "cv_f1_std": r["cv_f1_score_std"],
            "cv_roc_auc_mean": r["cv_roc_auc_mean"],
            "cv_roc_auc_std": r["cv_roc_auc_std"],
            "test_f1": r["test_f1_score"],
            "test_roc_auc": r["test_roc_auc"],
            "training_time_seconds": r["training_time_seconds"],
        }
        for name, r in results.items()
    }
    print("\n1. Validação cruzada (média ± desvio padrão)")
    for name, r in sorted(table.items(), key=lambda kv: -kv[1]["test_f1"]):
        print(f"  {name:<22} F1 CV {r['cv_f1_mean']:.4f} ± {r['cv_f1_std']:.4f}"
              f" | F1 teste {r['test_f1']:.4f}")
    return table


def bootstrap_and_mcnemar(predictions, y_test):
    first, second = list(predictions)[:2]
    rng = np.random.default_rng(42)
    y = y_test.to_numpy()
    n = len(y)
    samples = {name: [] for name in predictions}
    diffs = []
    for _ in range(N_BOOTSTRAP):
        idx = rng.integers(0, n, n)
        f1s = {name: f1_score(y[idx], pred[idx]) for name, pred in predictions.items()}
        for name, value in f1s.items():
            samples[name].append(value)
        diffs.append(f1s[first] - f1s[second])

    ci = {}
    print(f"\n2. F1 no teste com IC 95% (bootstrap, {N_BOOTSTRAP} reamostragens)")
    for name, values in samples.items():
        low, high = np.percentile(values, [2.5, 97.5])
        f1 = f1_score(y, predictions[name])
        ci[name] = {"f1": f1, "ic95_inferior": low, "ic95_superior": high}
        print(f"  {name:<22} {f1:.4f} [{low:.4f}; {high:.4f}]")

    d_low, d_high = np.percentile(diffs, [2.5, 97.5])
    print(f"  Diferença {first} - {second}: IC 95% [{d_low:.4f}; {d_high:.4f}]")

    # McNemar exato: compara apenas as conexões em que os dois modelos discordam
    first_ok = predictions[first] == y
    second_ok = predictions[second] == y
    b = int(np.sum(first_ok & ~second_ok))
    c = int(np.sum(~first_ok & second_ok))
    p_value = binomtest(b, b + c, 0.5).pvalue if b + c else 1.0
    print(f"  McNemar (exato): só {first} acerta = {b}, só {second} acerta = {c},"
          f" p-valor = {p_value:.4g}")

    return {
        "bootstrap": ci,
        "diferenca_f1": {"modelos": [first, second], "ic95": [d_low, d_high]},
        "mcnemar": {
            "modelos": [first, second],
            "so_primeiro_acerta": b,
            "so_segundo_acerta": c,
            "p_valor": p_value,
        },
    }


def threshold_table(y_score, y_test):
    rows = []
    print("\n3. Limiar de decisão do modelo em produção")
    print("  Limiar  Precisão  Recall   F1      TFP     FP")
    for t in THRESHOLDS:
        y_pred = (y_score >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        row = {
            "limiar": t,
            "precisao": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "f1": f1_score(y_test, y_pred),
            "taxa_falsos_positivos": fp / (fp + tn),
            "falsos_positivos": int(fp),
            "falsos_negativos": int(fn),
        }
        rows.append(row)
        print(f"  {t:.2f}    {row['precisao']:.4f}    {row['recall']:.4f}   "
              f"{row['f1']:.4f}  {row['taxa_falsos_positivos']:.4f}  {fp}")
    return rows


def ttl_ablation(X_train, y_train, X_test, y_test):
    results = {}
    print("\n4. Ablação dos atributos de TTL (LightGBM)")
    for label, removed in [("completo", []), ("sem sttl", ["sttl"]), ("sem TTL", TTL_COLUMNS)]:
        Xtr = X_train.drop(columns=removed)
        Xte = X_test.drop(columns=removed)
        pipeline = fit_model("LightGBM", Xtr, y_train)
        y_pred = pipeline.predict(Xte)
        y_score = pipeline.predict_proba(Xte)[:, 1]
        results[label] = {
            "removidos": removed,
            "acuracia": accuracy_score(y_test, y_pred),
            "f1": f1_score(y_test, y_pred),
            "roc_auc": roc_auc_score(y_test, y_score),
        }
        r = results[label]
        print(f"  {label:<10} acurácia {r['acuracia']:.4f} | F1 {r['f1']:.4f}"
              f" | ROC-AUC {r['roc_auc']:.4f}")
    return results


def timing(X_test):
    from app.ml.explainability import explain_prediction, get_explainer, get_pipeline

    pipeline = get_pipeline()
    try:
        get_explainer()  # o explainer é criado uma vez na API; fica fora da medição
    except Exception as exc:  # o modelo em produção não é baseado em árvores
        print(f"\n5. Tempo de resposta ignorado: SHAP indisponível para o modelo ({exc})")
        return None
    rows = X_test.sample(N_TIMING, random_state=42)

    only_model, with_shap = [], []
    for i in range(N_TIMING):
        row = rows.iloc[[i]]
        start = time.perf_counter()
        pipeline.predict_proba(row)
        only_model.append((time.perf_counter() - start) * 1000)

        start = time.perf_counter()
        pipeline.predict_proba(row)
        explain_prediction(row)
        with_shap.append((time.perf_counter() - start) * 1000)

    result = {
        "n_requisicoes": N_TIMING,
        "predicao_ms": {"media": float(np.mean(only_model)), "desvio": float(np.std(only_model))},
        "predicao_com_shap_ms": {"media": float(np.mean(with_shap)), "desvio": float(np.std(with_shap))},
    }
    print(f"\n5. Tempo por conexão ({N_TIMING} conexões do teste, sem a camada HTTP)")
    print(f"  Predição:         {result['predicao_ms']['media']:.2f} ± {result['predicao_ms']['desvio']:.2f} ms")
    print(f"  Predição + SHAP:  {result['predicao_com_shap_ms']['media']:.2f} ± "
          f"{result['predicao_com_shap_ms']['desvio']:.2f} ms")
    return result


def robust_selection(X_train, y_train, X_test, y_test):
    X_sel, X_final, y_sel, y_final = train_test_split(
        X_test, y_test, test_size=0.5, stratify=y_test, random_state=42
    )
    results = {}
    print("\n6. Seleção em metade do teste e avaliação na outra metade")
    for name in CANDIDATE_MODELS:
        pipeline = fit_model(name, X_train, y_train)
        results[name] = {
            "f1_selecao": f1_score(y_sel, pipeline.predict(X_sel)),
            "f1_avaliacao_final": f1_score(y_final, pipeline.predict(X_final)),
            "roc_auc_avaliacao_final": roc_auc_score(y_final, scores(pipeline, X_final)),
        }
        print(f"  {name:<22} F1 seleção {results[name]['f1_selecao']:.4f}"
              f" | F1 final {results[name]['f1_avaliacao_final']:.4f}")
    best = max(results, key=lambda n: results[n]["f1_selecao"])
    print(f"  Selecionado: {best} (F1 final {results[best]['f1_avaliacao_final']:.4f})")
    return {"modelos": results, "selecionado": best}


def machine_info():
    info = {
        "sistema": platform.platform(),
        "processador": platform.processor() or platform.machine(),
        "nucleos_logicos": os.cpu_count(),
        "python": platform.python_version(),
    }
    try:
        import psutil

        info["memoria_gb"] = round(psutil.virtual_memory().total / 1024**3, 1)
    except ImportError:
        if hasattr(os, "sysconf") and "SC_PHYS_PAGES" in os.sysconf_names:
            info["memoria_gb"] = round(
                os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 1024**3, 1
            )
    print("\n7. Máquina")
    for key, value in info.items():
        print(f"  {key}: {value}")
    print("  (no Windows, confira o modelo do processador e a memória em Configurações > Sistema > Sobre)")
    return info


def to_builtin(obj):
    if isinstance(obj, dict):
        return {k: to_builtin(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_builtin(v) for v in obj]
    if isinstance(obj, np.generic):
        return obj.item()
    return obj


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "--selecao-robusta",
        action="store_true",
        help="retreina os nove modelos para a seleção em metade do teste (mais demorado)",
    )
    args = parser.parse_args()

    output = {"maquina": machine_info(), "validacao_cruzada": cv_table()}

    print("\nCarregando dados...")
    df_train, df_test = load_raw_data()
    X_train, y_train = prepare_dataset(df_train)
    X_test, y_test = prepare_dataset(df_test)

    # Os três melhores no teste; o primeiro é o modelo em produção (best_model.joblib)
    top_models = sorted(output["validacao_cruzada"], key=lambda n: -output["validacao_cruzada"][n]["test_f1"])[:3]
    best_pipeline = joblib.load(BEST_MODEL_PATH)
    predictions = {top_models[0]: best_pipeline.predict(X_test)}
    for name in top_models[1:]:
        print(f"Retreinando {name} para a comparação pareada...")
        predictions[name] = fit_model(name, X_train, y_train).predict(X_test)

    output["comparacao_estatistica"] = bootstrap_and_mcnemar(predictions, y_test)
    output["limiares"] = threshold_table(best_pipeline.predict_proba(X_test)[:, 1], y_test)
    output["ablacao_ttl"] = ttl_ablation(X_train, y_train, X_test, y_test)
    output["tempo_resposta"] = timing(X_test)
    if args.selecao_robusta:
        output["selecao_robusta"] = robust_selection(X_train, y_train, X_test, y_test)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(to_builtin(output), f, indent=2, ensure_ascii=False)
    print(f"\nResultados salvos em: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
