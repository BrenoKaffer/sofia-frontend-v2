# 🔐 GUIA MANUAL: Habilitar Proteção contra Senhas Vazadas

## ⚠️ PROBLEMA IDENTIFICADO
O script `enable_password_protection_api.js` falhou com erro **401 Unauthorized**, indicando que a `SUPABASE_SERVICE_ROLE_KEY` não possui permissões suficientes para habilitar a proteção contra senhas vazadas via API.

## 🎯 SOLUÇÃO MANUAL

### Passo 1: Acessar o Painel do Supabase
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto Sofia

### Passo 2: Navegar para Configurações de Autenticação
1. No menu lateral esquerdo, clique em **"Authentication"** (Autenticação)
2. No submenu, clique em **"Settings"** (Configurações)
3. Role a página para baixo até encontrar a seção **"Password Security"** ou **"Security Settings"**

### Passo 3: Configurar Proteção de Senhas
1. Na seção **"Password Security"**, você encontrará as seguintes opções:
   - **Minimum password length** (Comprimento mínimo da senha): Recomendado **8 caracteres** ou mais
   - **Password complexity** (Complexidade da senha): Selecione **"Lowercase, uppercase, digits, and symbols"**
   - **Prevent leaked passwords** (Prevenir senhas vazadas): **HABILITE esta opção** ✅

2. Marque a caixa **"Prevent leaked passwords"** para ativar a proteção
3. Clique em **"Save"** ou **"Update"** para aplicar as alterações

### Passo 4: Configurações Adicionais Recomendadas
1. **CAPTCHA Protection**: Considere habilitar para proteção adicional contra bots
2. **Detect compromised tokens**: Habilite a detecção de tokens comprometidos
3. **Multi-Factor Authentication (MFA)**: Configure se necessário para usuários administrativos

## 📋 VERIFICAÇÃO

Após habilitar a proteção contra senhas vazadas:

1. **Teste de Registro**: Tente registrar um usuário com uma senha comum (ex: "123456", "password")
2. **Resultado Esperado**: O sistema deve rejeitar senhas que estão na base de dados do HaveIBeenPwned
3. **Mensagem de Erro**: Deve aparecer algo como "This password has been found in a data breach"

## ⚠️ OBSERVAÇÕES IMPORTANTES

- **Plano Necessário**: A proteção contra senhas vazadas está disponível apenas no **Plano Pro** e superiores
- **API Utilizada**: O Supabase usa a API do HaveIBeenPwned.org para verificar senhas vazadas
- **Usuários Existentes**: Usuários com senhas fracas ainda podem fazer login, mas receberão um `WeakPasswordError`

## 🔍 Verificação via SQL (Opcional)
Execute no SQL Editor para verificar as configurações:

```sql
-- Verificar configurações de autenticação
SELECT 
    name,
    value
FROM auth.config 
WHERE name LIKE '%password%' OR name LIKE '%hibp%'
ORDER BY name;
```

## 🚨 Alternativa: Corrigir Permissões da API

Se preferir usar a API, você precisa:

### Opção A: Gerar Nova Service Role Key
1. Vá em **Settings** > **API**
2. Na seção **Project API keys**
3. Clique em **"Generate new key"** para service_role
4. Substitua a chave no arquivo `.env.local`
5. Execute novamente: `node enable_password_protection_api.js`

### Opção B: Verificar Permissões
1. Confirme que está usando a **service_role key** (não a anon key)
2. A service_role key deve começar com: `eyJhbGciOiJIUzI1NiIs...`
3. Verifique se não há espaços extras ou caracteres inválidos

## 📊 Resultado Esperado

Após habilitar a proteção:
- ✅ Senhas vazadas serão rejeitadas automaticamente
- ✅ Usuários receberão mensagem de erro clara
- ✅ Sistema ficará mais seguro contra ataques de dicionário
- ✅ Conformidade com melhores práticas de segurança

## 🔄 PRÓXIMOS PASSOS

1. ✅ Execute o script `EMERGENCY_SECURITY_FIX.sql` no SQL Editor
2. ✅ Habilite a proteção contra senhas vazadas manualmente (este guia)
3. ⚪ Execute o script `optimize_rls_policies.sql` (opcional, para performance)
4. ⚪ Teste o sistema completo com novos registros de usuários

## 🎯 RESULTADO ESPERADO

Após seguir este guia:
- ✅ 100% das funções estarão seguras
- ✅ Proteção contra senhas vazadas ativa
- ✅ Sistema completamente protegido contra ataques de `search_path`
- ✅ Todas as configurações de segurança aplicadas