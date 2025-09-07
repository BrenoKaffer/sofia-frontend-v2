'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getToken: () => Promise<string | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Iniciar como true para evitar redirecionamento

  useEffect(() => {
    // Para desenvolvimento, inicializar automaticamente com usuário mock
    const mockUser = {
      id: '1',
      name: 'Usuário Demo',
      email: 'demo@sofia.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    };
    setUser(mockUser);
    setIsLoading(false); // Finalizar loading após definir o usuário
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Para demonstração, aceitar qualquer email/senha válidos
    if (email && password && password.length >= 6) {
      const mockUser = {
        id: '1',
        name: 'Usuário Demo',
        email: email,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
      };
      setUser(mockUser);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simular delay de registro
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Para demonstração, aceitar qualquer dados válidos
    if (name && email && password && password.length >= 6) {
      const mockUser = {
        id: '1',
        name: name,
        email: email,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
      };
      setUser(mockUser);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const getToken = async (): Promise<string | null> => {
    // Retornar um token mock para demonstração
    return 'mock-jwt-token-for-demo';
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, getToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}