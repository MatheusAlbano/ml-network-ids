"""
Ponto de entrada da aplicação FastAPI. Monta os routers, configura
metadados exibidos no Swagger (/docs), e garante que as tabelas do
banco de histórico existam antes da aplicação subir.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import APP_TITLE, APP_DESCRIPTION, APP_VERSION
from app.core.database import engine, Base
from app.models import analysis  # garante que o modelo seja registrado antes de criar as tabelas
from app.api.routes import predict, status, history, dashboard

# Cria as tabelas do banco (se ainda não existirem) na inicialização da aplicação
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
)

# Libera acesso do futuro frontend (React) rodando em outra porta durante o desenvolvimento
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # em produção, restringir ao domínio real do frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(status.router)
app.include_router(history.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Sistema"])
def root() -> dict:
    return {"message": "ML Network IDS API está no ar. Acesse /docs para a documentação."}