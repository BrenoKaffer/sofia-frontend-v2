// lib/supabaseClient.ts
// DEPRECATED: Este arquivo não é mais usado após migração para backend SOFIA
// Mantido apenas para compatibilidade com imports existentes

console.log('⚠️ supabaseClient.ts está deprecated - usando backend SOFIA');

// Stub object para evitar erros de importação
export const supabase = {
  // Métodos vazios para compatibilidade
  channel: () => ({
    on: () => ({
      subscribe: () => ({})
    }),
    subscribe: () => ({})
  }),
  removeChannel: () => {},
  from: () => ({
    select: () => ({
      order: () => ({
        limit: () => ({
          then: () => Promise.resolve({ data: [], error: null })
        })
      })
    })
  })
};