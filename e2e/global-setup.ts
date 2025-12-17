import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global dos testes E2E...');

  // Configurar dados de teste
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Aguardar servidor estar disponível
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    console.log(`📡 Verificando disponibilidade do servidor: ${baseURL}`);

    let retries = 0;
    const maxRetries = 30;
    
    while (retries < maxRetries) {
      try {
        await page.goto(baseURL, { timeout: 5000 });
        console.log('✅ Servidor está disponível');
        break;
      } catch (error) {
        retries++;
        console.log(`⏳ Tentativa ${retries}/${maxRetries} - Aguardando servidor...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (retries === maxRetries) {
          throw new Error(`Servidor não está disponível após ${maxRetries} tentativas`);
        }
      }
    }

    // Configurar dados de teste no banco/API
    console.log('📊 Configurando dados de teste...');
    
    // Criar usuário de teste se necessário
    try {
      await page.request.post(`${baseURL}/api/test/setup`, {
        data: {
          action: 'create-test-user',
          user: {
            email: process.env.E2E_TEST_EMAIL || 'test@example.com',
            password: process.env.E2E_TEST_PASSWORD || 'testpassword123',
            name: 'Test User'
          }
        }
      });
      console.log('👤 Usuário de teste criado');
    } catch (error) {
      console.log('⚠️ Usuário de teste já existe ou erro na criação');
    }

    // Configurar dados de dashboard de teste
    try {
      await page.request.post(`${baseURL}/api/test/setup`, {
        data: {
          action: 'seed-dashboard-data',
          data: {
            stats: {
              totalUsers: 1250,
              activeUsers: 890,
              totalRevenue: 45000,
              conversionRate: 3.2
            },
            charts: {
              userGrowth: [
                { date: '2024-01-01', users: 1000 },
                { date: '2024-01-02', users: 1050 },
                { date: '2024-01-03', users: 1100 },
                { date: '2024-01-04', users: 1200 },
                { date: '2024-01-05', users: 1250 }
              ],
              revenue: [
                { month: 'Jan', revenue: 35000 },
                { month: 'Feb', revenue: 38000 },
                { month: 'Mar', revenue: 42000 },
                { month: 'Apr', revenue: 45000 }
              ]
            }
          }
        }
      });
      console.log('📈 Dados de dashboard configurados');
    } catch (error) {
      console.log('⚠️ Erro ao configurar dados de dashboard:', error);
    }

    // Limpar cache e cookies
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('🧹 Cache e cookies limpos');

  } catch (error) {
    console.error('❌ Erro no setup global:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Setup global concluído com sucesso');
}

export default globalSetup;