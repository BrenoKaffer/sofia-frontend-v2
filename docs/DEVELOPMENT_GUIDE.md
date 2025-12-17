# Guia de Desenvolvimento - Projeto Sofia

## 🚀 Início Rápido

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18.0 ou superior)
- **npm** ou **yarn** (recomendamos npm)
- **Git** para controle de versão
- **VS Code** (recomendado) com extensões:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - TypeScript Importer
  - Prettier - Code formatter
  - ESLint

### Configuração do Ambiente

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/projeto-sofia.git
cd projeto-sofia/front
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Acesse a aplicação**
```
http://localhost:3000
```

## 📁 Estrutura do Projeto

### Organização de Pastas

```
front/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Grupo de rotas de autenticação
│   │   ├── login/         # Página de login
│   │   └── register/      # Página de registro
│   ├── api/               # API Routes
│   │   ├── metrics/       # Endpoint de métricas
│   │   └── auth/          # Endpoints de autenticação
│   ├── dashboard/         # Páginas do dashboard
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout raiz
│   └── page.tsx           # Página inicial
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes base (Button, Input, etc.)
│   ├── forms/            # Componentes de formulário
│   ├── layout/           # Componentes de layout
│   └── charts/           # Componentes de gráficos
├── lib/                  # Utilitários e configurações
│   ├── monitoring.ts     # Sistema de monitoramento
│   ├── error-handler.ts  # Tratamento de erros
│   ├── performance.ts    # Otimizações de performance
│   └── utils.ts          # Utilitários gerais
├── hooks/                # Hooks customizados
├── types/                # Definições de tipos TypeScript
├── __tests__/            # Testes
└── docs/                 # Documentação
```

### Convenções de Nomenclatura

#### Arquivos e Pastas
- **Componentes**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useUserData.ts`)
- **Utilitários**: camelCase (`formatDate.ts`)
- **Páginas**: kebab-case (`user-profile/page.tsx`)
- **Tipos**: PascalCase (`UserTypes.ts`)

#### Código
```typescript
// ✅ Bom
export interface UserProfileProps {
  userId: string;
  showAvatar?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  showAvatar = true
}) => {
  // Implementação
};

// ❌ Evitar
export interface userProfileProps {
  user_id: string;
  ShowAvatar?: boolean;
}
```

## 🧩 Desenvolvimento de Componentes

### Template de Componente

```typescript
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick
}) => {
  // Hooks
  const [isLoading, setIsLoading] = React.useState(false);

  // Event handlers
  const handleClick = React.useCallback(() => {
    if (disabled || isLoading) return;
    onClick?.();
  }, [disabled, isLoading, onClick]);

  // Render
  return (
    <button
      className={cn(
        'base-styles',
        {
          'variant-primary': variant === 'primary',
          'variant-secondary': variant === 'secondary',
          'size-sm': size === 'sm',
          'size-md': size === 'md',
          'size-lg': size === 'lg',
          'disabled': disabled
        },
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      data-testid="component-name"
    >
      {children}
    </button>
  );
};
```

### Boas Práticas para Componentes

#### 1. Props Interface
```typescript
// ✅ Sempre defina interface para props
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// ✅ Use valores padrão
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  ...props
}) => {
  // Implementação
};
```

#### 2. Composição vs Herança
```typescript
// ✅ Prefira composição
const Card = ({ children, className }) => (
  <div className={cn('card-base', className)}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="card-header">
    {children}
  </div>
);

// Uso
<Card>
  <CardHeader>Título</CardHeader>
  <CardContent>Conteúdo</CardContent>
</Card>
```

#### 3. Forwarding Refs
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="input-wrapper">
        {label && <label>{label}</label>}
        <input
          ref={ref}
          className={cn('input-base', className)}
          {...props}
        />
        {error && <span className="error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

## 🎣 Hooks Customizados

### Template de Hook

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseCustomHookOptions {
  initialValue?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseCustomHookReturn {
  data: any;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useCustomHook = (
  options: UseCustomHookOptions = {}
): UseCustomHookReturn => {
  const { initialValue, onSuccess, onError } = options;
  
  // State
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Functions
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Lógica do hook
      const result = await someAsyncOperation();
      
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};
```

### Hooks Disponíveis

#### useBreakpoint
```typescript
const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();

// Uso condicional
if (isMobile) {
  return <MobileComponent />;
}
```

#### usePerformance
```typescript
const {
  memoizedValue,
  debouncedValue,
  throttledFunction
} = usePerformance();
```

#### useMonitoring
```typescript
const { recordPerformance, recordError, recordUsage } = useMonitoring();

// Registrar métricas
recordPerformance('api-call', duration, { endpoint: '/api/users' });
recordError(error, { component: 'UserList' });
recordUsage('button-click', { action: 'save' });
```

## 🎨 Styling com Tailwind CSS

### Configuração de Classes

```typescript
// Usando cn() para combinar classes condicionalmente
const buttonClasses = cn(
  // Classes base
  'px-4 py-2 rounded-lg font-medium transition-colors',
  
  // Classes condicionais
  {
    'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
    'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
    'opacity-50 cursor-not-allowed': disabled,
  },
  
  // Classes responsivas
  'text-sm sm:text-base lg:text-lg',
  
  // Classes customizadas
  className
);
```

### Padrões de Design

#### Cores
```css
/* Paleta principal */
primary: blue-600
secondary: gray-600
success: green-600
warning: yellow-600
danger: red-600

/* Tons de cinza */
gray-50, gray-100, gray-200, ..., gray-900
```

#### Espaçamento
```css
/* Escala de espaçamento */
1 = 0.25rem (4px)
2 = 0.5rem (8px)
4 = 1rem (16px)
6 = 1.5rem (24px)
8 = 2rem (32px)
```

#### Breakpoints
```css
sm: 640px   /* Tablet */
md: 768px   /* Tablet large */
lg: 1024px  /* Desktop */
xl: 1280px  /* Desktop large */
2xl: 1536px /* Desktop extra large */
```

## 🧪 Testes

### Estrutura de Testes

```
__tests__/
├── components/           # Testes de componentes
│   ├── ui/              # Componentes base
│   └── forms/           # Componentes de formulário
├── hooks/               # Testes de hooks
├── lib/                 # Testes de utilitários
├── integration/         # Testes de integração
└── e2e/                 # Testes end-to-end
```

### Template de Teste de Componente

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentName } from '@/components/ComponentName';

// Mock de dependências se necessário
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.join(' '))
}));

describe('ComponentName', () => {
  // Setup comum
  const defaultProps = {
    children: 'Test content',
    onClick: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ComponentName {...defaultProps} />);
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
      expect(screen.getByTestId('component-name')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <ComponentName {...defaultProps} className="custom-class" />
      );
      
      expect(screen.getByTestId('component-name')).toHaveClass('custom-class');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      render(<ComponentName {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('component-name'));
      
      expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      render(<ComponentName {...defaultProps} disabled />);
      
      fireEvent.click(screen.getByTestId('component-name'));
      
      expect(defaultProps.onClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      render(<ComponentName {...defaultProps} />);
      
      const element = screen.getByTestId('component-name');
      expect(element).toBeVisible();
      expect(element).not.toHaveAttribute('aria-hidden', 'true');
    });
  });
});
```

### Template de Teste de Hook

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCustomHook } from '@/hooks/useCustomHook';

describe('useCustomHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useCustomHook());
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle async operations', async () => {
    const { result } = renderHook(() => useCustomHook());
    
    act(() => {
      result.current.refetch();
    });
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### Comandos de Teste

```bash
# Executar todos os testes
npm run test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage

# Executar testes E2E
npm run test:e2e

# Executar testes E2E em modo UI
npm run test:e2e:ui
```

## 🚀 Performance

### Otimizações Implementadas

#### 1. Code Splitting
```typescript
// Lazy loading de componentes
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// Uso com Suspense
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

#### 2. Memoization
```typescript
// React.memo para componentes puros
export const PureComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// useMemo para cálculos custosos
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// useCallback para funções
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);
```

#### 3. Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Monitoramento de Performance

```typescript
// Usar hook de monitoramento
const { recordPerformance } = useMonitoring();

// Medir performance de operações
const startTime = performance.now();
await someOperation();
const duration = performance.now() - startTime;

recordPerformance('operation-name', duration, {
  component: 'ComponentName',
  userId: user.id
});
```

## 🔧 Debugging

### Ferramentas de Debug

#### 1. React Developer Tools
- Instalar extensão do browser
- Inspecionar componentes e props
- Profiler para performance

#### 2. Next.js Debugger
```bash
# Modo debug
NODE_OPTIONS='--inspect' npm run dev
```

#### 3. Console Debugging
```typescript
// Debug condicional
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// Debug com contexto
console.group('Component Render');
console.log('Props:', props);
console.log('State:', state);
console.groupEnd();
```

### Logs Estruturados

```typescript
import { logger } from '@/lib/logger';

// Log com contexto
logger.info('User action', {
  userId: user.id,
  action: 'button-click',
  component: 'UserProfile',
  timestamp: new Date().toISOString(),
  metadata: {
    userAgent: navigator.userAgent,
    url: window.location.href
  }
});
```

## 📦 Build e Deploy

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linting
npm run lint:fix     # Fix automático de lint
npm run type-check   # Verificação de tipos
```

### Processo de Build

1. **Type checking**: Verificação de tipos TypeScript
2. **Linting**: ESLint para qualidade de código
3. **Testing**: Execução de todos os testes
4. **Building**: Compilação para produção
5. **Optimization**: Minificação e otimizações

### Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MONITORING_ENABLED=true
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
```

## 🤝 Contribuição

### Workflow de Desenvolvimento

1. **Fork** do repositório
2. **Clone** do seu fork
3. **Criar branch** feature (`git checkout -b feature/nova-funcionalidade`)
4. **Implementar** mudanças com testes
5. **Commit** seguindo conventional commits
6. **Push** para seu fork
7. **Criar Pull Request**

### Conventional Commits

```bash
# Tipos de commit
feat:     # Nova funcionalidade
fix:      # Correção de bug
docs:     # Documentação
style:    # Formatação (não afeta lógica)
refactor: # Refatoração
test:     # Testes
chore:    # Tarefas de build/config

# Exemplos
feat: adiciona componente de navegação mobile
fix: corrige bug no sistema de monitoramento
docs: atualiza guia de desenvolvimento
test: adiciona testes para error handler
```

### Code Review Checklist

- [ ] Código segue padrões estabelecidos
- [ ] Testes implementados e passando
- [ ] Documentação atualizada
- [ ] Performance considerada
- [ ] Acessibilidade verificada
- [ ] Responsividade testada
- [ ] Sem console.logs em produção

## 📚 Recursos Adicionais

### Documentação
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Ferramentas Úteis
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [TypeScript Importer](https://marketplace.visualstudio.com/items?itemName=pmneo.tsimporter)

### Comunidade
- **Slack**: #sofia-dev
- **GitHub Discussions**: Para discussões técnicas
- **Issues**: Para bugs e feature requests

---

## 🆘 Suporte

Se você encontrar problemas ou tiver dúvidas:

1. **Verifique a documentação** técnica
2. **Procure em issues** existentes no GitHub
3. **Pergunte no Slack** #sofia-dev
4. **Crie uma issue** se necessário

---

*Guia atualizado em: Dezembro 2024*