// Script de teste para verificar a integração com Pagar.me
// Execute com: node test-payment.js

const testPaymentAPI = async () => {
  const baseURL = 'http://localhost:3002';
  
  // Dados de teste para um pagamento PIX
  const testOrder = {
    customer: {
      name: 'João Silva Teste',
      email: 'joao.teste@exemplo.com',
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
        line_1: 'Rua Teste, 123',
        zip_code: '01234567',
        city: 'São Paulo',
        state: 'SP',
        country: 'BR',
      },
    },
    items: [
      {
        amount: 1000, // R$ 10,00 em centavos
        description: 'Produto de Teste',
        quantity: 1,
        code: 'TEST001',
      },
    ],
    payments: [
      {
        payment_method: 'pix',
        pix: {
          expires_in: 3600,
        },
        amount: 1000,
      },
    ],
  };

  try {
    console.log('🧪 Testando API de Pagamentos...\n');
    
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
      console.log('\n✅ Teste PASSOU! API de pagamentos está funcionando.');
      
      if (result.data && result.data.id) {
        console.log(`\n🔍 Testando busca do pedido: ${result.data.id}`);
        
        const getResponse = await fetch(`${baseURL}/api/payments?orderId=${result.data.id}`);
        const getResult = await getResponse.json();
        
        console.log('📥 Resultado da busca:', JSON.stringify(getResult, null, 2));
        
        if (getResponse.ok) {
          console.log('✅ Busca de pedido também funcionando!');
        } else {
          console.log('❌ Erro na busca de pedido');
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
testPaymentAPI();