"""
Ponto de entrada da aplicação FastAPI. Monta os routers e configura
metadados exibidos no Swagger (/docs).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import APP_TITLE, APP_DESCRIPTION, APP_VERSION
from app.api.routes import predict, status

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


@app.get("/", tags=["Sistema"])
def root() -> dict:
    return {"message": "ML Network IDS API está no ar. Acesse /docs para a documentação."}