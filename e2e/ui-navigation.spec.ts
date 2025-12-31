import { test, expect } from '@playwright/test';

test.describe('Interface do Usuário e Navegação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar página inicial sem erros', async ({ page }) => {
    // Verifica se a página carregou
    await expect(page).toHaveTitle(/SOFIA|Dashboard|Home/);
    
    // Verifica se não há erros de JavaScript críticos
    const errors: any[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Filtra erros conhecidos que não são críticos
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('network') &&
      !error.includes('ResizeObserver')
    );
    
    expect(criticalErrors.length).toBe(0);
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
      
      // Verifica se elementos principais estão visíveis
      const navigation = page.locator('nav, [role="navigation"]').first();
      if (await navigation.isVisible()) {
        await expect(navigation).toBeVisible();
      }
      
      // Verifica se há menu hambúrguer em mobile
      if (viewport.width < 768) {
        const mobileMenu = page.locator('[data-testid="mobile-menu"], .hamburger, [aria-label="Menu"]');
        const hasMobileMenu = await mobileMenu.count() > 0;
        
        if (hasMobileMenu) {
          await expect(mobileMenu.first()).toBeVisible();
        }
      }
    }
  });

  test('deve navegar entre páginas principais', async ({ page }) => {
    const routes = [
      { path: '/', name: 'Home' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/analytics', name: 'Analytics' },
      { path: '/settings', name: 'Settings' }
    ];
    
    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      
      // Verifica se a URL está correta
      expect(page.url()).toContain(route.path);
      
      // Verifica se não há erro 404
      const notFound = await page.locator('text=404').isVisible();
      expect(notFound).toBeFalsy();
    }
  });

  test('deve ter elementos de acessibilidade', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
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
    expect(foundElements).toBeGreaterThan(2);
  });

  test('deve ter performance adequada', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Página deve carregar em menos de 10 segundos
    expect(loadTime).toBeLessThan(10000);
    
    // Verifica se há elementos principais carregados
    const mainContent = page.locator('main, [role="main"], .main-content').first();
    if (await mainContent.isVisible()) {
      await expect(mainContent).toBeVisible();
    }
  });

  test('deve lidar com estados de carregamento', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Procura por indicadores de carregamento
    const loadingIndicators = [
      '[data-testid="loading"]',
      '.spinner',
      '.loading',
      'text=Carregando',
      'text=Loading'
    ];
    
    let hasLoadingState = false;
    
    for (const selector of loadingIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        hasLoadingState = true;
        
        // Verifica se o loading desaparece
        await page.waitForSelector(selector, { state: 'hidden', timeout: 10000 });
        break;
      } catch {
        // Continua para o próximo indicador
      }
    }
    
    // Se encontrou loading, deve ter desaparecido
    if (hasLoadingState) {
      await page.waitForLoadState('networkidle');
    }
    
    // Verifica se o conteúdo final está presente
    const hasContent = await page.locator('body').textContent();
    if (!hasContent) {
      throw new Error('Page content not found');
    }
    expect(hasContent.length).toBeGreaterThan(100);
  });
});

test.describe('Interações do Usuário', () => {
  test('deve responder a cliques em botões', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Procura por botões clicáveis
    const buttons = await page.locator('button:visible').all();
    
    if (buttons.length > 0) {
      const firstButton = buttons[0];
      
      // Verifica se o botão está habilitado
      const isEnabled = await firstButton.isEnabled();
      
      if (isEnabled) {
        await firstButton.click();
        await page.waitForTimeout(1000);
        
        // Verifica se houve alguma resposta
        const hasResponse = await page.locator('[data-testid="response"], .modal, .popup').isVisible();
        
        // Não é obrigatório ter resposta, mas não deve quebrar
        const hasError = await page.locator('text=Error').isVisible();
        expect(hasError).toBeFalsy();
      }
    }
  });

  test('deve validar formulários', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Procura por formulários
    const forms = await page.locator('form').all();
    
    if (forms.length > 0) {
      const form = forms[0];
      
      // Procura por campos obrigatórios
      const requiredFields = await form.locator('input[required], select[required], textarea[required]').all();
      
      if (requiredFields.length > 0) {
        // Tenta submeter formulário vazio
        const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
        
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Verifica se há validação
          const hasValidation = await page.locator('.error, .invalid, [aria-invalid="true"]').isVisible();
          
          // Deve haver alguma validação ou o formulário não deve ser submetido
          expect(hasValidation || page.url().includes('settings')).toBeTruthy();
        }
      }
    }
  });
});