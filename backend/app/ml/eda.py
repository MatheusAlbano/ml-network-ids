"""
Módulo de Análise Exploratória de Dados (EDA) para o UNSW-NB15.
Gera estatísticas e gráficos para embasar as decisões de engenharia de atributos.
"""

from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

from data_loader import load_raw_data

# Pasta onde os gráficos gerados serão salvos
ARTIFACTS_DIR = Path(__file__).resolve().parents[3] / "artifacts" / "eda"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


def analyze_categorical_columns(df: pd.DataFrame) -> None:
    """Exibe a cardinalidade (nº de valores únicos) de cada coluna categórica."""
    categorical_cols = df.select_dtypes(include="object").columns.tolist()
    print(f"\nColunas categóricas encontradas: {categorical_cols}")

    for col in categorical_cols:
        n_unique = df[col].nunique()
        print(f"\n'{col}' — {n_unique} valores únicos")
        if n_unique <= 15:
            print(df[col].value_counts())
        else:
            print(f"(muitos valores únicos para listar — top 10:)")
            print(df[col].value_counts().head(10))


def plot_class_distribution(df: pd.DataFrame) -> None:
    """Gera gráfico de barras da distribuição normal vs. ataque."""
    fig, ax = plt.subplots(figsize=(6, 4))
    df["label"].value_counts().sort_index().plot(
        kind="bar", ax=ax, color=["#2E86AB", "#E63946"]
    )
    ax.set_xticklabels(["Normal (0)", "Ataque (1)"], rotation=0)
    ax.set_title("Distribuição de Classes — Normal vs. Ataque")
    ax.set_ylabel("Quantidade de registros")
    fig.tight_layout()
    fig.savefig(ARTIFACTS_DIR / "class_distribution.png", dpi=150)
    plt.close(fig)
    print(f"\nGráfico salvo em: {ARTIFACTS_DIR / 'class_distribution.png'}")


def plot_correlation_heatmap(df: pd.DataFrame) -> None:
    """Gera heatmap de correlação entre as features numéricas."""
    numeric_df = df.select_dtypes(include=["int64", "float64"])
    corr = numeric_df.corr()

    fig, ax = plt.subplots(figsize=(16, 14))
    im = ax.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)
    ax.set_xticks(range(len(corr.columns)))
    ax.set_yticks(range(len(corr.columns)))
    ax.set_xticklabels(corr.columns, rotation=90, fontsize=7)
    ax.set_yticklabels(corr.columns, fontsize=7)
    fig.colorbar(im, ax=ax, shrink=0.8)
    ax.set_title("Matriz de Correlação — Features Numéricas")
    fig.tight_layout()
    fig.savefig(ARTIFACTS_DIR / "correlation_heatmap.png", dpi=150)
    plt.close(fig)
    print(f"Gráfico salvo em: {ARTIFACTS_DIR / 'correlation_heatmap.png'}")


def find_highly_correlated_features(df: pd.DataFrame, threshold: float = 0.9) -> None:
    """Identifica pares de features numéricas com correlação acima do limiar."""
    numeric_df = df.select_dtypes(include=["int64", "float64"])
    corr = numeric_df.corr().abs()

    # Pega apenas o triângulo superior da matriz, para não duplicar pares (A,B) e (B,A)
    upper = corr.where(
        pd.DataFrame(
            [[i < j for j in range(len(corr.columns))] for i in range(len(corr.columns))],
            index=corr.index, columns=corr.columns
        )
    )

    high_corr_pairs = [
        (col, row, upper.loc[row, col])
        for col in upper.columns
        for row in upper.index
        if pd.notnull(upper.loc[row, col]) and upper.loc[row, col] >= threshold
    ]

    print(f"\nPares de features com correlação >= {threshold}:")
    if not high_corr_pairs:
        print("Nenhum par encontrado acima do limiar.")
    else:
        for col, row, value in sorted(high_corr_pairs, key=lambda x: -x[2]):
            print(f"  {row} <-> {col}: {value:.3f}")


def detect_outliers_iqr(df: pd.DataFrame, top_n: int = 10) -> None:
    """Identifica as colunas numéricas com maior proporção de outliers (método IQR)."""
    numeric_df = df.select_dtypes(include=["int64", "float64"])
    outlier_ratios = {}

    for col in numeric_df.columns:
        q1 = numeric_df[col].quantile(0.25)
        q3 = numeric_df[col].quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = numeric_df[(numeric_df[col] < lower_bound) | (numeric_df[col] > upper_bound)]
        outlier_ratios[col] = len(outliers) / len(numeric_df) * 100

    print(f"\nTop {top_n} colunas com maior proporção de outliers (método IQR):")
    sorted_ratios = sorted(outlier_ratios.items(), key=lambda x: -x[1])[:top_n]
    for col, ratio in sorted_ratios:
        print(f"  {col}: {ratio:.2f}% de outliers")


if __name__ == "__main__":
    df_train, _ = load_raw_data()

    analyze_categorical_columns(df_train)
    plot_class_distribution(df_train)
    plot_correlation_heatmap(df_train)
    find_highly_correlated_features(df_train, threshold=0.9)
    detect_outliers_iqr(df_train)