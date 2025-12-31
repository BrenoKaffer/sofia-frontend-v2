# 🔒 Guia de Personalização das Políticas RLS

Este guia explica como personalizar e estender as políticas RLS (Row Level Security) para suas tabelas específicas do sistema Sofia.

## 📋 Índice

1. [Visão Geral das Políticas RLS](#visão-geral)
2. [Estrutura das Políticas](#estrutura)
3. [Personalizando para Suas Tabelas](#personalizando)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Testes e Validação](#testes)
6. [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

As políticas RLS implementadas seguem uma hierarquia de acesso:

```
SUPERADMIN (acesso total)
    ↓
ADMIN (acesso administrativo)
    ↓
USUÁRIO PREMIUM (acesso premium)
    ↓
USUÁRIO COMUM (acesso básico)
```

## 🏗️ Estrutura das Políticas

### Padrão de Nomenclatura
```sql
CREATE POLICY "{tabela}_{operacao}_policy" ON public.{tabela}
```

### Tipos de Operações
- `SELECT`: Controla quais linhas o usuário pode ver
- `INSERT`: Controla quais linhas o usuário pode inserir
- `UPDATE`: Controla quais linhas o usuário pode atualizar
- `DELETE`: Controla quais linhas o usuário pode deletar

## 🔧 Personalizando para Suas Tabelas

### 1. Habilitar RLS na Tabela

```sql
-- Substitua 'sua_tabela' pelo nome da sua tabela
ALTER TABLE public.sua_tabela ENABLE ROW LEVEL SECURITY;
```

### 2. Criar Políticas Básicas

#### Política de SELECT (Visualização)
```sql
CREATE POLICY "sua_tabela_select_policy" ON public.sua_tabela
  FOR SELECT
  USING (
    -- Usuário vê apenas seus próprios dados
    user_id = public.get_current_user_id() OR 
    -- Admins veem todos os dados
    public.current_user_is_admin()
  );
```

#### Política de INSERT (Criação)
```sql
CREATE POLICY "sua_tabela_insert_policy" ON public.sua_tabela
  FOR INSERT
  WITH CHECK (
    -- Usuário pode inserir apenas para si mesmo
    user_id = public.get_current_user_id() OR
    -- Admins podem inserir para qualquer usuário
    public.current_user_is_admin()
  );
```

#### Política de UPDATE (Atualização)
```sql
CREATE POLICY "sua_tabela_update_policy" ON public.sua_tabela
  FOR UPDATE
  USING (
    -- Usuário pode atualizar apenas seus dados
    user_id = public.get_current_user_id() OR 
    -- Admins podem atualizar qualquer dado
    public.current_user_is_admin()
  )
  WITH CHECK (
    -- Mesmas regras para o resultado da atualização
    user_id = public.get_current_user_id() OR 
    public.current_user_is_admin()
  );
```

#### Política de DELETE (Exclusão)
```sql
CREATE POLICY "sua_tabela_delete_policy" ON public.sua_tabela
  FOR DELETE
  USING (
    -- Apenas superadmins podem deletar
    public.current_user_is_superadmin() OR
    -- Ou usuário pode deletar seus próprios dados (opcional)
    user_id = public.get_current_user_id()
  );
```

### 3. Política de Bypass para Superadmin
```sql
CREATE POLICY "superadmin_bypass_sua_tabela" ON public.sua_tabela
  FOR ALL
  TO authenticated
  USING (public.current_user_is_superadmin())
  WITH CHECK (public.current_user_is_superadmin());
```

## 📚 Exemplos Práticos

### Exemplo 1: Tabela de Estratégias de Trading

```sql
-- Habilitar RLS
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuário vê suas estratégias + estratégias públicas + admins veem todas
CREATE POLICY "trading_strategies_select_policy" ON public.trading_strategies
  FOR SELECT
  USING (
    user_id = public.get_current_user_id() OR 
    is_public = true OR
    public.current_user_is_admin()
  );

-- INSERT: Usuário pode criar estratégias para si
CREATE POLICY "trading_strategies_insert_policy" ON public.trading_strategies
  FOR INSERT
  WITH CHECK (
    user_id = public.get_current_user_id()
  );

-- UPDATE: Usuário atualiza suas estratégias, admin atualiza qualquer uma
CREATE POLICY "trading_strategies_update_policy" ON public.trading_strategies
  FOR UPDATE
  USING (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_admin()
  );

-- DELETE: Usuário deleta suas estratégias, superadmin deleta qualquer uma
CREATE POLICY "trading_strategies_delete_policy" ON public.trading_strategies
  FOR DELETE
  USING (
    user_id = public.get_current_user_id() OR 
    public.current_user_is_superadmin()
  );
```

### Exemplo 2: Tabela de Sinais Premium

```sql
-- Habilitar RLS
ALTER TABLE public.premium_signals ENABLE ROW LEVEL SECURITY;

-- SELECT: Apenas usuários premium e admins podem ver sinais
CREATE POLICY "premium_signals_select_policy" ON public.premium_signals
  FOR SELECT
  USING (
    public.user_is_premium(public.get_current_user_status()) OR
    public.current_user_is_admin()
  );

-- INSERT: Apenas admins podem inserir sinais
CREATE POLICY "premium_signals_insert_policy" ON public.premium_signals
  FOR INSERT
  WITH CHECK (
    public.current_user_is_admin()
  );

-- UPDATE/DELETE: Apenas admins
CREATE POLICY "premium_signals_update_policy" ON public.premium_signals
  FOR UPDATE
  USING (public.current_user_is_admin());

CREATE POLICY "premium_signals_delete_policy" ON public.premium_signals
  FOR DELETE
  USING (public.current_user_is_superadmin());
```

### Exemplo 3: Tabela de Logs do Sistema

```sql
-- Habilitar RLS
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Apenas admins podem ver logs
CREATE POLICY "application_logs_select_policy" ON public.application_logs
  FOR SELECT
  USING (
    public.current_user_is_admin()
  );

-- INSERT: Sistema pode inserir, admins podem inserir manualmente
CREATE POLICY "application_logs_insert_policy" ON public.application_logs
  FOR INSERT
  WITH CHECK (
    public.current_user_is_admin() OR
    current_user = 'system' -- Para logs automáticos do sistema
  );

-- UPDATE/DELETE: Apenas superadmins
CREATE POLICY "application_logs_update_policy" ON public.application_logs
  FOR UPDATE
  USING (public.current_user_is_superadmin());

CREATE POLICY "application_logs_delete_policy" ON public.application_logs
  FOR DELETE
  USING (public.current_user_is_superadmin());
```

## 🧪 Testes e Validação

### 1. Função de Teste Personalizada

```sql
CREATE OR REPLACE FUNCTION public.test_custom_rls_policies(
  test_user_id uuid,
  test_table_name text
)
RETURNS TABLE(
  test_name text,
  result boolean,
  message text
) AS $$
BEGIN
  -- Configurar usuário de teste
  PERFORM set_config('app.current_user_id', test_user_id::text, true);
  
  -- Executar testes específicos da tabela
  -- Adicione seus testes aqui
  
  RETURN QUERY
  SELECT 
    'custom_test'::text,
    true,
    'Teste personalizado executado'::text;
    
  -- Limpar configuração
  PERFORM set_config('app.current_user_id', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Script de Teste Manual

```sql
-- Teste 1: Conectar como usuário comum
SELECT set_config('app.current_user_id', 'uuid-usuario-comum', true);
SELECT * FROM public.sua_tabela; -- Deve ver apenas seus dados

-- Teste 2: Conectar como admin
SELECT set_config('app.current_user_id', 'uuid-admin', true);
SELECT * FROM public.sua_tabela; -- Deve ver todos os dados

-- Teste 3: Conectar como superadmin
SELECT set_config('app.current_user_id', 'uuid-superadmin', true);
SELECT * FROM public.sua_tabela; -- Deve ver todos os dados + poder modificar
```

## 🔍 Troubleshooting

### Problema: Usuário não consegue ver seus próprios dados

**Solução:**
```sql
-- Verificar se a função get_current_user_id() está retornando o valor correto
SELECT public.get_current_user_id();

-- Verificar se o user_id na tabela está correto
SELECT user_id FROM public.sua_tabela WHERE user_id = public.get_current_user_id();
```

### Problema: Admin não consegue ver todos os dados

**Solução:**
```sql
-- Verificar se o usuário realmente é admin
SELECT public.current_user_is_admin();

-- Verificar o status do usuário
SELECT public.get_current_user_status();
```

### Problema: Políticas não estão funcionando

**Solução:**
```sql
-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'sua_tabela';

-- Listar todas as políticas da tabela
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'sua_tabela';
```

## 📝 Checklist de Implementação

- [ ] Habilitar RLS na tabela
- [ ] Criar política de SELECT
- [ ] Criar política de INSERT
- [ ] Criar política de UPDATE
- [ ] Criar política de DELETE
- [ ] Criar política de bypass para superadmin
- [ ] Configurar FORCE ROW LEVEL SECURITY (se necessário)
- [ ] Revogar permissões públicas
- [ ] Conceder permissões para authenticated
- [ ] Testar com diferentes tipos de usuário
- [ ] Documentar as políticas criadas

## 🚀 Próximos Passos

1. **Identifique suas tabelas**: Liste todas as tabelas que precisam de RLS
2. **Defina regras de negócio**: Determine quem pode acessar o quê
3. **Implemente gradualmente**: Comece com tabelas críticas
4. **Teste extensivamente**: Valide com diferentes cenários
5. **Monitore performance**: RLS pode impactar performance em tabelas grandes
6. **Documente tudo**: Mantenha documentação atualizada das políticas

## 📞 Suporte

Se encontrar problemas ou tiver dúvidas:

1. Verifique os logs do PostgreSQL
2. Use as funções de teste fornecidas
3. Consulte a documentação oficial do PostgreSQL sobre RLS
4. Revise este guia para exemplos similares

---

**Lembre-se**: RLS é uma ferramenta poderosa, mas deve ser implementada com cuidado. Sempre teste em ambiente de desenvolvimento antes de aplicar em produção!