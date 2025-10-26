# 🔧 Guia de Correção - Erros de Registro

## 📋 Problemas Identificados

### 1. Função SQL Ausente no Banco de Dados
**Erro:** `insert_user_profile_on_registration` não existe ou não está acessível
**Localização:** `lib/user-registration.ts` linhas 58 e 79

### 2. Falha na Criação de Perfil
**Erro:** Usuário é criado no Auth mas falha ao criar perfil nas tabelas
**Localização:** `app/register/[[...rest]]/page.tsx` linha 269

### 3. Estrutura das Tabelas Verificada ✅
**Status:** Tabelas existem com estrutura adequada:
- `user_profiles`: 24 colunas incluindo user_id, full_name, cpf, email
- `user_preferences`: 6 colunas incluindo id, theme, notifications, language

## 🛠️ Soluções

### Passo 1: Executar Função SQL no Supabase ⚠️ CRÍTICO
1. Acesse o **Supabase Dashboard** → **SQL Editor**
2. Execute o conteúdo do arquivo: `create_insert_user_profile_function.sql`
3. Verifique se a função foi criada com sucesso

**Comando SQL para verificar se a função existe:**
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'insert_user_profile_on_registration' 
AND routine_schema = 'public';
```

### Passo 2: Verificar Permissões da Função
Certifique-se que a função tem as permissões corretas:
```sql
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_user_profile_on_registration(uuid, text, text, text) TO anon;
```

### Passo 3: Testar Registro
1. Tente registrar um novo usuário
2. Verifique os logs no console do navegador
3. Confirme se os dados foram inseridos nas tabelas

## 🔍 Logs de Debug

### Console do Navegador
- `🔄 [REGISTER] Iniciando inserção de dados do perfil do usuário...`
- `✅ [REGISTER] Perfil do usuário criado com sucesso!`
- `❌ [REGISTER] Erro detalhado ao criar perfil do usuário:`

### Função SQL (Supabase Logs)
- `Executando insert_user_profile_on_registration para user_id: [ID]`
- `Dados inseridos em user_preferences para user_id: [ID]`
- `Dados inseridos em user_profiles para user_id: [ID]`

## 🚨 Códigos de Erro Comuns

- **42883**: Função não existe no banco (MAIS PROVÁVEL)
- **42P01**: Tabela não encontrada
- **23505**: Violação de chave única (usuário já existe)

## 📊 Estrutura das Tabelas (Verificada)

### user_profiles
- ✅ user_id (uuid, NOT NULL)
- ✅ full_name (text, YES)
- ✅ cpf (text, YES)
- ✅ email (text, YES)
- ✅ preferences (jsonb, NOT NULL)
- ✅ account_status (text, NOT NULL)
- ✅ terms_accepted (boolean, YES)
- ✅ registration_source (text, YES)
- ✅ profile_completed (boolean, YES)
- ✅ onboarding_completed (boolean, YES)

### user_preferences
- ✅ id (uuid, NOT NULL)
- ✅ theme (text, YES)
- ✅ notifications (boolean, YES)
- ✅ language (text, YES)

## ✅ Verificação Final

Após aplicar as correções:
1. ✅ Função SQL criada no banco
2. ✅ Tabelas existem e estão acessíveis
3. ⏳ Registro funciona sem erros
4. ⏳ Dados são inseridos corretamente
5. ⏳ Logs mostram sucesso

## 🎯 Próximos Passos

1. **URGENTE**: Execute o arquivo `create_insert_user_profile_function.sql` no Supabase
2. Teste o registro de um novo usuário
3. Verifique se os dados são inseridos corretamente nas tabelas