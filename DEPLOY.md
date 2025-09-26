# 🚀 Guia de Deploy - Sofia Trading Bot

Este documento contém instruções completas para deploy e configuração de CI/CD do Sofia Trading Bot.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta na Vercel
- Conta no Supabase
- Conta no Clerk (para autenticação)
- Repositório Git configurado

## 🔧 Configuração de Ambiente

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` com as seguintes variáveis:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Backend API
NEXT_PUBLIC_BACKEND_URL=your_backend_url

# API Keys (para autenticação de API)
API_SECRET_KEY=your_api_secret_key
JWT_SECRET=your_jwt_secret

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret
```

### 2. Configuração do Banco de Dados

Execute as migrações do Supabase:

```sql
-- Criar tabela de API keys
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions JSONB DEFAULT '[]',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);
```

## 🌐 Deploy na Vercel

### 1. Deploy Manual

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login na Vercel
vercel login

# Deploy
vercel --prod
```

### 2. Deploy Automático (CI/CD)

#### Configuração do GitHub

1. **Secrets do Repositório:**
   - `VERCEL_TOKEN`: Token da Vercel
   - `VERCEL_ORG_ID`: ID da organização
   - `VERCEL_PROJECT_ID`: ID do projeto
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima do Supabase
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Chave pública do Clerk
   - `CLERK_SECRET_KEY`: Chave secreta do Clerk
   - `NEXT_PUBLIC_BACKEND_URL`: URL do backend

2. **Workflow Automático:**
   - Push para `main` → Deploy em produção
   - Push para `develop` → Deploy em staging
   - Pull Request → Deploy de preview

#### Configuração da Vercel

1. **Variáveis de Ambiente:**
   ```bash
   # Production
   NEXT_PUBLIC_SUPABASE_URL=prod_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_supabase_key
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=prod_clerk_key
   CLERK_SECRET_KEY=prod_clerk_secret
   NEXT_PUBLIC_BACKEND_URL=prod_backend_url
   
   # Preview/Development
   NEXT_PUBLIC_SUPABASE_URL=dev_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=dev_supabase_key
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=dev_clerk_key
   CLERK_SECRET_KEY=dev_clerk_secret
   NEXT_PUBLIC_BACKEND_URL=dev_backend_url
   ```

2. **Configurações de Build:**
   - Framework: Next.js
   - Build Command: `npm run ci:build`
   - Install Command: `npm ci --legacy-peer-deps`
   - Output Directory: `.next`

## 🔍 Monitoramento e Health Checks

### 1. Health Check Endpoint

```bash
# Verificar saúde do sistema
curl https://your-domain.vercel.app/api/system/health
```

### 2. Monitoramento Automático

O sistema inclui:
- Health checks automáticos a cada 30 segundos
- Monitoramento de serviços (Database, Backend, Cache, Auth)
- Métricas de performance em tempo real
- Dashboard de monitoramento em `/monitoring`

### 3. Alertas e Notificações

Configure alertas para:
- Falhas de deploy
- Health checks falhando
- Erros de API
- Performance degradada

## 🛠️ Scripts de Desenvolvimento

```bash
# Desenvolvimento
npm run dev

# Build e teste
npm run ci:build
npm run ci:test

# Type checking
npm run type-check

# Health check local
npm run health-check

# Deploy manual
npm run deploy:preview    # Preview
npm run deploy:production # Produção
```

## 🔐 Segurança

### 1. API Keys

- Todas as API keys são hasheadas antes do armazenamento
- Suporte a permissões granulares
- Expiração automática configurável
- Rate limiting por API key

### 2. Autenticação

- JWT tokens para APIs
- Session-based auth para UI
- Middleware de autenticação automático
- Proteção CSRF

### 3. Headers de Segurança

```javascript
// Configurado automaticamente via vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

## 📊 Performance

### 1. Otimizações Implementadas

- Code splitting automático
- Image optimization
- Static generation onde possível
- Edge functions para APIs críticas
- Caching estratégico

### 2. Métricas Monitoradas

- Core Web Vitals
- Tempo de resposta de APIs
- Uso de memória
- Taxa de erro
- Uptime

## 🚨 Troubleshooting

### 1. Problemas Comuns

**Build Failures:**
```bash
# Limpar cache e reinstalar
rm -rf .next node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

**Health Check Failures:**
```bash
# Verificar logs
vercel logs your-deployment-url

# Testar localmente
npm run dev
npm run health-check
```

**Environment Variables:**
```bash
# Verificar variáveis
vercel env ls

# Adicionar variável
vercel env add VARIABLE_NAME
```

### 2. Logs e Debugging

```bash
# Logs da Vercel
vercel logs

# Logs em tempo real
vercel logs --follow

# Logs de uma função específica
vercel logs --function=api/system/health
```

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar logs de deploy na Vercel
2. Consultar dashboard de monitoramento
3. Verificar status dos serviços externos
4. Revisar configurações de ambiente

---

**Última atualização:** $(date)
**Versão:** 1.0.0