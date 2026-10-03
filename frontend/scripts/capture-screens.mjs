/**
 * Captura as telas do sistema para as figuras do TCC.
 *
 * Pré-requisitos: backend (uvicorn) e frontend (npm run dev) em execução,
 * com o modelo treinado e um usuário já cadastrado.
 *
 * Uso (dentro de frontend/):
 *   npx playwright install chromium   # apenas na primeira vez
 *   EMAIL=admin@exemplo.com PASSWORD='Senha@123' npm run screens
 *
 * Variáveis opcionais:
 *   BASE_URL      URL do frontend (padrão: http://localhost:5173)
 *   OUT_DIR       pasta de saída (padrão: ../docs/telas)
 *   PREDICT_JSON  JSON com uma conexão para preencher o formulário de predição
 *                 (gera a figura do resultado com explicabilidade)
 *   BATCH_CSV     CSV para a tela de Upload em Lote
 */

import { chromium } from "playwright";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";
const OUT_DIR = resolve(process.env.OUT_DIR ?? "../docs/telas");
const { EMAIL, PASSWORD, PREDICT_JSON, BATCH_CSV } = process.env;

if (!EMAIL || !PASSWORD) {
  console.error("Defina EMAIL e PASSWORD de um usuário cadastrado.");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

// Mesmo tamanho das capturas já utilizadas no documento
const VIEWPORT = { width: 1900, height: 910 };

async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
}

async function shot(page, name) {
  // Fecha as notificações (toasts) para que não apareçam na figura
  for (const close of await page.getByLabel("Fechar notificação").all()) {
    await close.click().catch(() => {});
  }
  await page.waitForTimeout(400);

  const path = `${OUT_DIR}/${name}.png`;
  await page.screenshot({ path });
  console.log(`  ${path}`);
}

// Rola a página até que o elemento fique no topo da área visível
async function scrollToTop(locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await locator.page().waitForTimeout(500);
}

async function open(page, route) {
  await page.goto(`${BASE_URL}${route}`);
  await settle(page);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });

console.log("Telas de acesso");
await open(page, "/login");
await shot(page, "login");
await open(page, "/cadastro");
await shot(page, "cadastro");

await open(page, "/login");
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
await settle(page);

// O lote e a predição vêm antes do Dashboard e do Histórico para que
// essas telas já exibam análises do usuário autenticado.
if (BATCH_CSV && existsSync(BATCH_CSV)) {
  console.log("Upload em Lote");
  await open(page, "/batch");
  await page.setInputFiles('input[type="file"]', BATCH_CSV);
  await page.getByRole("button", { name: /Processar arquivo/ }).click();
  await page.waitForSelector("text=Processando arquivo...", { state: "detached", timeout: 60000 });
  await settle(page);
  await scrollToTop(page.getByText("Resultado da análise"));
  await shot(page, "upload-lote");
}

console.log("Predição");
await open(page, "/predict");
await shot(page, "predicao");

if (PREDICT_JSON && existsSync(PREDICT_JSON)) {
  const connection = JSON.parse(readFileSync(PREDICT_JSON, "utf-8"));

  // Abre a seção de métricas do tráfego para expor os campos numéricos
  await page.getByRole("button", { name: /Métricas do tráfego/ }).click();

  for (const [name, value] of Object.entries(connection)) {
    const field = page.locator(`[id="${name}"]`);
    if ((await field.count()) === 0) continue;

    const tag = await field.evaluate((el) => el.tagName);
    if (tag === "SELECT") {
      await field.selectOption(String(value));
    } else {
      await field.fill(String(value));
    }
  }

  await page.getByRole("button", { name: /Analisar conexão/ }).click();
  const result = page.getByText("Resultado da análise");
  await result.waitFor({ timeout: 30000 });
  await settle(page);
  await scrollToTop(result);
  await shot(page, "predicao-resultado");
}

console.log("Demais telas");
for (const [route, name] of [
  ["/", "dashboard"],
  ["/history", "historico"],
  ["/statistics", "estatisticas"],
  ["/settings", "configuracoes"],
  ["/account", "minha-conta"],
  ["/users", "area-administrador"],
]) {
  await open(page, route);

  // A Área do Administrador redireciona usuários comuns para o Dashboard
  if (route === "/users" && !page.url().endsWith("/users")) {
    console.log("  (Área do Administrador ignorada: o usuário não é administrador)");
    continue;
  }

  await shot(page, name);
}

await browser.close();
console.log(`Capturas salvas em ${OUT_DIR}`);
