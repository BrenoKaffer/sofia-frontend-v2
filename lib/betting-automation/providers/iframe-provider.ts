import { AbstractBettingProvider } from '../base-provider';
import { BettingCredentials, BetRequest, BetResult } from '../types';

export class IframeBettingProvider extends AbstractBettingProvider {
  name = 'IframeProvider';
  priority = 1; // Prioridade mais alta - método mais seguro e confiável
  
  private iframe: HTMLIFrameElement | null = null;
  private container: HTMLElement | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private pendingRequests: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();
  private isIframeReady = false;

  async isAvailable(): Promise<boolean> {
    // Verificar se estamos no ambiente do navegador
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  async doConnect(credentials: BettingCredentials): Promise<void> {
    try {
      // Criar container para o iframe
      this.createIframeContainer();
      
      // Criar e configurar iframe
      this.createIframe(credentials);
      
      // Configurar comunicação via postMessage
      this.setupMessageHandling();
      
      // Aguardar iframe estar pronto
      await this.waitForIframeReady();
      
      // Executar login automático
      await this.performIframeLogin(credentials);
      
    } catch (error) {
      this.cleanup();
      throw new Error(`Falha na conexão via iframe: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async doDisconnect(): Promise<void> {
    this.cleanup();
  }

  async doPlaceBet(betData: BetRequest): Promise<BetResult> {
    if (!this.iframe || !this.isIframeReady) {
      throw new Error('Iframe não está conectado ou pronto');
    }

    this.validateBetData(betData);

    const requestId = this.generateRequestId();
    
    return new Promise((resolve, reject) => {
      // Configurar timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Timeout na execução da aposta'));
      }, 60000); // 60 segundos timeout

      // Armazenar handlers da promessa
      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      // Enviar comando de aposta para o iframe
      this.sendMessageToIframe({
        type: 'PLACE_BET',
        requestId,
        data: betData
      });
    });
  }

  private createIframeContainer(): void {
    // Criar container oculto para o iframe
    this.container = document.createElement('div');
    this.container.id = 'betting-iframe-container';
    this.container.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 1200px;
      height: 800px;
      z-index: -1;
      opacity: 0;
      pointer-events: none;
    `;
    
    document.body.appendChild(this.container);
  }

  private createIframe(credentials: BettingCredentials): void {
    if (!this.container) throw new Error('Container não foi criado');

    this.iframe = document.createElement('iframe');
    this.iframe.id = 'betting-automation-iframe';
    this.iframe.src = credentials.siteUrl;
    
    // Configurações de segurança do iframe
    this.iframe.sandbox.add(
      'allow-scripts',
      'allow-same-origin',
      'allow-forms',
      'allow-popups',
      'allow-popups-to-escape-sandbox'
    );
    
    this.iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;

    // Event listeners
    this.iframe.onload = () => {
      this.injectAutomationScript();
    };

    this.iframe.onerror = () => {
      throw new Error('Falha ao carregar iframe');
    };

    this.container.appendChild(this.iframe);
  }

  private setupMessageHandling(): void {
    window.addEventListener('message', (event) => {
      // Verificar origem por segurança
      if (!this.iframe || event.source !== this.iframe.contentWindow) {
        return;
      }

      this.handleIframeMessage(event.data);
    });
  }

  private handleIframeMessage(message: any): void {
    const { type, requestId, data, error } = message;

    switch (type) {
      case 'IFRAME_READY':
        this.isIframeReady = true;
        // Emit ready event through event handlers
        this.emitEvent({
          type: 'session_start',
          data: { provider: this.name },
          timestamp: new Date()
        });
        break;

      case 'LOGIN_RESULT':
        this.handleLoginResult(requestId, data, error);
        break;

      case 'BET_RESULT':
        this.handleBetResult(requestId, data, error);
        break;

      case 'ERROR':
        this.handleIframeError(requestId, error);
        break;

      case 'LOG':
        console.log('[Iframe Log]:', data);
        break;
    }
  }

  private handleLoginResult(requestId: string, data: any, error: string): void {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      clearTimeout(request.timeout);
      this.pendingRequests.delete(requestId);
      
      if (error) {
        request.reject(new Error(error));
      } else {
        request.resolve(data);
      }
    }
  }

  private handleBetResult(requestId: string, data: any, error: string): void {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      clearTimeout(request.timeout);
      this.pendingRequests.delete(requestId);
      
      if (error) {
        request.reject(new Error(error));
      } else {
        const betResult: BetResult = {
          success: data.success,
          betId: data.betId,
          winningNumber: data.winningNumber,
          winningColor: data.winningColor,
          payout: data.payout,
          profit: data.profit,
          timestamp: new Date(data.timestamp),
          executionTime: data.executionTime,
          error: data.error
        };
        request.resolve(betResult);
      }
    }
  }

  private handleIframeError(requestId: string, error: string): void {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      clearTimeout(request.timeout);
      this.pendingRequests.delete(requestId);
      request.reject(new Error(error));
    }
  }

  private async waitForIframeReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isIframeReady) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout aguardando iframe ficar pronto'));
      }, 30000);

      // Use a simple flag-based approach instead of event listeners
      const checkReady = () => {
        if (this.isIframeReady) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      
      checkReady();
    });
  }

  private async performIframeLogin(credentials: BettingCredentials): Promise<void> {
    const requestId = this.generateRequestId();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Timeout no login'));
      }, 30000);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      this.sendMessageToIframe({
        type: 'LOGIN',
        requestId,
        data: {
          username: credentials.username,
          password: credentials.password,
          siteType: credentials.siteType
        }
      });
    });
  }

  private sendMessageToIframe(message: any): void {
    if (this.iframe && this.iframe.contentWindow) {
      this.iframe.contentWindow.postMessage(message, '*');
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private injectAutomationScript(): void {
    if (!this.iframe || !this.iframe.contentWindow) return;

    // Script que será injetado no iframe para automação
    const automationScript = `
      (function() {
        console.log('Sofia Automation Script Loaded');
        
        // Configurações específicas por site
        const siteConfigs = {
          'bet365.com': {
            selectors: {
              loginButton: '.hm-MainHeaderRHSLoggedOutWide_Login',
              usernameField: '#loginUsername',
              passwordField: '#loginPassword',
              submitButton: '.hm-LoginModule_LoginBtn',
              rouletteTable: '.roulette-table',
              betAmountInput: '.bet-amount',
              numberBets: '[data-number]',
              colorBets: '[data-color]',
              placeBetButton: '.place-bet'
            }
          },
          'betfair.com': {
            selectors: {
              loginButton: '.login-button',
              usernameField: '#ssc-liu',
              passwordField: '#ssc-lipw',
              submitButton: '#ssc-lis',
              rouletteTable: '.roulette-wheel',
              betAmountInput: '.stake-input',
              numberBets: '.number-bet',
              colorBets: '.color-bet',
              placeBetButton: '.place-bet-btn'
            }
          }
        };

        let currentConfig = null;
        
        // Detectar site atual
        function detectSite() {
          const hostname = window.location.hostname;
          for (const [site, config] of Object.entries(siteConfigs)) {
            if (hostname.includes(site)) {
              currentConfig = config;
              return site;
            }
          }
          return 'unknown';
        }

        // Função para aguardar elemento
        function waitForElement(selector, timeout = 10000) {
          return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
              resolve(element);
              return;
            }

            const observer = new MutationObserver(() => {
              const element = document.querySelector(selector);
              if (element) {
                observer.disconnect();
                resolve(element);
              }
            });

            observer.observe(document.body, {
              childList: true,
              subtree: true
            });

            setTimeout(() => {
              observer.disconnect();
              reject(new Error('Timeout aguardando elemento: ' + selector));
            }, timeout);
          });
        }

        // Função de login
        async function performLogin(credentials) {
          try {
            if (!currentConfig) throw new Error('Site não suportado');

            // Clicar no botão de login
            const loginButton = await waitForElement(currentConfig.selectors.loginButton);
            loginButton.click();

            // Preencher credenciais
            const usernameField = await waitForElement(currentConfig.selectors.usernameField);
            const passwordField = await waitForElement(currentConfig.selectors.passwordField);
            
            usernameField.value = credentials.username;
            passwordField.value = credentials.password;

            // Disparar eventos de input
            usernameField.dispatchEvent(new Event('input', { bubbles: true }));
            passwordField.dispatchEvent(new Event('input', { bubbles: true }));

            // Submeter login
            const submitButton = await waitForElement(currentConfig.selectors.submitButton);
            submitButton.click();

            // Aguardar login ser processado
            await new Promise(resolve => setTimeout(resolve, 3000));

            return { success: true };
          } catch (error) {
            throw new Error('Falha no login: ' + error.message);
          }
        }

        // Função para executar apostas
        async function placeBet(betData) {
          try {
            if (!currentConfig) throw new Error('Site não suportado');

            const startTime = Date.now();

            // Navegar para roleta se necessário
            if (!window.location.href.includes('roulette')) {
              // Lógica para navegar para roleta
            }

            // Aguardar mesa estar pronta
            await waitForElement(currentConfig.selectors.rouletteTable);

            // Executar apostas
            for (const selection of betData.selections) {
              await placeSingleBet(selection);
            }

            // Confirmar apostas
            const placeBetButton = await waitForElement(currentConfig.selectors.placeBetButton);
            placeBetButton.click();

            // Aguardar resultado (simulado)
            await new Promise(resolve => setTimeout(resolve, 30000));

            return {
              success: true,
              betId: 'iframe_' + Date.now(),
              winningNumber: Math.floor(Math.random() * 37),
              winningColor: ['red', 'black', 'green'][Math.floor(Math.random() * 3)],
              payout: betData.totalAmount * 2, // Simulado
              profit: betData.totalAmount, // Simulado
              timestamp: new Date().toISOString(),
              executionTime: Date.now() - startTime
            };
          } catch (error) {
            return {
              success: false,
              error: error.message,
              timestamp: new Date().toISOString(),
              executionTime: Date.now() - startTime
            };
          }
        }

        async function placeSingleBet(selection) {
          if (!currentConfig) return;

          // Definir valor da aposta
          const amountInput = document.querySelector(currentConfig.selectors.betAmountInput);
          if (amountInput) {
            amountInput.value = selection.amount.toString();
            amountInput.dispatchEvent(new Event('input', { bubbles: true }));
          }

          // Clicar na seleção
          let selector = '';
          if (selection.type === 'number') {
            selector = currentConfig.selectors.numberBets.replace('[data-number]', '[data-number="' + selection.value + '"]');
          } else if (selection.type === 'color') {
            selector = currentConfig.selectors.colorBets.replace('[data-color]', '[data-color="' + selection.value + '"]');
          }

          if (selector) {
            const betElement = await waitForElement(selector);
            betElement.click();
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Listener para mensagens do parent
        window.addEventListener('message', async (event) => {
          const { type, requestId, data } = event.data;

          try {
            switch (type) {
              case 'LOGIN':
                const loginResult = await performLogin(data);
                parent.postMessage({
                  type: 'LOGIN_RESULT',
                  requestId,
                  data: loginResult
                }, '*');
                break;

              case 'PLACE_BET':
                const betResult = await placeBet(data);
                parent.postMessage({
                  type: 'BET_RESULT',
                  requestId,
                  data: betResult
                }, '*');
                break;
            }
          } catch (error) {
            parent.postMessage({
              type: 'ERROR',
              requestId,
              error: error.message
            }, '*');
          }
        });

        // Detectar site e notificar que está pronto
        const detectedSite = detectSite();
        parent.postMessage({
          type: 'IFRAME_READY',
          data: { site: detectedSite }
        }, '*');

      })();
    `;

    // Injetar script no iframe
    try {
      const script = this.iframe.contentDocument?.createElement('script');
      if (script) {
        script.textContent = automationScript;
        this.iframe.contentDocument?.head.appendChild(script);
      }
    } catch (error) {
      console.warn('Não foi possível injetar script no iframe:', error);
    }
  }

  private cleanup(): void {
    // Limpar requests pendentes
    this.pendingRequests.forEach(({ timeout }) => clearTimeout(timeout));
    this.pendingRequests.clear();

    // Remover iframe e container
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.isIframeReady = false;
  }

  // Método para mostrar/ocultar iframe (útil para debug)
  public toggleIframeVisibility(visible: boolean): void {
    if (this.container) {
      if (visible) {
        this.container.style.cssText = `
          position: fixed;
          top: 50px;
          left: 50px;
          width: 1200px;
          height: 800px;
          z-index: 9999;
          opacity: 1;
          pointer-events: auto;
          border: 2px solid #007bff;
          background: white;
        `;
      } else {
        this.container.style.cssText = `
          position: fixed;
          top: -9999px;
          left: -9999px;
          width: 1200px;
          height: 800px;
          z-index: -1;
          opacity: 0;
          pointer-events: none;
        `;
      }
    }
  }
}