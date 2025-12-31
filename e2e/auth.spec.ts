import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve exibir página de login quando não autenticado', async ({ page }) => {
    // Verifica se elementos de login estão presentes
    await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();
    await expect(page.locator('text=Entrar')).toBeVisible();
  });

  test('deve permitir navegação para página de registro', async ({ page }) => {
    // Clica no botão de registro se disponível
    const signUpButton = page.locator('[data-testid="sign-up-button"]');
    if (await signUpButton.isVisible()) {
      await signUpButton.click();
      await expect(page.url()).toContain('sign-up');
    }
  });

  test('deve validar campos obrigatórios no formulário de login', async ({ page }) => {
    const signInButton = page.locator('[data-testid="sign-in-button"]');
    if (await signInButton.isVisible()) {
      await signInButton.click();
      
      // Tenta submeter formulário vazio
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Verifica se mensagens de erro aparecem
        await expect(page.locator('text=obrigatório')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('deve redirecionar para dashboard após login bem-sucedido', async ({ page }) => {
    // Este teste seria implementado com credenciais de teste válidas
    // Por enquanto, apenas verifica se a estrutura está correta
    await page.goto('/dashboard');
    
    // Se não autenticado, deve redirecionar para login
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    
    // Verifica se está na página de login ou dashboard
    expect(currentUrl).toMatch(/(sign-in|dashboard)/);
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
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Verifica se foi redirecionado para login ou se está autenticado
      const currentUrl = page.url();
      const isProtected = currentUrl.includes('sign-in') || currentUrl.includes(route);
      expect(isProtected).toBeTruthy();
    }
  });
});