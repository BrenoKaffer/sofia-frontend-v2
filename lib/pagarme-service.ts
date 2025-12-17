/**
 * Serviço de integração com a API do Pagar.me
 * Documentação: https://docs.pagar.me/
 */

export interface PagarmeCustomer {
  name: string;
  email: string;
  document: string;
  document_type: 'CPF' | 'CNPJ';
  type: 'individual' | 'company';
  phones?: {
    mobile_phone?: {
      country_code: string;
      area_code: string;
      number: string;
    };
  };
  address?: {
    line_1: string;
    line_2?: string;
    zip_code: string;
    city: string;
    state: string;
    country: string;
  };
}

export interface PagarmeItem {
  amount: number; // valor em centavos
  description: string;
  quantity: number;
  code?: string;
}

export interface PagarmeOrder {
  customer: PagarmeCustomer;
  items: PagarmeItem[];
  payments: PagarmePayment[];
  metadata?: Record<string, string>;
}

export interface PagarmePayment {
  payment_method: 'credit_card' | 'debit_card' | 'pix' | 'boleto';
  amount: number;
  credit_card?: {
    card: {
      number: string;
      holder_name: string;
      exp_month: number;
      exp_year: number;
      cvv: string;
    };
    installments: number;
    statement_descriptor?: string;
  };
  pix?: {
    expires_in?: number; // segundos
  };
  boleto?: {
    bank: string;
    instructions: string;
    due_at: string; // ISO 8601
  };
}

export interface PagarmeOrderResponse {
  id: string;
  code: string;
  amount: number;
  currency: string;
  closed: boolean;
  items: any[];
  customer: any;
  status: 'pending' | 'paid' | 'canceled' | 'failed';
  created_at: string;
  updated_at: string;
  charges: PagarmeCharge[];
}

export interface PagarmeCharge {
  id: string;
  code: string;
  gateway_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'canceled' | 'failed' | 'processing';
  currency: string;
  payment_method: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  customer: any;
  metadata: Record<string, string>;
  last_transaction?: {
    id: string;
    transaction_type: string;
    gateway_id: string;
    amount: number;
    status: string;
    success: boolean;
    installments: number;
    statement_descriptor: string;
    acquirer_name: string;
    acquirer_affiliation_code: string;
    acquirer_tid: string;
    acquirer_nsu: string;
    acquirer_auth_code: string;
    acquirer_message: string;
    acquirer_return_code: string;
    operation_type: string;
    card?: {
      id: string;
      first_six_digits: string;
      last_four_digits: string;
      brand: string;
      holder_name: string;
      exp_month: number;
      exp_year: number;
      status: string;
      type: string;
    };
    pix?: {
      qr_code: string;
      qr_code_url: string;
      expires_at: string;
    };
    boleto?: {
      url: string;
      barcode: string;
      nosso_numero: string;
      bank: string;
      document_number: string;
      instructions: string;
      due_at: string;
    };
  };
}

export class PagarmeService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.pagar.me/core/v5';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Cria um novo pedido no Pagar.me
   */
  async createOrder(order: PagarmeOrder): Promise<PagarmeOrderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao criar pedido: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar pedido no Pagar.me:', error);
      throw error;
    }
  }

  /**
   * Busca um pedido pelo ID
   */
  async getOrder(orderId: string): Promise<PagarmeOrderResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao buscar pedido: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar pedido no Pagar.me:', error);
      throw error;
    }
  }

  /**
   * Lista todos os pedidos
   */
  async listOrders(params?: {
    page?: number;
    size?: number;
    status?: string;
    created_since?: string;
    created_until?: string;
  }): Promise<{ data: PagarmeOrderResponse[]; paging: any }> {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }

      const url = `${this.baseUrl}/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao listar pedidos: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar pedidos no Pagar.me:', error);
      throw error;
    }
  }

  /**
   * Busca uma cobrança pelo ID
   */
  async getCharge(chargeId: string): Promise<PagarmeCharge> {
    try {
      const response = await fetch(`${this.baseUrl}/charges/${chargeId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao buscar cobrança: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar cobrança no Pagar.me:', error);
      throw error;
    }
  }

  /**
   * Cancela uma cobrança
   */
  async cancelCharge(chargeId: string, amount?: number): Promise<PagarmeCharge> {
    try {
      const body: any = {};
      if (amount) {
        body.amount = amount;
      }

      const response = await fetch(`${this.baseUrl}/charges/${chargeId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao cancelar cobrança: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao cancelar cobrança no Pagar.me:', error);
      throw error;
    }
  }

  /**
   * Valida se um webhook é válido
   */
  validateWebhook(signature: string, body: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * Cria um cliente no Pagar.me
   */
  async createCustomer(customer: PagarmeCustomer): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(customer),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao criar cliente: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar cliente no Pagar.me:', error);
      throw error;
    }
  }

  /**
   * Busca um cliente pelo ID
   */
  async getCustomer(customerId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao buscar cliente: ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar cliente no Pagar.me:', error);
      throw error;
    }
  }
}

// Instância singleton do serviço
// Remover validação em tempo de importação para não quebrar o build
// Fornecer uma fábrica para criar instâncias quando necessário
export function getPagarmeService(): PagarmeService {
  const apiKey = process.env.PAGARME_API_KEY;
  if (!apiKey) {
    // Lançar erro apenas quando chamado, não em tempo de importação
    throw new Error('PAGARME_API_KEY não configurada');
  }
  return new PagarmeService(apiKey);
}