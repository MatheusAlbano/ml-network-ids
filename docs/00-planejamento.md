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

## 9. Estrutura de alto nível do repositório (referência — será criada na Etapa 2)

```
project/
├── backend/
├── frontend/
├── models/
├── dataset/
├── artifacts/
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

---
*Documento vivo — pode ser revisado conforme o projeto evolui, mas mudanças de escopo devem ser registradas aqui com justificativa.*