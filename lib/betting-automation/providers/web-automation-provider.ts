import { AbstractBettingProvider } from '../base-provider';
import { BettingCredentials, BetRequest, BetResult } from '../types';

// Nota: Este provider será usado no backend Node.js onde o Puppeteer está disponível
// No frontend, usaremos uma API para comunicar com este provider

export class WebAutomationProvider extends AbstractBettingProvider {
  name = 'WebAutomation';
  priority = 3; // Prioridade média (iframe tem prioridade maior)
  
  private browser: any = null;
  private page: any = null;
  private siteConfig: SiteConfig | null = null;

  async isAvailable(): Promise<boolean> {
    try {
      // Verificar se estamos no ambiente Node.js (backend)
      return typeof window === 'undefined' && typeof process !== 'undefined';
    } catch {
      return false;
    }
  }

  async doConnect(credentials: BettingCredentials): Promise<void> {
    // Esta implementação será executada no backend
    const puppeteer = await this.loadPuppeteer();
    
    this.browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled'
      ],
      protocolTimeout: 60000
    });

    this.page = await this.browser.newPage();
    
    // Configurar user agent realista
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // Configurar viewport
    await this.page.setViewport({ width: 1366, height: 768 });

    // Remover propriedades que indicam automação
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // Carregar configuração específica do site
    this.siteConfig = this.getSiteConfig(credentials.siteType);
    
    // Navegar para o site e fazer login
    await this.performLogin(credentials);
  }

  async doDisconnect(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    this.siteConfig = null;
  }

  async doPlaceBet(betData: BetRequest): Promise<BetResult> {
    if (!this.page || !this.siteConfig) {
      throw new Error('Provider não está conectado');
    }

    this.validateBetData(betData);

    try {
      // Navegar para a seção de roleta se necessário
      await this.navigateToRoulette();
      
      // Aguardar a mesa estar pronta
      await this.waitForTableReady();
      
      // Executar as apostas
      const betResult = await this.executeBets(betData);
      
      return betResult;
    } catch (error) {
      throw new Error(`Erro ao executar aposta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async loadPuppeteer() {
    try {
      // Tentar carregar puppeteer-extra primeiro (com stealth)
      const puppeteerExtra = require('puppeteer-extra');
      const StealthPlugin = require('puppeteer-extra-plugin-stealth');
      puppeteerExtra.use(StealthPlugin());
      return puppeteerExtra;
    } catch {
      // Fallback para puppeteer padrão
      return require('puppeteer');
    }
  }

  private getSiteConfig(siteType: string): SiteConfig {
    const configs: Record<string, SiteConfig> = {
      'bet365': {
        loginUrl: 'https://www.bet365.com',
        rouletteUrl: 'https://www.bet365.com/casino/roulette',
        selectors: {
          loginButton: '.hm-MainHeaderRHSLoggedOutWide_Login',
          usernameField: '#loginUsername',
          passwordField: '#loginPassword',
          submitButton: '.hm-LoginModule_LoginBtn',
          rouletteTable: '.roulette-table',
          betAmountInput: '.bet-amount',
          numberBets: '[data-number]',
          colorBets: '[data-color]',
          placeBetButton: '.place-bet',
          betConfirmation: '.bet-confirmed'
        }
      },
      'betfair': {
        loginUrl: 'https://www.betfair.com',
        rouletteUrl: 'https://www.betfair.com/exchange/plus/roulette',
        selectors: {
          loginButton: '.login-button',
          usernameField: '#ssc-liu',
          passwordField: '#ssc-lipw',
          submitButton: '#ssc-lis',
          rouletteTable: '.roulette-wheel',
          betAmountInput: '.stake-input',
          numberBets: '.number-bet',
          colorBets: '.color-bet',
          placeBetButton: '.place-bet-btn',
          betConfirmation: '.bet-receipt'
        }
      },
      // Adicionar mais configurações conforme necessário
      'other': {
        loginUrl: '',
        rouletteUrl: '',
        selectors: {
          loginButton: '',
          usernameField: '',
          passwordField: '',
          submitButton: '',
          rouletteTable: '',
          betAmountInput: '',
          numberBets: '',
          colorBets: '',
          placeBetButton: '',
          betConfirmation: ''
        }
      }
    };

    return configs[siteType] || configs['other'];
  }

  private async performLogin(credentials: BettingCredentials): Promise<void> {
    if (!this.siteConfig) throw new Error('Configuração do site não encontrada');

    await this.page.goto(credentials.siteUrl || this.siteConfig.loginUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Aguardar e clicar no botão de login
    await this.page.waitForSelector(this.siteConfig.selectors.loginButton, { timeout: 30000 });
    await this.page.click(this.siteConfig.selectors.loginButton);

    // Preencher credenciais
    await this.page.waitForSelector(this.siteConfig.selectors.usernameField, { timeout: 30000 });
    await this.page.type(this.siteConfig.selectors.usernameField, credentials.username);
    
    await this.page.type(this.siteConfig.selectors.passwordField, credentials.password);

    // Submeter login
    await this.page.click(this.siteConfig.selectors.submitButton);

    // Aguardar login ser processado
    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });

    // Verificar se login foi bem-sucedido
    const isLoggedIn = await this.verifyLogin();
    if (!isLoggedIn) {
      throw new Error('Falha no login - credenciais inválidas ou site mudou');
    }
  }

  private async verifyLogin(): Promise<boolean> {
    try {
      // Verificar se elementos de usuário logado estão presentes
      await this.page.waitForSelector('.user-info, .account-balance, .logout-button', { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  private async navigateToRoulette(): Promise<void> {
    if (!this.siteConfig) throw new Error('Configuração do site não encontrada');

    const currentUrl = this.page.url();
    if (!currentUrl.includes('roulette')) {
      await this.page.goto(this.siteConfig.rouletteUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    }
  }

  private async waitForTableReady(): Promise<void> {
    if (!this.siteConfig) throw new Error('Configuração do site não encontrada');

    await this.page.waitForSelector(this.siteConfig.selectors.rouletteTable, { timeout: 30000 });
    
    // Aguardar um pouco mais para garantir que a mesa está totalmente carregada
    await this.delay(2000);
  }

  private async executeBets(betData: BetRequest): Promise<BetResult> {
    if (!this.siteConfig) throw new Error('Configuração do site não encontrada');

    const startTime = Date.now();

    try {
      // Limpar apostas anteriores se necessário
      await this.clearPreviousBets();

      // Executar cada seleção
      for (const selection of betData.selections) {
        await this.placeSingleBet(selection);
      }

      // Confirmar todas as apostas
      await this.confirmBets();

      // Aguardar resultado
      const result = await this.waitForResult();

      return {
        success: true,
        betId: `web_${Date.now()}`,
        winningNumber: result.winningNumber,
        winningColor: result.winningColor,
        payout: result.payout,
        profit: result.payout - betData.totalAmount,
        timestamp: new Date(),
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na execução da aposta',
        timestamp: new Date(),
        executionTime: Date.now() - startTime
      };
    }
  }

  private async clearPreviousBets(): Promise<void> {
    try {
      // Tentar encontrar e clicar em botão de limpar apostas
      const clearButton = await this.page.$('.clear-bets, .remove-all-bets, [data-action="clear"]');
      if (clearButton) {
        await clearButton.click();
        await this.delay(500);
      }
    } catch {
      // Ignorar se não encontrar botão de limpar
    }
  }

  private async placeSingleBet(selection: any): Promise<void> {
    if (!this.siteConfig) throw new Error('Configuração do site não encontrada');

    // Definir valor da aposta
    const amountInput = await this.page.$(this.siteConfig.selectors.betAmountInput);
    if (amountInput) {
      await amountInput.click({ clickCount: 3 }); // Selecionar tudo
      await amountInput.type(selection.amount.toString());
    }

    // Clicar na seleção apropriada
    let selector = '';
    
    if (selection.type === 'number') {
      selector = `${this.siteConfig.selectors.numberBets}[data-number="${selection.value}"]`;
    } else if (selection.type === 'color') {
      selector = `${this.siteConfig.selectors.colorBets}[data-color="${selection.value}"]`;
    }
    // Adicionar mais tipos conforme necessário

    if (selector) {
      await this.page.waitForSelector(selector, { timeout: 10000 });
      await this.page.click(selector);
      await this.delay(500); // Pequena pausa entre apostas
    }
  }

  private async confirmBets(): Promise<void> {
    if (!this.siteConfig) throw new Error('Configuração do site não encontrada');

    const placeBetButton = await this.page.$(this.siteConfig.selectors.placeBetButton);
    if (placeBetButton) {
      await placeBetButton.click();
      
      // Aguardar confirmação
      await this.page.waitForSelector(this.siteConfig.selectors.betConfirmation, { timeout: 10000 });
    }
  }

  private async waitForResult(): Promise<{ winningNumber: number; winningColor: 'red' | 'black' | 'green'; payout: number }> {
    // Aguardar o resultado do giro
    // Esta implementação depende muito do site específico
    await this.delay(30000); // Aguardar até 30 segundos pelo resultado

    // Tentar extrair resultado da página
    const result = await this.page.evaluate(() => {
      // Lógica específica para extrair resultado
      // Isso varia muito entre sites
      return {
        winningNumber: 0,
        winningColor: 'red' as const,
        payout: 0
      };
    });

    return result;
  }
}

interface SiteConfig {
  loginUrl: string;
  rouletteUrl: string;
  selectors: {
    loginButton: string;
    usernameField: string;
    passwordField: string;
    submitButton: string;
    rouletteTable: string;
    betAmountInput: string;
    numberBets: string;
    colorBets: string;
    placeBetButton: string;
    betConfirmation: string;
  };
}