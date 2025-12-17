# 🔧 Instruções para Correção dos Erros de Banco de Dados

## 📋 Problemas Identificados

Baseado nos erros reportados, foram identificados os seguintes problemas:

1. **❌ Tabela `system_logs` não existe**
   - Erro: `Could not find the table 'public.system_logs' in the schema cache`

2. **❌ Coluna `preferences` com tipo incorreto**
   - Erro: `column "preferences" is of type jsonb but expression is of type uuid`
   - A coluna está definida como UUID mas deveria ser JSONB

3. **❌ Função de registro com parâmetros incorretos**
   - A função `insert_user_profile_on_registration` não está alinhada com a estrutura real das tabelas

## 🚀 Solução - Passos para Correção

### Passo 1: Executar Script Principal
Execute o arquivo `fix-database-errors.sql` no **SQL Editor do Supabase**:

```sql
-- Copie e cole todo o conteúdo do arquivo fix-database-errors.sql
-- Este script irá:
-- ✅ Criar a tabela system_logs
-- ✅ Corrigir o tipo da coluna preferences
-- ✅ Adicionar todas as colunas necessárias
-- ✅ Recriar a função insert_user_profile_on_registration
```

### Passo 2: Executar Funções de Logging
Execute o arquivo `create-missing-log-functions.sql` no **SQL Editor do Supabase**:

```sql
-- Copie e cole todo o conteúdo do arquivo create-missing-log-functions.sql
-- Este script irá:
-- ✅ Criar funções para inserir logs
-- ✅ Criar funções para consultar logs
-- ✅ Criar funções para estatísticas
-- ✅ Configurar triggers automáticos
```

### Passo 3: Verificar Correções
Após executar os scripts, verifique se tudo foi criado corretamente:

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('system_logs', 'user_profiles', 'user_preferences');

-- Verificar estrutura da user_profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'preferences';

-- Verificar funções
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'insert_user_profile_on_registration';
```

## 🧪 Teste do Sistema

### Teste 1: Verificar Logs
```sql
-- Inserir um log de teste
SELECT insert_system_log('INFO', 'Teste do sistema de logs', 'test', 'manual_test');

-- Verificar se foi inserido
SELECT * FROM system_logs WHERE message = 'Teste do sistema de logs';
```

### Teste 2: Testar Função de Registro
```sql
-- Testar a função de registro (descomente no script se necessário)
-- Isso criará um usuário de teste e depois removerá
```

### Teste 3: Testar Registro na Aplicação
1. Acesse a página de registro: `http://localhost:3000/register`
2. Preencha o formulário com dados de teste
3. Verifique se o registro é concluído sem erros
4. Verifique os logs no console do navegador

## 📊 Estrutura Final das Tabelas

### Tabela `system_logs`
```sql
- id (UUID, PRIMARY KEY)
- level (TEXT) - 'debug', 'info', 'warn', 'error', 'fatal'
- message (TEXT)
- context (TEXT)
- source (TEXT)
- user_id (UUID, FK para auth.users)
- session_id (TEXT)
- ip_address (INET)
- user_agent (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Tabela `user_profiles` (corrigida)
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FK para auth.users)
- full_name (TEXT)
- cpf (TEXT)
- email (TEXT)
- preferences (JSONB) ← CORRIGIDO: era UUID, agora é JSONB
- notes (JSONB)
- account_status (TEXT)
- permissions (JSONB)
- terms_accepted (BOOLEAN)
- registration_source (TEXT)
- profile_completed (BOOLEAN)
- onboarding_completed (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### Tabela `user_preferences`
```sql
- id (UUID, PRIMARY KEY, FK para auth.users)
- theme (TEXT)
- notifications (BOOLEAN)
- language (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## 🔍 Monitoramento Pós-Correção

Após aplicar as correções, monitore:

1. **Logs de Erro**: Verifique se os erros `PGRST205` e `42804` não aparecem mais
2. **Registro de Usuários**: Teste o fluxo completo de registro
3. **Sistema de Logs**: Verifique se os logs estão sendo salvos corretamente
4. **Performance**: Monitore se não há degradação de performance

## 🆘 Solução de Problemas

### Se ainda houver erros:

1. **Verificar permissões RLS**:
   ```sql
   -- Verificar políticas RLS
   SELECT * FROM pg_policies WHERE tablename IN ('system_logs', 'user_profiles', 'user_preferences');
   ```

2. **Verificar usuário do Supabase**:
   - Certifique-se de que está executando os scripts com usuário `postgres` ou `service_role`

3. **Limpar cache do Supabase**:
   - No dashboard do Supabase, vá em Settings > API e clique em "Restart API"

4. **Verificar logs do Supabase**:
   - Acesse Logs > Database para ver erros detalhados

## 📞 Suporte

Se os problemas persistirem:
1. Verifique os logs detalhados no console do navegador
2. Verifique os logs do Supabase Dashboard
3. Execute os scripts de verificação fornecidos
4. Documente qualquer erro específico que ainda ocorra

---

**⚠️ Importante**: Execute os scripts na ordem especificada e sempre faça backup do banco antes de aplicar mudanças em produção.