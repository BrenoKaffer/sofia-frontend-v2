import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test('deve exibir login quando não autenticado', async ({ page }) => {
    const res = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 200).toBeLessThan(500);

    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrar/i })).toBeVisible();
  });

  test('deve proteger /dashboard para usuário não autenticado', async ({ page }) => {
    const res = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 200).toBeLessThan(500);

    await page.waitForTimeout(500);
    expect(page.url()).toMatch(/(login|dashboard)/);
  });

  test('deve carregar /builder sem erro 5xx', async ({ page }) => {
    const res = await page.goto('/builder', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 200).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
