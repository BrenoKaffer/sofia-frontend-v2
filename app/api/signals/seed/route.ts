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

    // Gerar dados de demonstração para sinais
    const now = new Date();
    const demoSignals = [];

    // Estratégias disponíveis
    const strategies = [
      'Martingale Clássico',
      'Fibonacci Avançado', 
      'D\'Alembert Plus',
      'Paroli Modificado',
      'Labouchère Pro',
      'As Dúzias (Atrasadas)',
      'Terminais que se Puxam',
      'A Cor do Jogo'
    ];

    const betTypes = [
      'Straight Up',
      'Split',
      'Street',
      'Corner',
      'Dozen + Column Protection',
      'Red/Black',
      'Even/Odd'
    ];

    const tableIds = [
      'pragmatic-brazilian',
      'pragmatic-mega-roulette',
      'evolution-immersive',
      'evolution-live',
      'evolution-lightning',
      'pragmatic-speed'
    ];

    // Gerar 10 sinais de demonstração
    for (let i = 0; i < 10; i++) {
      const strategy = strategies[Math.floor(Math.random() * strategies.length)];
      const tableId = tableIds[Math.floor(Math.random() * tableIds.length)];
      const betType = betTypes[Math.floor(Math.random() * betTypes.length)];
      
      // Gerar apostas sugeridas baseadas no tipo
      let suggestedBets = [];
      if (betType === 'Dozen + Column Protection') {
        suggestedBets = ['1st 12', 'Column 2', 'Column 3'];
      } else if (betType === 'Red/Black') {
        suggestedBets = ['Red'];
      } else if (betType === 'Straight Up') {
        const nums = [];
        for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) {
          nums.push((Math.floor(Math.random() * 37)).toString());
        }
        suggestedBets = nums;
      } else {
        suggestedBets = ['Corner 1-2-4-5', 'Street 7-8-9'];
      }
      
      // Timestamp de geração (últimos 30 minutos)
      const timestampGenerated = new Date(now.getTime() - Math.random() * 30 * 60 * 1000);
      
      // Expiração (1-3 minutos após geração)
      const expiresAt = new Date(timestampGenerated.getTime() + (Math.random() * 2 + 1) * 60 * 1000);
      
      const confidenceLevels = ['High', 'Medium', 'Low'];
      const confidenceLevel = confidenceLevels[Math.floor(Math.random() * confidenceLevels.length)];
      
      const signal = {
        timestamp_generated: timestampGenerated.toISOString(),
        table_id: tableId,
        strategy_name: strategy,
        suggested_bets: suggestedBets,
        suggested_units: Math.floor(Math.random() * 5) + 1,
        confidence_level: confidenceLevel,
        message: `Estratégia "${strategy}" ativada. Sugere apostar em: ${suggestedBets.join(', ')}. Confiança: ${confidenceLevel}.`,
        is_validated: false,
        type: betType,
        expires_at: expiresAt.toISOString()
      };
      
      demoSignals.push(signal);
    }

    // Limpar sinais existentes de demonstração (últimas 2 horas)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const { error: deleteError } = await supabase
      .from('generated_signals')
      .delete()
      .gte('timestamp_generated', twoHoursAgo.toISOString());

    if (deleteError) {
      console.log('Aviso: Não foi possível limpar sinais de demonstração existentes:', deleteError);
    }

    // Inserir novos sinais de demonstração
    const { data, error } = await supabase
      .from('generated_signals')
      .insert(demoSignals)
      .select();

    if (error) {
      console.error('Erro ao inserir sinais de demonstração:', error);
      return NextResponse.json(
        { error: 'Erro ao inserir sinais de demonstração', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Sinais de demonstração inseridos com sucesso:', data);
    
    return NextResponse.json({
      message: 'Sinais de demonstração inseridos com sucesso',
      data: data,
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Erro na API de seed de sinais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST para inserir sinais de demonstração',
    endpoint: '/api/signals/seed',
    method: 'POST',
    description: 'Popula a tabela generated_signals com dados de demonstração'
  });
}