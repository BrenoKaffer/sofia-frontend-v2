#!/usr/bin/env node

/**
 * Script de Varredura de Segurança Automatizada
 * Identifica vulnerabilidades comuns no código e configurações
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityScanner {
  constructor() {
    this.issues = [];
    this.projectRoot = process.cwd();
    this.excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addIssue(type, severity, file, line, description, recommendation) {
    this.issues.push({
      type,
      severity,
      file,
      line,
      description,
      recommendation,
      timestamp: new Date().toISOString()
    });
  }

  // Verifica credenciais hardcoded
  scanHardcodedCredentials() {
    this.log('🔍 Verificando credenciais hardcoded...');
    
    const patterns = [
      { pattern: /password\s*[:=]\s*['"][^'"]{3,}['"]/, desc: 'Senha hardcoded' },
      { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/, desc: 'API key hardcoded' },
      { pattern: /secret\s*[:=]\s*['"][^'"]{10,}['"]/, desc: 'Secret hardcoded' },
      { pattern: /token\s*[:=]\s*['"][^'"]{20,}['"]/, desc: 'Token hardcoded' },
      { pattern: /private[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/, desc: 'Chave privada hardcoded' },
      { pattern: /database[_-]?url\s*[:=]\s*['"]postgres:\/\/[^'"]+['"]/, desc: 'URL de banco hardcoded' }
    ];

    this.scanFiles((filePath, content) => {
      patterns.forEach(({ pattern, desc }) => {
        const matches = content.match(new RegExp(pattern.source, 'gi'));
        if (matches) {
          matches.forEach(match => {
            const lines = content.split('\n');
            const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
            
            // Ignorar arquivos de teste e exemplos
            if (!filePath.includes('test') && !filePath.includes('example') && !filePath.includes('.env.example')) {
              this.addIssue(
                'hardcoded-credentials',
                'high',
                filePath,
                lineNumber,
                `${desc}: ${match.substring(0, 50)}...`,
                'Mover para variáveis de ambiente'
              );
            }
          });
        }
      });
    });
  }

  // Verifica dependências vulneráveis
  scanVulnerableDependencies() {
    this.log('🔍 Verificando dependências vulneráveis...');
    
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      if (audit.vulnerabilities) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
          this.addIssue(
            'vulnerable-dependency',
            vuln.severity,
            'package.json',
            0,
            `Dependência vulnerável: ${pkg} - ${vuln.title}`,
            `Atualizar para versão ${vuln.fixAvailable ? 'disponível' : 'não disponível'}`
          );
        });
      }
    } catch (error) {
      this.log('Erro ao executar npm audit', 'warning');
    }
  }

  // Verifica configurações inseguras
  scanInsecureConfigurations() {
    this.log('🔍 Verificando configurações inseguras...');
    
    // Verificar CORS permissivo
    this.scanFiles((filePath, content) => {
      if (content.includes('origin: "*"') || content.includes("origin: '*'")) {
        this.addIssue(
          'insecure-cors',
          'medium',
          filePath,
          0,
          'CORS configurado para aceitar qualquer origem',
          'Configurar origens específicas'
        );
      }
      
      // Verificar debug habilitado em produção
      if (content.includes('NODE_ENV') && content.includes('production') && content.includes('debug: true')) {
        this.addIssue(
          'debug-enabled',
          'medium',
          filePath,
          0,
          'Debug habilitado em produção',
          'Desabilitar debug em produção'
        );
      }
    });
  }

  // Verifica exposição de informações sensíveis
  scanInformationDisclosure() {
    this.log('🔍 Verificando exposição de informações...');
    
    this.scanFiles((filePath, content) => {
      // Verificar console.log com dados sensíveis
      const sensitiveConsole = content.match(/console\.log.*(?:password|token|key|secret)/gi);
      if (sensitiveConsole) {
        this.addIssue(
          'information-disclosure',
          'medium',
          filePath,
          0,
          'Console.log pode expor informações sensíveis',
          'Remover ou usar logger apropriado'
        );
      }
      
      // Verificar stack traces expostos
      if (content.includes('error.stack') && !filePath.includes('middleware')) {
        this.addIssue(
          'stack-trace-exposure',
          'low',
          filePath,
          0,
          'Stack trace pode ser exposto',
          'Sanitizar erros antes de retornar'
        );
      }
    });
  }

  // Verifica headers de segurança
  scanSecurityHeaders() {
    this.log('🔍 Verificando headers de segurança...');
    
    const configFile = path.join(this.projectRoot, 'next.config.js');
    if (fs.existsSync(configFile)) {
      const content = fs.readFileSync(configFile, 'utf8');
      
      const requiredHeaders = [
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Strict-Transport-Security'
      ];
      
      requiredHeaders.forEach(header => {
        if (!content.includes(header)) {
          this.addIssue(
            'missing-security-header',
            'medium',
            configFile,
            0,
            `Header de segurança ausente: ${header}`,
            `Adicionar ${header} ao next.config.js`
          );
        }
      });
    }
  }

  // Utilitário para escanear arquivos
  scanFiles(callback) {
    const scanDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !this.excludeDirs.includes(file)) {
          scanDir(filePath);
        } else if (stat.isFile() && /\.(js|ts|jsx|tsx|json)$/.test(file)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            callback(filePath, content);
          } catch (error) {
            // Ignorar arquivos que não podem ser lidos
          }
        }
      });
    };
    
    scanDir(this.projectRoot);
  }

  // Gera relatório
  generateReport() {
    this.log('📊 Gerando relatório de segurança...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.issues.length,
        high: this.issues.filter(i => i.severity === 'high').length,
        medium: this.issues.filter(i => i.severity === 'medium').length,
        low: this.issues.filter(i => i.severity === 'low').length
      },
      issues: this.issues
    };
    
    // Salvar relatório
    const reportPath = path.join(this.projectRoot, 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Exibir resumo
    console.log('\n📋 RELATÓRIO DE SEGURANÇA');
    console.log('========================');
    console.log(`Total de issues: ${report.summary.total}`);
    console.log(`🔴 Alta: ${report.summary.high}`);
    console.log(`🟡 Média: ${report.summary.medium}`);
    console.log(`🟢 Baixa: ${report.summary.low}`);
    
    if (this.issues.length > 0) {
      console.log('\n🔍 ISSUES ENCONTRADAS:');
      this.issues.forEach((issue, index) => {
        const severity = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        console.log(`\n${index + 1}. ${severity} ${issue.type.toUpperCase()}`);
        console.log(`   Arquivo: ${issue.file}:${issue.line}`);
        console.log(`   Descrição: ${issue.description}`);
        console.log(`   Recomendação: ${issue.recommendation}`);
      });
    }
    
    console.log(`\n📄 Relatório completo salvo em: ${reportPath}`);
    
    return report;
  }

  // Executa todas as verificações
  async scan() {
    this.log('🚀 Iniciando varredura de segurança...');
    
    this.scanHardcodedCredentials();
    this.scanVulnerableDependencies();
    this.scanInsecureConfigurations();
    this.scanInformationDisclosure();
    this.scanSecurityHeaders();
    
    const report = this.generateReport();
    
    // Retornar código de saída baseado na severidade
    const hasHighSeverity = report.summary.high > 0;
    process.exit(hasHighSeverity ? 1 : 0);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.scan().catch(error => {
    console.error('❌ Erro durante a varredura:', error);
    process.exit(1);
  });
}

module.exports = SecurityScanner;