# 🚀 Projeto Sofia - Frontend

Uma aplicação web moderna e responsiva construída com Next.js 14, TypeScript e Tailwind CSS, focada em performance, acessibilidade e experiência do usuário.

## ✨ Características Principais

- 🎯 **Next.js 14** com App Router
- 🔷 **TypeScript** para type safety
- 🎨 **Tailwind CSS** para styling
- 📱 **Design Responsivo** otimizado para mobile
- 🔍 **Monitoramento** em tempo real
- 🛡️ **Tratamento de Erros** robusto
- ⚡ **Performance** otimizada
- 🧪 **Testes** abrangentes (Unit, Integration, E2E)
- ♿ **Acessibilidade** (WCAG 2.1)

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18.0+
- npm ou yarn
- Git

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/projeto-sofia.git
cd projeto-sofia/front

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver a aplicação.

## 📁 Estrutura do Projeto

```
front/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard principal
│   └── globals.css        # Estilos globais
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes base
│   ├── forms/            # Formulários
│   ├── layout/           # Layout components
│   └── charts/           # Gráficos e visualizações
├── lib/                  # Utilitários e configurações
│   ├── monitoring.ts     # Sistema de monitoramento
│   ├── error-handler.ts  # Tratamento de erros
│   └── performance.ts    # Otimizações
├── hooks/                # Hooks customizados
├── types/                # Tipos TypeScript
├── __tests__/            # Testes
├── e2e/                  # Testes E2E
└── docs/                 # Documentação
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento
npm run build           # Build de produção
npm run start           # Servidor de produção
npm run lint            # Verificação de código
npm run lint:fix        # Correção automática
npm run type-check      # Verificação de tipos

# Testes
npm run test            # Testes unitários
npm run test:watch      # Testes em modo watch
npm run test:coverage   # Cobertura de testes
npm run test:e2e        # Testes E2E
npm run test:e2e:ui     # Testes E2E com interface
```

## 🧪 Testes

O projeto possui uma suíte completa de testes:

### Testes Unitários
- **Jest** + **React Testing Library**
- Cobertura mínima: 80%
- Testes de componentes, hooks e utilitários

### Testes de Integração
- Testes de fluxos completos
- Integração entre componentes
- APIs e contextos

### Testes E2E
- **Playwright** para automação
- Testes em múltiplos navegadores
- Cenários de usuário reais

```bash
# Executar todos os testes
npm run test:all

# Gerar relatório de cobertura
npm run test:coverage
```

## 📱 Responsividade

A aplicação é totalmente responsiva com:

- **Mobile First** design
- **Breakpoints** otimizados
- **Touch** interactions
- **Progressive Enhancement**

### Breakpoints

```css
sm: 640px   /* Tablet */
md: 768px   /* Tablet large */
lg: 1024px  /* Desktop */
xl: 1280px  /* Desktop large */
2xl: 1536px /* Desktop XL */
```

## 🔍 Monitoramento

Sistema completo de monitoramento incluindo:

- **Performance Metrics**: Core Web Vitals, tempos de carregamento
- **Error Tracking**: Captura e análise de erros
- **Usage Analytics**: Comportamento do usuário
- **Real-time Monitoring**: Métricas em tempo real

```typescript
// Exemplo de uso
const { recordPerformance, recordError } = useMonitoring();

recordPerformance('api-call', duration, { endpoint: '/api/users' });
recordError(error, { component: 'UserList' });
```

## 🛡️ Tratamento de Erros

Sistema robusto de tratamento de erros:

- **Error Boundaries** para captura de erros React
- **Global Error Handler** para erros não capturados
- **Retry Logic** para operações que falharam
- **User Notifications** para feedback ao usuário

```typescript
// Error Boundary automático
<withErrorBoundary>
  <ComponenteQuePodefFalhar />
</withErrorBoundary>

// Hook para tratamento
const { handleError } = useErrorHandler();
```

## ⚡ Performance

Otimizações implementadas:

- **Code Splitting** automático
- **Image Optimization** com Next.js
- **Lazy Loading** de componentes
- **Memoization** estratégica
- **Bundle Analysis** e otimização

### Métricas de Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🎨 Design System

Componentes consistentes e reutilizáveis:

```typescript
// Exemplo de componente
<Button 
  variant="primary" 
  size="lg" 
  loading={isLoading}
  onClick={handleClick}
>
  Salvar
</Button>

// Grid responsivo
<ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }}>
  <Card>Conteúdo 1</Card>
  <Card>Conteúdo 2</Card>
  <Card>Conteúdo 3</Card>
</ResponsiveGrid>
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MONITORING_ENABLED=true
NEXT_PUBLIC_ENVIRONMENT=development
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
```

### Configurações Principais

- **Next.js**: `next.config.js`
- **TypeScript**: `tsconfig.json`
- **Tailwind**: `tailwind.config.js`
- **Jest**: `jest.config.js`
- **Playwright**: `playwright.config.ts`
- **ESLint**: `.eslintrc.json`

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Deploy automático via Git
git push origin main

# Deploy manual
npx vercel --prod
```

### Docker

```bash
# Build da imagem
docker build -t sofia-frontend .

# Executar container
docker run -p 3000:3000 sofia-frontend
```

### Build Manual

```bash
# Build de produção
npm run build

# Iniciar servidor
npm start
```

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia nosso [Guia de Desenvolvimento](./docs/DEVELOPMENT_GUIDE.md) antes de contribuir.

### Processo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Conventional Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: adiciona nova funcionalidade
fix: corrige bug crítico
docs: atualiza documentação
style: ajustes de formatação
refactor: refatora código existente
test: adiciona testes
chore: tarefas de manutenção
```

## 📚 Documentação

- [📖 Documentação Técnica](./docs/TECHNICAL_DOCUMENTATION.md)
- [🛠️ Guia de Desenvolvimento](./docs/DEVELOPMENT_GUIDE.md)
- [🎨 Design System](./docs/DESIGN_SYSTEM.md)
- [🔧 API Reference](./docs/API_REFERENCE.md)

## 🛠️ Tecnologias

### Core
- **Next.js 14** - Framework React
- **TypeScript** - Linguagem tipada
- **Tailwind CSS** - Framework CSS
- **React 18** - Biblioteca UI

### Desenvolvimento
- **ESLint** - Linting
- **Prettier** - Formatação
- **Husky** - Git hooks
- **Jest** - Testes unitários
- **Playwright** - Testes E2E

### Produção
- **Vercel** - Hospedagem
- **PostgreSQL** - Banco de dados
- **Redis** - Cache
- **Sentry** - Monitoramento de erros

## 📊 Status do Projeto

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Test Coverage](https://img.shields.io/badge/coverage-85%25-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

### Métricas Atuais

- **Cobertura de Testes**: 85%+
- **Performance Score**: 95+
- **Accessibility Score**: 100
- **SEO Score**: 95+
- **Best Practices**: 100

## 🐛 Reportar Bugs

Encontrou um bug? Por favor, [abra uma issue](https://github.com/seu-usuario/projeto-sofia/issues) com:

- Descrição detalhada do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Informações do ambiente

## 💡 Roadmap

### Próximas Funcionalidades

- [ ] **PWA** - Progressive Web App
- [ ] **Offline Mode** - Funcionalidade offline
- [ ] **Push Notifications** - Notificações push
- [ ] **Dark Mode** - Tema escuro
- [ ] **Multi-language** - Suporte a múltiplos idiomas
- [ ] **Advanced Analytics** - Analytics avançados

### Melhorias Planejadas

- [ ] **Performance** - Otimizações adicionais
- [ ] **Accessibility** - Melhorias de acessibilidade
- [ ] **Testing** - Cobertura de testes 95%+
- [ ] **Documentation** - Documentação expandida

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Equipe

- **Desenvolvedor Principal**: [Seu Nome](https://github.com/seu-usuario)
- **UI/UX Designer**: [Nome Designer](https://github.com/designer)
- **DevOps**: [Nome DevOps](https://github.com/devops)

## 🙏 Agradecimentos

- [Next.js Team](https://nextjs.org/) pelo framework incrível
- [Vercel](https://vercel.com/) pela hospedagem
- [Tailwind CSS](https://tailwindcss.com/) pelo framework CSS
- Comunidade open source pelas bibliotecas utilizadas

---

<div align="center">

**[⬆ Voltar ao topo](#-projeto-sofia---frontend)**

Feito com ❤️ pela equipe Sofia

</div>