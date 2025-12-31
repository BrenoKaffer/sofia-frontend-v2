// Jest setup file
import '@testing-library/jest-dom';

// Polyfills for Web APIs
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body;
    }
  };
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
    }
    
    async json() {
      return JSON.parse(this.body);
    }
    
    async text() {
      return this.body;
    }
  };
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value);
        });
      }
    }
    
    get(name) {
      return this._headers.get(name.toLowerCase());
    }
    
    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }
    
    has(name) {
      return this._headers.has(name.toLowerCase());
    }
  };
}

if (typeof URL === 'undefined') {
  global.URL = class URL {
    constructor(url, base) {
      this.href = url;
      this.searchParams = new URLSearchParams();
    }
  };
}

if (typeof URLSearchParams === 'undefined') {
  global.URLSearchParams = class URLSearchParams {
    constructor(init = '') {
      this._params = new Map();
    }
    
    get(name) {
      return this._params.get(name);
    }
    
    set(name, value) {
      this._params.set(name, value);
    }
  };
}

// Mock Next.js NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      json: () => Promise.resolve(data),
      status: init.status || 200,
      headers: new Headers(init.headers || {}),
      ok: (init.status || 200) >= 200 && (init.status || 200) < 300
    })),
    redirect: jest.fn((url, status = 302) => ({
      status,
      headers: new Headers({ Location: url })
    }))
  }
}));

// Mock Supabase client to avoid network calls in tests
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = () => ({
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn().mockResolvedValue({ data: [], error: null }),
    upsert: jest.fn().mockResolvedValue({ data: [], error: null }),
    update: jest.fn().mockResolvedValue({ data: [], error: null }),
    delete: jest.fn().mockResolvedValue({ data: [], error: null }),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
  });
  const mockClient = {
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    from: jest.fn(mockFrom),
    auth: {
      admin: {
        createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user', user_metadata: {} } }, error: null }),
        deleteUser: jest.fn().mockResolvedValue({ data: null, error: null }),
        listUsers: jest.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      },
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null }),
    },
  };
  return {
    createClient: jest.fn(() => mockClient),
    SupabaseClient: class {},
  };
});

// Mock project Supabase helpers
jest.mock('@/lib/supabase', () => {
  const mockFrom = () => ({
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn().mockResolvedValue({ data: [], error: null }),
    upsert: jest.fn().mockResolvedValue({ data: [], error: null }),
    update: jest.fn().mockResolvedValue({ data: [], error: null }),
    delete: jest.fn().mockResolvedValue({ data: [], error: null }),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
  });
  const mockClient = {
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    from: jest.fn(mockFrom),
    auth: {
      admin: {
        createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user', user_metadata: {} } }, error: null }),
        deleteUser: jest.fn().mockResolvedValue({ data: null, error: null }),
        listUsers: jest.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      },
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null }),
    },
  };
  return {
    getSupabaseClient: () => mockClient,
    supabase: mockClient,
    createServerClient: () => mockClient,
  };
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock sistema de autenticação customizado
jest.mock('@/lib/auth-server', () => ({
  auth: jest.fn(() => Promise.resolve({
    userId: 'test-user-id',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    },
    isAuthenticated: true
  })),
  requireAuth: jest.fn(() => Promise.resolve({
    userId: 'test-user-id',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    },
    isAuthenticated: true
  }))
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Environment variables for testing
process.env.BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';
process.env.BACKEND_API_KEY = process.env.BACKEND_API_KEY || process.env.TEST_BACKEND_API_KEY || ''

// Global test timeout
jest.setTimeout(30000);

// Suppress console warnings during tests
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalWarn;
  console.error = originalError;
  jest.clearAllMocks();
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock TextEncoder/TextDecoder
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str) {
      return new Uint8Array(str.split('').map(char => char.charCodeAt(0)));
    }
  };
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(bytes) {
      return String.fromCharCode(...bytes);
    }
  };
}

// Mock performance.now
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  };
}

// Cleanup after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset localStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Reset sessionStorage
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});
