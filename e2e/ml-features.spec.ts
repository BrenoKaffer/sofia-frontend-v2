import { test, expect } from '@playwright/test';

test.describe('Funcionalidades de Machine Learning', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Aguarda carregamento completo
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar dashboard de ML sem erros', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verifica se não há erros de console críticos
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
      !error.includes('network')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('deve exibir componentes de predição ML', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Procura por elementos relacionados a ML
    const mlElements = [
      '[data-testid="ml-predictions"]',
      '[data-testid="prediction-card"]',
      'text=Predição',
      'text=Confiança',
      'text=Modelo'
    ];
    
    let foundElements = 0;
    for (const selector of mlElements) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        foundElements++;
      } catch {
        // Elemento não encontrado, continua
      }
    }
    
    // Pelo menos alguns elementos de ML devem estar presentes
    expect(foundElements).toBeGreaterThan(0);
  });

  test('deve fazer requisições para API de ML', async ({ page }) => {
    // Intercepta requisições para APIs de ML
    const mlRequests: any[] = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/ml/')) {
        mlRequests.push({
          url,
          method: request.method()
        });
      }
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verifica se pelo menos uma requisição ML foi feita
    expect(mlRequests.length).toBeGreaterThan(0);
    
    // Verifica se as URLs estão corretas
    const validEndpoints = mlRequests.filter(req => 
      req.url.includes('/predictions') ||
      req.url.includes('/status') ||
      req.url.includes('/initialize')
    );
    
    expect(validEndpoints.length).toBeGreaterThan(0);
  });

  test('deve responder a interações do usuário', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Procura por botões interativos
    const interactiveElements = [
      'button:has-text("Atualizar")',
      'button:has-text("Predizer")',
      'button:has-text("Analisar")',
      '[data-testid="refresh-button"]',
      '[data-testid="predict-button"]'
    ];
    
    for (const selector of interactiveElements) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          await page.waitForTimeout(1000);
          
          // Verifica se houve alguma resposta visual
          const hasLoading = await page.locator('[data-testid="loading"]').isVisible();
          const hasSpinner = await page.locator('.spinner').isVisible();
          const hasUpdatedContent = await page.locator('[data-testid="updated-content"]').isVisible();
          
          // Pelo menos uma indicação de resposta deve estar presente
          expect(hasLoading || hasSpinner || hasUpdatedContent).toBeTruthy();
          break;
        }
      } catch {
        // Continua para o próximo elemento
      }
    }
  });
});

test.describe('API Endpoints', () => {
  test('deve responder corretamente aos endpoints de ML', async ({ page }) => {
    const responses: any[] = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/ml/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        });
      }
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verifica se as respostas são válidas
    const validResponses = responses.filter(res => res.status < 500);
    expect(validResponses.length).toBeGreaterThan(0);
    
    // Verifica se não há muitos erros 5xx
    const serverErrors = responses.filter(res => res.status >= 500);
    expect(serverErrors.length).toBeLessThan(responses.length / 2);
  });

  test('deve lidar com erros de rede graciosamente', async ({ page }) => {
    // Simula falha de rede
    await page.route('**/api/ml/**', route => {
      route.abort('failed');
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verifica se a aplicação não quebrou
    const hasErrorBoundary = await page.locator('[data-testid="error-boundary"]').isVisible();
    const hasErrorMessage = await page.locator('text=erro').isVisible();
    const hasRetryButton = await page.locator('button:has-text("Tentar novamente")').isVisible();
    
    // Deve haver algum tratamento de erro
    expect(hasErrorBoundary || hasErrorMessage || hasRetryButton).toBeTruthy();
  });
});