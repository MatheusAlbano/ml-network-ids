# Hospedagem gratuita (Hugging Face Spaces)

O sistema inteiro (API FastAPI + frontend React) roda num único contêiner
Docker no Hugging Face Spaces, no plano gratuito (2 vCPU, 16 GB de RAM).
O resultado é um link do tipo `https://usuario-nome.hf.space`: abriu, usou.

## Como funciona

- O `Dockerfile` da raiz compila o React e instala o backend. O servidor
  `backend/app/serve.py` publica a API em `/api` e o site na raiz.
- A cada push na `main`, o workflow `.github/workflows/deploy-huggingface.yml`
  envia o código ao Space, que reconstrói a imagem sozinho.
- Os artefatos do modelo não ficam no GitHub. Eles são enviados ao Space uma
  única vez e permanecem lá entre os deploys.
- O workflow `.github/workflows/manter-ativo.yml` acessa o sistema uma vez
  por dia, porque o plano gratuito hiberna o Space após 48 horas sem acesso.

## Configuração (uma vez)

1. Crie uma conta em https://huggingface.co e um Space novo:
   **New Space**, SDK **Docker**, modelo **Blank**, visibilidade **Public**
   (Space privado exige login no Hugging Face para abrir o link).
2. No Space, aba **Files**, botão **Contribute > Upload files**, envie os
   quatro arquivos gerados pelo treinamento na sua máquina:
   - `models/best_model.joblib`
   - `artifacts/input_schema.json`
   - `artifacts/model_metadata.json`
   - `dataset/raw/UNSW_NB15_testing-set.csv` (usado pela tela de Estatísticas)

   Podem ir soltos na raiz do Space; o build coloca cada um na pasta certa.
3. No Space, **Settings > Variables and secrets > New secret**, crie:
   - `SECRET_KEY`: qualquer texto longo e aleatório (assina os tokens JWT)
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD`: login do administrador, recriado a
     cada inicialização
   - `DATABASE_URL` (opcional): veja "Persistência" abaixo
4. Em https://huggingface.co/settings/tokens crie um token do tipo **Write**.
5. No GitHub, em **Settings > Secrets and variables > Actions**:
   - aba **Secrets**: `HF_TOKEN` com o token do passo 4
   - aba **Variables**: `HF_SPACE` com `usuario/nome-do-space` e
     `HF_SPACE_URL` com `https://usuario-nome-do-space.hf.space`
6. Em **Actions > Deploy no Hugging Face > Run workflow** (ou num push na
   `main`), o código é enviado. O primeiro build leva alguns minutos; o
   andamento aparece na aba **Logs** do Space.

## Persistência

O disco do plano gratuito é apagado quando o Space reinicia (após um deploy
ou depois de hibernar). Sem configuração extra, o administrador é recriado
automaticamente, mas outros usuários e o histórico de análises começam do zero.

Para guardar tudo, crie um banco PostgreSQL gratuito (por exemplo em
https://neon.tech) e coloque a URL de conexão no secret `DATABASE_URL` do
Space. As tabelas são criadas sozinhas na primeira inicialização.

## Rodando a mesma imagem localmente

```bash
docker build -t ml-network-ids .
docker run -p 7860:7860 -e ADMIN_EMAIL=admin@exemplo.com -e ADMIN_PASSWORD=troque-esta-senha ml-network-ids
```

Com os artefatos em `models/`, `artifacts/` e `dataset/raw/`, o sistema abre
em http://localhost:7860 e a documentação da API em http://localhost:7860/api/docs.
