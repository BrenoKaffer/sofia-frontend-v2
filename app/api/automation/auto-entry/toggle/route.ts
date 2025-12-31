import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Rota de compatibilidade para /api/automation/auto-entry/toggle
 * Redireciona para a funcionalidade de dynamic-strategies existente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { strategy_id, enabled } = body

    if (!strategy_id || typeof enabled !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'Parâmetros inválidos: strategy_id e enabled são obrigatórios' 
      }, { status: 400 })
    }

    // Redirecionar para a rota dynamic-strategies/toggle existente
    const toggleUrl = new URL('/api/dynamic-strategies/toggle', request.url)
    
    const toggleRequest = new Request(toggleUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: strategy_id,
        enabled: enabled,
        reason: enabled ? 'Ativada via página de estratégias' : 'Pausada via página de estratégias'
      })
    })

    // Fazer a chamada interna para a rota existente
    const response = await fetch(toggleRequest)
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: data.error || 'Falha ao alternar estratégia',
        details: data.details 
      }, { status: response.status })
    }

    return NextResponse.json({ 
      success: true, 
      message: enabled ? 'Estratégia ativada com sucesso' : 'Estratégia pausada com sucesso',
      data: data.data 
    })

  } catch (err: any) {
    console.error('Erro em /api/automation/auto-entry/toggle:', err)
    return NextResponse.json({ 
      success: false, 
      error: err?.message || 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    methods: ['POST'],
    description: 'Ativa/Desativa estratégia (compatibilidade com automation API)',
    input: { strategy_id: 'string', enabled: 'boolean' },
    output: { success: 'boolean', message: 'string', data: 'object' }
  })
}