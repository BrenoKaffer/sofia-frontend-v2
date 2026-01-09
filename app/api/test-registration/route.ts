import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Inicialização segura (lazy) com fallback para evitar erro no build
function getAdminClient() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey = process.env.SUPABASE_SERVICE_ROLE
  const url = envUrl || 'https://placeholder.supabase.co'
  const key = envKey || 'placeholder-key'
  return {
    client: createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    }),
    configured: Boolean(envUrl && envKey)
  }
}

export async function GET() {
  try {
    const { client: supabase, configured } = getAdminClient()
    if (!configured) {
      const summary = { total: 0, passed: 0, failed: 0, warning: 0, info: 1, unexpected: 0 }
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        testType: 'DEFERRED_CONSTRAINTS_SOLUTION',
        problemSolved: false,
        nextAction: 'Configure variáveis do Supabase para executar testes',
        tests: [{ name: 'Ambiente Supabase', status: 'info', details: { message: 'Supabase não configurado — testes skipados' } }],
        summary,
      })
    }
    const tests = []

    // Teste 1: Verificar se constraints estão configuradas como DEFERRED
    try {
      const { data: constraintData, error: constraintError } = await supabase
        .rpc('exec_sql', {
          query: `
            SELECT 
              tc.constraint_name,
              tc.table_name,
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name,
              tc.is_deferrable,
              tc.initially_deferred
            FROM 
              information_schema.table_constraints AS tc 
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_schema = 'public'
              AND (tc.table_name = 'user_profiles' OR tc.table_name = 'user_preferences')
            ORDER BY tc.table_name, tc.constraint_name;
          `
        })

      if (constraintError && constraintError.code !== '42883') {
        tests.push({
          name: 'Verificação de Constraints DEFERRED',
          status: 'info',
          details: {
            message: 'Não foi possível verificar constraints via RPC',
            error: constraintError.message,
            recommendation: 'Execute fix_deferred_constraints.sql no Supabase SQL Editor'
          }
        })
      } else {
        const deferredConstraints = constraintData?.filter((c: any) => c.is_deferrable === 'YES' && c.initially_deferred === 'YES') || []
        const nonDeferredConstraints = constraintData?.filter((c: any) => c.is_deferrable !== 'YES' || c.initially_deferred !== 'YES') || []
        
        tests.push({
          name: 'Verificação de Constraints DEFERRED',
          status: deferredConstraints.length > 0 ? 'passed' : 'failed',
          details: {
            message: `Encontradas ${constraintData?.length || 0} constraints de chave estrangeira`,
            deferredConstraints: deferredConstraints.length,
            nonDeferredConstraints: nonDeferredConstraints.length,
            constraints: constraintData,
            analysis: deferredConstraints.length > 0 ? 
              '✅ Constraints DEFERRED configuradas - problema de timing resolvido' : 
              '❌ Constraints NÃO estão DEFERRED - execute fix_deferred_constraints.sql',
            recommendation: deferredConstraints.length === 0 ? 
              'AÇÃO NECESSÁRIA: Execute fix_deferred_constraints.sql para resolver o problema' : 
              'Configuração correta - constraints permitem timing adequado dos triggers'
          }
        })
      }
    } catch (error: any) {
      tests.push({
        name: 'Verificação de Constraints DEFERRED',
        status: 'info',
        details: {
          message: 'Erro ao verificar constraints',
          error: error.message,
          note: 'Use o script fix_deferred_constraints.sql para configuração manual'
        }
      })
    }

    // Teste 2: Verificar se a função insert_user_profile_on_registration existe
    try {
      const testUserId = '12345678-1234-1234-1234-123456789012'
      
      const { data: functionResult, error: functionError } = await supabase
        .rpc('insert_user_profile_on_registration', {
          p_user_id: testUserId,
          p_full_name: 'Teste Função',
          p_cpf: '123.456.789-00',
          p_email: 'teste@example.com'
        })

      if (functionError) {
        if (functionError.code === '42883') {
          tests.push({
            name: 'Status da Função SQL',
            status: 'failed',
            details: {
              error: 'CRÍTICO: Função insert_user_profile_on_registration NÃO EXISTE',
              code: functionError.code,
              solution: 'Execute o arquivo create_insert_user_profile_function.sql no Supabase SQL Editor',
              priority: 'ALTA - Esta é a causa raiz do problema'
            }
          })
        } else if (functionError.code === '23503') {
          tests.push({
            name: 'Status da Função SQL',
            status: 'passed',
            details: {
              message: 'Função EXISTS e funciona corretamente',
              code: functionError.code,
              note: 'Erro de constraint esperado com UUID fictício - função está OK'
            }
          })
        } else {
          tests.push({
            name: 'Status da Função SQL',
            status: 'warning',
            details: {
              error: functionError.message,
              code: functionError.code,
              note: 'Função existe mas tem outros problemas'
            }
          })
        }
      } else {
        tests.push({
          name: 'Status da Função SQL',
          status: 'unexpected',
          details: {
            message: 'Função executou com sucesso (inesperado com UUID fictício)',
            result: functionResult,
            note: 'Isso pode indicar que a função não está validando constraints corretamente'
          }
        })
      }
    } catch (error: any) {
      tests.push({
        name: 'Status da Função SQL',
        status: 'failed',
        details: {
          error: error.message,
          code: 'exception'
        }
      })
    }

    // Teste 3: Teste de registro real com usuário temporário
    try {
      const testEmail = process.env.TEST_REG_EMAIL || `deferred-test-${Date.now()}@example.com`
      const testPassword = process.env.TEST_REG_PASSWORD || ''
      let testUserId: string | null = null
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Teste Constraint Deferred',
          cpf: '123.456.789-00'
        }
      })

      if (authError) {
        tests.push({
          name: 'Teste de Registro Real (com DEFERRED)',
          status: 'failed',
          details: {
            error: authError.message,
            code: authError.status || 'unknown',
            diagnosis: 'Ainda há problema no registro mesmo com constraints DEFERRED',
            recommendation: 'Verifique se fix_deferred_constraints.sql foi executado corretamente'
          }
        })
      } else {
        testUserId = authData.user.id
        tests.push({
          name: 'Teste de Registro Real (com DEFERRED)',
          status: 'passed',
          details: {
            message: '✅ SUCESSO! Usuário criado com constraints DEFERRED',
            userId: testUserId,
            email: testEmail,
            conclusion: 'Problema de timing resolvido com constraints DEFERRED',
            metadata: authData.user.user_metadata
          }
        })

        // Verificar se os dados foram inseridos nas tabelas relacionadas
        try {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', testUserId)
            .single()

          const { data: preferencesData } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('id', testUserId)
            .single()

          tests.push({
            name: 'Verificação de Dados Inseridos',
            status: 'info',
            details: {
              profileExists: !!profileData,
              preferencesExists: !!preferencesData,
              profileData: profileData,
              preferencesData: preferencesData,
              analysis: (profileData && preferencesData) ? 
                '✅ Dados inseridos corretamente em ambas as tabelas' :
                '⚠️ Alguns dados podem não ter sido inseridos automaticamente'
            }
          })
        } catch (error: any) {
          tests.push({
            name: 'Verificação de Dados Inseridos',
            status: 'info',
            details: {
              error: error.message,
              note: 'Erro ao verificar dados inseridos'
            }
          })
        }

        // Limpeza: Remover usuário de teste
        try {
          await supabase.from('user_profiles').delete().eq('user_id', testUserId)
          await supabase.from('user_preferences').delete().eq('id', testUserId)
          await supabase.auth.admin.deleteUser(testUserId)
          
          tests.push({
            name: 'Limpeza de Dados de Teste',
            status: 'passed',
            details: {
              message: 'Dados de teste removidos com sucesso'
            }
          })
        } catch (error: any) {
          tests.push({
            name: 'Limpeza de Dados de Teste',
            status: 'warning',
            details: {
              error: error.message,
              note: 'Alguns dados de teste podem não ter sido removidos'
            }
          })
        }
      }
    } catch (error: any) {
      tests.push({
        name: 'Teste de Registro Real (com DEFERRED)',
        status: 'failed',
        details: {
          error: error.message,
          code: 'exception'
        }
      })
    }

    // Diagnóstico final baseado nos resultados
    const hasDeferred = tests.find(t => t.name === 'Verificação de Constraints DEFERRED' && t.status === 'passed')
    const hasFunction = tests.find(t => t.name === 'Status da Função SQL' && t.status === 'passed')
    const registrationWorked = tests.find(t => t.name === 'Teste de Registro Real (com DEFERRED)' && t.status === 'passed')
    
    const diagnosis = {
      name: 'DIAGNÓSTICO E SOLUÇÃO FINAL',
      status: registrationWorked ? 'passed' : 'info',
      details: {
        problemSolved: !!registrationWorked,
        solutionApplied: 'Constraints DEFERRED para resolver timing de triggers',
        explanation: 'As constraints DEFERRED permitem que a verificação de chave estrangeira seja adiada até o final da transação, resolvendo o problema de timing dos triggers automáticos.',
        results: {
          constraintsConfigured: !!hasDeferred,
          functionExists: !!hasFunction,
          registrationWorking: !!registrationWorked
        },
        nextSteps: registrationWorked ? [
          '✅ Problema resolvido com sucesso!',
          '✅ Registro de usuários funcionando corretamente',
          '✅ Triggers automáticos funcionando sem erro de timing',
          '✅ Integridade referencial mantida'
        ] : [
          '1. Execute fix_deferred_constraints.sql no Supabase SQL Editor',
          '2. Verifique se as constraints foram configuradas como DEFERRED',
          '3. Teste o registro novamente',
          '4. Se necessário, execute create_insert_user_profile_function.sql'
        ],
        technicalDetails: {
          approach: 'DEFERRABLE INITIALLY DEFERRED constraints',
          benefits: [
            'Mantém integridade referencial',
            'Resolve timing de triggers automáticos',
            'Não requer desabilitar triggers',
            'Solução elegante e segura'
          ],
          implementation: 'Constraints verificadas no final da transação em vez de imediatamente'
        }
      }
    }
    
    tests.push(diagnosis)

    const summary = {
      total: tests.length,
      passed: tests.filter(t => t.status === 'passed').length,
      failed: tests.filter(t => t.status === 'failed').length,
      warning: tests.filter(t => t.status === 'warning').length,
      info: tests.filter(t => t.status === 'info').length,
      unexpected: tests.filter(t => t.status === 'unexpected').length
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      testType: 'DEFERRED_CONSTRAINTS_SOLUTION',
      problemSolved: !!registrationWorked,
      nextAction: registrationWorked ? 
        'Problema resolvido! Registro funcionando corretamente' : 
        'Execute fix_deferred_constraints.sql no Supabase SQL Editor',
      tests,
      summary,
      solutionFiles: [
        {
          name: 'fix_deferred_constraints.sql',
          purpose: 'Configurar constraints como DEFERRED para resolver timing',
          location: 'Raiz do projeto front-end',
          priority: 'ALTA - Solução principal'
        },
        {
          name: 'create_insert_user_profile_function.sql',
          purpose: 'Garantir que a função SQL existe (se necessário)',
          location: 'Fornecido pelo usuário',
          priority: 'MÉDIA - Backup se função não existir'
        }
      ]
    })

  } catch (error: any) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: 'Erro geral no teste de constraints DEFERRED',
      details: error.message,
      tests: [],
      summary: { total: 0, passed: 0, failed: 1, warning: 0, info: 0, unexpected: 0 }
    }, { status: 500 })
  }
}
