import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Rota de compatibilidade para /api/automation/strategy/register
 * Registra estratégia no StrategyEngine via upload de dynamic-strategies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { strategy_id, rules, status, source } = body

    if (!strategy_id || !rules) {
      return NextResponse.json({ 
        success: false, 
        error: 'Parâmetros inválidos: strategy_id e rules são obrigatórios' 
      }, { status: 400 })
    }

    // Preparar payload para upload
    const uploadPayload = {
      name: strategy_id,
      description: `Estratégia registrada via ${source || 'Builder'}`,
      version: '1.0.0',
      author: 'SOFIA Builder',
      category: 'builder',
      nodes: rules.nodes || [],
      connections: rules.connections || [],
      status: status || 'active',
      min_spins: 10,
      max_numbers: 6,
      confidence_threshold: 0.6,
      priority: 1
    }

    // Fazer upload da estratégia
    const uploadUrl = new URL('/api/dynamic-strategies/upload-from-builder', request.url)
    
    const uploadRequest = new Request(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadPayload)
    })

    const uploadResponse = await fetch(uploadRequest)
    const uploadData = await uploadResponse.json()

    if (!uploadResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Falha ao fazer upload da estratégia',
        details: uploadData 
      }, { status: uploadResponse.status })
    }

    // Se o status for 'active', ativar a estratégia
    if (status === 'active') {
      try {
        const toggleUrl = new URL('/api/dynamic-strategies/toggle', request.url)
        
        const toggleRequest = new Request(toggleUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: strategy_id,
            enabled: true,
            reason: 'Ativação automática após registro'
          })
        })

        const toggleResponse = await fetch(toggleRequest)
        const toggleData = await toggleResponse.json()

        if (!toggleResponse.ok) {
          console.warn('Estratégia registrada mas falha na ativação:', toggleData)
        }
      } catch (toggleErr) {
        console.warn('Erro ao ativar estratégia após registro:', toggleErr)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Estratégia registrada com sucesso no StrategyEngine',
      strategy_id: strategy_id,
      upload_result: uploadData
    })

  } catch (err: any) {
    console.error('Erro em /api/automation/strategy/register:', err)
    return NextResponse.json({ 
      success: false, 
      error: err?.message || 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    methods: ['POST'],
    description: 'Registra estratégia no StrategyEngine (compatibilidade com automation API)',
    input: { 
      strategy_id: 'string', 
      rules: 'object (nodes, connections)', 
      status: 'string?', 
      source: 'string?' 
    },
    output: { success: 'boolean', message: 'string', strategy_id: 'string' }
  })
}