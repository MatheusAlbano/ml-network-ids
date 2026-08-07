# Planejamento do Projeto — Sistema de Detecção de Intrusão em Redes (IDS) com Machine Learning

## 1. Contexto

Trabalho de Conclusão de Curso (TCC) com objetivo de projetar, implementar e avaliar um Sistema de Detecção de Intrusão (IDS) baseado em Machine Learning, utilizando o dataset **UNSW-NB15**, com predição em tempo real, explicabilidade (XAI) e interface profissional.

## 2. Problema a ser resolvido

Sistemas tradicionais de IDS baseados em assinaturas (signature-based) não detectam ataques desconhecidos (zero-day). A proposta é usar ML para detectar padrões de tráfego malicioso com base em características estatísticas da conexão de rede, permitindo generalização a variações de ataques conhecidos.

## 3. Objetivo geral

Desenvolver um IDS funcional, ponta a ponta (dataset → modelo → API → interface), capaz de classificar conexões de rede como **normais** ou **ataque**, com transparência sobre o motivo da decisão (explicabilidade).

## 4. Objetivos específicos

- Processar e preparar o dataset UNSW-NB15 (limpeza, encoding, normalização);
- Treinar e comparar múltiplos algoritmos de ML, selecionando o melhor via métricas objetivas;
- Expor o modelo via API REST documentada (FastAPI + Swagger);
- Construir uma interface moderna para predição em tempo real, upload em lote (CSV), histórico e estatísticas;
- Implementar explicabilidade (SHAP) para justificar cada predição;
- Documentar todo o processo para fins acadêmicos (TCC) e de portfólio profissional.

## 5. Escopo — MVP (Etapas iniciais)

O que é **essencial** para o sistema funcionar de ponta a ponta:

1. Pipeline de dados (leitura, limpeza, encoding, split treino/teste);
2. Um modelo treinado e avaliado (mesmo que só 1 algoritmo no início);
3. Persistência do modelo (pipeline salvo com joblib);
4. Endpoint de predição funcional via FastAPI;
5. Interface mínima que envia dados e mostra o resultado.

## 6. Escopo — Incremental (pós-MVP)

Adicionado em etapas posteriores, depois que o núcleo funciona:

- Comparação entre múltiplos modelos (Random Forest, XGBoost, LightGBM, CatBoost, Gradient Boosting, Extra Trees, Logistic Regression, MLP, SVM);
- SHAP e explicações em linguagem natural;
- Dashboard com métricas agregadas;
- Histórico de análises com filtro/exportação;
- Upload de CSV em lote com barra de progresso;
- Gráficos de avaliação (matriz de confusão, ROC, PR curve);
- Sistema de logs;
- Configurações (troca de modelo, limiar, tema, idioma).

## 7. Requisitos não-funcionais

- Código organizado em camadas (separação clara entre dados, modelo, API, interface);
- Tratamento de erros e validação de entradas (segurança básica de API);
- Testes automatizados (pytest) para partes críticas do pipeline;
- Documentação técnica e acadêmica ao final de cada macro-etapa;
- Versionamento via Git, com commits seguindo *conventional commits*.

## 8. Stack tecnológica definida

| Camada | Tecnologia |
|---|---|
| Backend/API | Python + FastAPI |
| ML | Scikit-Learn, XGBoost, LightGBM, CatBoost |
| Dados | Pandas, NumPy |
| Persistência de modelo | Joblib |
| Explicabilidade | SHAP |
| Visualização | Matplotlib |
| Frontend | React (a definir: Vite ou Next.js na etapa de frontend) |
| Testes | Pytest |

## 9. Estrutura de alto nível do repositório

```
ml-network-ids/
├── backend/
│   └── app/
│       ├── api/
│       │   └── routes/
│       │       ├── predict.py
│       │       └── status.py
│       ├── core/
│       │   └── config.py
│       ├── ml/
│       │   ├── data_loader.py
│       │   ├── eda.py
│       │   ├── feature_engineering.py
│       │   ├── train_baseline.py
│       │   ├── compare_models.py
│       │   └── persist_artifacts.py
│       ├── schemas/
│       │   └── prediction.py
│       └── main.py
├── frontend/
├── models/
├── dataset/
│   ├── raw/
│   └── processed/
├── artifacts/
│   ├── eda/
│   ├── input_schema.json
│   ├── model_metadata.json
│   └── model_comparison_results.json
├── logs/
├── tests/
├── docs/
├── requirements.txt
└── README.md
```

## 10. Critérios de sucesso do projeto

- O sistema classifica corretamente conexões de rede com métricas de avaliação documentadas (Accuracy, Precision, Recall, F1, ROC-AUC);
- A API responde predições em tempo real com baixa latência;
- A interface é utilizável e visualmente profissional;
- O projeto está documentado o suficiente para defesa de TCC e para servir como peça de portfólio.

## 11. Fora de escopo (por ora)

- Detecção de intrusão em tempo real sobre tráfego de rede ao vivo (captura de pacotes reais) — o projeto trabalha sobre o dataset e formulário/CSV, não sobre uma NIC monitorando tráfego real;
- Deploy em produção com infraestrutura de alta disponibilidade.

## 12. Decisão: Classificação Binária vs. Multiclasse

**Decisão registrada:** o sistema será desenvolvido como classificador **binário** (`Normal` vs. `Ataque`) no MVP.

**Justificativa:**
- Reduz complexidade de balanceamento de classes (o UNSW-NB15 tem forte desbalanceamento entre categorias de ataque, como `Worms` e `Shellcode` com poucas amostras);
- Torna as métricas de avaliação e a explicabilidade (SHAP) mais diretas de implementar e interpretar;
- Garante um sistema completo e defensável dentro do prazo do TCC.

**Extensão futura (pós-MVP, opcional):** uma vez que o pipeline binário estiver 100% funcional e documentado, avaliar a adição de um segundo modelo multiclasse utilizando a coluna `attack_cat`, para categorizar o tipo de ataque detectado. Essa extensão será tratada como um "modo avançado" separado do núcleo do sistema, e só será iniciada se o MVP estiver estável.

> Esta decisão deve ser mantida consistente em todo o texto do TCC (Metodologia, Resultados, Conclusão) para evitar divergência entre o que o modelo realmente faz e o que é descrito no documento.

## 13. Observação sobre a fonte do dataset (Kaggle)

Os arquivos `UNSW_NB15_training-set.csv` e `UNSW_NB15_testing-set.csv` foram obtidos via Kaggle. Constatou-se que, nessa distribuição, os nomes dos arquivos estavam **invertidos** em relação à convenção oficial da UNSW Sydney:

- Arquivo nomeado "training-set" continha 82.332 linhas (tamanho oficial do conjunto de teste);
- Arquivo nomeado "testing-set" continha 175.341 linhas (tamanho oficial do conjunto de treino).

Essa é uma inconsistência conhecida em algumas distribuições de terceiros do dataset. Os arquivos foram renomeados localmente para refletir a convenção acadêmica padrão (conjunto maior para treino, conjunto menor para teste), preservando o conteúdo original de cada partição. Essa correção deve ser mencionada na seção de Materiais e Métodos do TCC, como evidência de verificação e validação da fonte de dados.

## 14. Limitação computacional do SVM

Durante a comparação de modelos (Etapa 9), constatou-se que o treinamento do SVM com kernel RBF no dataset completo (175.341 registros de treino, 5-fold CV) é computacionalmente inviável dentro de um tempo razoável, devido à complexidade O(n²) a O(n³) do algoritmo — uma limitação amplamente documentada na literatura.

Decisão: o SVM foi treinado e avaliado em uma amostra estratificada de 15.000 registros (preservando a proporção original de classes), enquanto os demais modelos utilizaram o dataset completo. A avaliação final no conjunto de teste foi realizada sobre o conjunto de teste completo (82.332 registros) para todos os modelos, garantindo comparabilidade nos resultados finais.

## 15. Resultado da comparação de modelos

Nove modelos foram treinados e avaliados: Logistic Regression, Random Forest, Extra Trees, Gradient Boosting, XGBoost, LightGBM, CatBoost, MLP e SVM.

O modelo **LightGBM** foi selecionado automaticamente como melhor modelo, com base no F1-score no conjunto de teste (métrica de seleção definida a priori):

| Modelo | CV F1-score | Test F1-score | Test ROC-AUC |
|---|---|---|---|
| LightGBM | 0.9605 | 0.9282 | 0.9878 |
| CatBoost | 0.9654 | 0.9220 | 0.9864 |
| XGBoost | 0.9684 | 0.8986 | 0.9862 |
| Random Forest (baseline) | 0.9689 | 0.8930 | 0.9816 |
| Extra Trees | 0.9683 | 0.8889 | 0.9742 |
| Gradient Boosting | 0.9601 | 0.8848 | 0.9831 |
| MLP | 0.9524 | 0.8848 | 0.9778 |
| Logistic Regression | 0.9107 | 0.8102 | 0.8586 |
| SVM (amostra de 15k) | 0.8094 | 0.7084 | 0.8304 |

Observa-se, para praticamente todos os modelos, uma diferença entre o F1-score médio de validação cruzada (calculado inteiramente sobre o conjunto de treino) e o F1-score no conjunto de teste holdout oficial. Essa diferença é atribuída à distribuição estatística distinta entre as partições de treino e teste do UNSW-NB15, uma característica documentada na literatura sobre este dataset, e não a um sintoma de overfitting introduzido pelo pipeline de modelagem.

> **Nota (Etapa 11):** os números desta tabela refletem as métricas calculadas durante o loop de comparação da Etapa 9. Um bug de compartilhamento de objeto (ver seção 16) afetou apenas o *pipeline final salvo em disco*, não os cálculos de métrica de cada modelo — portanto esta tabela permanece válida após a correção, mas o `best_model.joblib` precisou ser re-treinado.

## 16. Correção: preprocessador compartilhado entre modelos na comparação

Identificado, durante os testes da API (Etapa 11), um bug em que o objeto `ColumnTransformer` (preprocessador) era instanciado uma única vez e reutilizado por referência em todos os 9 modelos comparados na Etapa 9. Como o Scikit-Learn ajusta (`fit`) o preprocessador *in-place*, o estado final do objeto correspondia ao último modelo treinado no loop (SVM, treinado sobre uma amostra reduzida de 15.000 registros), fazendo com que o pipeline salvo (`best_model.joblib`) apresentasse incompatibilidade de dimensionalidade em produção (59 features esperadas vs. 54 geradas pela amostra do SVM).

**Correção:** o preprocessador passou a ser instanciado individualmente (nova instância) para cada modelo dentro do loop de comparação, eliminando o compartilhamento de estado entre pipelines. A Etapa 9 (`compare_models.py`) e a Etapa 10 (`persist_artifacts.py`) foram re-executadas após a correção, gerando um novo `best_model.joblib` e metadados atualizados.

Esse episódio ilustra um cuidado importante ao trabalhar com objetos mutáveis do Scikit-Learn em loops de treinamento, e foi documentado como parte do processo de engenharia de software do projeto.

## 17. Arquitetura da API (Etapa 11)

A API foi construída com FastAPI, seguindo os seguintes princípios:

- **Schema-first dinâmico:** o modelo Pydantic de entrada (`NetworkConnectionInput`) é construído em tempo de execução a partir do `artifacts/input_schema.json` (gerado na Etapa 10), garantindo que a validação da API nunca fique dessincronizada das features reais esperadas pelo pipeline;
- **Carregamento único do modelo:** o pipeline treinado é carregado uma única vez em memória (via `lru_cache`), evitando I/O de disco repetido a cada requisição;
- **Endpoints implementados:**
  - `GET /` — health check simples;
  - `GET /status` — retorna metadados e métricas do modelo em produção;
  - `POST /predict` — recebe as características de uma conexão de rede e retorna classe prevista, probabilidades, nível de risco (Baixo/Médio/Alto/Crítico) e tempo de inferência;
- **Documentação automática:** disponível via Swagger UI em `/docs`, gerada nativamente pelo FastAPI a partir dos schemas Pydantic.

---
*Documento vivo — pode ser revisado conforme o projeto evolui, mas mudanças de escopo devem ser registradas aqui com justificativa.*