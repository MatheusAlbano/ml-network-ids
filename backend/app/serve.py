"""
Ponto de entrada usado na hospedagem (Docker / Render).

Junta backend e frontend num único servidor, para que o sistema inteiro
fique acessível por um só link:
- a API (app.main) é montada em /api;
- o build do React (frontend/dist) é servido na raiz, com fallback para
  index.html, já que o React Router controla as rotas no navegador.

Na inicialização também cria (ou atualiza) o usuário administrador a
partir das variáveis ADMIN_EMAIL e ADMIN_PASSWORD, e pré-carrega o modelo
e as estatísticas em segundo plano para que a primeira tela abra rápido.

Em desenvolvimento continue usando app.main:app normalmente.
"""

import os
import threading
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse

from app.core.config import BASE_DIR
from app.core.database import SessionLocal
from app.core.logging_config import logger  # type: ignore
from app.core.security import hash_password
from app.main import app as api
from app.models.user import User

FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST", BASE_DIR / "frontend" / "dist"))

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/api", api)


def ensure_admin_user() -> None:
    """Garante que exista um administrador com as credenciais das variáveis de ambiente."""
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    if not email or not password:
        logger.warning("ADMIN_EMAIL/ADMIN_PASSWORD não definidos: nenhum administrador foi criado.")
        return

    username = os.getenv("ADMIN_USERNAME", "admin")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user = User(username=username, email=email, hashed_password=hash_password(password))
            db.add(user)
        else:
            user.hashed_password = hash_password(password)
        user.role = "admin"
        user.is_active = True
        db.commit()
        logger.info(f"Administrador {email} disponível.")
    finally:
        db.close()


def warm_up() -> None:
    """Carrega modelo, explicador SHAP e estatísticas antes do primeiro acesso."""
    try:
        from app.api.routes.predict import get_model
        from app.ml import statistics
        from app.ml.explainability import get_explainer

        get_model()
        get_explainer()
        statistics.get_confusion_matrix_data()
        statistics.get_global_feature_importance()
        logger.info("Modelo e estatísticas pré-carregados.")
    except Exception as e:  # o servidor continua de pé mesmo sem os artefatos
        logger.error(f"Falha ao pré-carregar o modelo: {e}")


@app.on_event("startup")
def on_startup() -> None:
    ensure_admin_user()
    threading.Thread(target=warm_up, daemon=True).start()


@app.get("/{full_path:path}", include_in_schema=False)
def frontend(full_path: str):
    if not FRONTEND_DIST.exists():
        return JSONResponse(
            {"detail": "Build do frontend não encontrado. A API está em /api/docs."},
            status_code=404,
        )

    requested = (FRONTEND_DIST / full_path).resolve()
    if full_path and requested.is_file() and FRONTEND_DIST.resolve() in requested.parents:
        return FileResponse(requested)
    return FileResponse(FRONTEND_DIST / "index.html")
