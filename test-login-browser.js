// Script para testar login no navegador
// Execute este código no console do navegador na página de login

console.log('🔍 Testando login com credenciais corretas...');

// Função para preencher e submeter o formulário de login
async function testLogin() {
  try {
    // Encontrar os campos de email e senha
    const emailInput = document.querySelector('input[type="email"], input[name="email"]');
    const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
    const submitButton = document.querySelector('button[type="submit"]');

    if (!emailInput || !passwordInput) {
      console.error('❌ Campos de email ou senha não encontrados');
      console.log('Elementos encontrados:', {
        emailInputs: document.querySelectorAll('input[type="email"]'),
        passwordInputs: document.querySelectorAll('input[type="password"]'),
        allInputs: document.querySelectorAll('input')
      });
      return;
    }

    console.log('✅ Campos encontrados, preenchendo...');
    
    // Preencher os campos
    emailInput.value = 'teste@sofia.com';
    passwordInput.value = 'teste123';
    
    // Disparar eventos para garantir que o React detecte as mudanças
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('📝 Campos preenchidos:', {
      email: emailInput.value,
      password: passwordInput.value ? '***' : 'VAZIO'
    });

    // Aguardar um pouco e tentar submeter
    setTimeout(() => {
      if (submitButton) {
        console.log('🚀 Submetendo formulário...');
        submitButton.click();
      } else {
        console.log('⚠️ Botão de submit não encontrado, tentando submeter o form diretamente');
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }
    }, 500);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Aguardar a página carregar completamente
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testLogin);
} else {
  testLogin();
}

// Também monitorar mudanças na URL para detectar redirecionamento
let currentUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== currentUrl) {
    console.log('🔄 URL mudou:', {
      de: currentUrl,
      para: window.location.href
    });
    currentUrl = window.location.href;
    
    if (window.location.pathname === '/dashboard') {
      console.log('✅ Login bem-sucedido! Redirecionado para dashboard');
    }
  }
}, 1000);