# 🔐 Sistema de Status de Usuário - Projeto Sofia

## 📋 Visão Geral

O sistema de status de usuário foi implementado para fornecer controle granular sobre o acesso dos usuários à plataforma, substituindo o campo de texto simples `account_status` por um sistema robusto baseado em ENUM com validações, auditoria e controles de acesso.

## 🎯 Status Disponíveis

### ✅ **Status com Acesso Liberado**
- **`active`** - Usuário ativo com acesso completo
- **`free`** - Usuário gratuito com acesso básico  
- **`premium`** - Usuário premium com acesso completo
- **`trial`** - Usuário em período de teste premium
- **`admin`** - Administrador com acesso completo ao sistema
- **`superadmin`** - Super administrador com acesso total

### ❌ **Status com Acesso Negado**
- **`blocked`** - Usuário bloqueado temporariamente
- **`suspended`** - Usuário suspenso por violação
- **`banned`** - Usuário banido permanentemente

### ⏸️ **Status com Acesso Limitado**
- **`inactive`** - Usuário inativo (requer reativação)
- **`pending`** - Usuário pendente de verificação

## 📁 Arquivos Criados

### 1. **SQL Schema** (`sql/user_account_status_enum.sql`)
```sql
-- Cria ENUM, altera tabela, funções auxiliares, views, índices e triggers
CREATE TYPE public.account_status_enum AS ENUM (
    'active', 'free', 'premium', 'trial',
    'blocked', 'suspended', 'banned', 
    'inactive', 'pending', 'admin', 'superadmin'
);
```

### 2. **Utilitários TypeScript** (`lib/user-status.ts`)
- Enum TypeScript espelhando o PostgreSQL
- Funções de validação (`userHasAccess`, `userIsBlocked`, `userIsAdmin`, `userIsSuperAdmin`, etc.)
- Configurações de status com metadados
- Validação de transições de status
- Interface para mudanças de status

### 3. **Componentes React** (`components/admin/UserStatusSelect.tsx`)
- `UserStatusSelect` - Seletor de status com validação
- `UserStatusBadge` - Badge visual para exibir status
- `StatusChangeHistory` - Histórico de mudanças

### 4. **Hooks React** (`hooks/useUserStatus.ts`)
- `useUserStatus` - Gerenciamento completo de status
- `useCurrentUserStatus` - Status do usuário logado
- Integração com Supabase
- Funções de estatísticas e busca

### 5. **Middleware Atualizado** (`middleware.ts`)
- Verificação automática de status em todas as rotas
- Redirecionamentos baseados em status
- Headers com informações do usuário
- Proteção de rotas premium, admin e superadmin
- Rotas específicas para diferentes níveis de acesso

## 🔧 Como Usar

### 1. **Executar o Script SQL**
```bash
# No Supabase SQL Editor, execute:
sql/user_account_status_enum.sql
```

### 2. **Importar Utilitários**
```typescript
import { 
  AccountStatus, 
  userHasAccess, 
  userIsBlocked,
  userIsAdmin,
  userIsSuperAdmin,
  getStatusConfig 
} from '@/lib/user-status';

// Verificar acesso
const hasAccess = userHasAccess(user.account_status);

// Verificar se é administrador
const isAdmin = userIsAdmin(user.account_status);

// Verificar se é super administrador
const isSuperAdmin = userIsSuperAdmin(user.account_status);
```
// Obter configuração do status
const config = getStatusConfig(user.account_status);
console.log(config.label, config.icon, config.color);
```

### 3. **Usar Componentes**
```tsx
import { UserStatusSelect, UserStatusBadge } from '@/components/admin/UserStatusSelect';

// Seletor de status
<UserStatusSelect
  currentStatus={user.account_status}
  onStatusChange={(newStatus) => updateUserStatus(newStatus)}
  showTransitionValidation={true}
/>

// Badge de status
<UserStatusBadge 
  status={user.account_status}
  showDescription={true}
  size="md"
/>
```

### 4. **Usar Hooks**
```tsx
import { useUserStatus, useCurrentUserStatus } from '@/hooks/useUserStatus';

// Para gerenciar status de um usuário específico
const { 
  userProfile, 
  changeUserStatus, 
  hasAccess, 
  isPremium 
} = useUserStatus(userId);

// Para o usuário atual
const { status, loading } = useCurrentUserStatus();
```

## 🛡️ Funcionalidades de Segurança

### **Validação de Transições**
```typescript
// Transições válidas são controladas automaticamente
const isValid = isValidStatusTransition('free', 'premium'); // true
const isInvalid = isValidStatusTransition('banned', 'active'); // false
```

### **Middleware de Proteção**
- Usuários bloqueados → `/blocked`
- Usuários pendentes → `/pending-verification`
- Usuários inativos → `/account-inactive`
- Rotas premium → `/upgrade`
- Rotas admin → `/unauthorized`

### **Auditoria Automática**
Todas as mudanças de status são registradas na tabela `user_status_changes`:
```sql
SELECT * FROM user_status_changes 
WHERE user_id = 'user-uuid'
ORDER BY changed_at DESC;
```

## 📊 Consultas Úteis

### **Views Pré-criadas**
```sql
-- Usuários ativos
SELECT * FROM active_users;

-- Usuários bloqueados  
SELECT * FROM blocked_users;

-- Usuários premium
SELECT * FROM premium_users;

-- Usuários pendentes
SELECT * FROM pending_users;

-- Usuários inativos
SELECT * FROM inactive_users;
```

### **Funções SQL**
```sql
-- Verificar se usuário tem acesso
SELECT user_has_access('premium'::account_status_enum); -- true

-- Verificar se está bloqueado
SELECT user_is_blocked('banned'::account_status_enum); -- true

-- Verificar se é premium
SELECT user_is_premium('trial'::account_status_enum); -- true
```

## 🎨 Personalização Visual

### **Cores por Status**
- 🟢 **Verde**: active, free, premium, trial
- 🔴 **Vermelho**: blocked, suspended, banned
- ⚪ **Cinza**: inactive
- 🟡 **Amarelo**: pending

### **Ícones**
- ✅ Acesso liberado
- ❌ Acesso negado  
- ⏸️ Acesso limitado
- ⏳ Pendente

## 🔄 Fluxos de Status

### **Usuário Novo**
```
pending → active/free (após verificação)
```

### **Upgrade Premium**
```
free → premium (pagamento)
free → trial (período teste)
trial → premium (conversão)
```

### **Moderação**
```
active → blocked (violação leve)
active → suspended (violação grave)  
active → banned (violação severa)
blocked → active (desbloqueio)
```

### **Inatividade**
```
active → inactive (sem uso prolongado)
inactive → active (reativação)
```

## 🚀 Próximos Passos

1. **Executar o script SQL** no Supabase
2. **Testar as funções** de validação
3. **Implementar componentes** nas páginas admin
4. **Configurar notificações** para mudanças de status
5. **Adicionar logs** de auditoria na interface

## 📝 Comandos SQL Rápidos

### **Bloquear Usuário**
```sql
UPDATE user_profiles 
SET account_status = 'blocked'::account_status_enum 
WHERE user_id = 'user-uuid';
```

### **Promover para Premium**
```sql
UPDATE user_profiles 
SET account_status = 'premium'::account_status_enum 
WHERE user_id = 'user-uuid';
```

### **Promover para Admin**
```sql
UPDATE user_profiles 
SET account_status = 'admin'::account_status_enum 
WHERE user_id = 'user-uuid';
```

### **Promover para Super Admin**
```sql
UPDATE user_profiles 
SET account_status = 'superadmin'::account_status_enum 
WHERE user_id = 'user-uuid';
```

### **Estatísticas de Status**
```sql
SELECT 
  account_status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM user_profiles 
GROUP BY account_status
ORDER BY total DESC;
```

---

## ✨ Benefícios do Sistema

- ✅ **Type Safety** - Enum TypeScript + PostgreSQL
- ✅ **Validação Automática** - Transições controladas
- ✅ **Auditoria Completa** - Histórico de mudanças
- ✅ **Performance** - Índices otimizados
- ✅ **Segurança** - Middleware de proteção
- ✅ **UX** - Componentes visuais intuitivos
- ✅ **Escalabilidade** - Views e funções pré-criadas

O sistema está pronto para uso em produção! 🎉