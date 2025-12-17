const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Configuração do servidor Express
const app = express();
app.use(cors());
app.use(express.json());

// Verificar se deve usar dados mock
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
console.log(`🔧 Modo de dados: ${USE_MOCK_DATA ? 'MOCK' : 'REAL'}`);

// Criar servidor HTTP
const server = http.createServer(app);

// Configurar WebSocket Server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

// === FUNÇÕES PARA DADOS REAIS ===

// Buscar dados reais do backend
const fetchRealData = async (endpoint) => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.SOFIA_BACKEND_URL || '';
    const response = await fetch(`${backendUrl}/api/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`Erro ao buscar dados reais de ${endpoint}:`, error.message);
    return null;
  }
};

const getRealSignalData = async () => {
  const data = await fetchRealData('signals/recent?limit=1');
  if (data && data.signals && data.signals.length > 0) {
    const signal = data.signals[0];
    return {
      type: 'signal',
      data: {
        id: signal.id || Date.now(),
        strategy: signal.strategy || 'Desconhecida',
        table: signal.table || 'Mesa Principal',
        prediction: signal.prediction || {
          number: Math.floor(Math.random() * 37),
          color: ['red', 'black', 'green'][Math.floor(Math.random() * 3)],
          confidence: 75
        },
        timestamp: signal.timestamp || new Date().toISOString(),
        status: signal.status || 'active'
      }
    };
  }
  return null;
};

const getRealKPIData = async () => {
  const data = await fetchRealData('kpis');
  if (data) {
    return {
      type: 'kpi',
      data: {
        totalSignals: data.totalSignals || 0,
        successRate: data.successRate || 0,
        activeStrategies: data.activeStrategies || 0,
        dailyProfit: data.dailyProfit || '0.00',
        timestamp: new Date().toISOString()
      }
    };
  }
  return null;
};

const getRealTableStatus = async () => {
  const data = await fetchRealData('table-status');
  if (data && Array.isArray(data)) {
    return {
      type: 'table_status',
      data: data.map(table => ({
        id: table.id || table.name?.toLowerCase().replace(' ', '_'),
        name: table.name || 'Mesa Desconhecida',
        status: table.status || 'offline',
        players: table.players || 0,
        lastSpin: table.lastSpin || {
          number: Math.floor(Math.random() * 37),
          color: ['red', 'black', 'green'][Math.floor(Math.random() * 3)],
          timestamp: new Date().toISOString()
        }
      }))
    };
  }
  return null;
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

// === FUNÇÕES HÍBRIDAS (REAL OU MOCK) ===

const getSignalData = async () => {
  if (USE_MOCK_DATA) {
    return generateMockData();
  }
  
  const realData = await getRealSignalData();
  if (realData) {
    return realData;
  }
  
  // Fallback para mock se dados reais não estiverem disponíveis
  console.warn('Dados reais não disponíveis, usando mock para sinais');
  return generateMockData();
};

const getKPIData = async () => {
  if (USE_MOCK_DATA) {
    return generateKPIData();
  }
  
  const realData = await getRealKPIData();
  if (realData) {
    return realData;
  }
  
  // Fallback para mock se dados reais não estiverem disponíveis
  console.warn('Dados reais não disponíveis, usando mock para KPIs');
  return generateKPIData();
};

const getTableStatusData = async () => {
  if (USE_MOCK_DATA) {
    return generateTableStatus();
  }
  
  const realData = await getRealTableStatus();
  if (realData) {
    return realData;
  }
  
  // Fallback para mock se dados reais não estiverem disponíveis
  console.warn('Dados reais não disponíveis, usando mock para status das mesas');
  return generateTableStatus();
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

// Gerenciar conexões WebSocket
const clients = new Set();

wss.on('connection', async (ws, req) => {
  console.log(`[${new Date().toLocaleTimeString()}] Nova conexão WebSocket estabelecida`);
  clients.add(ws);
  
  // Enviar dados iniciais (usando funções híbridas)
  try {
    const signalData = await getSignalData();
    const kpiData = await getKPIData();
    const tableData = await getTableStatusData();
    
    ws.send(JSON.stringify(signalData));
    ws.send(JSON.stringify(kpiData));
    ws.send(JSON.stringify(tableData));
  } catch (error) {
    console.error('Erro ao enviar dados iniciais:', error);
    // Fallback para dados mock em caso de erro
    ws.send(JSON.stringify(generateMockData()));
    ws.send(JSON.stringify(generateKPIData()));
    ws.send(JSON.stringify(generateTableStatus()));
  }
  
  // Configurar heartbeat
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Mensagem recebida:', data);
      
      // Responder com confirmação
      ws.send(JSON.stringify({
        type: 'ack',
        data: { received: true, timestamp: new Date().toISOString() }
      }));
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`[${new Date().toLocaleTimeString()}] Conexão WebSocket fechada`);
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('Erro na conexão WebSocket:', error);
    clients.delete(ws);
  });
});

// Broadcast de dados para todos os clientes conectados
const broadcastToClients = (data) => {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Enviar dados periodicamente (real ou mock baseado na configuração)
setInterval(async () => {
  if (clients.size > 0) {
    try {
      // Enviar novo sinal a cada 30 segundos
      const signalData = await getSignalData();
      broadcastToClients(signalData);
    } catch (error) {
      console.error('Erro ao enviar sinal periódico:', error);
      broadcastToClients(generateMockData());
    }
  }
}, 30000);

setInterval(async () => {
  if (clients.size > 0) {
    try {
      // Atualizar KPIs a cada 60 segundos
      const kpiData = await getKPIData();
      broadcastToClients(kpiData);
    } catch (error) {
      console.error('Erro ao enviar KPIs periódicos:', error);
      broadcastToClients(generateKPIData());
    }
  }
}, 60000);

setInterval(async () => {
  if (clients.size > 0) {
    try {
      // Atualizar status das mesas a cada 45 segundos
      const tableData = await getTableStatusData();
      broadcastToClients(tableData);
    } catch (error) {
      console.error('Erro ao enviar status das mesas periódico:', error);
      broadcastToClients(generateTableStatus());
    }
  }
}, 45000);

// Heartbeat para manter conexões vivas
setInterval(() => {
  clients.forEach(client => {
    if (!client.isAlive) {
      client.terminate();
      clients.delete(client);
      return;
    }
    
    client.isAlive = false;
    client.ping();
  });
}, 30000);

// Endpoints REST para compatibilidade
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    websocket: {
      connected_clients: clients.size,
      server_status: 'running'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/signals/recent', async (req, res) => {
  try {
    if (USE_MOCK_DATA) {
      const signals = Array.from({length: 10}, () => generateMockData().data);
      res.json({ signals, total: signals.length });
    } else {
      const data = await fetchRealData('signals/recent?limit=10');
      if (data) {
        res.json(data);
      } else {
        // Fallback para mock
        const signals = Array.from({length: 10}, () => generateMockData().data);
        res.json({ signals, total: signals.length });
      }
    }
  } catch (error) {
    console.error('Erro no endpoint signals/recent:', error);
    const signals = Array.from({length: 10}, () => generateMockData().data);
    res.json({ signals, total: signals.length });
  }
});

app.get('/api/kpis', async (req, res) => {
  try {
    const kpiData = await getKPIData();
    res.json(kpiData.data);
  } catch (error) {
    console.error('Erro no endpoint kpis:', error);
    res.json(generateKPIData().data);
  }
});

app.get('/api/table-status', async (req, res) => {
  try {
    const tableData = await getTableStatusData();
    res.json(tableData.data);
  } catch (error) {
    console.error('Erro no endpoint table-status:', error);
    res.json(generateTableStatus().data);
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket rodando na porta ${PORT}`);
  const origin = process.env.NEXT_PUBLIC_WS_URL || process.env.SOFIA_BACKEND_WS_URL || `ws://0.0.0.0:${PORT}/ws`;
  const apiOrigin = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.SOFIA_BACKEND_URL || `http://0.0.0.0:${PORT}`;
  console.log(`📡 WebSocket endpoint: ${origin}`);
  console.log(`🌐 API REST: ${apiOrigin}/api`);
  console.log(`💡 Health check: ${apiOrigin}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado.');
  });
});

process.on('SIGINT', () => {
  console.log('Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado.');
  });
});
