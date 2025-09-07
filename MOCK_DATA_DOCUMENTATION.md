# Documentação de Dados Mock - Sistema SOFIA

## Resumo
Este documento lista todas as partes do sistema frontend que foram preenchidas com dados mock para permitir o desenvolvimento contínuo enquanto o backend está sendo ajustado.

**⚠️ IMPORTANTE**: Todos os itens listados abaixo precisam ser substituídos por dados reais do backend quando estiver funcionando corretamente.

---

## APIs com Dados Mock Implementados

### 1. **Tabelas de Roleta** (`/api/roulette-tables`)
**Arquivo**: `app/api/roulette-tables/route.ts`

**Dados Mock Incluem**:
- 6 mesas de roleta de diferentes provedores
- Status das mesas (online/maintenance)
- Contagem de jogadores
- Último número sorteado e cor
- Provedor da mesa
- Timestamp de última atualização

**Estrutura dos Dados**:
```json
{
  "id": "pragmatic-brazilian-roulette",
  "name": "Pragmatic Roleta Brasileira",
  "status": "online",
  "provider": "Pragmatic Play",
  "players_count": 47,
  "last_number": 23,
  "last_color": "red",
  "last_updated": "2025-01-05T..."
}
```

---

### 2. **Sinais em Tempo Real** (`/api/signals/recent`)
**Arquivo**: `app/api/signals/recent/route.ts`

**Dados Mock Incluem**:
- Sinais gerados com diferentes tipos (hot_number, cold_number, etc.)
- Números e cores preditos
- Nível de confiança (60-100%)
- Status do sinal (active/expired)
- Resultado (win/loss/null)
- Timestamps de criação e expiração

**Função Geradora**: `generateMockSignals(limit, tableId)`

**Estrutura dos Dados**:
```json
{
  "id": "mock_signal_...",
  "table_id": "pragmatic-brazilian-roulette",
  "signal_type": "hot_number",
  "predicted_number": 23,
  "predicted_color": "red",
  "confidence": 85,
  "status": "active",
  "result": "win",
  "created_at": "2025-01-05T...",
  "expires_at": "2025-01-05T..."
}
```

---

### 3. **Histórico de Sinais** (`/api/signals-history`)
**Arquivo**: `app/api/signals-history/route.ts`

**Dados Mock Incluem**:
- 500 registros históricos simulados
- Diferentes estratégias de IA
- Resultados validados (win/loss)
- Lucro/prejuízo por sinal
- Suporte a filtros (table_id, strategy_name)
- Paginação (limit, offset)

**Função Geradora**: `generateMockSignalsHistory(searchParams)`

**Estrutura dos Dados**:
```json
{
  "id": "mock_history_...",
  "table_id": "evolution-immersive-roulette",
  "strategy_name": "Hot Numbers AI",
  "signal_type": "color_pattern",
  "predicted_number": 15,
  "actual_number": 15,
  "result": "win",
  "profit_loss": 250,
  "confidence": 78,
  "status": "validated"
}
```

---

### 4. **KPIs e Estatísticas** (`/api/kpis`)
**Arquivo**: `app/api/kpis/route.ts`

**Dados Mock Incluem**:
- 7 estratégias diferentes de IA
- Métricas de performance (taxa de acerto, lucro/prejuízo)
- Contadores de sinais (gerados, bem-sucedidos, falhados)
- Lucro médio por vitória e prejuízo médio por derrota
- Filtro por mesa específica

**Função Geradora**: `generateMockKPIs(tableId)`

**Estrutura dos Dados**:
```json
{
  "id": "mock_kpi_0",
  "strategy_name": "Hot Numbers AI",
  "table_id": "pragmatic-mega-roulette",
  "total_signals_generated": 342,
  "successful_signals": 198,
  "failed_signals": 144,
  "assertiveness_rate_percent": 57.89,
  "total_net_profit_loss": 15420,
  "avg_profit_per_win": 156,
  "avg_loss_per_loss": 67
}
```

---

### 5. **Status das Roletas** (`/api/roulette-status`)
**Arquivo**: `app/api/roulette-status/route.ts`

**Dados Mock Incluem**:
- Status detalhado de cada mesa (active, maintenance, error)
- Informações do último giro (número, cor, timestamp)
- Estimativa do próximo giro
- Qualidade da conexão
- Porcentagem de uptime
- Contagem de jogadores em tempo real

**Função Geradora**: `generateMockRouletteStatus()`

**Estrutura dos Dados**:
```json
{
  "id": "status_pragmatic-brazilian-roulette",
  "table_id": "pragmatic-brazilian-roulette",
  "table_name": "Pragmatic Roleta Brasileira",
  "provider": "Pragmatic Play",
  "status": "active",
  "players_count": 89,
  "last_spin": {
    "number": 23,
    "color": "red",
    "timestamp": "2025-01-05T...",
    "spin_duration": 28
  },
  "connection_quality": "excellent",
  "uptime_percentage": 97
}
```

---

### 6. **Preferências do Usuário** (`/api/user-preferences`)
**Arquivo**: `app/api/user-preferences/route.ts`

**Dados Mock Incluem**:
- Estratégias preferidas do usuário
- Mesas monitoradas
- Configurações de notificações
- Configurações de exibição (tema, idioma, fuso horário)
- Configurações de gerenciamento de risco
- Suporte a GET e PUT (buscar e salvar)

**Função Geradora**: `generateMockUserPreferences()`

**Estrutura dos Dados**:
```json
{
  "user_id": "mock_user_123",
  "strategies": ["Hot Numbers AI", "Pattern Recognition"],
  "tables": ["pragmatic-brazilian-roulette"],
  "notifications": {
    "email_enabled": true,
    "signal_alerts": true
  },
  "display_settings": {
    "theme": "dark",
    "language": "pt-BR",
    "currency": "BRL"
  },
  "risk_management": {
    "max_bet_amount": 1000,
    "daily_loss_limit": 5000
  }
}
```

---

## Como os Dados Mock Funcionam

### Estratégia de Fallback
Todas as APIs implementam uma estratégia de fallback em duas situações:

1. **Erro de Conexão**: Quando o backend não responde ou retorna erro HTTP
2. **Exceção**: Quando ocorre qualquer erro durante a execução

### Identificação nos Logs
Todos os dados mock são identificados nos logs do console com mensagens como:
- `⚠️ Usando [tipo] mock (fallback)`
- `⚠️ Usando [tipo] mock (fallback devido a erro)`

### Comentários no Código
Todos os dados mock estão marcados com comentários:
```javascript
// MOCK DATA: Fallback com dados simulados para desenvolvimento
```

---

## Checklist para Substituição por Dados Reais

### Quando o Backend Estiver Funcionando:

- [ ] **Tabelas de Roleta**: Remover função `defaultTables` e fallback
- [ ] **Sinais Recentes**: Remover função `generateMockSignals` e fallbacks
- [ ] **Histórico de Sinais**: Remover função `generateMockSignalsHistory` e fallbacks
- [ ] **KPIs**: Remover função `generateMockKPIs` e fallbacks
- [ ] **Status das Roletas**: Remover função `generateMockRouletteStatus` e fallbacks
- [ ] **Preferências do Usuário**: Remover função `generateMockUserPreferences` e fallbacks

### Testes Necessários:
- [ ] Verificar se todas as APIs retornam dados reais do backend
- [ ] Confirmar que os formatos de dados são compatíveis
- [ ] Testar cenários de erro (backend offline)
- [ ] Validar performance com dados reais
- [ ] Verificar se filtros e paginação funcionam corretamente

---

## Observações Importantes

1. **Dados Realistas**: Todos os dados mock foram criados para serem o mais realistas possível
2. **Variabilidade**: Os dados incluem variações (mesas online/offline, diferentes resultados)
3. **Timestamps**: Todos os timestamps são gerados dinamicamente
4. **Filtros**: As APIs mock respeitam os parâmetros de filtro quando fornecidos
5. **Paginação**: Implementada onde necessário (histórico de sinais)

---

**Data de Criação**: 05/01/2025  
**Última Atualização**: 05/01/2025  
**Responsável**: Sistema de IA - Implementação de Dados Mock

---

> ⚠️ **LEMBRETE**: Este arquivo deve ser removido quando todos os dados mock forem substituídos por dados reais do backend.