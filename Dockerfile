# Imagem única com backend (FastAPI) e frontend (React) para hospedagem.
# Usada pelo Hugging Face Spaces, mas roda em qualquer serviço com Docker:
#   docker build -t ml-network-ids . && docker run -p 7860:7860 ml-network-ids

# --- Etapa 1: build do frontend ---
FROM node:22-slim AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# A API fica no mesmo endereço, em /api
ENV VITE_API_BASE_URL=/api
RUN npx vite build

# --- Etapa 2: backend ---
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# O Hugging Face Spaces executa o contêiner com o usuário 1000
RUN useradd -m -u 1000 user
WORKDIR /app

COPY requirements.txt ./
COPY deploy/requirements-deploy.txt deploy/
RUN pip install --no-cache-dir -r deploy/requirements-deploy.txt

COPY --chown=user . .
COPY --from=frontend --chown=user /frontend/dist frontend/dist
RUN sh deploy/organizar_artefatos.sh && mkdir -p logs artifacts && chown -R user /app

USER user
ENV PYTHONUNBUFFERED=1 PORT=7860
WORKDIR /app/backend
EXPOSE 7860
CMD ["sh", "-c", "uvicorn app.serve:app --host 0.0.0.0 --port ${PORT}"]
