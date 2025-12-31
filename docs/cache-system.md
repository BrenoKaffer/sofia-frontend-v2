# Sistema de Cache Inteligente - SOFIA

## Visão Geral

O sistema de cache inteligente do SOFIA foi projetado para otimizar a performance da aplicação através de estratégias avançadas de cache, reduzindo latência e melhorando a experiência do usuário.

## Arquitetura

### Componentes Principais

1. **ApiCache** (`lib/api-cache.ts`)
   - Sistema de cache base com TTL e invalidação por tags
   - Suporte a stale-while-revalidate
   - Estatísticas de hit/miss rate
   - Limpeza automática de entradas expiradas

2. **useIntelligentCache** (`hooks/use-intelligent-cache.ts`)
   - Hook React para cache inteligente
   - Retry automático com exponential backoff
   - Refresh em background
   - Gerenciamento de estado de loading/error

3. **RouletteCache** (`lib/roulette-cache.ts`)
   - Cache especializado para dados da roleta
   - Atualizações em tempo real
   - Sistema de subscribers
   - Pré-carregamento de dados críticos

4. **Componentes Cached**
   - `LiveSignalsCached`: Sinais ao vivo com cache
   - `StatsCardsCached`: Estatísticas com cache
   - `CacheManager`: Interface de gerenciamento

## Configurações de Cache

### Presets Disponíveis

```typescript
const cacheConfigs = {
  realtime: {
    ttl: 30 * 1000, // 30 segundos
    tags: ['realtime'],
    staleWhileRevalidate: true
  },
  historical: {
    ttl: 10 * 60 * 1000, // 10 minutos
    tags: ['historical'],
    staleWhileRevalidate: true
  },
  config: {
    ttl: 30 * 60 * 1000, // 30 minutos
    tags: ['config'],
    staleWhileRevalidate: false
  },
  user: {
    ttl: 5 * 60 * 1000, // 5 minutos
    tags: ['user'],
    staleWhileRevalidate: true
  },
  strategies: {
    ttl: 15 * 60 * 1000, // 15 minutos
    tags: ['strategies'],
    staleWhileRevalidate: true
  }
};
```

## Uso Básico

### Hook useIntelligentCache

```typescript
import { useIntelligentCache } from '@/hooks/use-intelligent-cache';

function MyComponent() {
  const { data, loading, error, refresh, invalidate } = useIntelligentCache(
    'my-data-key',
    () => fetchMyData(),
    {
      ttl: 60000, // 1 minuto
      refreshInterval: 30000, // Refresh a cada 30s
      backgroundRefresh: true,
      retryOnError: true,
      maxRetries: 3
    }
  );

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  
  return <div>{JSON.stringify(data)}</div>;
}
```

### Hook usePresetCache

```typescript
import { usePresetCache } from '@/hooks/use-intelligent-cache';

function RealtimeComponent() {
  const { data, loading, error } = usePresetCache(
    'realtime-data',
    () => fetchRealtimeData(),
    'realtime' // Usa configuração predefinida
  );

  return <div>{/* Renderizar dados */}</div>;
}
```

### Múltiplas Requisições

```typescript
import { useMultipleIntelligentCache } from '@/hooks/use-intelligent-cache';

function DashboardComponent() {
  const { data, loading, error, refreshAll } = useMultipleIntelligentCache([
    {
      key: 'stats',
      fetcher: () => fetchStats(),
      options: { ttl: 30000 }
    },
    {
      key: 'signals',
      fetcher: () => fetchSignals(),
      options: { ttl: 15000 }
    }
  ]);

  return (
    <div>
      <div>Stats: {data.stats}</div>
      <div>Signals: {data.signals}</div>
      <button onClick={refreshAll}>Refresh All</button>
    </div>
  );
}
```

## Cache da Roleta

### Hooks Especializados

```typescript
import { 
  useLiveSignals, 
  useCurrentSession, 
  useRecentStats,
  useHistoricalNumbers,
  useActiveStrategies
} from '@/lib/roulette-cache';

function RouletteComponent() {
  const signals = useLiveSignals();
  const session = useCurrentSession();
  const stats = useRecentStats();
  
  return (
    <div>
      {/* Renderizar dados da roleta */}
    </div>
  );
}
```

### Gerenciamento Manual

```typescript
import { rouletteCacheUtils } from '@/lib/roulette-cache';

// Inicializar sistema
await rouletteCacheUtils.initialize();

// Forçar refresh
rouletteCacheUtils.forceRefresh();

// Obter estatísticas
const stats = rouletteCacheUtils.getStats();

// Subscrever a atualizações
const unsubscribe = rouletteCacheUtils.subscribe((data) => {
  console.log('Cache atualizado:', data);
});

// Cleanup
rouletteCacheUtils.cleanup();
```

## Componentes com Cache

### LiveSignalsCached

```typescript
import { LiveSignalsCached } from '@/components/dashboard/live-signals-cached';

function Dashboard() {
  return (
    <LiveSignalsCached 
      onGoToTable={(signal) => console.log(signal)}
      activeSignal={null}
    />
  );
}
```

### StatsCardsCached

```typescript
import { StatsCardsCached } from '@/components/dashboard/stats-cards-cached';

function Dashboard() {
  return (
    <StatsCardsCached className="grid-cols-4" />
  );
}
```

### CacheManager

```typescript
import { CacheManager } from '@/components/dashboard/cache-manager';

function AdminPanel() {
  return (
    <CacheManager 
      showAdvanced={true}
      className="w-full"
    />
  );
}
```

## Estratégias de Cache

### 1. Stale-While-Revalidate

- Retorna dados em cache (mesmo se stale)
- Busca dados frescos em background
- Atualiza cache quando novos dados chegam
- Ideal para dados que mudam frequentemente

### 2. Cache-First

- Verifica cache primeiro
- Só busca dados se não estiver em cache
- Ideal para dados estáticos ou que mudam pouco

### 3. Network-First

- Tenta buscar dados da rede primeiro
- Usa cache como fallback se rede falhar
- Ideal para dados críticos que precisam estar atualizados

### 4. Background Refresh

- Atualiza dados em background em intervalos regulares
- Não bloqueia a UI
- Mantém dados sempre frescos

## Otimizações de Performance

### 1. Memoização

```typescript
// Cálculos custosos são memoizados
const expensiveCalculation = useMemo(() => {
  return heavyComputation(data);
}, [data]);
```

### 2. Debouncing

```typescript
// Requisições são debounced para evitar spam
const debouncedFetch = useCallback(
  debounce(() => fetchData(), 300),
  []
);
```

### 3. Lazy Loading

```typescript
// Dados são carregados sob demanda
const { data } = useIntelligentCache(
  key,
  fetcher,
  { lazy: true } // Só carrega quando necessário
);
```

### 4. Prefetching

```typescript
// Dados críticos são pré-carregados
await rouletteCache.preloadCriticalData();
```

## Monitoramento e Debug

### Estatísticas do Cache

```typescript
import { cacheUtils } from '@/lib/api-cache';

const stats = cacheUtils.getStats();
console.log({
  hits: stats.hits,
  misses: stats.misses,
  hitRate: stats.hitRate,
  size: stats.size
});
```

### Logs de Debug

```typescript
// Habilitar logs detalhados em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('Cache miss for key:', key);
  console.log('Fetching fresh data...');
}
```

### Métricas de Performance

- **Hit Rate**: Porcentagem de requisições atendidas pelo cache
- **Miss Rate**: Porcentagem de requisições que precisaram buscar dados
- **Average Response Time**: Tempo médio de resposta
- **Cache Size**: Número de entradas no cache
- **Memory Usage**: Uso de memória do cache

## Boas Práticas

### 1. Escolha do TTL

- **Dados em tempo real**: 15-30 segundos
- **Dados frequentes**: 1-5 minutos
- **Dados estáticos**: 15-30 minutos
- **Configurações**: 1+ horas

### 2. Uso de Tags

```typescript
// Agrupar caches relacionados com tags
apiCache.set('user-profile', data, { 
  tags: ['user', 'profile'] 
});

// Invalidar por grupo
apiCache.invalidateByTags(['user']);
```

### 3. Error Handling

```typescript
const { data, error } = useIntelligentCache(
  key,
  fetcher,
  {
    onError: (error) => {
      // Log error
      console.error('Cache error:', error);
      
      // Report to monitoring service
      reportError(error);
    }
  }
);
```

### 4. Cleanup

```typescript
useEffect(() => {
  return () => {
    // Cleanup subscriptions
    rouletteCacheUtils.cleanup();
  };
}, []);
```

## Troubleshooting

### Problemas Comuns

1. **Cache não está funcionando**
   - Verificar se TTL não é muito baixo
   - Confirmar que chaves são consistentes
   - Verificar se dados não estão sendo invalidados prematuramente

2. **Performance ruim**
   - Verificar hit rate do cache
   - Ajustar TTL conforme necessário
   - Considerar pré-carregamento de dados críticos

3. **Dados desatualizados**
   - Verificar configuração de stale-while-revalidate
   - Ajustar intervalo de refresh em background
   - Implementar invalidação manual quando necessário

4. **Memory leaks**
   - Verificar se subscriptions estão sendo limpas
   - Confirmar que cache tem limite de tamanho
   - Implementar limpeza automática de entradas antigas

### Ferramentas de Debug

1. **CacheManager Component**: Interface visual para monitorar cache
2. **Browser DevTools**: Verificar network requests
3. **Console Logs**: Logs detalhados em desenvolvimento
4. **Performance Profiler**: Medir impacto na performance

## Roadmap

### Próximas Funcionalidades

- [ ] Cache persistente (localStorage/IndexedDB)
- [ ] Sincronização entre abas
- [ ] Compressão de dados em cache
- [ ] Cache distribuído (Redis)
- [ ] Métricas avançadas de performance
- [ ] A/B testing de estratégias de cache
- [ ] Cache warming automático
- [ ] Invalidação inteligente baseada em ML

### Melhorias de Performance

- [ ] Web Workers para operações pesadas
- [ ] Service Worker para cache offline
- [ ] HTTP/2 Server Push integration
- [ ] GraphQL cache integration
- [ ] Edge caching (CDN)

## Conclusão

O sistema de cache inteligente do SOFIA fornece uma base sólida para otimização de performance, com estratégias flexíveis e ferramentas de monitoramento avançadas. A implementação modular permite fácil extensão e customização conforme as necessidades da aplicação evoluem.