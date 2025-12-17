import { test, expect, Page } from '@playwright/test';

// Configurações de teste
const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'test@example.com',
  password: process.env.E2E_TEST_PASSWORD || 'testpassword123'
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper para fazer login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(`${BASE_URL}/dashboard`);
}

// Helper para aguardar carregamento
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="page-loaded"]', { timeout: 10000 });
}

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar interceptadores para APIs
    await page.route('**/api/metrics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.route('**/api/dashboard/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 1250,
          activeUsers: 890,
          totalRevenue: 45000,
          conversionRate: 3.2
        })
      });
    });
  });

  test('deve carregar dashboard corretamente após login', async ({ page }) => {
    await login(page);
    await waitForPageLoad(page);

    // Verificar elementos principais do dashboard
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('deve exibir estatísticas corretas', async ({ page }) => {
    await login(page);
    await waitForPageLoad(page);

    // Verificar cards de estatísticas
    await expect(page.locator('[data-testid="total-users-card"]')).toContainText('1,250');
    await expect(page.locator('[data-testid="active-users-card"]')).toContainText('890');
    await expect(page.locator('[data-testid="revenue-card"]')).toContainText('45,000');
    await expect(page.locator('[data-testid="conversion-card"]')).toContainText('3.2%');
  });

  test('deve navegar entre diferentes seções', async ({ page }) => {
    await login(page);
    await waitForPageLoad(page);

    // Testar navegação para Analytics
    await page.click('[data-testid="nav-analytics"]');
    await page.waitForURL('**/analytics');
    await expect(page.locator('[data-testid="analytics-title"]')).toBeVisible();

    // Testar navegação para Settings
    await page.click('[data-testid="nav-settings"]');
    await page.waitForURL('**/settings');
    await expect(page.locator('[data-testid="settings-title"]')).toBeVisible();

    // Voltar para Dashboard
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForURL('**/dashboard');
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  });

  test('deve funcionar corretamente em dispositivos móveis', async ({ page }) => {
    // Simular viewport móvel
    await page.setViewportSize({ width: 375, height: 667 });
    
    await login(page);
    await waitForPageLoad(page);

    // Verificar se menu mobile está presente
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // Abrir menu mobile
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Testar navegação mobile
    await page.click('[data-testid="mobile-nav-analytics"]');
    await page.waitForURL('**/analytics');
    await expect(page.locator('[data-testid="analytics-title"]')).toBeVisible();
  });

  test('deve atualizar dados em tempo real', async ({ page }) => {
    await login(page);
    await waitForPageLoad(page);

    // Interceptar chamada de atualização
    let updateCount = 0;
    await page.route('**/api/dashboard/stats', async (route) => {
      updateCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalUsers: 1250 + updateCount * 10,
          activeUsers: 890 + updateCount * 5,
          totalRevenue: 45000 + updateCount * 1000,
          conversionRate: 3.2 + updateCount * 0.1
        })
      });
    });

    // Aguardar primeira atualização automática
    await page.waitForTimeout(5000);

    // Verificar se dados foram atualizados
    await expect(page.locator('[data-testid="total-users-card"]')).toContainText('1,260');
  });

  test('deve lidar com erros de API graciosamente', async ({ page }) => {
    // Simular erro de API
    await page.route('**/api/dashboard/stats', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await login(page);

    // Verificar se mensagem de erro é exibida
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Erro ao carregar dados');

    // Verificar se botão de retry está presente
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('deve permitir filtrar dados por período', async ({ page }) => {
    await login(page);
    await waitForPageLoad(page);

    // Abrir seletor de período
    await page.click('[data-testid="period-selector"]');
    await expect(page.locator('[data-testid="period-dropdown"]')).toBeVisible();

    // Selecionar período de 7 dias
    await page.click('[data-testid="period-7days"]');

    // Verificar se dados foram atualizados
    await page.waitForResponse('**/api/dashboard/stats?period=7days');
    await expect(page.locator('[data-testid="period-selector"]')).toContainText('Últimos 7 dias');
  });

  test('deve exportar dados corretamente', async ({ page }) => {
    await login(page);
    await waitForPageLoad(page);

    // Configurar download
    const downloadPromise = page.waitForEvent('download');

    // Clicar no botão de exportar
    await page.click('[data-testid="export-button"]');

    // Aguardar download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/dashboard-export-\d{4}-\d{2}-\d{2}\.csv/);
  });

  test('deve manter estado durante navegação', async ({ page }) => {
    await login(page);
    await waitForPageLoad(page);

    // Alterar filtro
    await page.click('[data-testid="period-selector"]');
    await page.click('[data-testid="period-30days"]');

    // Navegar para outra página
    await page.click('[data-testid="nav-analytics"]');
    await page.waitForURL('**/analytics');

    // Voltar para dashboard
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForURL('**/dashboard');

    // Verificar se filtro foi mantido
    await expect(page.locator('[data-testid="period-selector"]')).toContainText('Últimos 30 dias');
  });

  test('deve funcionar com teclado (acessibilidade)', async ({ page }) => {
    await login(page);
    await waitForPageLoad(page);

    // Testar navegação por teclado
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-analytics"]')).toBeFocused();

    // Testar ativação por Enter
    await page.keyboard.press('Enter');
    await page.waitForURL('**/analytics');
  });

  test('deve ter performance adequada', async ({ page }) => {
    // Medir métricas de performance
    await page.goto(`${BASE_URL}/login`);
    
    const startTime = Date.now();
    await login(page);
    await waitForPageLoad(page);
    const loadTime = Date.now() - startTime;

    // Verificar se carregamento foi rápido (menos de 3 segundos)
    expect(loadTime).toBeLessThan(3000);

    // Verificar Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: Record<string, number> = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Timeout para resolver mesmo se métricas não estiverem disponíveis
        setTimeout(() => resolve({}), 2000);
      });
    });

    console.log('Performance metrics:', metrics);
  });

  test('deve funcionar offline (PWA)', async ({ page, context }) => {
    await login(page);
    await waitForPageLoad(page);

    // Simular modo offline
    await context.setOffline(true);

    // Recarregar página
    await page.reload();

    // Verificar se página offline é exibida ou cache funciona
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Voltar online
    await context.setOffline(false);
    
    // Verificar se conectividade é restaurada
    await page.waitForSelector('[data-testid="online-indicator"]', { timeout: 5000 });
  });
});