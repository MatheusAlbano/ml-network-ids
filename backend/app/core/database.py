"""
Configuração da conexão com o banco de dados SQLite e definição da
sessão usada pelos endpoints para ler/gravar o histórico de análises.
"""

import os

from sqlalchemy import create_engine #type: ignore
from sqlalchemy.orm import sessionmaker, declarative_base #type: ignore

from app.core.config import BASE_DIR

DATABASE_PATH = BASE_DIR / "artifacts" / "history.db"

# Por padrão usa o SQLite local. Na hospedagem, a variável DATABASE_URL pode
# apontar para um PostgreSQL externo, para que usuários e histórico não se
# percam quando o servidor reinicia.
DATABASE_URL = os.getenv("DATABASE_URL") or f"sqlite:///{DATABASE_PATH}"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    # check_same_thread=False é necessário porque o FastAPI pode atender
    # requisições em threads diferentes, mas o SQLite por padrão só permite
    # uso na thread onde a conexão foi criada.
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency do FastAPI: fornece uma sessão de banco por requisição, e a fecha ao final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()