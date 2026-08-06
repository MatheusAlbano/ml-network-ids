"""
Módulo responsável por carregar o dataset UNSW-NB15 a partir dos arquivos CSV brutos.
"""

from pathlib import Path
import pandas as pd

# Caminho base do dataset bruto, relativo à raiz do projeto
RAW_DATA_DIR = Path(__file__).resolve().parents[3] / "dataset" / "raw"

TRAIN_FILE = RAW_DATA_DIR / "UNSW_NB15_training-set.csv"
TEST_FILE = RAW_DATA_DIR / "UNSW_NB15_testing-set.csv"


def load_raw_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Carrega os conjuntos de treino e teste brutos do UNSW-NB15.

    Returns:
        tuple contendo (df_train, df_test)
    """
    if not TRAIN_FILE.exists():
        raise FileNotFoundError(
            f"Arquivo de treino não encontrado em: {TRAIN_FILE}. "
            "Baixe o dataset e coloque em dataset/raw/."
        )
    if not TEST_FILE.exists():
        raise FileNotFoundError(
            f"Arquivo de teste não encontrado em: {TEST_FILE}. "
            "Baixe o dataset e coloque em dataset/raw/."
        )

    df_train = pd.read_csv(TRAIN_FILE)
    df_test = pd.read_csv(TEST_FILE)

    return df_train, df_test


def inspect_dataset(df: pd.DataFrame, name: str = "dataset") -> None:
    """
    Imprime um resumo exploratório inicial do dataset: shape, colunas,
    tipos de dados e contagem de valores nulos.
    """
    print(f"\n{'=' * 60}")
    print(f"Inspeção: {name}")
    print(f"{'=' * 60}")
    print(f"Shape (linhas, colunas): {df.shape}")
    print(f"\nTipos de dados:\n{df.dtypes.value_counts()}")
    print(f"\nValores nulos por coluna (top 10):")
    nulls = df.isnull().sum()
    nulls_present = nulls[nulls > 0].sort_values(ascending=False)
    if nulls_present.empty:
        print("Nenhum valor nulo encontrado.")
    else:
        print(nulls_present.head(10))

    if "label" in df.columns:
        print(f"\nDistribuição da coluna 'label' (0=normal, 1=ataque):")
        print(df["label"].value_counts())

    if "attack_cat" in df.columns:
        print(f"\nDistribuição da coluna 'attack_cat':")
        print(df["attack_cat"].value_counts())


if __name__ == "__main__":
    df_train, df_test = load_raw_data()
    inspect_dataset(df_train, "Treino (training-set)")
    inspect_dataset(df_test, "Teste (testing-set)")