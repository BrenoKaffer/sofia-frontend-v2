import { NextResponse } from 'next/server';

export async function GET() {
  const templates = [
    {
      id: 'tpl-1',
      name: 'Sessão Curta Conservadora',
      description: 'Sessão de 60 min com risco baixo',
      strategy: {
        name: 'Conservadora',
        description: 'Baixo risco, foco em consistência',
        type: 'conservative',
        parameters: {
          maxBetAmount: 50,
          stopLoss: 5,
          takeProfit: 10,
          riskPercentage: 2,
          maxConsecutiveLosses: 3,
        },
        isActive: true,
      },
      defaultSettings: {
        autoStop: true,
        maxDuration: 60,
        profitTarget: 500,
        lossLimit: 100,
      },
      tags: ['curta', 'conservadora'],
    },
    {
      id: 'tpl-2',
      name: 'Sessão Longa Agressiva',
      description: 'Sessão de 240 min com maior risco',
      strategy: {
        name: 'Agressiva',
        description: 'Maior risco e potencial de retorno',
        type: 'aggressive',
        parameters: {
          maxBetAmount: 200,
          stopLoss: 15,
          takeProfit: 25,
          riskPercentage: 8,
          maxConsecutiveLosses: 5,
        },
        isActive: true,
      },
      defaultSettings: {
        autoStop: false,
        maxDuration: 240,
        profitTarget: 2000,
        lossLimit: 500,
      },
      tags: ['longa', 'agressiva'],
    },
  ];
  return NextResponse.json(templates);
}