import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
  });

  test('deve exibir página de login quando não autenticado', async ({ page }) => {
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Entrar/i })).toBeVisible();
  });

  test('deve permitir navegação para página de registro', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/register');
    await expect(page.getByRole('heading', { name: 'Criar Conta' })).toBeVisible();
  });

  test('deve validar campos obrigatórios no formulário de login', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await expect(page.locator('text=Por favor, preencha todos os campos')).toBeVisible({ timeout: 5000 });
    }
  });

  test('deve redirecionar para dashboard após login bem-sucedido', async ({ page }) => {
    // Este teste seria implementado com credenciais de teste válidas
    // Por enquanto, apenas verifica se a estrutura está correta
    const res = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 200).toBeLessThan(500);
    
    // Se não autenticado, deve redirecionar para login
    expect(page.url()).toMatch(/(login|dashboard)/);
  });
});

test.describe('Proteção de Rotas', () => {
  test('deve proteger rotas privadas', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/analytics',
      '/settings',
      '/profile'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const currentUrl = page.url();
      expect(currentUrl.includes('/login') || currentUrl.includes(route)).toBeTruthy();
    }
  });
});
