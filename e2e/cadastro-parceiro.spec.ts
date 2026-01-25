import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function parseEnvFile(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function readFirstEnvLocal(): Record<string, string> {
  const candidates = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "apps", "admin", ".env.local"),
  ];
  for (const p of candidates) {
    try {
      const contents = fs.readFileSync(p, "utf8");
      return parseEnvFile(contents);
    } catch {}
  }
  return {};
}

function normalizeBaseUrl(raw: string): string {
  return String(raw || "").trim().replace(/\/+$/, "");
}

async function fillByLabel(page: any, label: string, value: string) {
  const input = page.locator(`label:has-text("${label}")`).locator("..").locator("input");
  await expect(input).toBeVisible();
  await input.fill(value);
}

test("Cadastro de parceiro (afiliado) completa fluxo e recebe sucesso", async ({ page, context }) => {
  test.setTimeout(180_000);

  const envLocal = readFirstEnvLocal();
  const baseUrl = normalizeBaseUrl(process.env.BASE_URL || envLocal.BASE_URL || "https://admin.v1sofia.com");
  const baseHost = new URL(baseUrl).hostname;

  const email = (process.env.E2E_TEST_EMAIL || envLocal.E2E_TEST_EMAIL || "").trim();
  const password = process.env.E2E_TEST_PASSWORD || envLocal.E2E_TEST_PASSWORD || "";
  const partnerToken = process.env.E2E_PARTNER_TOKEN || envLocal.E2E_PARTNER_TOKEN || "";
  const shouldMockBackend = !partnerToken && (!email || !password);
  const tokenForClient = partnerToken || (shouldMockBackend ? "e2e-token" : "");

  const birthdate = (process.env.E2E_BIRTHDATE || envLocal.E2E_BIRTHDATE || "1990-01-01").trim();
  const zipCode = (process.env.E2E_ZIP_CODE || envLocal.E2E_ZIP_CODE || "70000000").trim();
  const uf = (process.env.E2E_UF || envLocal.E2E_UF || "DF").trim();
  const street = (process.env.E2E_STREET || envLocal.E2E_STREET || "Rua das Flores").trim();
  const streetNumber = (process.env.E2E_STREET_NUMBER || envLocal.E2E_STREET_NUMBER || "100").trim();
  const neighborhood = (process.env.E2E_NEIGHBORHOOD || envLocal.E2E_NEIGHBORHOOD || "Asa Norte").trim();
  const city = (process.env.E2E_CITY || envLocal.E2E_CITY || "Brasília").trim();

  const cadastroUrl = `${baseUrl}/afiliado/cadastro`;

  if (shouldMockBackend) {
    await page.route("**/api/partners/me/affiliate/register", async (route) => {
      const req = route.request();
      const origin = req.headers()["origin"] || "*";
      const headers = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Credentials": "true",
      };
      if (req.method().toUpperCase() === "OPTIONS") {
        await route.fulfill({ status: 204, headers });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers,
        body: JSON.stringify({
          success: true,
          affiliate_slug: "tomas-carlos-eduardo-rodrigues",
          checkout_links: { annual: "https://checkout.v1sofia.com/checkout/anual/tomas-carlos-eduardo-rodrigues" },
        }),
      });
    });
  }

  if (tokenForClient) {
    await context.addCookies([
      {
        name: "partner_auth",
        value: tokenForClient,
        domain: baseHost,
        path: "/",
        httpOnly: false,
        secure: baseUrl.startsWith("https://"),
        sameSite: "Lax",
      },
    ]);

    await page.addInitScript((token: string) => {
      localStorage.setItem("partner-auth", JSON.stringify({ token }));
    }, tokenForClient);
  }

  if (!partnerToken && !shouldMockBackend) {
    await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Entrar")).toBeVisible();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("**/dashboard", { timeout: 60_000 });
  }

  await page.goto(cadastroUrl, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Cadastro de Parceiro" })).toBeVisible();

  await page.waitForFunction(() => {
    const el = document.querySelector('input[placeholder="000.000.000-00"]') as HTMLInputElement | null;
    return Boolean(el && el.value && el.value.length > 0);
  });

  await expect(page.getByText("Etapa 1 de 4")).toBeVisible();
  await fillByLabel(page, "Nome completo", "Tomás Carlos Eduardo Rodrigues");
  await page.getByPlaceholder("000.000.000-00").fill("22020243016");
  await fillByLabel(page, "Nome da mãe", "Isabela Jéssica");
  await page.locator('input[type="date"]').fill(birthdate);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByText("Etapa 2 de 4")).toBeVisible();
  await fillByLabel(page, "Renda mensal (R$)", "5000");
  await fillByLabel(page, "Profissão", "Professor");
  await fillByLabel(page, "DDD", "61");
  await fillByLabel(page, "Telefone", "25395779");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByText("Etapa 3 de 4")).toBeVisible();
  await page.getByPlaceholder("00000-000").fill(zipCode);
  await page.getByPlaceholder("SP").fill(uf);
  await fillByLabel(page, "Rua", street);
  await fillByLabel(page, "Número", streetNumber);
  await fillByLabel(page, "Bairro", neighborhood);
  await fillByLabel(page, "Cidade", city);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByText("Etapa 4 de 4")).toBeVisible();
  await page.getByPlaceholder("001").fill("001");
  await fillByLabel(page, "Agência", "0983");
  await fillByLabel(page, "Conta", "01002538");
  await fillByLabel(page, "Dígito", "1");

  const accountTypeSelect = page
    .locator('label:has-text("Tipo de conta")')
    .locator("..")
    .locator("select");
  await expect(accountTypeSelect).toBeVisible();
  await accountTypeSelect.selectOption("checking");

  const registerResPromise = page.waitForResponse((res) => {
    return res.request().method() === "POST" && res.url().includes("/partners/me/affiliate/register");
  });

  await page.getByRole("button", { name: "Concluir cadastro" }).click();

  const registerRes = await registerResPromise;
  expect(registerRes.status()).toBe(200);

  const registerJson = (await registerRes.json().catch(() => null)) as any;
  expect(registerJson?.success).toBe(true);

  await expect(page.getByText("Cadastro concluído")).toBeVisible({ timeout: 60_000 });
});
