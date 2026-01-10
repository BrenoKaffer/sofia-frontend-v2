// Página de teste para simular o fluxo completo
'use client';

import { useState } from 'react';

export default function TestRecoveryPage() {
  const [email, setEmail] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runFullTest = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      // 1. Gerar link de recuperação
      const generateResponse = await fetch('/api/forgot-password/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, testType: 'full' })
      });
      
      const generateData = await generateResponse.json();
      
      // 2. Testar cada link gerado
      const linkTests = await Promise.all(
        generateData.results.map(async (result: any) => {
          if (result.link) {
            // Simular click no link
            const testUrl = new URL(result.link);
            const debugResponse = await fetch(`/api/auth/debug-token${testUrl.search}`);
            const debugData = await debugResponse.json();
            
            return {
              config: result.config,
              link: result.link,
              debug: debugData,
              hasRequiredParams: !!(debugData.query.code || debugData.hashParams.access_token)
            };
          }
          return result;
        })
      );
      
      setResults({
        generation: generateData,
        linkAnalysis: linkTests,
        summary: {
          totalLinks: linkTests.length,
          validLinks: linkTests.filter((t: any) => t.hasRequiredParams).length,
          issues: linkTests.filter((t: any) => !t.hasRequiredParams).map((t: any) => t.config)
        }
      });
      
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teste de Recuperação de Senha</h1>
      
      <div className="mb-6">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Digite um email para testar"
          className="border p-2 mr-2"
        />
        <button
          onClick={runFullTest}
          disabled={loading || !email}
          className="bg-blue-500 text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Testando...' : 'Executar Teste Completo'}
        </button>
      </div>

      {results && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Resultados:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}