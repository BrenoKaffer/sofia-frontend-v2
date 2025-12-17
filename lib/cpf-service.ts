interface CPFRequest {
  cpf: string;
  birthDate: string;
}

interface CPFResponse {
  success: boolean;
  data: {
    name: string;
    status: string;
    situation: string;
    birthDate: string;
    deathYear?: string;
    cpfNumber: string;
    registrationDate: string;
    verificationDigit: string;
    receipt: {
      emissionTime: string;
      emissionDate: string;
    };
  };
}

const API_BASE_URL = 'https://api.cpfhub.io/api/cpf';
const API_KEY = process.env.CPF_HUB_API_KEY || '';

export class CPFService {
  static async validateCPF(cpf: string, birthDate: string): Promise<CPFResponse> {
    try {
      // Detecta se está em ambiente de desenvolvimento
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           typeof window !== 'undefined' && window.location.hostname === 'localhost';
      
      // Em desenvolvimento, retorna dados simulados
      if (isDevelopment) {
        // Simula delay da API real
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Dados simulados baseados no CPF
        const simulatedData: CPFResponse = {
          success: true,
          data: {
            name: this.generateSimulatedName(cpf),
            status: 'REGULAR',
            situation: 'REGULAR',
            birthDate: birthDate,
            cpfNumber: cpf.replace(/[^\d]/g, ''),
            registrationDate: '01/01/2000',
            verificationDigit: cpf.slice(-2),
            receipt: {
              emissionTime: new Date().toLocaleTimeString(),
              emissionDate: new Date().toLocaleDateString()
            }
          }
        };
        
        return simulatedData;
      }
      
      // Verificar se a API key está configurada
      if (!API_KEY) {
        throw new Error('CPF_HUB_API_KEY não configurada nas variáveis de ambiente');
      }

      // Em produção, faz a consulta real
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: cpf.replace(/[^\d]/g, ''), // Remove pontuação
          birthDate: birthDate.replace(/[^\d]/g, ''), // Remove barras
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CPFResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao validar CPF:', error);
      
      // Em caso de erro, retorna dados simulados se estiver em desenvolvimento
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           typeof window !== 'undefined' && window.location.hostname === 'localhost';
      
      if (isDevelopment) {
        return {
          success: true,
          data: {
            name: this.generateSimulatedName(cpf),
            status: 'REGULAR',
            situation: 'REGULAR',
            birthDate: birthDate,
            cpfNumber: cpf.replace(/[^\d]/g, ''),
            registrationDate: '01/01/2000',
            verificationDigit: cpf.slice(-2),
            receipt: {
              emissionTime: new Date().toLocaleTimeString(),
              emissionDate: new Date().toLocaleDateString()
            }
          }
        };
      }
      
      throw new Error('Erro ao validar CPF. Tente novamente.');
    }
  }

  static formatCPF(cpf: string): string {
    const numbers = cpf.replace(/[^\d]/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  static formatDate(date: string): string {
    const numbers = date.replace(/[^\d]/g, '');
    if (numbers.length === 8) {
      return numbers.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
    }
    return date;
  }

  static isValidCPF(cpf: string): boolean {
    const numbers = cpf.replace(/[^\d]/g, '');
    
    if (numbers.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(numbers[9]) !== digit1) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(numbers[10]) === digit2;
  }

  static isValidDate(date: string): boolean {
    const numbers = date.replace(/[^\d]/g, '');
    if (numbers.length !== 8) return false;
    
    const day = parseInt(numbers.substring(0, 2));
    const month = parseInt(numbers.substring(2, 4));
    const year = parseInt(numbers.substring(4, 8));
    
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    return true;
  }

  // Função auxiliar para gerar nomes simulados baseados no CPF
  private static generateSimulatedName(cpf: string): string {
    const names = [
      'João Silva Santos',
      'Maria Oliveira Costa',
      'Pedro Souza Lima',
      'Ana Paula Ferreira',
      'Carlos Eduardo Alves',
      'Fernanda Santos Rocha',
      'Ricardo Pereira Dias',
      'Juliana Costa Martins'
    ];
    
    // Usa os últimos dígitos do CPF para selecionar um nome
    const index = parseInt(cpf.slice(-2)) % names.length;
    return names[index];
  }
}