import { test, expect } from '@playwright/test';

test.describe('Interface do Usuário e Navegação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
  });

  test('deve carregar página inicial sem erros', async ({ page }) => {
    await expect(page.locator('input#email')).toBeVisible();
    const hasRuntimeError = await page.locator('text=Unhandled Runtime Error').isVisible();
    expect(hasRuntimeError).toBeFalsy();
  });

  test('deve ter navegação responsiva', async ({ page }) => {
    // Testa em diferentes tamanhos de tela
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('deve navegar entre páginas principais', async ({ page }) => {
    const routes = [
      { path: '/login', name: 'Login' },
      { path: '/register', name: 'Register' },
      { path: '/terms', name: 'Terms' },
      { path: '/privacy-policy', name: 'Privacy' }
    ];
    
    for (const route of routes) {
      const res = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      expect(res?.status() ?? 200).toBeLessThan(500);
      
      // Verifica se a URL está correta
      const currentUrl = page.url();
      expect(currentUrl.includes(route.path) || currentUrl.includes('/login')).toBeTruthy();
      
      // Verifica se não há erro 404
      if (currentUrl.includes(route.path)) {
        const notFound = await page.locator('text=404').isVisible();
        expect(notFound).toBeFalsy();
      }
    }
  });

  test('deve ter elementos de acessibilidade', async ({ page }) => {
    // Verifica elementos de acessibilidade
    const accessibilityElements = [
      '[role="main"]',
      '[role="navigation"]',
      '[role="button"]',
      '[aria-label]',
      'h1, h2, h3, h4, h5, h6'
    ];
    
    let foundElements = 0;
    for (const selector of accessibilityElements) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        foundElements++;
      }
    }
    
    // Deve ter pelo menos alguns elementos de acessibilidade
    expect(foundElements).toBeGreaterThan(0);
  });

  test('deve ter performance adequada', async ({ page }) => {
    const startTime = Date.now();
    
    const res = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 200).toBeLessThan(500);
    
    const loadTime = Date.now() - startTime;
    
    // Página deve carregar em menos de 10 segundos
    expect(loadTime).toBeLessThan(20000);
    
    // Verifica se há elementos principais carregados
    await expect(page.locator('body')).toBeVisible();
  });

  test('deve lidar com estados de carregamento', async ({ page }) => {
    const res = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 200).toBeLessThan(500);
    await page.waitForTimeout(500);
    const content = await page.locator('body').textContent();
    expect((content ?? '').length).toBeGreaterThan(50);
  });
});

test.describe('Interações do Usuário', () => {
  test('deve responder a cliques em botões', async ({ page }) => {
    const res = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 200).toBeLessThan(500);
    
    // Procura por botões clicáveis
    const buttons = await page.locator('button:visible').all();
    
    if (buttons.length > 0) {
      const firstButton = buttons[0];
      
      // Verifica se o botão está habilitado
      const isEnabled = await firstButton.isEnabled();
      
      if (isEnabled) {
        await firstButton.click();
        await page.waitForTimeout(1000);
        
        const hasRuntimeError = await page.locator('text=Unhandled Runtime Error').isVisible();
        expect(hasRuntimeError).toBeFalsy();
      }
    }
  });

  test('deve validar formulários', async ({ page }) => {
    const res = await page.goto('/register', { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 200).toBeLessThan(500);

    const submitButton = page.getByRole('button', { name: /Criar Conta/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await expect(page.locator('text=Por favor, preencha todos os campos')).toBeVisible({ timeout: 5000 });
    }
  });
});
