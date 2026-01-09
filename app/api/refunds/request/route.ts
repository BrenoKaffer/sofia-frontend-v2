import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 1. Validar sessão
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { transaction_id, reason, description } = await request.json();

    if (!transaction_id || !reason) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });
    }

    // 2. Validar se a transação pertence ao usuário
    const { data: transaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transaction_id)
      .eq('user_id', session.user.id)
      .single();

    if (!transaction) {
      return NextResponse.json({ message: 'Transação inválida.' }, { status: 404 });
    }

    // 3. Verificar duplicidade
    const { data: existing } = await supabase
      .from('refund_requests')
      .select('id')
      .eq('transaction_id', transaction_id)
      .in('status', ['pending', 'approved'])
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Solicitação já existente.' }, { status: 400 });
    }

    // 4. Criar solicitação
    const { error } = await supabase
      .from('refund_requests')
      .insert({
        user_id: session.user.id,
        transaction_id,
        reason,
        description,
        status: 'pending'
      });

    if (error) throw error;

    return NextResponse.json({ message: 'Solicitação enviada' });

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ message: 'Erro interno' }, { status: 500 });
  }
}
