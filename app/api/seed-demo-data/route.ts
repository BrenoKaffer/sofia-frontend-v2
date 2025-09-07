
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

    // Primeiro, vamos verificar a estrutura da tabela
    console.log('🔍 Verificando estrutura da tabela...');
    
    // Tentar fazer uma query simples para ver a estrutura
    const { data: existingData, error: selectError } = await supabase
      .from('kpi_strategy_performance_summary')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Erro ao verificar tabela:', selectError);
      return NextResponse.json(
        { error: 'Tabela não encontrada ou erro de acesso', details: selectError.message },
        { status: 500 }
      );
    }
    
    console.log('✅ Tabela encontrada, dados existentes:', existingData);

    // Dados de demonstração mínimos - usando apenas campos que certamente existem
    const demoStrategies = [
      {
        strategy_id: 'Martingale Clássico'
      },
      {
        strategy_id: 'Fibonacci Avançado'
      },
      {
        strategy_id: 'D\'Alembert Plus'
      }
    ];
    
    console.log('🔧 Tentando inserir dados mínimos:', demoStrategies);

    // Limpar dados existentes (opcional)
    const { error: deleteError } = await supabase
      .from('kpi_strategy_performance_summary')
      .delete()
      .neq('id', 0); // Deletar todos os registros

    if (deleteError) {
      console.log('Aviso: Não foi possível limpar dados existentes:', deleteError);
    }

    // Inserir dados de demonstração
    const { data, error } = await supabase
      .from('kpi_strategy_performance_summary')
      .insert(demoStrategies)
      .select();

    if (error) {
      console.error('Erro ao inserir dados de demonstração:', error);
      return NextResponse.json(
        { error: 'Erro ao inserir dados de demonstração', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Dados de demonstração inseridos com sucesso:', data);
    
    return NextResponse.json({
      message: 'Dados de demonstração inseridos com sucesso',
      data: data,
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Erro na API de seed de dados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST para inserir dados de demonstração',
    endpoint: '/api/seed-demo-data',
    method: 'POST',
    description: 'Popula a tabela kpi_strategy_performance_summary com dados de demonstração'
  });
}