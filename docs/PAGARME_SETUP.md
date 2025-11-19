# Configuração do SDK Pagar.me (Canônica)

Este documento centraliza a configuração do SDK Pagar.me para o frontend canônico.

> Origem consolidada: `docs/sofia-frontend-deprecated/PAGARME_SETUP.md`.

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

## 🔧 Componentes e Rotas

- Componente de checkout: `components/payments/pagarme-checkout.tsx`
- API de captura: `app/api/payments/capture/route.ts` (`POST /api/payments/capture`)
- Página de exemplo: `app/checkout-pagarme/page.tsx` (`/checkout-pagarme`)

## 🎨 Layout

- Header, resumo da compra, formulário, métodos de pagamento, botão, segurança e responsividade conforme documentação oficial.

## 🔒 Segurança

- Transações via Pagar.me; sem armazenamento local de dados sensíveis; HTTPS; validação frontend/backend.

## 📱 Métodos de Pagamento

- Cartão de crédito, PIX, boleto.

## 🛠️ Personalização

- Estilos, campos, validações e callbacks customizáveis no componente.

## 📞 Suporte

- [Documentação Pagar.me](https://docs.pagar.me/)
- [Suporte Pagar.me](https://pagar.me/suporte/)
- [Status da API](https://status.pagar.me/)

## 🔄 Próximos Passos

1. Configurar webhook de notificações
2. Implementar relatórios
3. Adicionar recorrência
4. Configurar produção