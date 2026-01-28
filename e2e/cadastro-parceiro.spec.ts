import { expect, test } from '@playwright/test';

test('Cadastro de parceiro (afiliado) carrega quando a rota existe', async ({ page }) => {
  const res = await page.goto('/parceiro/cadastro', { waitUntil: 'domcontentloaded' });

  if (res?.status() === 404) {
    test.skip(true, 'Rota /parceiro/cadastro não está disponível no ambiente atual');
  }

  expect(res?.status() ?? 200).toBeLessThan(500);

  await expect(page.locator('body')).toContainText(/cadastro|parceiro|entrar|login/i);
});
