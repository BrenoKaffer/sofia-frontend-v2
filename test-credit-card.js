// Script de teste para pagamento com cartão de crédito
// Execute com: node test-credit-card.js

const testCreditCardPayment = async () => {
  const baseURL = 'http://localhost:3002';
  
  // Dados de teste para pagamento com cartão
  const testOrder = {
    customer: {
      name: 'Maria Silva Teste',
      email: 'maria.teste@exemplo.com',
      document: '11144477735', // CPF válido para teste
      document_type: 'CPF',
      type: 'individual',
      phones: {
        mobile_phone: {
          country_code: '55',
          area_code: '11',
          number: '999999999',
        },
      },
      address: {
        line_1: 'Rua Teste, 456',
        zip_code: '01234567',
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
      },
    },
    items: [
      {
        amount: 5000, // R$ 50,00 em centavos
        description: 'Produto Premium de Teste',
        quantity: 1,
        code: 'PREMIUM001',
      },
    ],
    payments: [
      {
        payment_method: 'credit_card',
        credit_card: {
          installments: 1,
          statement_descriptor: 'SOFIA',
          card: {
            number: '4111111111111111', // Número de teste válido do Pagar.me
            holder_name: 'MARIA SILVA TESTE',
            exp_month: 12,
            exp_year: 2030,
            cvv: '123',
          },
        },
        amount: 5000,
      },
    ],
  };

  try {
    console.log('💳 Testando Pagamento com Cartão de Crédito...\n');
    
    console.log('📤 Enviando pedido de teste para:', `${baseURL}/api/payments`);
    console.log('📋 Dados do pedido:', JSON.stringify(testOrder, null, 2));
    
    const response = await fetch(`${baseURL}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder),
    });

    console.log('\n📥 Resposta recebida:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const result = await response.json();
    console.log('Body:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Teste de Cartão PASSOU! API está funcionando.');
      
      // Verificar se o pagamento foi aprovado
      if (result.data && result.data.charges && result.data.charges[0]) {
        const charge = result.data.charges[0];
        console.log(`\n💳 Status do pagamento: ${charge.status}`);
        
        if (charge.status === 'paid') {
          console.log('✅ Pagamento APROVADO!');
        } else if (charge.status === 'pending') {
          console.log('⏳ Pagamento PENDENTE (aguardando processamento)');
        } else {
          console.log('❌ Pagamento REJEITADO ou FALHOU');
        }
      }
    } else {
      console.log('\n❌ Teste FALHOU! Verifique a configuração da API.');
    }

  } catch (error) {
    console.error('\n💥 Erro durante o teste:', error.message);
    console.log('\n🔧 Possíveis causas:');
    console.log('- Servidor não está rodando em http://localhost:3000');
    console.log('- Chave da API Pagar.me não está configurada');
    console.log('- Problema de conectividade');
  }
};

// Executar o teste
testCreditCardPayment();