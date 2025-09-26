# Configuração do SDK Pagar.me

Este projeto implementa o SDK oficial da Pagar.me para processamento de pagamentos.

## 🚀 Configuração Inicial

### 1. Obter Chaves da Pagar.me

1. Acesse o [Dashboard da Pagar.me](https://dashboard.pagar.me/)
2. Faça login ou crie uma conta
3. Vá para **Configurações > Chaves de API**
4. Copie suas chaves:
   - **API Key** (ak_test_... para teste ou ak_live_... para produção)
   - **Encryption Key** (ek_test_... para teste ou ek_live_... para produção)

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` e substitua as chaves:

```env
# === CONFIGURAÇÕES PAGAR.ME ===
PAGARME_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_PAGARME_ENCRYPTION_KEY=sua_encryption_key_aqui
```

### 3. Testar a Integração

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse: `http://localhost:3000/checkout-pagarme`

3. Preencha os dados de teste e teste o checkout

## 📋 Dados de Teste

Para testar a integração, use os seguintes dados:

### Cartões de Teste
- **Aprovado**: 4111 1111 1111 1111
- **Recusado**: 4000 0000 0000 0002
- **CVV**: Qualquer 3 dígitos
- **Validade**: Qualquer data futura

### CPF de Teste
- **Válido**: 111.444.777-35

## 🔧 Componentes Criados

### 1. PagarMeCheckout
Componente principal que implementa o checkout da Pagar.me:
- **Localização**: `components/payments/pagarme-checkout.tsx`
- **Funcionalidades**:
  - Carregamento automático do SDK
  - Formulário de dados do cliente
  - Resumo do pedido
  - Integração com todos os métodos de pagamento

### 2. API Route de Captura
Endpoint para processar pagamentos:
- **Localização**: `app/api/payments/capture/route.ts`
- **Endpoint**: `POST /api/payments/capture`
- **Funcionalidade**: Captura transações autorizadas

### 3. Página de Exemplo
Demonstração do componente:
- **Localização**: `app/checkout-pagarme/page.tsx`
- **URL**: `/checkout-pagarme`

## 🎨 Layout Implementado

O layout segue o design oficial da Pagar.me conforme a documentação:

- ✅ Header com logo e título
- ✅ Resumo da compra com itens e total
- ✅ Formulário de dados pessoais
- ✅ Seção de métodos de pagamento com ícones
- ✅ Botão "Continuar" estilizado
- ✅ Informações de segurança
- ✅ Design responsivo

## 🔒 Segurança

- Todas as transações são processadas pela Pagar.me
- Dados sensíveis não são armazenados localmente
- Comunicação criptografada (HTTPS)
- Validação de dados no frontend e backend

## 📱 Métodos de Pagamento Suportados

- **Cartão de Crédito**: Visa, Mastercard, Elo, etc.
- **PIX**: Pagamento instantâneo
- **Boleto Bancário**: Vencimento configurável

## 🛠️ Personalização

Para personalizar o componente:

1. **Estilos**: Edite as classes CSS no componente
2. **Campos**: Adicione/remova campos no formulário
3. **Validações**: Modifique as validações conforme necessário
4. **Callbacks**: Implemente suas próprias funções de sucesso/erro

## 📞 Suporte

- [Documentação Pagar.me](https://docs.pagar.me/)
- [Suporte Pagar.me](https://pagar.me/suporte/)
- [Status da API](https://status.pagar.me/)

## 🔄 Próximos Passos

1. Configurar webhook para notificações de status
2. Implementar relatórios de transações
3. Adicionar suporte a assinaturas/recorrência
4. Configurar ambiente de produção