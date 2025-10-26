# 🔒 Habilitar Proteção Contra Senhas Vazadas

## 📋 Resumo
A proteção contra senhas vazadas é um recurso de segurança do Supabase Auth que verifica se as senhas dos usuários foram comprometidas em vazamentos de dados conhecidos, usando a base de dados do HaveIBeenPwned.org.

## ⚠️ Status Atual
**DESABILITADO** - Conforme identificado no relatório do Database Linter

## 🎯 Como Habilitar

### Método 1: Dashboard do Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na sua conta

2. **Navegue até o Projeto**
   - Selecione o projeto Sofia

3. **Acesse as Configurações de Auth**
   - No menu lateral, clique em **"Authentication"**
   - Vá para a aba **"Settings"**

4. **Encontre a Seção de Segurança**
   - Procure por **"Password Security"** ou **"Leaked Password Protection"**
   - Ou procure por **"HaveIBeenPwned Integration"**

5. **Habilite a Proteção**
   - Ative o toggle/checkbox para **"Enable leaked password protection"**
   - Salve as configurações

### Método 2: Via API (Alternativo)

Se não encontrar a opção no dashboard, você pode usar a API do Supabase:

```bash
# Substitua YOUR_PROJECT_REF e YOUR_SERVICE_ROLE_KEY pelos valores reais
curl -X PATCH 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/settings' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "password_min_length": 8,
    "password_requirements": {
      "leaked_password_protection": true
    }
  }'
```

### Método 3: Configuração via Environment Variables

Adicione no seu arquivo de configuração do Supabase (se aplicável):

```env
GOTRUE_PASSWORD_MIN_LENGTH=8
GOTRUE_PASSWORD_REQUIREMENTS_LEAKED_PASSWORD_PROTECTION=true
```

## 🔍 Como Verificar se Foi Habilitado

### 1. Teste Prático
Tente registrar um usuário com uma senha conhecidamente comprometida (ex: "password123"):
- Se a proteção estiver ativa, o registro será rejeitado
- Você receberá um erro indicando que a senha foi encontrada em vazamentos

### 2. Verificação via API
```bash
curl 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/settings' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

### 3. Logs do Sistema
Verifique os logs de autenticação no dashboard do Supabase para confirmar que a verificação está sendo executada.

## 📊 Benefícios da Proteção

✅ **Segurança Aprimorada**
- Previne uso de senhas comprometidas
- Reduz risco de ataques de credential stuffing

✅ **Conformidade**
- Atende padrões de segurança modernos
- Melhora a postura de segurança geral

✅ **Experiência do Usuário**
- Força usuários a escolherem senhas mais seguras
- Feedback imediato sobre qualidade da senha

## ⚡ Impacto na Performance

- **Latência Adicional**: ~100-300ms por verificação de senha
- **Apenas no Registro/Mudança de Senha**: Não afeta login normal
- **Cache Interno**: Supabase pode cachear resultados para otimização

## 🚨 Considerações Importantes

1. **Privacidade**: As senhas são verificadas usando hash SHA-1 truncado (k-anonymity)
2. **Disponibilidade**: Depende da disponibilidade do serviço HaveIBeenPwned
3. **Fallback**: Configure um comportamento de fallback caso o serviço esteja indisponível

## 📝 Próximos Passos

1. ✅ Habilitar a proteção no dashboard
2. ✅ Testar com senhas conhecidamente comprometidas
3. ✅ Verificar logs para confirmar funcionamento
4. ✅ Documentar para a equipe
5. ✅ Executar novo scan do Database Linter para confirmar resolução

## 🔗 Recursos Adicionais

- [Documentação Oficial do Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [OWASP Password Guidelines](https://owasp.org/www-project-authentication-cheat-sheet/)

---

**Status**: 🟡 Pendente de Implementação  
**Prioridade**: Baixa (Melhoria de Segurança)  
**Tempo Estimado**: 5-10 minutos