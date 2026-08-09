"""Script utilitário para gerar um CSV de teste para o endpoint de upload em lote."""

from pathlib import Path

from data_loader import load_raw_data
from feature_engineering import prepare_dataset

OUTPUT_PATH = Path(__file__).resolve().parents[3] / "artifacts" / "sample_batch_test.csv"

if __name__ == "__main__":
    _, df_test = load_raw_data()
    X_test, _ = prepare_dataset(df_test)

    sample = X_test.sample(n=20, random_state=1)
    sample.to_csv(OUTPUT_PATH, index=False)
    print(f"CSV de teste com 20 linhas salvo em: {OUTPUT_PATH}")