# Guia de Integração das APIs SOFIA

Este guia explica como usar todos os recursos de integração com as APIs do SOFIA que foram implementados.

## 📁 Estrutura dos Arquivos

```
├── docs/
│   ├── api-endpoints.md          # Documentação completa dos endpoints
│   └── README-API-Integration.md  # Este arquivo
├── lib/
│   └── api-client.ts             # Cliente HTTP centralizado
├── hooks/
│   └── use-real-time-data.ts     # Hooks para dados em tempo real
├── contexts/
│   └── sofia-context.tsx         # Contexto global do SOFIA
├── components/examples/
│   └── api-integration-example.tsx # Exemplo de uso completo
└── .env.example                   # Variáveis de ambiente
```

## 🚀 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar as variáveis conforme necessário
```

**Variáveis principais:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_PUBLIC_API_URL=http://localhost:3001/api/public
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
NEXT_PUBLIC_API_KEY=your_api_key_here
```

### 2. Configurar o Provider Global

No seu `app/layout.tsx` ou `_app.tsx`:

```tsx
import { SofiaProvider } from '@/contexts/sofia-context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SofiaProvider>
          {children}
        </SofiaProvider>
      </body>
    </html>
  );
}
```

## 📡 Usando o Cliente de API

### Importação e Uso Básico

```tsx
import { apiClient } from '@/lib/api-client';

// Buscar sinais recentes
const signals = await apiClient.getRecentSignals('table_1', 20, 70);

// Buscar KPIs
const kpis = await apiClient.getKpisEstrategias('table_1');

// Buscar histórico
const history = await apiClient.getSignalsHistory({
  table_id: 'table_1',
  strategy: 'Fibonacci',
  confidence_min: 75,
  limit: 50
});
```

### Tratamento de Erros

```tsx
const fetchData = async () => {
  const response = await apiClient.getRecentSignals();
  
  if (response.success) {
    console.log('Dados:', response.data);
  } else {
    console.error('Erro:', response.error);
  }
};
```

### Configuração de API Key

```tsx
// Definir API key dinamicamente
apiClient.setApiKey('nova_api_key');

// Ou configurar URLs customizadas
apiClient.setBaseUrls(
  'https://api.sofia.com.br/api',
  'https://api.sofia.com.br/api/public'
);
```

## 🔄 Dados em Tempo Real

### Hook Básico

```tsx
import { useRealTimeData } from '@/hooks/use-real-time-data';

function MyComponent() {
  const { data, isConnected, isLoading, error, refresh } = useRealTimeData({
    endpoint: '/signals/recent',
    pollingInterval: 5000,
    enableWebSocket: true,
    enablePolling: true,
    onData: (newData) => {
      console.log('Novos dados:', newData);
    },
    onError: (error) => {
      console.error('Erro:', error);
    }
  });

  return (
    <div>
      <p>Status: {isConnected ? 'Conectado' : 'Desconectado'}</p>
      <button onClick={refresh}>Atualizar</button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

### Hooks Específicos

```tsx
import { 
  useRealTimeSignals, 
  useRealTimeTableStatus, 
  useRealTimeKPIs 
} from '@/hooks/use-real-time-data';

function Dashboard() {
  // Sinais em tempo real
  const signals = useRealTimeSignals({
    pollingInterval: 3000,
    onData: (signals) => {
      // Processar novos sinais
    }
  });

  // Status das mesas
  const tableStatus = useRealTimeTableStatus('table_1');

  // KPIs (atualização menos frequente)
  const kpis = useRealTimeKPIs({
    pollingInterval: 10000
  });

  return (
    <div>
      <h2>Sinais: {signals.data?.length || 0}</h2>
      <h2>Mesa Status: {tableStatus.data?.status}</h2>
      <h2>KPIs: {kpis.data?.length || 0}</h2>
    </div>
  );
}
```

## 🌐 Contexto Global

### Usando o Contexto

```tsx
import { 
  useSofia, 
  useSofiaSignals, 
  useSofiaKPIs, 
  useSofiaConnection,
  useSofiaPreferences 
} from '@/contexts/sofia-context';

function MyComponent() {
  // Acesso completo ao estado e ações
  const { state, actions } = useSofia();
  
  // Hooks específicos (mais convenientes)
  const signals = useSofiaSignals();
  const kpis = useSofiaKPIs();
  const { isConnected, error } = useSofiaConnection();
  const { preferences, updatePreferences } = useSofiaPreferences();

  const handleUpdatePrefs = async () => {
    await updatePreferences({
      selected_strategies: ['Fibonacci', 'Martingale'],
      notification_settings: {
        sound_enabled: true,
        min_confidence: 80
      }
    });
  };

  return (
    <div>
      <p>Sinais: {signals.length}</p>
      <p>Status: {isConnected ? 'Online' : 'Offline'}</p>
      <button onClick={actions.refreshData}>Atualizar</button>
      <button onClick={handleUpdatePrefs}>Salvar Preferências</button>
    </div>
  );
}
```

### Ações Disponíveis

```tsx
const { actions } = useSofia();

// Atualizar todos os dados
await actions.refreshData();

// Buscar histórico de sinais
const signalsHistory = await actions.getSignalsHistory({
  strategy: 'Fibonacci',
  confidence_min: 75
});

// Buscar histórico da roleta
const rouletteHistory = await actions.getRouletteHistory('table_1', 100);

// Limpar cache
actions.clearCache();

// Definir erro customizado
actions.setError('Erro personalizado');
```

## 🔌 API Pública

### Endpoints Principais

```tsx
// Health check
const health = await apiClient.getPublicSystemHealth();

// Estatísticas de uso
const usage = await apiClient.getPublicSystemUsage();

// Sinais públicos
const publicSignals = await apiClient.getPublicSignals('table_1', 10, 80);

// Mesas disponíveis
const tables = await apiClient.getPublicTables();

// Performance de estratégias
const performance = await apiClient.getPublicStrategiesStats('table_1', '7d');

// Solicitar predição
const prediction = await apiClient.requestPublicPrediction({
  table_id: 'table_1',
  spins: [1, 15, 32, 8, 21],
  prediction_type: 'next_number'
});
```

## 📊 Exemplos Práticos

### Dashboard de Sinais

```tsx
import { useSofiaSignals, useSofiaConnection } from '@/contexts/sofia-context';

function SignalsDashboard() {
  const signals = useSofiaSignals();
  const { isConnected, lastUpdate } = useSofiaConnection();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2>Sinais em Tempo Real</h2>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="grid gap-4">
        {signals.map((signal) => (
          <div key={signal.id} className="border p-4 rounded">
            <div className="flex justify-between">
              <span className="font-medium">{signal.strategy}</span>
              <span className="text-sm bg-blue-100 px-2 py-1 rounded">
                {signal.confidence}%
              </span>
            </div>
            <p className="text-sm text-gray-600">{signal.table_id}</p>
            <p className="text-xs text-gray-400">
              {new Date(signal.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Filtros Avançados

```tsx
import { useState } from 'react';
import { useSofia } from '@/contexts/sofia-context';

function AdvancedFilters() {
  const { actions } = useSofia();
  const [filters, setFilters] = useState({
    strategy: '',
    table_id: '',
    confidence_min: 70,
    date_from: '',
    date_to: ''
  });
  const [results, setResults] = useState([]);

  const applyFilters = async () => {
    const data = await actions.getSignalsHistory(filters);
    setResults(data);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <select 
          value={filters.strategy} 
          onChange={(e) => setFilters({...filters, strategy: e.target.value})}
        >
          <option value="">Todas as estratégias</option>
          <option value="Fibonacci">Fibonacci</option>
          <option value="Martingale">Martingale</option>
        </select>
        
        <input
          type="range"
          min="50"
          max="100"
          value={filters.confidence_min}
          onChange={(e) => setFilters({...filters, confidence_min: +e.target.value})}
        />
      </div>
      
      <button onClick={applyFilters} className="bg-blue-500 text-white px-4 py-2 rounded">
        Aplicar Filtros
      </button>
      
      <div className="mt-4">
        <p>Resultados: {results.length}</p>
        {/* Renderizar resultados */}
      </div>
    </div>
  );
}
```

## 🔧 Configurações Avançadas

### Retry Logic Customizada

```tsx
// No api-client.ts, você pode customizar:
const response = await apiClient.makeRequest('/custom-endpoint', {
  method: 'POST',
  body: { data: 'example' },
  timeout: 15000,  // 15 segundos
  retries: 5       // 5 tentativas
});
```

### Cache Personalizado

```tsx
const { state, actions } = useSofia();

// Acessar cache
const cachedSignals = state.cache.signals_history;
const cachedPerformance = state.cache.performance_data;

// Atualizar cache manualmente
actions.updateCache('signals_history', newData);

// Limpar cache específico
actions.clearCache();
```

### WebSocket Customizado

```tsx
const customWS = useRealTimeData({
  endpoint: '/custom',
  enableWebSocket: true,
  enablePolling: false, // Apenas WebSocket
  onData: (data) => {
    // Processar dados do WebSocket
  },
  onError: (error) => {
    // Fallback para polling se WebSocket falhar
  }
});
```

## 🐛 Debugging e Monitoramento

### Logs de Debug

```tsx
// Ativar logs detalhados
process.env.NEXT_PUBLIC_DEBUG = 'true';

// Monitorar todas as chamadas de API
apiClient.onRequest = (url, config) => {
  console.log('API Request:', url, config);
};

apiClient.onResponse = (url, response) => {
  console.log('API Response:', url, response);
};
```

### Health Monitoring

```tsx
function HealthMonitor() {
  const [health, setHealth] = useState(null);
  
  useEffect(() => {
    const checkHealth = async () => {
      const response = await apiClient.getPublicSystemHealth();
      setHealth(response.data);
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // A cada 30s
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4">
      <div className={`w-4 h-4 rounded-full ${
        health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
      }`} />
    </div>
  );
}
```

## 📝 Notas Importantes

1. **Rate Limiting**: A API pública tem limites de taxa. Use com moderação.
2. **Autenticação**: Alguns endpoints requerem autenticação. Configure adequadamente.
3. **WebSocket**: Pode não funcionar em todos os ambientes. O polling é o fallback.
4. **Cache**: Use o cache para otimizar performance, mas limpe quando necessário.
5. **Errors**: Sempre trate erros adequadamente para melhor UX.

## 🚀 Próximos Passos

1. Implementar autenticação completa
2. Adicionar mais hooks específicos
3. Implementar notificações push
4. Adicionar métricas de performance
5. Implementar offline support

---

**Exemplo Completo**: Veja `components/examples/api-integration-example.tsx` para um exemplo funcional completo.