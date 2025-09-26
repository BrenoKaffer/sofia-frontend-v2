# 🚀 Configuração do Sistema de Pagamentos - Pagar.me

## 📋 Resumo da Análise

Após analisar o banco de dados existente, identifiquei que **não existem tabelas específicas para o sistema de pagamentos Pagar.me**. O schema atual contém tabelas para usuários, perfis, logs, etc., mas não possui estruturas para:

- ✅ Transações de pagamento
- ✅ Assinaturas recorrentes  
- ✅ Cupons de desconto
- ✅ Webhooks da Pagar.me
- ✅ Métodos de pagamento salvos

## 🗄️ Tabelas Criadas

Criei o arquivo `sql/payment_tables.sql` com **6 tabelas essenciais**:

### 1. **transactions** - Transações de Pagamento
- Armazena todas as transações (cartão, PIX, boleto)
- Integração completa com IDs da Pagar.me
- Suporte a cupons de desconto
- Controle de status e metadados

### 2. **subscriptions** - Assinaturas Recorrentes
- Gerencia assinaturas mensais/anuais
- Controle de períodos e renovações
- Status da assinatura (ativa, cancelada, etc.)
- Histórico de mudanças

### 3. **coupons** - Sistema de Cupons
- Cupons de desconto (% ou valor fixo)
- Controle de uso e validade
- Restrições por usuário e valor mínimo
- Cupons pré-cadastrados incluídos

### 4. **coupon_usages** - Histórico de Uso de Cupons
- Rastreamento de cada uso de cupom
- Vinculação com transações e usuários
- Auditoria completa

### 5. **payment_webhooks** - Logs de Webhooks
- Recebe notificações da Pagar.me
- Controle de processamento e tentativas
- Armazena payload completo para debug

### 6. **payment_methods** - Métodos Salvos (Opcional)
- Cartões salvos dos usuários
- Integração com tokens da Pagar.me
- Facilita pagamentos futuros

## 🔧 Como Executar

### 1. **Executar o SQL no Supabase**
```sql
-- Execute o conteúdo completo do arquivo:
-- sql/payment_tables.sql
```

### 2. **Configurar Variáveis de Ambiente**
```env
# Pagar.me (Sandbox para testes)
PAGARME_API_KEY=ak_test_...
PAGARME_ENCRYPTION_KEY=ek_test_...
PAGARME_WEBHOOK_SECRET=whsec_...

# URLs da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
WEBHOOK_URL=https://seudominio.com/api/webhooks/pagarme

# Supabase (já configurado)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. **Testar Integração**
```bash
# No terminal do projeto
npm run dev

# Acessar: http://localhost:3000/checkout
# Usar dados de teste da Pagar.me
```

## 📊 Dados de Teste Incluídos

O SQL já inclui **4 cupons de exemplo**:
- `WELCOME10` - 10% de desconto
- `SAVE20` - 20% de desconto  
- `FIRST50` - R$ 50 OFF
- `PREMIUM15` - 15% de desconto

## 🔗 Integração com o Código Atual

O sistema de checkout já está **100% preparado** para usar essas tabelas:

✅ **API de cupons** (`/api/validate-coupon`) - Pronta para consultar `coupons`  
✅ **Processamento de pagamento** - Salvará em `transactions`  
✅ **Sistema de assinaturas** - Integrará com `subscriptions`  
✅ **Webhooks** - Receberão dados em `payment_webhooks`

## 🚨 Próximos Passos Obrigatórios

### 1. **Executar SQL no Banco**
- Copie o conteúdo de `sql/payment_tables.sql`
- Execute no painel do Supabase (SQL Editor)

### 2. **Obter Credenciais Pagar.me**
- Criar conta na Pagar.me
- Gerar chaves de API (sandbox)
- Configurar webhook endpoint

### 3. **Configurar Variáveis de Ambiente**
- Adicionar chaves da Pagar.me no `.env.local`
- Configurar URLs de produção

### 4. **Testar Fluxo Completo**
- Pagamento com cartão de teste
- Aplicação de cupons
- Recebimento de webhooks

## 📈 Benefícios da Estrutura

- **Auditoria Completa**: Todos os pagamentos rastreados
- **Flexibilidade**: Suporte a múltiplos métodos de pagamento
- **Escalabilidade**: Índices otimizados para performance
- **Segurança**: Validações e constraints adequadas
- **Manutenibilidade**: Estrutura clara e documentada

## 🔍 Monitoramento

Com essas tabelas, você poderá:
- Acompanhar receita em tempo real
- Analisar efetividade de cupons
- Monitorar falhas de pagamento
- Gerar relatórios financeiros
- Detectar fraudes e problemas

---

**Status**: ✅ **Estrutura do banco pronta para produção**  
**Próximo passo**: Executar o SQL no Supabase e configurar credenciais da Pagar.me