"""
Módulo de engenharia de atributos do UNSW-NB15.
Aplica as decisões definidas na Etapa 6 (EDA): remoção de leakage,
tratamento de cardinalidade, remoção de redundância, encoding e normalização.
"""

from pathlib import Path
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, RobustScaler

try:
    from app.ml.data_loader import load_raw_data
except ImportError:
    from data_loader import load_raw_data

# Colunas que NUNCA devem entrar como feature (vazamento de dados ou irrelevantes)
LEAKAGE_COLUMNS = ["attack_cat", "id"]

# Coluna alvo (target)
TARGET_COLUMN = "label"

# Features redundantes identificadas na Etapa 6 (mantemos uma de cada par)
REDUNDANT_COLUMNS = [
    "is_ftp_login",  # redundante com ct_ftp_cmd (corr = 1.000)
    "dbytes",        # redundante com dloss (corr = 0.997)
    "sbytes",        # redundante com sloss (corr = 0.996)
    "dwin",          # redundante com swin (corr = 0.990)
    "ct_srv_dst",    # redundante com ct_srv_src (corr = 0.980)
    "dpkts",         # redundante com dloss/dbytes (corr >= 0.97)
    "spkts",         # redundante com sloss/sbytes (corr >= 0.96)
    "synack",        # redundante com tcprtt (corr = 0.949)
]

# Categorias de 'proto' que serão mantidas; o restante vira "other"
TOP_PROTO_CATEGORIES = ["tcp", "udp", "unas", "arp", "ospf"]

# Colunas categóricas que serão codificadas via One-Hot Encoding
CATEGORICAL_COLUMNS = ["proto", "service", "state"]


def group_rare_proto(df: pd.DataFrame) -> pd.DataFrame:
    """Agrupa categorias raras de 'proto' em 'other', reduzindo a cardinalidade."""
    df = df.copy()
    df["proto"] = df["proto"].apply(
        lambda x: x if x in TOP_PROTO_CATEGORIES else "other"
    )
    return df


def drop_unwanted_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Remove colunas de vazamento de dados e features redundantes."""
    columns_to_drop = [
        col for col in LEAKAGE_COLUMNS + REDUNDANT_COLUMNS if col in df.columns
    ]
    return df.drop(columns=columns_to_drop)


def split_features_target(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Separa o DataFrame em features (X) e alvo (y)."""
    X = df.drop(columns=[TARGET_COLUMN])
    y = df[TARGET_COLUMN]
    return X, y


def build_preprocessing_pipeline(X: pd.DataFrame) -> ColumnTransformer:
    """
    Constrói o pipeline de pré-processamento:
    - One-Hot Encoding para colunas categóricas
    - RobustScaler para colunas numéricas
    """
    numeric_columns = X.select_dtypes(include=["int64", "float64"]).columns.tolist()

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_COLUMNS,
            ),
            ("numeric", RobustScaler(), numeric_columns),
        ],
        remainder="drop",
    )

    return preprocessor


def prepare_dataset(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """
    Aplica todas as etapas de engenharia de atributos, exceto o fit do
    encoder/scaler (isso será feito na Etapa 8, apenas com dados de treino).
    """
    df = group_rare_proto(df)
    df = drop_unwanted_columns(df)
    X, y = split_features_target(df)
    return X, y


if __name__ == "__main__":
    df_train, df_test = load_raw_data()

    X_train, y_train = prepare_dataset(df_train)
    X_test, y_test = prepare_dataset(df_test)

    print(f"Shape de X_train após engenharia de atributos: {X_train.shape}")
    print(f"Shape de X_test após engenharia de atributos: {X_test.shape}")
    print(f"\nColunas restantes em X_train:\n{X_train.columns.tolist()}")

    print(f"\nNova distribuição de 'proto' após agrupamento (treino):")
    print(X_train["proto"].value_counts())

    preprocessor = build_preprocessing_pipeline(X_train)
    X_train_transformed = preprocessor.fit_transform(X_train)
    X_test_transformed = preprocessor.transform(X_test)

    print(f"\nShape de X_train após encoding + normalização: {X_train_transformed.shape}")
    print(f"Shape de X_test após encoding + normalização: {X_test_transformed.shape}")