// Mock Authentication System
// Substitui temporariamente o Supabase para desenvolvimento

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  cpf?: string;
  fullName?: string;
}

// Usuários mock para teste
const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    name: 'Usuário Teste',
    email: 'teste@sofia.com',
    fullName: 'Usuário de Teste SOFIA',
    cpf: '123.456.789-00'
  },
  {
    id: '2',
    name: 'Admin',
    email: 'admin@sofia.com',
    fullName: 'Administrador SOFIA',
    cpf: '987.654.321-00'
  }
];

// Simula delay de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockAuthService {
  private currentUser: MockUser | null = null;
  private isAuthenticated = false;

  constructor() {
    // Verificar se há usuário salvo no localStorage
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('mock_user');
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
          this.isAuthenticated = true;
        } catch (error) {
          console.error('[MOCK-AUTH] Erro ao carregar usuário salvo:', error);
          localStorage.removeItem('mock_user');
        }
      }
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: MockUser; error?: string }> {
    console.log('[MOCK-AUTH] Tentativa de login:', { email });
    
    // Simular delay de rede
    await delay(800);

    // Verificar credenciais mock
    const user = MOCK_USERS.find(u => u.email === email);
    
    if (!user) {
      return {
        success: false,
        error: 'Usuário não encontrado'
      };
    }

    // Para o mock, qualquer senha funciona (exceto vazia)
    if (!password || password.length < 3) {
      return {
        success: false,
        error: 'Senha deve ter pelo menos 3 caracteres'
      };
    }

    // Login bem-sucedido
    this.currentUser = user;
    this.isAuthenticated = true;

    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_user', JSON.stringify(user));
    }

    console.log('[MOCK-AUTH] Login bem-sucedido:', user);
    
    return {
      success: true,
      user
    };
  }

  async register(name: string, email: string, password: string, cpf?: string, fullName?: string): Promise<{ success: boolean; user?: MockUser; error?: string }> {
    console.log('[MOCK-AUTH] Tentativa de registro:', { name, email });
    
    // Simular delay de rede
    await delay(1000);

    // Verificar se email já existe
    const existingUser = MOCK_USERS.find(u => u.email === email);
    if (existingUser) {
      return {
        success: false,
        error: 'Email já está em uso'
      };
    }

    // Criar novo usuário mock
    const newUser: MockUser = {
      id: Date.now().toString(),
      name,
      email,
      fullName: fullName || name,
      cpf
    };

    // Adicionar à lista de usuários mock
    MOCK_USERS.push(newUser);

    // Login automático após registro
    this.currentUser = newUser;
    this.isAuthenticated = true;

    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_user', JSON.stringify(newUser));
    }

    console.log('[MOCK-AUTH] Registro bem-sucedido:', newUser);
    
    return {
      success: true,
      user: newUser
    };
  }

  async logout(): Promise<void> {
    console.log('[MOCK-AUTH] Fazendo logout');
    
    this.currentUser = null;
    this.isAuthenticated = false;

    // Remover do localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_user');
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.isAuthenticated || !this.currentUser) {
      return null;
    }
    
    // Retornar um token mock
    return `mock_token_${this.currentUser.id}_${Date.now()}`;
  }

  getCurrentUser(): MockUser | null {
    return this.currentUser;
  }

  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  // Método para simular verificação de sessão
  async checkSession(): Promise<MockUser | null> {
    // Simular delay
    await delay(200);
    
    return this.currentUser;
  }
}

// Instância singleton
export const mockAuthService = new MockAuthService();