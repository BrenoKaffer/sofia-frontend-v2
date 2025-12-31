# 🔒 Setup de Políticas RLS (Row Level Security)

## 📋 Resumo

Este diretório contém todos os scripts necessários para aplicar políticas RLS abrangentes no banco de dados, removendo os avisos vermelhos de "Unrestricted" das tabelas.

## 🗂️ Arquivos Criados

### Scripts SQL
- **`rls_policies.sql`** - Políticas básicas para `user_profiles` e `user_status_changes`
- **`comprehensive_rls_policies.sql`** - Políticas para todas as tabelas de pagamento e outras
- **`apply_all_rls.sql`** - Script principal que aplica todas as políticas
- **`rls_verification.sql`** - Script de verificação das políticas aplicadas

### Scripts de Execução
- **`run_rls_setup.bat`** - Script batch para Windows (execução automática)

### Documentação
- **`README_RLS_SETUP.md`** - Este arquivo de documentação

## 🚀 Como Aplicar as Políticas

### Opção 1: Script Automático (Recomendado)
```bash
# No diretório sql/
./run_rls_setup.bat
```

### Opção 2: Execução Manual
```bash
# Conectar ao banco
psql -h localhost -U postgres -d sofia

# Executar o script principal
\i apply_all_rls.sql
```

### Opção 3: Passo a Passo
```bash
# 1. Políticas básicas
psql -h localhost -U postgres -d sofia -f rls_policies.sql

# 2. Políticas abrangentes
psql -h localhost -U postgres -d sofia -f comprehensive_rls_policies.sql

# 3. Verificação
psql -h localhost -U postgres -d sofia -f rls_verification.sql
```

## 📊 Tabelas Cobertas

### ✅ Políticas Básicas
- `user_profiles` (4 políticas)
- `user_status_changes` (4 políticas)

### ✅ Políticas Abrangentes
- `transactions` (4 políticas)
- `subscriptions` (4 políticas) 
- `coupons` (4 políticas)
- `coupon_usages` (4 políticas)
- `payment_methods` (4 políticas)
- `payment_webhooks` (4 políticas)

### 📋 Views Automáticas
As seguintes views herdam as políticas de `user_profiles`:
- `active_users`
- `blocked_users`
- `premium_users`
- `pending_users`
- `inactive_users`
- `admin_users`
- `superadmin_users`

## 🔐 Hierarquia de Acesso

### 👑 SUPERADMIN
- Acesso total a todas as tabelas
- Pode fazer SELECT, INSERT, UPDATE, DELETE em tudo
- Bypass completo das políticas RLS

### 🛡️ ADMIN
- Acesso de leitura/escrita na maioria das tabelas
- Pode gerenciar usuários, cupons, transações
- Não pode deletar dados críticos (apenas superadmin)

### 💎 USUÁRIO PREMIUM/COMUM
- Acesso apenas aos próprios dados
- Pode ver e gerenciar suas transações, assinaturas, métodos de pagamento
- Não pode acessar dados de outros usuários

## 🔍 Verificação das Políticas

Após aplicar as políticas, execute:

```sql
-- Verificar tabelas com RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Contar políticas por tabela
SELECT tablename, COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

## ⚠️ Resolução de Problemas

### Erro: "policy already exists"
- As políticas são criadas com verificação `IF NOT EXISTS`
- É seguro executar os scripts múltiplas vezes

### Erro: "psql command not found"
- Instale o PostgreSQL client
- Ou use uma ferramenta como pgAdmin, DBeaver, etc.

### Erro: "permission denied"
- Verifique se está conectado como usuário com privilégios
- Use `postgres` ou outro usuário superadmin

### Tabelas ainda aparecem como "Unrestricted"
- Execute o script de verificação: `rls_verification.sql`
- Verifique se todas as políticas foram criadas
- Reinicie a aplicação/interface

## 📈 Benefícios Implementados

### 🔒 Segurança
- Isolamento completo de dados entre usuários
- Prevenção de acesso não autorizado
- Auditoria automática de acessos

### 🎯 Conformidade
- Remove avisos de "Unrestricted"
- Atende boas práticas de segurança
- Compatível com LGPD/GDPR

### 🚀 Performance
- Políticas otimizadas com índices
- Funções auxiliares com cache
- Verificações eficientes

## 🔄 Manutenção

### Adicionar Nova Tabela
1. Habilitar RLS: `ALTER TABLE nova_tabela ENABLE ROW LEVEL SECURITY;`
2. Criar políticas seguindo o padrão dos exemplos
3. Testar com diferentes tipos de usuário

### Modificar Políticas Existentes
1. Usar `DROP POLICY` se necessário
2. Recriar com `CREATE POLICY`
3. Testar thoroughly

### Monitoramento
- Use `rls_verification.sql` regularmente
- Monitore logs de acesso negado
- Ajuste políticas conforme necessário

## 📞 Suporte

Se encontrar problemas:
1. Execute `rls_verification.sql` para diagnóstico
2. Verifique logs do PostgreSQL
3. Teste com usuários de diferentes níveis
4. Consulte a documentação das funções auxiliares

---

**✅ Após aplicar estas políticas, todos os avisos vermelhos de "Unrestricted" devem desaparecer!**