import { SmartCache, useSmartCache, createApiCache, cacheMiddleware } from '@/lib/cache';
import { renderHook } from '@testing-library/react';

// Mock do localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

// Mock do performance.now
const mockPerformanceNow = jest.fn();
global.performance.now = mockPerformanceNow;

describe('SmartCache', () => {
  let cache: SmartCache;

  beforeEach(() => {
    cache = new SmartCache({ maxSize: 3, ttl: 1000 });
    mockPerformanceNow.mockReturnValue(1000);
    jest.clearAllMocks();
  });

  describe('set e get', () => {
    it('deve armazenar e recuperar valores', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('deve retornar undefined para chaves inexistentes', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('deve sobrescrever valores existentes', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });
  });

  describe('TTL (Time To Live)', () => {
    it('deve expirar itens após TTL', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      // Simular passagem do tempo
      mockPerformanceNow.mockReturnValue(2500);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('deve permitir TTL customizado por item', () => {
      cache.set('key1', 'value1', 500); // TTL menor
      cache.set('key2', 'value2'); // TTL padrão

      mockPerformanceNow.mockReturnValue(1600);
      expect(cache.get('key1')).toBeUndefined(); // Expirado
      expect(cache.get('key2')).toBe('value2'); // Ainda válido
    });
  });

  describe('LRU (Least Recently Used)', () => {
    it('deve remover item menos usado quando atingir maxSize', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Cache está cheio, próximo set deve remover key1
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('deve atualizar ordem de uso ao acessar item', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Acessar key1 para torná-la mais recente
      cache.get('key1');
      
      // Adicionar novo item deve remover key2 (menos recente)
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
  });

  describe('has', () => {
    it('deve verificar existência de chaves corretamente', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('deve retornar false para itens expirados', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);

      mockPerformanceNow.mockReturnValue(2500);
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('deve remover itens corretamente', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      
      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('clear', () => {
    it('deve limpar todo o cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.clear();
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('size', () => {
    it('deve retornar tamanho correto do cache', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('getStats', () => {
    it('deve retornar estatísticas corretas', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('nonexistent'); // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.size).toBe(1);
    });
  });

  describe('persistência', () => {
    it('deve salvar no localStorage quando configurado', () => {
      const persistentCache = new SmartCache({ 
        maxSize: 3, 
        ttl: 1000, 
        persistent: true,
        storageKey: 'test-cache'
      });
      
      persistentCache.set('key1', 'value1');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'test-cache',
        expect.stringContaining('key1')
      );
    });

    it('deve carregar do localStorage na inicialização', () => {
      const mockData = JSON.stringify({
        key1: { value: 'value1', timestamp: 1000, ttl: 1000 }
      });
      mockLocalStorage.getItem.mockReturnValue(mockData);
      
      const persistentCache = new SmartCache({ 
        maxSize: 3, 
        ttl: 1000, 
        persistent: true,
        storageKey: 'test-cache'
      });
      
      expect(persistentCache.get('key1')).toBe('value1');
    });
  });
});

describe('useSmartCache', () => {
  it('deve retornar instância do cache', () => {
    const { result } = renderHook(() => useSmartCache());
    
    expect(result.current.cache).toBeInstanceOf(SmartCache);
    expect(typeof result.current.invalidatePattern).toBe('function');
    expect(typeof result.current.preload).toBe('function');
  });
});

describe('createApiCache', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('deve cachear respostas de API', async () => {
    const mockResponse = { data: 'test' };
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
      clone: () => ({
        json: () => Promise.resolve(mockResponse)
      })
    });

    const cachedFetch = createApiCache();
    
    // Primeira chamada
    const result1 = await cachedFetch('/api/test');
    expect(result1).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    // Segunda chamada deve usar cache
    const result2 = await cachedFetch('/api/test');
    expect(result2).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Não deve chamar fetch novamente
  });

  it('deve invalidar cache por padrão', async () => {
    const mockResponse1 = { data: 'test1' };
    const mockResponse2 = { data: 'test2' };
    const mockFetch = global.fetch as jest.Mock;
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse1),
        clone: () => ({ json: () => Promise.resolve(mockResponse1) })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse2),
        clone: () => ({ json: () => Promise.resolve(mockResponse2) })
      });

    const cachedFetch = createApiCache();
    
    await cachedFetch('/api/test');
    
    // Invalidar cache
    cachedFetch.invalidatePattern('/api/test');
    
    const result = await cachedFetch('/api/test');
    expect(result).toEqual(mockResponse2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('cacheMiddleware', () => {
  it('deve criar middleware de cache para Next.js', () => {
    const middleware = cacheMiddleware({
      patterns: ['/api/data'],
      ttl: 300000
    });
    
    expect(typeof middleware).toBe('function');
  });

  it('deve processar request corretamente', () => {
    const middleware = cacheMiddleware({
      patterns: ['/api/data'],
      ttl: 300000
    });
    
    const mockRequest = {
      nextUrl: { pathname: '/api/data' },
      method: 'GET'
    };
    
    // Verificar se não gera erro
    expect(() => {
      middleware(mockRequest as any);
    }).not.toThrow();
  });
});
