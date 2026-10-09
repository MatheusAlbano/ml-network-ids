# Hospedagem gratuita (Render)

O sistema inteiro (API FastAPI + frontend React) roda num único contêiner
Docker no plano gratuito do Render (512 MB de RAM). O resultado é um link do
tipo `https://ml-network-ids.onrender.com`: abriu, usou.

## Como funciona

- O `Dockerfile` da raiz compila o React e instala o backend. O servidor
  `backend/app/serve.py` publica a API em `/api` e o site na raiz.
- O `render.yaml` descreve o serviço. O Render reconstrói e publica sozinho a
  cada push na `main`.
- Os quatro artefatos do modelo que a API usa precisam estar no repositório,
  porque o Render só enxerga o que está no GitHub. O `.gitignore` já abre
  exceção para eles; os demais arquivos gerados continuam ignorados.
- O plano gratuito desliga o serviço após 15 minutos sem acesso, e a primeira
  visita depois disso leva cerca de um minuto. O workflow
  `.github/workflows/manter-ativo.yml` acessa o sistema a cada 10 minutos para
  mantê-lo ligado (as 750 horas gratuitas do mês cobrem o mês inteiro).

## Configuração (uma vez)

1. Envie os artefatos do modelo para o GitHub, a partir da sua cópia local
   do projeto (onde o treinamento foi feito):

   ```bash
   git add models/best_model.joblib artifacts/input_schema.json artifacts/model_metadata.json dataset/raw/UNSW_NB15_testing-set.csv
   git commit -m "chore: adiciona artefatos do modelo para a hospedagem"
   git push
   ```

   O CSV de teste é usado pela tela de Estatísticas; o de treino não é necessário.
2. Crie uma conta em https://render.com entrando com o GitHub.
3. No painel, **New > Blueprint**, escolha o repositório `ml-network-ids` e
   confirme. O Render lê o `render.yaml` e pede dois valores:
   - `ADMIN_EMAIL` e `ADMIN_PASSWORD`: login do administrador, recriado a
     cada inicialização
   - `DATABASE_URL` (opcional): deixe em branco ou veja "Persistência" abaixo

   O `SECRET_KEY` (assinatura dos tokens JWT) é gerado automaticamente.
4. O primeiro build leva alguns minutos; o andamento aparece na aba **Logs**.
   Ao terminar, o link do serviço aparece no topo da página.
5. No GitHub, em **Settings > Secrets and variables > Actions > Variables**,
   crie `RENDER_URL` com esse link, para ativar o "manter ativo".

## Persistência

O disco do plano gratuito é apagado quando o serviço reinicia (após um deploy
ou depois de desligar por inatividade). Sem configuração extra, o
administrador é recriado automaticamente, mas outros usuários e o histórico de
análises começam do zero.

Para guardar tudo, crie um banco PostgreSQL gratuito (por exemplo em
https://neon.tech) e coloque a URL de conexão na variável `DATABASE_URL` do
serviço no Render (aba **Environment**). As tabelas são criadas sozinhas na
primeira inicialização. O PostgreSQL gratuito do próprio Render expira após
30 dias, por isso a sugestão do Neon.

## Rodando a mesma imagem localmente

```bash
docker build -t ml-network-ids .
docker run -p 10000:10000 -e ADMIN_EMAIL=admin@exemplo.com -e ADMIN_PASSWORD=troque-esta-senha ml-network-ids
```

O sistema abre em http://localhost:10000 e a documentação da API em
http://localhost:10000/api/docs.
