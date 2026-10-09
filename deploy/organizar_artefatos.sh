#!/bin/sh
# Coloca os artefatos do modelo nas pastas que a API espera.
# Eles não ficam no GitHub (são gerados pelo treinamento), então são
# enviados uma única vez ao Space do Hugging Face, na raiz ou já nas
# pastas certas. Este script aceita os dois jeitos.
set -e
cd "$(dirname "$0")/.."

colocar() {
  nome="$1"; destino="$2"
  if [ -f "$destino/$nome" ]; then
    echo "ok: $destino/$nome"
    return
  fi
  origem=$(find . -path ./frontend -prune -o -name "$nome" -type f -print | head -n 1)
  if [ -n "$origem" ]; then
    mkdir -p "$destino"
    mv "$origem" "$destino/$nome"
    echo "ok: $origem -> $destino/$nome"
  else
    echo "AVISO: $nome não encontrado; envie o arquivo ao Space."
  fi
}

colocar best_model.joblib models
colocar input_schema.json artifacts
colocar model_metadata.json artifacts
colocar UNSW_NB15_testing-set.csv dataset/raw
