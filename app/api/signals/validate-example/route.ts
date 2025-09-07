import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Endpoint de exemplo para demonstrar como validar sinais automaticamente
 * Este endpoint simula a validação de sinais pendentes
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    // Buscar sinais não validados que já expiraram
    const now = new Date();
    const { data: expiredSignals, error: fetchError } = await supabase
      .from('generated_signals')
      .select('*')
      .eq('is_validated', false)
      .lt('expires_at', now.toISOString())
      .limit(10);

    if (fetchError) {
      console.error('Erro ao buscar sinais expirados:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar sinais' },
        { status: 500 }
      );
    }

    if (!expiredSignals || expiredSignals.length === 0) {
      return NextResponse.json({
        message: 'Nenhum sinal expirado encontrado para validação',
        validated_count: 0
      });
    }

    const validatedSignals = [];

    // Simular validação de cada sinal
    for (const signal of expiredSignals) {
      // Simular número vencedor aleatório (0-36)
      const winningNumber = Math.floor(Math.random() * 37);
      
      // Verificar se o sinal foi hit ou miss
      let isHit = false;
      
      // Verificar se alguma das apostas sugeridas foi vencedora
      if (signal.suggested_bets && Array.isArray(signal.suggested_bets)) {
        for (const bet of signal.suggested_bets) {
          if (typeof bet === 'number' && bet === winningNumber) {
            isHit = true;
            break;
          }
          // Verificar apostas especiais como Red/Black, Even/Odd, etc.
          if (typeof bet === 'string') {
            if (bet === 'Red' && isRedNumber(winningNumber)) isHit = true;
            if (bet === 'Black' && isBlackNumber(winningNumber)) isHit = true;
            if (bet === 'Even' && winningNumber % 2 === 0 && winningNumber !== 0) isHit = true;
            if (bet === 'Odd' && winningNumber % 2 === 1) isHit = true;
          }
        }
      }

      const result = isHit ? 'hit' : 'miss';
      
      // Calcular expected_return
      let calculatedReturn = 0;
      if (result === 'hit') {
        // Para hit, calcular baseado no tipo de aposta
        calculatedReturn = signal.suggested_units * 35; // Straight up payout
      } else {
        // Para miss, perda das unidades
        calculatedReturn = -(signal.suggested_units * 1);
      }

      // Atualizar o sinal
      const { data: updatedSignal, error: updateError } = await supabase
        .from('generated_signals')
        .update({
          is_validated: true,
          validation_result: result,
          winning_number: winningNumber,
          net_payout: calculatedReturn,
          expected_return: calculatedReturn,
          validated_at: new Date().toISOString()
        })
        .eq('id', signal.id)
        .select()
        .single();

      if (!updateError && updatedSignal) {
        validatedSignals.push({
          id: signal.id,
          result,
          winning_number: winningNumber,
          expected_return: calculatedReturn
        });
      }
    }

    return NextResponse.json({
      message: `${validatedSignals.length} sinais validados com sucesso`,
      validated_signals: validatedSignals,
      validated_count: validatedSignals.length
    });
  } catch (error) {
    console.error('Erro na validação automática:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para verificar números vermelhos
function isRedNumber(number: number): boolean {
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(number);
}

// Função auxiliar para verificar números pretos
function isBlackNumber(number: number): boolean {
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];
  return blackNumbers.includes(number);
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Endpoint de exemplo para validação automática de sinais',
    endpoint: '/api/signals/validate-example',
    method: 'POST',
    description: 'Valida automaticamente sinais expirados simulando resultados da roleta',
    note: 'Este é um endpoint de demonstração. Em produção, a validação seria feita com dados reais da roleta.'
  });
}