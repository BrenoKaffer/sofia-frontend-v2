'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  RefreshCw,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react';

// Tipos para comunicação iframe
interface IframeMessage {
  type: 'SOFIA_COMMAND' | 'SOFIA_RESPONSE' | 'SOFIA_EVENT';
  action: string;
  data?: any;
  requestId?: string;
}

interface BetExecutionData {
  numbers: number[];
  amount: number;
  betType: 'straight' | 'split' | 'corner' | 'line' | 'color';
  tableId: string;
}

interface IframeConnectionStatus {
  isConnected: boolean;
  isLoggedIn: boolean;
  currentSite: string;
  tableReady: boolean;
  balance?: number;
  lastActivity: string;
}

interface IframeBettingProviderProps {
  onBetExecuted?: (result: any) => void;
  onConnectionChange?: (status: IframeConnectionStatus) => void;
  onError?: (error: string) => void;
  suggestedBets: (string | number)[];
  autoExecute?: boolean;
}

export function IframeBettingProvider({
  onBetExecuted,
  onConnectionChange,
  onError,
  suggestedBets,
  autoExecute = false
}: IframeBettingProviderProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<IframeConnectionStatus>({
    isConnected: false,
    isLoggedIn: false,
    currentSite: '',
    tableReady: false,
    lastActivity: new Date().toISOString()
  });

  const [selectedSite, setSelectedSite] = useState('bet365');
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const [injectionProgress, setInjectionProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Map<string, any>>(new Map());

  // Sites suportados com URLs e configurações
  const supportedSites = {
    bet365: {
      name: 'Bet365',
      url: 'https://www.bet365.com',
      rouletteUrl: 'https://www.bet365.com/casino/roulette',
      loginUrl: 'https://www.bet365.com/login',
      color: 'bg-yellow-600'
    },
    betfair: {
      name: 'Betfair',
      url: 'https://www.betfair.com',
      rouletteUrl: 'https://www.betfair.com/casino/roulette',
      loginUrl: 'https://www.betfair.com/login',
      color: 'bg-blue-600'
    },
    betano: {
      name: 'Betano',
      url: 'https://www.betano.com',
      rouletteUrl: 'https://www.betano.com/casino/roulette',
      loginUrl: 'https://www.betano.com/login',
      color: 'bg-green-600'
    }
  };

  // Script de injeção para comunicação com o iframe
  const injectionScript = `
    (function() {
      console.log('🎯 SOFIA Betting Script Injected');
      
      // Configuração do site atual
      const siteConfig = {
        bet365: {
          selectors: {
            loginButton: '.hm-MainHeaderRHSLoggedOutWide_Login, .lp-UserCentredLayout_Login',
            usernameField: '#loginUsername, [data-testid="username-input"]',
            passwordField: '#loginPassword, [data-testid="password-input"]',
            submitButton: '.lms-StandardLogin_LoginBtn, [data-testid="login-submit"]',
            rouletteTable: '.roulette-table, .game-table, [data-game="roulette"]',
            betAmountInput: '.bet-amount, .stake-input, [data-testid="stake-input"]',
            numberBets: '[data-number], .number-bet, .roulette-number',
            colorBets: '[data-color], .color-bet, .red-bet, .black-bet',
            placeBetButton: '.place-bet, .confirm-bet, [data-testid="place-bet"]',
            betConfirmation: '.bet-confirmed, .bet-placed, .success-message',
            balance: '.balance, .available-balance, [data-testid="balance"]'
          }
        },
        betfair: {
          selectors: {
            loginButton: '.login-button, .header-login',
            usernameField: '#username, [name="username"]',
            passwordField: '#password, [name="password"]',
            submitButton: '.login-submit, [type="submit"]',
            rouletteTable: '.roulette-wheel, .game-area',
            betAmountInput: '.stake-input, .bet-amount',
            numberBets: '.number-bet, [data-number]',
            colorBets: '.color-bet, [data-color]',
            placeBetButton: '.confirm-bet, .place-bet',
            betConfirmation: '.bet-placed, .confirmed',
            balance: '.balance, .wallet-balance'
          }
        },
        generic: {
          selectors: {
            loginButton: '.login, .entrar, .sign-in, [data-login]',
            usernameField: '#username, #user, #email, [name="username"], [name="email"]',
            passwordField: '#password, #pass, [name="password"]',
            submitButton: '.submit, .login-btn, .entrar-btn, [type="submit"]',
            rouletteTable: '.roulette, .roleta, .table, .game-table',
            betAmountInput: '.bet-amount, .valor, .stake, .amount-input',
            numberBets: '[data-number], .number, .numero, .roulette-number',
            colorBets: '[data-color], .color, .cor, .red, .black',
            placeBetButton: '.place-bet, .apostar, .confirm, .bet-button',
            betConfirmation: '.confirmed, .confirmado, .success, .bet-placed',
            balance: '.balance, .saldo, .wallet, .available'
          }
        }
      };

      // Detectar site atual
      const hostname = window.location.hostname.toLowerCase();
      let currentSiteConfig = siteConfig.generic;
      
      if (hostname.includes('bet365')) {
        currentSiteConfig = siteConfig.bet365;
      } else if (hostname.includes('betfair')) {
        currentSiteConfig = siteConfig.betfair;
      }

      // Classe principal para automação
      class SofiaIframeAutomation {
        constructor() {
          this.config = currentSiteConfig;
          this.isReady = false;
          this.setupMessageListener();
          this.detectPageState();
          this.startHeartbeat();
        }

        setupMessageListener() {
          window.addEventListener('message', (event) => {
            if (event.data.type === 'SOFIA_COMMAND') {
              this.handleCommand(event.data);
            }
          });
        }

        async handleCommand(message) {
          const { action, data, requestId } = message;
          
          try {
            let result;
            
            switch (action) {
              case 'LOGIN':
                result = await this.performLogin(data);
                break;
              case 'NAVIGATE_TO_ROULETTE':
                result = await this.navigateToRoulette();
                break;
              case 'PLACE_BET':
                result = await this.placeBet(data);
                break;
              case 'GET_BALANCE':
                result = await this.getBalance();
                break;
              case 'CHECK_TABLE_STATUS':
                result = await this.checkTableStatus();
                break;
              case 'GET_PAGE_STATE':
                result = this.getPageState();
                break;
              default:
                throw new Error(\`Ação não suportada: \${action}\`);
            }

            this.sendResponse(requestId, { success: true, data: result });
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.sendResponse(requestId, { 
              success: false, 
              error: errorMessage 
            });
          }
        }

        async performLogin(credentials) {
          const { email, password } = credentials;
          
          // Encontrar campos de login
          const usernameField = this.findElement(this.config.selectors.usernameField);
          const passwordField = this.findElement(this.config.selectors.passwordField);
          const submitButton = this.findElement(this.config.selectors.submitButton);

          if (!usernameField || !passwordField) {
            throw new Error('Campos de login não encontrados');
          }

          // Preencher campos
          await this.humanType(usernameField, email);
          await this.delay(500, 1000);
          await this.humanType(passwordField, password);
          await this.delay(500, 1000);

          // Submeter formulário
          if (submitButton) {
            await this.humanClick(submitButton);
          } else {
            // Tentar submit via Enter
            passwordField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
          }

          // Aguardar redirecionamento
          await this.waitForNavigation();
          
          return { loggedIn: true, url: window.location.href };
        }

        async navigateToRoulette() {
          // Tentar encontrar link para roleta
          const rouletteLinks = document.querySelectorAll('a[href*="roulette"], a[href*="roleta"]');
          
          if (rouletteLinks.length > 0) {
            await this.humanClick(rouletteLinks[0]);
            await this.waitForElement(this.config.selectors.rouletteTable);
            return { navigated: true, url: window.location.href };
          }
          
          throw new Error('Link para roleta não encontrado');
        }

        async placeBet(betData) {
          const { numbers, amount, betType } = betData;
          const results = [];

          // Verificar se a mesa está pronta
          const table = this.findElement(this.config.selectors.rouletteTable);
          if (!table) {
            throw new Error('Mesa de roleta não encontrada');
          }

          // Definir valor da aposta
          await this.setBetAmount(amount);

          // Colocar apostas nos números
          for (const number of numbers) {
            try {
              await this.placeBetOnNumber(number);
              results.push({ number, status: 'placed' });
              await this.delay(200, 500);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
              results.push({ number, status: 'failed', error: errorMessage });
            }
          }

          // Confirmar apostas
          await this.confirmBets();

          return { 
            bets: results, 
            totalAmount: amount * numbers.length,
            timestamp: new Date().toISOString()
          };
        }

        async setBetAmount(amount) {
          const amountInput = this.findElement(this.config.selectors.betAmountInput);
          if (amountInput) {
            amountInput.value = '';
            await this.humanType(amountInput, amount.toString());
          }
        }

        async placeBetOnNumber(number) {
          const numberElements = document.querySelectorAll(this.config.selectors.numberBets);
          
          for (const element of numberElements) {
            const elementNumber = this.extractNumber(element);
            if (elementNumber === number) {
              await this.humanClick(element);
              return;
            }
          }
          
          throw new Error(\`Número \${number} não encontrado na mesa\`);
        }

        async confirmBets() {
          const confirmButton = this.findElement(this.config.selectors.placeBetButton);
          if (confirmButton) {
            await this.humanClick(confirmButton);
            
            // Aguardar confirmação
            await this.waitForElement(this.config.selectors.betConfirmation, 5000);
          }
        }

        async getBalance() {
          const balanceElement = this.findElement(this.config.selectors.balance);
          if (balanceElement) {
            const balanceText = balanceElement.textContent || balanceElement.value;
            const balance = parseFloat(balanceText.replace(/[^0-9.,]/g, '').replace(',', '.'));
            return { balance: isNaN(balance) ? 0 : balance };
          }
          return { balance: 0 };
        }

        checkTableStatus() {
          const table = this.findElement(this.config.selectors.rouletteTable);
          return {
            tableReady: !!table,
            url: window.location.href,
            title: document.title
          };
        }

        getPageState() {
          return {
            url: window.location.href,
            title: document.title,
            isLoggedIn: this.detectLoginState(),
            hasRouletteTable: !!this.findElement(this.config.selectors.rouletteTable),
            timestamp: new Date().toISOString()
          };
        }

        detectLoginState() {
          // Verificar se há elementos que indicam login
          const loginButton = this.findElement(this.config.selectors.loginButton);
          return !loginButton; // Se não há botão de login, provavelmente está logado
        }

        detectPageState() {
          const state = this.getPageState();
          this.sendEvent('PAGE_STATE_CHANGED', state);
        }

        startHeartbeat() {
          setInterval(() => {
            this.sendEvent('HEARTBEAT', {
              timestamp: new Date().toISOString(),
              url: window.location.href,
              isLoggedIn: this.detectLoginState()
            });
          }, 5000);
        }

        // Utilitários
        findElement(selectors) {
          const selectorList = selectors.split(', ');
          for (const selector of selectorList) {
            const element = document.querySelector(selector.trim());
            if (element) return element;
          }
          return null;
        }

        async waitForElement(selector, timeout = 10000) {
          return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
              const element = this.findElement(selector);
              if (element) {
                resolve(element);
              } else if (Date.now() - startTime > timeout) {
                reject(new Error(\`Elemento não encontrado: \${selector}\`));
              } else {
                setTimeout(check, 100);
              }
            };
            
            check();
          });
        }

        async waitForNavigation(timeout = 10000) {
          const currentUrl = window.location.href;
          return new Promise((resolve) => {
            const check = () => {
              if (window.location.href !== currentUrl) {
                resolve(true);
              } else {
                setTimeout(check, 100);
              }
            };
            setTimeout(check, 1000);
            setTimeout(() => resolve(false), timeout);
          });
        }

        async humanClick(element) {
          // Simular movimento do mouse
          element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          await this.delay(50, 150);
          
          // Click
          element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          await this.delay(50, 100);
          element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }

        async humanType(element, text) {
          element.focus();
          await this.delay(100, 300);
          
          for (const char of text) {
            element.value += char;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            await this.delay(50, 150);
          }
          
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }

        extractNumber(element) {
          const text = element.textContent || element.getAttribute('data-number') || element.value;
          const number = parseInt(text);
          return isNaN(number) ? null : number;
        }

        delay(min, max) {
          const delay = Math.floor(Math.random() * (max - min + 1)) + min;
          return new Promise(resolve => setTimeout(resolve, delay));
        }

        sendResponse(requestId, data) {
          window.parent.postMessage({
            type: 'SOFIA_RESPONSE',
            requestId,
            data
          }, '*');
        }

        sendEvent(event, data) {
          window.parent.postMessage({
            type: 'SOFIA_EVENT',
            event,
            data
          }, '*');
        }
      }

      // Inicializar automação
      window.sofiaAutomation = new SofiaIframeAutomation();
      
      // Notificar que o script foi carregado
      window.parent.postMessage({
        type: 'SOFIA_EVENT',
        event: 'SCRIPT_LOADED',
        data: { timestamp: new Date().toISOString() }
      }, '*');
      
    })();
  `;

  // Função para enviar comandos para o iframe
  const sendCommand = useCallback(async (action: string, data?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!iframeRef.current) {
        reject(new Error('Iframe não disponível'));
        return;
      }

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Armazenar request pendente
      setPendingRequests(prev => new Map(prev.set(requestId, { resolve, reject })));

      // Enviar comando
      iframeRef.current.contentWindow?.postMessage({
        type: 'SOFIA_COMMAND',
        action,
        data,
        requestId
      }, '*');

      // Timeout
      setTimeout(() => {
        setPendingRequests(prev => {
          const newMap = new Map(prev);
          const request = newMap.get(requestId);
          if (request) {
            newMap.delete(requestId);
            request.reject(new Error('Timeout'));
          }
          return newMap;
        });
      }, 30000);
    });
  }, []);

  // Listener para mensagens do iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SOFIA_RESPONSE') {
        const { requestId, data } = event.data;
        const request = pendingRequests.get(requestId);
        
        if (request) {
          setPendingRequests(prev => {
            const newMap = new Map(prev);
            newMap.delete(requestId);
            return newMap;
          });

          if (data.success) {
            request.resolve(data.data);
          } else {
            request.reject(new Error(data.error));
          }
        }
      } else if (event.data.type === 'SOFIA_EVENT') {
        handleIframeEvent(event.data.event, event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pendingRequests]);

  // Handler para eventos do iframe
  const handleIframeEvent = useCallback((event: string, data: any) => {
    const timestamp = new Date().toLocaleTimeString();
    
    switch (event) {
      case 'SCRIPT_LOADED':
        addLog('✅ Script de automação carregado');
        setInjectionProgress(100);
        break;
        
      case 'PAGE_STATE_CHANGED':
        setConnectionStatus(prev => ({
          ...prev,
          isLoggedIn: data.isLoggedIn,
          tableReady: data.hasRouletteTable,
          lastActivity: data.timestamp
        }));
        onConnectionChange?.(connectionStatus);
        break;
        
      case 'HEARTBEAT':
        setConnectionStatus(prev => ({
          ...prev,
          lastActivity: data.timestamp,
          isLoggedIn: data.isLoggedIn
        }));
        break;
        
      default:
        addLog(`📡 Evento: ${event}`);
    }
  }, [connectionStatus, onConnectionChange]);

  // Função para adicionar logs
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  }, []);

  // Função para conectar ao site
  const connectToSite = useCallback(async () => {
    try {
      const siteConfig = supportedSites[selectedSite as keyof typeof supportedSites];
      addLog(`🔗 Conectando a ${siteConfig.name}...`);
      setInjectionProgress(0);
      
      // Carregar site no iframe
      if (iframeRef.current) {
        iframeRef.current.src = siteConfig.loginUrl;
        
        // Aguardar carregamento e injetar script
        iframeRef.current.onload = () => {
          setTimeout(() => {
            try {
              const iframeDoc = iframeRef.current?.contentDocument;
              if (iframeDoc) {
                const script = iframeDoc.createElement('script');
                script.textContent = injectionScript;
                iframeDoc.head.appendChild(script);
                setInjectionProgress(50);
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
              addLog(`❌ Erro ao injetar script: ${errorMessage}`);
              onError?.(`Erro ao injetar script: ${errorMessage}`);
            }
          }, 2000);
        };
      }
      
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: true,
        currentSite: selectedSite
      }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog(`❌ Erro na conexão: ${errorMessage}`);
      onError?.(`Erro na conexão: ${errorMessage}`);
    }
  }, [selectedSite, injectionScript, onError]);

  // Função para fazer login
  const performLogin = useCallback(async () => {
    try {
      addLog('🔐 Fazendo login...');
      const result = await sendCommand('LOGIN', credentials);
      addLog('✅ Login realizado com sucesso');
      
      setConnectionStatus(prev => ({
        ...prev,
        isLoggedIn: true
      }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog(`❌ Erro no login: ${errorMessage}`);
      onError?.(`Erro no login: ${errorMessage}`);
    }
  }, [credentials, sendCommand, onError]);

  // Função para navegar para roleta
  const navigateToRoulette = useCallback(async () => {
    try {
      addLog('🎰 Navegando para roleta...');
      const result = await sendCommand('NAVIGATE_TO_ROULETTE');
      addLog('✅ Mesa de roleta carregada');
      
      setConnectionStatus(prev => ({
        ...prev,
        tableReady: true
      }));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog(`❌ Erro ao navegar: ${errorMessage}`);
      onError?.(`Erro ao navegar: ${errorMessage}`);
    }
  }, [sendCommand, onError]);

  // Função para executar aposta
  const executeBet = useCallback(async (betData: BetExecutionData) => {
    try {
      addLog(`💰 Executando aposta: ${betData.numbers.join(', ')} - R$ ${betData.amount}`);
      const result = await sendCommand('PLACE_BET', betData);
      addLog(`✅ Aposta executada: ${result.bets.length} números`);
      
      onBetExecuted?.(result);
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addLog(`❌ Erro na aposta: ${errorMessage}`);
      onError?.(`Erro na aposta: ${errorMessage}`);
      throw error;
    }
  }, [sendCommand, onBetExecuted, onError]);

  // Auto-executar apostas quando há sinais
  useEffect(() => {
    if (autoExecute && connectionStatus.tableReady && suggestedBets.length > 0) {
      const numbers = suggestedBets.slice(0, 6).map(bet => 
        typeof bet === 'string' ? parseInt(bet) : bet
      ).filter(num => num >= 0 && num <= 36);

      if (numbers.length > 0) {
        const betData: BetExecutionData = {
          numbers,
          amount: 5, // Valor padrão
          betType: 'straight',
          tableId: 'iframe-table'
        };

        executeBet(betData).catch(console.error);
      }
    }
  }, [autoExecute, connectionStatus.tableReady, suggestedBets, executeBet]);

  return (
    <div className="space-y-4">
      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-lg">Iframe Betting Provider</CardTitle>
              <Badge 
                variant={connectionStatus.isConnected ? "default" : "secondary"}
                className={`text-xs ${supportedSites[selectedSite as keyof typeof supportedSites]?.color || 'bg-gray-600'}`}
              >
                {connectionStatus.isConnected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <CardDescription>
            Execução de apostas via iframe integrado com comunicação postMessage
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus.isConnected ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-sm">
                  {connectionStatus.isLoggedIn ? 'Logado' : connectionStatus.isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              {connectionStatus.tableReady && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Mesa Pronta
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              {!connectionStatus.isConnected ? (
                <Button size="sm" onClick={connectToSite}>
                  <Globe className="w-4 h-4 mr-1" />
                  Conectar
                </Button>
              ) : !connectionStatus.isLoggedIn ? (
                <Button size="sm" onClick={performLogin} disabled={!credentials.email || !credentials.password}>
                  <Shield className="w-4 h-4 mr-1" />
                  Login
                </Button>
              ) : !connectionStatus.tableReady ? (
                <Button size="sm" onClick={navigateToRoulette}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Ir para Roleta
                </Button>
              ) : (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Pronto
                </Badge>
              )}
            </div>
          </div>

          {/* Progresso de Injeção */}
          {injectionProgress > 0 && injectionProgress < 100 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Injetando script de automação...</span>
                <span>{injectionProgress}%</span>
              </div>
              <Progress value={injectionProgress} className="h-2" />
            </div>
          )}

          {isExpanded && (
            <div className="space-y-4">
              {/* Configurações */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Casa de Apostas</Label>
                  <Select value={selectedSite} onValueChange={setSelectedSite}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(supportedSites).map(([key, site]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${site.color}`} />
                            {site.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Status da Conexão</Label>
                  <div className="text-sm text-muted-foreground">
                    {connectionStatus.lastActivity && 
                      `Última atividade: ${new Date(connectionStatus.lastActivity).toLocaleTimeString()}`
                    }
                  </div>
                </div>
              </div>

              {/* Credenciais */}
              {!connectionStatus.isLoggedIn && (
                <div className="space-y-3 p-3 bg-black/20 rounded-lg">
                  <Input
                    type="email"
                    placeholder="Email/CPF"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              )}

              {/* Logs */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Log de Atividades</Label>
                <div className="bg-black/40 rounded-lg p-3 h-32 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma atividade ainda
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, index) => (
                        <div key={index} className="text-xs font-mono text-gray-300">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Iframe */}
      {connectionStatus.isConnected && (
        <Card className={isFullscreen ? 'fixed inset-4 z-50' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {supportedSites[selectedSite as keyof typeof supportedSites]?.name} - Iframe
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              ref={iframeRef}
              className={`w-full border-0 rounded-b-lg ${
                isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-96'
              }`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              title={`${supportedSites[selectedSite as keyof typeof supportedSites]?.name} Betting Interface`}
            />
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {suggestedBets.length > 0 && !connectionStatus.tableReady && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Há {suggestedBets.length} sinais disponíveis! Configure a conexão para executar apostas automaticamente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}