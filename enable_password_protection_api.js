// =====================================================
// SCRIPT PARA HABILITAR PROTEÇÃO CONTRA SENHAS VAZADAS VIA API
// Execute: node enable_password_protection_api.js
// =====================================================

const https = require('https');
const fs = require('fs');
const path = require('path');

// Função para carregar variáveis do .env.local
function loadEnvFile() {
    const envPath = path.join(__dirname, '.env.local');
    
    if (!fs.existsSync(envPath)) {
        console.error('❌ Arquivo .env.local não encontrado!');
        process.exit(1);
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
    
    return envVars;
}

// Função para fazer requisição HTTPS
function makeHttpsRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: parsedData,
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData,
                        headers: res.headers
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Função principal
async function enablePasswordProtection() {
    console.log('🔐 Iniciando habilitação da Proteção Contra Senhas Vazadas...\n');
    
    try {
        // Carregar variáveis de ambiente
        const env = loadEnvFile();
        
        const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !serviceRoleKey) {
            console.error('❌ Variáveis de ambiente necessárias não encontradas!');
            console.error('   Verifique se NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env.local');
            process.exit(1);
        }
        
        console.log('✅ Variáveis de ambiente carregadas');
        console.log(`📍 Supabase URL: ${supabaseUrl}`);
        console.log(`🔑 Service Role Key: ${serviceRoleKey.substring(0, 20)}...`);
        
        // Extrair project reference da URL
        const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
        console.log(`🏗️  Project Reference: ${projectRef}\n`);
        
        // Configurar opções da requisição
        const options = {
            hostname: 'api.supabase.com',
            port: 443,
            path: `/v1/projects/${projectRef}/config/auth`,
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        // Dados para habilitar proteção contra senhas vazadas
        const configData = {
            SECURITY_CAPTCHA_ENABLED: false,
            SECURITY_CAPTCHA_PROVIDER: "hcaptcha",
            PASSWORD_MIN_LENGTH: 6,
            PASSWORD_REQUIRED_CHARACTERS: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            HIBP_ENABLED: true  // Esta é a configuração principal para proteção contra senhas vazadas
        };
        
        console.log('📤 Enviando configuração para Supabase...');
        console.log('⚙️  Configurações a serem aplicadas:');
        console.log(`   - HIBP_ENABLED: ${configData.HIBP_ENABLED}`);
        console.log(`   - PASSWORD_MIN_LENGTH: ${configData.PASSWORD_MIN_LENGTH}`);
        console.log(`   - SECURITY_CAPTCHA_ENABLED: ${configData.SECURITY_CAPTCHA_ENABLED}\n`);
        
        // Fazer a requisição
        const response = await makeHttpsRequest(options, configData);
        
        console.log(`📊 Status da resposta: ${response.statusCode}`);
        
        if (response.statusCode === 200 || response.statusCode === 201) {
            console.log('✅ SUCESSO! Proteção Contra Senhas Vazadas habilitada com sucesso!\n');
            
            console.log('📋 Configurações aplicadas:');
            console.log('   ✅ HIBP (Have I Been Pwned) habilitado');
            console.log('   ✅ Senhas comprometidas serão rejeitadas automaticamente');
            console.log('   ✅ Verificação em tempo real durante registro e alteração de senha');
            
            console.log('\n🔍 Resposta da API:');
            console.log(JSON.stringify(response.data, null, 2));
            
        } else if (response.statusCode === 401) {
            console.error('❌ ERRO: Não autorizado (401)');
            console.error('   Verifique se a SUPABASE_SERVICE_ROLE_KEY está correta');
            console.error('   A chave deve ter permissões de administrador');
            
        } else if (response.statusCode === 404) {
            console.error('❌ ERRO: Projeto não encontrado (404)');
            console.error('   Verifique se a NEXT_PUBLIC_SUPABASE_URL está correta');
            console.error(`   Project Reference extraído: ${projectRef}`);
            
        } else {
            console.error(`❌ ERRO: Falha na requisição (${response.statusCode})`);
            console.error('📄 Resposta da API:');
            console.error(JSON.stringify(response.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ ERRO FATAL:', error.message);
        console.error('\n🔧 Possíveis soluções:');
        console.error('   1. Verifique sua conexão com a internet');
        console.error('   2. Confirme se as credenciais no .env.local estão corretas');
        console.error('   3. Verifique se o projeto Supabase está ativo');
        console.error('   4. Confirme se a Service Role Key tem permissões adequadas');
    }
}

// Função para verificar o status atual
async function checkCurrentStatus() {
    console.log('\n🔍 Verificando status atual da configuração...\n');
    
    try {
        const env = loadEnvFile();
        const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
        
        const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
        
        const options = {
            hostname: 'api.supabase.com',
            port: 443,
            path: `/v1/projects/${projectRef}/config/auth`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Accept': 'application/json'
            }
        };
        
        const response = await makeHttpsRequest(options);
        
        if (response.statusCode === 200) {
            console.log('📊 Status atual das configurações de autenticação:');
            
            const config = response.data;
            console.log(`   🔐 HIBP Enabled: ${config.HIBP_ENABLED ? '✅ SIM' : '❌ NÃO'}`);
            console.log(`   📏 Password Min Length: ${config.PASSWORD_MIN_LENGTH || 'Não definido'}`);
            console.log(`   🤖 Captcha Enabled: ${config.SECURITY_CAPTCHA_ENABLED ? '✅ SIM' : '❌ NÃO'}`);
            
            return config.HIBP_ENABLED;
        } else {
            console.error(`❌ Erro ao verificar status: ${response.statusCode}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar status:', error.message);
        return false;
    }
}

// Executar o script
async function main() {
    console.log('🚀 SUPABASE - HABILITADOR DE PROTEÇÃO CONTRA SENHAS VAZADAS');
    console.log('=' .repeat(60));
    
    // Verificar status atual
    const isCurrentlyEnabled = await checkCurrentStatus();
    
    if (isCurrentlyEnabled) {
        console.log('\n✅ A Proteção Contra Senhas Vazadas já está HABILITADA!');
        console.log('   Não é necessário executar novamente.');
    } else {
        console.log('\n⚠️  A Proteção Contra Senhas Vazadas está DESABILITADA.');
        console.log('   Procedendo com a habilitação...\n');
        
        await enablePasswordProtection();
        
        // Verificar novamente após a tentativa
        console.log('\n🔄 Verificando se a configuração foi aplicada...');
        const isNowEnabled = await checkCurrentStatus();
        
        if (isNowEnabled) {
            console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
            console.log('   A Proteção Contra Senhas Vazadas está agora ATIVA.');
        } else {
            console.log('\n⚠️  A configuração pode não ter sido aplicada corretamente.');
            console.log('   Verifique os logs acima para mais detalhes.');
        }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✨ Script finalizado!');
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { enablePasswordProtection, checkCurrentStatus };