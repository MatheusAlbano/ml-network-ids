# ML Network IDS

Sistema de Detecção de Intrusão em Redes (IDS) baseado em Machine Learning, desenvolvido como Trabalho de Conclusão de Curso (TCC) — Ciência da Computação, UNIFAJ.

O sistema classifica conexões de rede como **normais** ou **ataques**, utilizando o dataset UNSW-NB15, com predição em tempo real, explicabilidade das decisões (SHAP), análise em lote via CSV, histórico de análises e um dashboard de métricas — tudo através de uma API REST documentada e uma interface web moderna.

## Sumário

- [Visão geral](#visão-geral)
- [Stack tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Resultados do modelo](#resultados-do-modelo)
- [Manual de instalação](#manual-de-instalação)
- [Manual do usuário](#manual-do-usuário)
- [Manual do desenvolvedor](#manual-do-desenvolvedor)
- [Limitações e trabalhos futuros](#limitações-e-trabalhos-futuros)
- [Documentação adicional](#documentação-adicional)

## Visão geral

Sistemas tradicionais de detecção de intrusão baseados em assinaturas não conseguem identificar ataques desconhecidos (zero-day). Este projeto usa Machine Learning para detectar padrões de tráfego malicioso a partir de características estatísticas da conexão de rede, permitindo generalização para variações de ataques conhecidos.

**Funcionalidades principais:**

- Predição individual em tempo real, com explicabilidade via SHAP
- Análise em lote via upload de arquivo CSV
- Histórico de análises com filtros e exportação
- Dashboard com métricas agregadas e gráficos de avaliação (matriz de confusão, ROC, Precision-Recall, feature importance)
- Limiar de classificação ajustável
- API REST documentada automaticamente (Swagger/OpenAPI)

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Backend / API | Python, FastAPI |
| Machine Learning | Scikit-Learn, XGBoost, LightGBM, CatBoost |
| Explicabilidade | SHAP |
| Dados | Pandas, NumPy |
| Persistência | SQLite (histórico), Joblib (modelo) |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Gráficos | Recharts |
| Testes | Pytest |

## Arquitetura
ml-network-ids/
├── backend/
│ └── app/
│ ├── api/routes/ # endpoints (predict, batch, history, dashboard, schema, status)
│ ├── core/ # configuração, banco de dados, logging
│ ├── ml/ # pipeline de dados, treino, explicabilidade, estatísticas
│ ├── models/ # modelos SQLAlchemy (histórico)
│ ├── schemas/ # modelos Pydantic (contratos da API)
│ └── main.py
├── frontend/
│ └── src/
│ ├── components/ # componentes reutilizáveis
│ ├── pages/ # telas (Dashboard, Predição, Histórico, Estatísticas, Upload, Configurações)
│ ├── services/ # comunicação com a API
│ ├── hooks/ # hooks customizados
│ └── types/ # tipos TypeScript
├── models/ # modelo treinado (best_model.joblib) — gerado localmente
├── dataset/ # UNSW-NB15 (não versionado — ver instalação)
├── artifacts/ # schema, metadados, resultados de comparação de modelos
├── docs/ # decisões técnicas e planejamento detalhado do projeto
└── tests/ # testes automatizados (pytest)

O modelo de melhor desempenho (**LightGBM**) foi selecionado automaticamente dentre nove algoritmos comparados via validação cruzada, e é servido através de um pipeline único (pré-processamento + modelo) persistido com Joblib.

## Resultados do modelo

Avaliação sobre o conjunto de teste oficial do UNSW-NB15 (82.332 registros):

| Métrica | Valor |
|---|---|
| Accuracy | 91.70% |
| Precision | 88.59% |
| Recall | 97.48% |
| F1-score | 92.82% |
| ROC-AUC | 98.78% |

Detalhes completos da comparação entre os nove modelos avaliados (Random Forest, XGBoost, LightGBM, CatBoost, Gradient Boosting, Extra Trees, Logistic Regression, MLP, SVM) estão documentados em [`docs/00-planejamento.md`](docs/00-planejamento.md).

## Manual de instalação

### Pré-requisitos

- Python 3.11+
- Node.js 22+
- Dataset UNSW-NB15 ([Kaggle](https://www.kaggle.com))

### Backend

```bash
# Criar e ativar ambiente virtual
python -m venv venv
source venv/Scripts/activate  # Windows (Git Bash)

# Instalar dependências
pip install -r requirements.txt

# Colocar os arquivos do UNSW-NB15 em dataset/raw/
#   UNSW_NB15_training-set.csv
#   UNSW_NB15_testing-set.csv

# Treinar e comparar os modelos (gera models/best_model.joblib)
python backend/app/ml/compare_models.py
python backend/app/ml/persist_artifacts.py

# Rodar a API
cd backend
uvicorn app.main:app --reload --port 8000
```

A API estará disponível em `http://127.0.0.1:8000`, com documentação interativa em `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd frontend
npm install

# Criar arquivo .env com:
# VITE_API_BASE_URL=http://127.0.0.1:8000

npm run dev
```

A interface estará disponível em `http://localhost:5173`.

### Testes

```bash
python -m pytest backend/tests/ -v
```

## Manual do usuário

- **Dashboard**: visão geral com total de análises, taxa de ataques e métricas do modelo em produção.
- **Predição**: preencha as características de uma conexão de rede e clique em "Analisar Conexão" para obter a classificação, probabilidades, nível de risco e a explicação das features mais influentes na decisão.
- **Histórico**: consulte análises anteriores, filtre por classe ou nível de risco, e exporte para CSV.
- **Estatísticas**: visualize a matriz de confusão, curvas ROC e Precision-Recall, e a importância global das features do modelo.
- **Upload CSV**: envie um arquivo CSV com múltiplas conexões para análise em lote. Linhas com erro de formatação são reportadas individualmente, sem interromper o processamento das demais.
- **Configurações**: ajuste o limiar de classificação (probabilidade mínima para uma conexão ser considerada ataque).

## Manual do desenvolvedor

O processo de desenvolvimento completo — incluindo decisões técnicas, bugs identificados e corrigidos, e justificativas de arquitetura — está documentado em [`docs/00-planejamento.md`](docs/00-planejamento.md). Destaques:

- O sistema foi construído incrementalmente, em 25 etapas, cada uma validada antes de avançar.
- O schema de entrada da API (`artifacts/input_schema.json`) é gerado a partir dos dados de treino e consumido dinamicamente tanto pela validação do backend (Pydantic) quanto pelo formulário do frontend — garantindo que ambos nunca fiquem dessincronizados do que o modelo realmente espera.
- O upload em lote inclui tratamento de robustez para CSVs exportados/editados no Microsoft Excel (delimitador `;`, BOM UTF-8, vírgula decimal).

## Limitações e trabalhos futuros

- **Classificação binária**: o sistema classifica apenas Normal vs. Ataque. Extensão para classificação multiclasse (categorização do tipo de ataque via `attack_cat`) é um trabalho futuro natural.
- **Troca de modelo em produção**: não implementada nesta versão — o sistema serve o modelo de melhor desempenho selecionado no treinamento (LightGBM). A comparação entre os nove modelos avaliados está disponível em `artifacts/model_comparison_results.json`.
- **Tema claro e múltiplos idiomas**: não implementados nesta versão; o sistema opera em modo escuro e português (Brasil).
- **Explicabilidade em lote**: predições em lote não calculam SHAP individualmente por linha, por custo computacional — apenas a classificação e probabilidade são retornadas.
- **Captura de tráfego em tempo real**: o sistema opera sobre dados fornecidos (formulário ou CSV), não sobre uma interface de rede monitorando tráfego ao vivo.

## Documentação adicional

- [`docs/00-planejamento.md`](docs/00-planejamento.md) — planejamento detalhado, decisões técnicas e histórico do desenvolvimento
- `/docs` (Swagger UI, com a API rodando) — documentação interativa de todos os endpoints

---

Desenvolvido por Matheus Albano, Octávio Morais e Rafael Tieppo — TCC, Ciência da Computação, UNIFAJ, 2026.