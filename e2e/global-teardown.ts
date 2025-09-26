import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Iniciando limpeza global dos testes E2E...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    
    // Limpar dados de teste
    console.log('🗑️ Limpando dados de teste...');
    
    try {
      await page.request.post(`${baseURL}/api/test/cleanup`, {
        data: {
          action: 'cleanup-all'
        }
      });
      console.log('✅ Dados de teste limpos');
    } catch (error) {
      console.log('⚠️ Erro ao limpar dados de teste:', error);
    }

    // Remover usuário de teste
    try {
      await page.request.delete(`${baseURL}/api/test/users/test@example.com`);
      console.log('👤 Usuário de teste removido');
    } catch (error) {
      console.log('⚠️ Erro ao remover usuário de teste:', error);
    }

    // Limpar métricas de teste
    try {
      await page.request.delete(`${baseURL}/api/test/metrics`);
      console.log('📊 Métricas de teste limpas');
    } catch (error) {
      console.log('⚠️ Erro ao limpar métricas de teste:', error);
    }

    // Resetar configurações de teste
    try {
      await page.request.post(`${baseURL}/api/test/reset`, {
        data: {
          resetCache: true,
          resetSessions: true,
          resetMetrics: true
        }
      });
      console.log('🔄 Configurações resetadas');
    } catch (error) {
      console.log('⚠️ Erro ao resetar configurações:', error);
    }

  } catch (error) {
    console.error('❌ Erro na limpeza global:', error);
  } finally {
    await browser.close();
  }

  console.log('✅ Limpeza global concluída');
}

export default globalTeardown;