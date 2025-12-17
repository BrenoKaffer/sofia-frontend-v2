/**
 * Teste de persistência de logs usando o logger da aplicação
 */

// Simular ambiente Next.js
global.process = {
  ...process,
  env: {
    ...process.env,
    NEXT_PUBLIC_ENV: 'development'
  }
};

async function testLogPersistence() {
  console.log('=== TESTE DE PERSISTÊNCIA DE LOGS ===');
  
  try {
    // Testar criação de log via API (usando apenas campos que existem)
    const testLog = {
      level: 'info',
      message: 'Teste de persistência - ' + new Date().toISOString(),
      context: 'test_persistence',
      source: 'test-script',
      metadata: {
        test: true,
        timestamp: Date.now()
      }
    };

    console.log('📝 Criando log de teste...');
    const createResponse = await fetch('http://localhost:3003/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testLog)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log('❌ Erro ao criar log:', createResponse.status, errorText);
      return;
    }

    const createdLog = await createResponse.json();
     console.log('✅ Log criado com sucesso:', createdLog.log?.id || 'ID não encontrado');

    // Aguardar um pouco para garantir que foi persistido
    console.log('⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar se o log foi persistido
    console.log('🔍 Verificando se o log foi persistido...');
    const logsResponse = await fetch('http://localhost:3003/api/logs?limit=10');
    
    if (!logsResponse.ok) {
      console.log('❌ Erro ao buscar logs:', logsResponse.status);
      return;
    }

    const logs = await logsResponse.json();
    console.log(`📊 Total de logs encontrados: ${logs.length}`);

    // Procurar pelo log criado
     const foundLog = logs.find(log => log.id === createdLog.log?.id);
    
    if (foundLog) {
      console.log('✅ Log encontrado no banco de dados!');
      console.log('📋 Detalhes do log:');
      console.log(`   - ID: ${foundLog.id}`);
      console.log(`   - Level: ${foundLog.level}`);
      console.log(`   - Message: ${foundLog.message}`);
      console.log(`   - Timestamp: ${foundLog.timestamp}`);
      console.log('🎉 TESTE DE PERSISTÊNCIA PASSOU!');
    } else {
      console.log('❌ Log não encontrado no banco de dados');
      console.log('🔍 Logs disponíveis:');
      logs.slice(0, 3).forEach(log => {
        console.log(`   - ${log.id}: ${log.level} - ${log.message}`);
      });
    }

  } catch (error) {
    console.log('❌ Erro durante o teste:', error.message);
  }
}

testLogPersistence();