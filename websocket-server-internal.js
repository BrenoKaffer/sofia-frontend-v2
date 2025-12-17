const WebSocket = require('ws');
const http = require('http');
const express = require('express');
require('dotenv').config();

// Configuração do servidor Express APENAS para APIs internas
const app = express();
app.use(express.json());

// Verificar se deve usar dados mock
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
console.log(`🔧 Servidor INTERNO - Modo de dados: ${USE_MOCK_DATA ? 'MOCK' : 'REAL'}`);

// REMOVER CORS - servidor interno não precisa
// NÃO expor WebSocket publicamente

// Criar servidor HTTP apenas para APIs internas
const server = http.createServer(app);

// WebSocket Server INTERNO - sem path público
const wss = new WebSocket.Server({ 
  port: 3002, // Porta diferente, apenas interna
  host: '127.0.0.1' // Apenas localhost
});

// === FUNÇÕES DE BUSCA DE DADOS REAIS ===
const fetchRealData = async (endpoint) => {
  try {
    const response = await fetch(`http://localhost:3001/api/${endpoint}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error(`Erro ao buscar dados reais de ${endpoint}:`, error);
    return null;
  }
};

const getRealSignalData = async () => {
  const data = await fetchRealData('signals/latest');
  return data ? { type: 'signal', data } : null;
};

const getRealKPIData = async () => {
  const data = await fetchRealData('kpis');
  return data ? { type: 'kpi', data } : null;
};

const getRealTableStatus = async () => {
  const data = await fetchRealData('table-status');
  return data ? { type: 'table_status', data } : null;
};

// === FUNÇÕES HÍBRIDAS (REAL OU MOCK) ===
const getSignalData = async () => {
  if (USE_MOCK_DATA) {
    return generateMockData();
  }
  
  try {
    const realData = await getRealSignalData();
    return realData || generateMockData();
  } catch (error) {
    console.error('Erro ao buscar dados reais de sinais:', error);
    return generateMockData();
  }
};

const getKPIData = async () => {
  if (USE_MOCK_DATA) {
    return generateKPIData();
  }
  
  try {
    const realData = await getRealKPIData();
    return realData || generateKPIData();
  } catch (error) {
    console.error('Erro ao buscar dados reais de KPIs:', error);
    return generateKPIData();
  }
};

const getTableStatusData = async () => {
  if (USE_MOCK_DATA) {
    return generateTableStatus();
  }
  
  try {
    const realData = await getRealTableStatus();
    return realData || generateTableStatus();
  } catch (error) {
    console.error('Erro ao buscar dados reais de status das mesas:', error);
    return generateTableStatus();
  }
};

// === DADOS SIMULADOS PARA DEMONSTRAÇÃO ===
const generateMockData = () => {
  const strategies = ['Fibonacci', 'Martingale', 'D\'Alembert', 'Paroli', 'Labouchere'];
  const tables = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa VIP'];
  const colors = ['red', 'black', 'green'];
  const numbers = Array.from({length: 37}, (_, i) => i); // 0-36
  
  return {
    type: 'signal',
    data: {
      id: Date.now(),
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      table: tables[Math.floor(Math.random() * tables.length)],
      prediction: {
        number: numbers[Math.floor(Math.random() * numbers.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        confidence: Math.floor(Math.random() * 40) + 60 // 60-100%
      },
      timestamp: new Date().toISOString(),
      status: 'active'
    }
  };
};

const generateKPIData = () => {
  return {
    type: 'kpi',
    data: {
      totalSignals: Math.floor(Math.random() * 1000) + 500,
      successRate: Math.floor(Math.random() * 30) + 70, // 70-100%
      activeStrategies: Math.floor(Math.random() * 5) + 3,
      dailyProfit: (Math.random() * 2000 - 1000).toFixed(2), // -1000 to +1000
      timestamp: new Date().toISOString()
    }
  };
};

const generateTableStatus = () => {
  const tables = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa VIP'];
  return {
    type: 'table_status',
    data: tables.map(table => ({
      id: table.toLowerCase().replace(' ', '_'),
      name: table,
      status: Math.random() > 0.2 ? 'online' : 'offline',
      players: Math.floor(Math.random() * 50) + 1,
      lastSpin: {
        number: Math.floor(Math.random() * 37),
        color: ['red', 'black', 'green'][Math.floor(Math.random() * 3)],
        timestamp: new Date().toISOString()
      }
    }))
  };
};

// Dados em memória para APIs internas
let currentData = {
  signals: [],
  kpis: {},
  tableStatus: [],
  lastUpdate: 0
};

// Gerenciar conexões WebSocket INTERNAS (se necessário)
const internalClients = new Set();

wss.on('connection', (ws, req) => {
  console.log(`[${new Date().toLocaleTimeString()}] Nova conexão WebSocket INTERNA estabelecida`);
  internalClients.add(ws);
  
  ws.on('close', () => {
    console.log(`[${new Date().toLocaleTimeString()}] Conexão WebSocket INTERNA fechada`);
    internalClients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('Erro na conexão WebSocket INTERNA:', error);
    internalClients.delete(ws);
  });
});

// Atualizar dados em memória periodicamente (real ou mock baseado na configuração)
setInterval(async () => {
  try {
    const signalData = await getSignalData();
    const newSignal = signalData.data;
    currentData.signals.unshift(newSignal);
    if (currentData.signals.length > 50) {
      currentData.signals = currentData.signals.slice(0, 50);
    }
    currentData.lastUpdate = Date.now();
    console.log(`[${new Date().toLocaleTimeString()}] Novo sinal gerado:`, newSignal.strategy);
  } catch (error) {
    console.error('Erro ao atualizar sinais:', error);
    const newSignal = generateMockData().data;
    currentData.signals.unshift(newSignal);
    if (currentData.signals.length > 50) {
      currentData.signals = currentData.signals.slice(0, 50);
    }
    currentData.lastUpdate = Date.now();
  }
}, 30000);

setInterval(async () => {
  try {
    const kpiData = await getKPIData();
    currentData.kpis = kpiData.data;
    currentData.lastUpdate = Date.now();
    console.log(`[${new Date().toLocaleTimeString()}] KPIs atualizados`);
  } catch (error) {
    console.error('Erro ao atualizar KPIs:', error);
    currentData.kpis = generateKPIData().data;
    currentData.lastUpdate = Date.now();
  }
}, 60000);

setInterval(async () => {
  try {
    const tableData = await getTableStatusData();
    currentData.tableStatus = tableData.data;
    currentData.lastUpdate = Date.now();
    console.log(`[${new Date().toLocaleTimeString()}] Status das mesas atualizado`);
  } catch (error) {
    console.error('Erro ao atualizar status das mesas:', error);
    currentData.tableStatus = generateTableStatus().data;
    currentData.lastUpdate = Date.now();
  }
}, 45000);

// APIs INTERNAS - apenas para o middleware do frontend
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    internal_service: true,
    data_age: Date.now() - currentData.lastUpdate,
    signals_count: currentData.signals.length,
    websocket_clients: internalClients.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/signals/recent', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({ 
    signals: currentData.signals.slice(0, limit), 
    total: currentData.signals.length 
  });
});

app.get('/api/kpis', (req, res) => {
  res.json(currentData.kpis);
});

app.get('/api/table-status', (req, res) => {
  res.json(currentData.tableStatus);
});

// Endpoint público para listar mesas (compatibilidade com api-client)
app.get('/api/public/tables', (req, res) => {
  const publicTables = [
    {
      id: 'mesa1',
      name: 'Mesa 1',
      provider: 'Pragmatic Play',
      status: 'active',
      last_spin: Math.floor(Math.random() * 37),
      last_update: new Date().toISOString()
    },
    {
      id: 'mesa2', 
      name: 'Mesa 2',
      provider: 'Evolution Gaming',
      status: 'active',
      last_spin: Math.floor(Math.random() * 37),
      last_update: new Date().toISOString()
    },
    {
      id: 'mesa3',
      name: 'Mesa 3', 
      provider: 'NetEnt',
      status: 'active',
      last_spin: Math.floor(Math.random() * 37),
      last_update: new Date().toISOString()
    }
  ];
  res.json({ data: publicTables, success: true });
});

// Endpoint para forçar atualização de dados (para testes)
app.post('/api/refresh', (req, res) => {
  currentData.signals.unshift(generateMockData().data);
  currentData.kpis = generateKPIData().data;
  currentData.tableStatus = generateTableStatus().data;
  currentData.lastUpdate = Date.now();
  
  res.json({
    success: true,
    message: 'Dados atualizados',
    timestamp: new Date().toISOString()
  });
});

// Inicializar dados
currentData.signals = Array.from({length: 10}, () => generateMockData().data);
currentData.kpis = generateKPIData().data;
currentData.tableStatus = generateTableStatus().data;
currentData.lastUpdate = Date.now();

// Iniciar servidor INTERNO
const PORT = 3001;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🔒 Servidor WebSocket INTERNO rodando na porta ${PORT}`);
  console.log(`🚫 WebSocket NÃO exposto publicamente`);
  console.log(`🔐 APIs internas: http://127.0.0.1:${PORT}/api`);
  console.log(`💡 Health check interno: http://127.0.0.1:${PORT}/api/health`);
  console.log(`📊 Dados inicializados: ${currentData.signals.length} sinais`);
});

console.log(`🔒 WebSocket Server INTERNO na porta 3002 (127.0.0.1 apenas)`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Encerrando servidor interno...');
  server.close(() => {
    wss.close(() => {
      console.log('Servidor interno encerrado.');
    });
  });
});

process.on('SIGINT', () => {
  console.log('Encerrando servidor interno...');
  server.close(() => {
    wss.close(() => {
      console.log('Servidor interno encerrado.');
    });
  });
});