# Dados de Teste - Pagar.me

## 📋 Informações Importantes

- **Ambiente**: Sandbox/Teste
- **URL da Aplicação**: http://localhost:3000/checkout-teste
- **Webhook URL**: http://localhost:3000/api/webhooks/pagarme

## 💳 Dados de Teste para Cartão de Crédito

### Cartões que APROVAM a transação:
```
Número: 4111 1111 1111 1111
CVV: 123
Validade: 12/2030
Nome: João Silva
```

```
Número: 5555 5555 5555 4444
CVV: 123
Validade: 12/2030
Nome: Maria Santos
```

### Cartões que RECUSAM a transação:
```
Número: 4000 0000 0000 0002
CVV: 123
Validade: 12/2030
Nome: Teste Recusado
```

## 🏦 Dados de Teste para PIX

### Para PIX (sempre aprovado em sandbox):
```
CPF: 111.111.111-11
Nome: Teste PIX
Email: teste@pix.com
Telefone: (11) 99999-9999
```

## 👤 Dados do Cliente para Teste

```
Nome Completo: João da Silva Santos
Email: joao.teste@email.com
CPF: 111.111.111-11
Telefone: (11) 99999-9999

Endereço:
Rua: Rua das Flores, 123
Bairro: Centro
Cidade: São Paulo
Estado: SP
CEP: 01234-567
```

## 🔧 Configurações de Teste

### Valores para Teste:
- **Valor mínimo**: R$ 1,00
- **Valor recomendado**: R$ 29,90
- **Valor máximo**: R$ 999,99

### Parcelas para Teste:
- **1x**: Sem juros
- **2x a 6x**: Com juros (conforme configuração)
- **Máximo**: 12x

## 🚀 Como Testar

### 1. Teste de Cartão de Crédito:
1. Acesse: http://localhost:3000/checkout-teste
2. Selecione "Cartão de Crédito"
3. Preencha com os dados de teste acima
4. Clique em "Finalizar Compra"
5. Aguarde o processamento

### 2. Teste de PIX:
1. Acesse: http://localhost:3000/checkout-teste
2. Selecione "PIX"
3. Preencha com os dados de teste acima
4. Clique em "Gerar PIX"
5. Copie o código PIX ou escaneie o QR Code

## 📊 Status de Transação

### Status Possíveis:
- **processing**: Processando
- **paid**: Pago
- **refused**: Recusado
- **pending**: Pendente
- **chargedback**: Estornado

### Webhooks:
- Os webhooks serão enviados para: `/api/webhooks/pagarme`
- Verifique os logs no console do servidor

## 🔍 Debugging

### Logs Importantes:
1. **Console do Navegador**: Erros de frontend
2. **Terminal do Servidor**: Logs de API e webhooks
3. **Network Tab**: Requisições HTTP

### URLs de API:
- **Criar Assinatura**: `/api/create-subscription`
- **Criar PIX**: `/api/create-pix`
- **Webhook**: `/api/webhooks/pagarme`

## ⚠️ Observações

1. **Ambiente de Teste**: Nenhuma cobrança real será feita
2. **Chaves de API**: Use apenas chaves de teste (ak_test_...)
3. **Webhooks**: Configure o ngrok para testes locais se necessário
4. **Logs**: Sempre verifique os logs para debugging

## 🔐 Segurança

- ✅ Nunca commite chaves reais no código
- ✅ Use variáveis de ambiente para configurações
- ✅ Valide todos os dados de entrada
- ✅ Implemente verificação de webhook signature