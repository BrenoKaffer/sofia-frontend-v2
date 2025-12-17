const https = require('https');
const http = require('http');

// Configuração para ignorar certificados SSL em desenvolvimento
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const BASE_URL = 'http://localhost:3000';

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Testes dos endpoints
async function runTests() {
  console.log('🚀 Iniciando testes dos endpoints...\n');

  const tests = [
    {
      name: 'Health Check',
      url: `${BASE_URL}/api/system/health`,
      method: 'GET'
    },
    {
      name: 'WebSocket Info',
      url: `${BASE_URL}/api/websocket`,
      method: 'GET'
    },
    {
      name: 'User Preferences (sem auth)',
      url: `${BASE_URL}/api/user/preferences`,
      method: 'GET'
    },
    {
      name: 'Available Options',
      url: `${BASE_URL}/api/user/available-options`,
      method: 'GET'
    },
    {
      name: 'Process Spin (sem dados)',
      url: `${BASE_URL}/api/process-spin`,
      method: 'POST',
      body: {}
    },
    {
      name: 'AI Signals',
      url: `${BASE_URL}/api/ai-signals`,
      method: 'GET'
    },
    {
      name: 'Register (dados inválidos)',
      url: `${BASE_URL}/api/auth/register`,
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: '123456',
        name: 'Test User'
      }
    },
    {
      name: 'Login (dados inválidos)',
      url: `${BASE_URL}/api/auth/login`,
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: '123456'
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`📋 Testando: ${test.name}`);
      console.log(`   URL: ${test.method} ${test.url}`);
      
      const startTime = Date.now();
      const response = await makeRequest(test.url, {
        method: test.method,
        body: test.body
      });
      const endTime = Date.now();
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ⏱️  Tempo: ${endTime - startTime}ms`);
      
      if (response.data && typeof response.data === 'object') {
        console.log(`   📄 Resposta: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
      } else {
        console.log(`   📄 Resposta: ${response.data.substring(0, 200)}...`);
      }
      
      // Considerar sucesso se status não for 500 (erro interno)
      if (response.status !== 500) {
        passedTests++;
        console.log(`   ✅ PASSOU\n`);
      } else {
        console.log(`   ❌ FALHOU (Erro interno do servidor)\n`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`   🔌 Servidor não está rodando em ${BASE_URL}`);
      }
      
      console.log(`   ❌ FALHOU\n`);
    }
  }

  console.log('📊 RESUMO DOS TESTES:');
  console.log(`   ✅ Passou: ${passedTests}/${totalTests}`);
  console.log(`   ❌ Falhou: ${totalTests - passedTests}/${totalTests}`);
  console.log(`   📈 Taxa de sucesso: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 Todos os testes passaram!');
  } else if (passedTests > totalTests / 2) {
    console.log('\n⚠️  Maioria dos testes passou, mas alguns falharam.');
  } else {
    console.log('\n❌ Muitos testes falharam. Verifique a configuração do servidor.');
  }
}

// Executar testes
runTests().catch(console.error);