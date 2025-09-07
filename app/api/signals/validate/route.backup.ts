import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const body = await request.json();
    const { signal_id, result, winning_number, net_payout } = body;

    // Validar parâmetros obrigatórios
    if (!signal_id || !result || winning_number === undefined) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: signal_id, result, winning_number' },
        { status: 400 }
      );
    }

    // Buscar o sinal para validação
    const { data: signal, error: fetchError } = await supabase
      .from('generated_signals')
      .select('*')
      .eq('id', signal_id)
      .single();

    if (fetchError || !signal) {
      return NextResponse.json(
        { error: 'Sinal não encontrado' },
        { status: 404 }
      );
    }

    // Calcular expected_return baseado no resultado
    let calculatedExpectedReturn = 0;
    
    if (result === 'hit') {
      // Se foi hit, usar net_payout fornecido ou calcular baseado nas unidades
      calculatedExpectedReturn = net_payout || (signal.suggested_units * 35); // Multiplicador padrão para hit
    } else if (result === 'miss') {
      // Se foi miss, perda das unidades apostadas
      calculatedExpectedReturn = -(signal.suggested_units * 1); // Perda das unidades
    }

    // Atualizar o sinal com o resultado da validação
    const { data: updatedSignal, error: updateError } = await supabase
      .from('generated_signals')
      .update({
        is_validated: true,
        validation_result: result,
        winning_number: winning_number,
        net_payout: calculatedExpectedReturn,
        expected_return: calculatedExpectedReturn,
        validated_at: new Date().toISOString()
      })
      .eq('id', signal_id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar sinal:', updateError);
      return NextResponse.json(
        { error: 'Erro ao validar sinal', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Sinal validado com sucesso:', updatedSignal);
    
    return NextResponse.json({
      message: 'Sinal validado com sucesso',
      signal: updatedSignal,
      expected_return: calculatedExpectedReturn
    });
  } catch (error) {
    console.error('Erro na API de validação de sinais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST para validar um sinal',
    endpoint: '/api/signals/validate',
    method: 'POST',
    description: 'Valida um sinal como hit ou miss e calcula o expected_return real',
    parameters: {
      signal_id: 'ID do sinal a ser validado',
      result: 'hit ou miss',
      winning_number: 'Número que saiu na roleta',
      net_payout: 'Lucro líquido real (opcional, será calculado se não fornecido)'
    }
  });
}