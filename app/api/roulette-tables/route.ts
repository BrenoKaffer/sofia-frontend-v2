import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

// Configuração do Backend SOFIA
const SOFIA_BACKEND_URL = process.env.SOFIA_BACKEND_URL || 'http://localhost:3001/api';
const REQUEST_TIMEOUT = 15000; // 15 segundos

// Interfaces
interface ApiResponse {
  data: any[];
  success: boolean;
  message: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    console.log('🚀 Buscando tabelas de roleta do backend...');

    // Configurar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${SOFIA_BACKEND_URL}/roulette-tables`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`,
          'User-Agent': 'Sofia-Frontend/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Erro do backend: ${response.status} ${response.statusText}`);
        
        // Fallback para dados mock em caso de erro
        const defaultTables = [
          { 
            id: 'pragmatic-brazilian-roulette', 
            name: 'Pragmatic Roleta Brasileira',
            status: 'online', 
            last_updated: new Date().toISOString(),
            provider: 'Pragmatic Play',
            min_bet: 1.0,
            max_bet: 500.0,
            currency: 'BRL'
          },
          { 
            id: 'evolution-auto-roulette', 
            name: 'Evolution Auto Roulette',
            status: 'online', 
            last_updated: new Date().toISOString(),
            provider: 'Evolution Gaming',
            min_bet: 0.5,
            max_bet: 1000.0,
            currency: 'BRL'
          },
          { 
            id: 'playtech-premium-roulette', 
            name: 'Playtech Premium Roulette',
            status: 'maintenance', 
            last_updated: new Date().toISOString(),
            provider: 'Playtech',
            min_bet: 2.0,
            max_bet: 750.0,
            currency: 'BRL'
          }
        ];
        
        return NextResponse.json(defaultTables, {
          status: 200,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }

      const tablesData = await response.json();
      
      // Validar estrutura da resposta
      if (tablesData && typeof tablesData === 'object') {
        if (tablesData.data && Array.isArray(tablesData.data)) {
          return NextResponse.json(tablesData.data, {
            status: 200,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
        } else if (Array.isArray(tablesData)) {
          return NextResponse.json(tablesData, {
            status: 200,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
        }
      }
      
      throw new Error('Formato de resposta inválido do backend');
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Erro ao buscar tabelas:', fetchError);
      
      // Fallback para dados mock
      const defaultTables = [
        { 
          id: 'pragmatic-brazilian-roulette', 
          name: 'Pragmatic Roleta Brasileira',
          status: 'online', 
          last_updated: new Date().toISOString(),
          provider: 'Pragmatic Play',
          min_bet: 1.0,
          max_bet: 500.0,
          currency: 'BRL'
        },
        { 
          id: 'evolution-auto-roulette', 
          name: 'Evolution Auto Roulette',
          status: 'online', 
          last_updated: new Date().toISOString(),
          provider: 'Evolution Gaming',
          min_bet: 0.5,
          max_bet: 1000.0,
          currency: 'BRL'
        },
        { 
          id: 'playtech-premium-roulette', 
          name: 'Playtech Premium Roulette',
          status: 'maintenance', 
          last_updated: new Date().toISOString(),
          provider: 'Playtech',
          min_bet: 2.0,
          max_bet: 750.0,
          currency: 'BRL'
        }
      ];
      
      return NextResponse.json(defaultTables, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
  } catch (error) {
    console.error('Erro geral na API de tabelas:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
