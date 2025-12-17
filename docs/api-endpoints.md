# Lista Completa de Endpoints e APIs - Frontend SOFIA

Esta documentação contém todos os endpoints e APIs que o frontend SOFIA deve consumir para funcionar corretamente.

## 🔗 APIs Principais do Backend

### 1. API Frontend (sofia-trigger-api.js)
**Base URL:** `http://localhost:3001/api`

#### Endpoints Disponíveis:

##### KPIs e Performance
```http
GET /kpis-estrategias
```
- **Descrição:** Buscar KPIs de performance das estratégias
- **Query params:** `table_id` (opcional)
- **Retorna:** Métricas de performance das estratégias

##### Histórico de Roleta
```http
GET /roulette-history
```
- **Descrição:** Buscar histórico de giros da roleta
- **Query params:** `table_id`, `limit`, `offset`
- **Retorna:** Histórico de spins com paginação

##### Sinais Recentes
```http
GET /signals/recent
```
- **Descrição:** Buscar sinais recentes
- **Query params:** `table_id`, `limit`, `confidence_min`
- **Retorna:** Lista de sinais mais recentes

##### Atributos de Sinais
```http
GET /signal-attributes
```
- **Descrição:** Buscar atributos de sinais (para filtros)
- **Retorna:** Listas de estratégias, mesas e outros filtros disponíveis

##### Preferências do Usuário
```http
GET /user-preferences
```
- **Descrição:** Buscar preferências do usuário
- **Headers:** Autenticação necessária
- **Retorna:** Configurações personalizadas do usuário

```http
PUT /user-preferences
```
- **Descrição:** Salvar/atualizar preferências do usuário
- **Headers:** Autenticação necessária
- **Body:** `selected_strategies`, `selected_tables`, `notification_settings`, `dashboard_layout`

##### Opções Disponíveis
```http
GET /available-options
```
- **Descrição:** Buscar configurações disponíveis
- **Retorna:** Estratégias e mesas disponíveis, preferências padrão

##### Histórico de Sinais
```http
GET /signals/history
```
- **Descrição:** Buscar histórico de sinais com filtros
- **Query params:** `table_id`, `strategy`, `confidence_min`, `date_from`, `date_to`, `page`, `limit`
- **Retorna:** Histórico paginado de sinais com filtros avançados

---

### 2. API Pública (publicAPISystem.js)
**Base URL:** `http://localhost:3001/api/public`
**Autenticação:** API Key necessária

#### Sinais
```http
GET /signals
```
- **Descrição:** Listar sinais recentes
- **Query params:** `table_id`, `limit`, `confidence`

```http
GET /signals/:signalId
```
- **Descrição:** Detalhes de um sinal específico

#### Mesas
```http
GET /tables
```
- **Descrição:** Listar mesas disponíveis

```http
GET /tables/:tableId/status
```
- **Descrição:** Status de uma mesa específica

```http
GET /tables/:tableId/spins
```
- **Descrição:** Últimos spins de uma mesa

#### Estatísticas
```http
GET /stats/general
```
- **Descrição:** Estatísticas gerais do sistema

```http
GET /stats/strategies
```
- **Descrição:** Performance das estratégias
- **Query params:** `table_id`, `period`

#### Predições
```http
GET /predictions/recent
```
- **Descrição:** Predições recentes
- **Query params:** `table_id`, `type`, `limit`

```http
POST /predictions/request
```
- **Descrição:** Solicitar nova predição
- **Body:** `table_id`, `spins`, `prediction_type`

#### Estratégias
```http
GET /strategies
```
- **Descrição:** Listar estratégias disponíveis

```http
GET /strategies/:strategyId/performance
```
- **Descrição:** Performance de uma estratégia
- **Query params:** `period`, `table_id`

#### Sistema
```http
GET /system/health
```
- **Descrição:** Health check da API
- **Retorna:** Status, versão, uptime

```http
GET /system/usage
```
- **Descrição:** Estatísticas de uso da API
- **Retorna:** Quota, requests, endpoints utilizados

---

## 🔄 Comunicação em Tempo Real

### 3. WebSocket de Dados (dataCollector.js)
**URL:** `wss://api.revesbot.com.br/ws`

⚠️ **Nota:** Não usar diretamente no frontend, mas sim no backend

- Recebe dados de spins em tempo real de múltiplas mesas
- **Formato da mensagem:** `{"slug": "table_id", "result": number}`
- Reconexão automática em caso de falha

### 4. Trigger API para Novos Spins
**URL:** `http://localhost:3001/new-spin-event`

```http
POST /new-spin-event
```
- **Descrição:** Recebe notificações de novos spins
- **Body:** Dados processados do spin (número, cor, mesa, timestamp)

---

## 📊 Monitoramento e Métricas

### 5. Endpoints de Monitoramento (phase3Integration.js)
- Health checks automáticos dos módulos da Fase 3
- Métricas de performance do ML Engine
- Estatísticas do Message Queue System
- Monitoramento da API Pública

### 6. KPIs e Analytics (kpiUpdater.js)
- Métricas de performance das estratégias
- ROI e win rate por estratégia
- Análise de tendências e recalibração automática
- Histórico de performance recente

---

## 🤖 Integração com IA (Fase 3)

### 7. Advanced ML Engine
- Criação autônoma de estratégias
- Estratégias nomeadas como "Estratégia Autônoma [número]"
- Otimização contínua de parâmetros
- Predições baseadas em padrões detectados

### 8. Message Queue System
- Processamento assíncrono de sinais
- Fila de tarefas para criação de estratégias
- Workers para processamento em background

---

## 🔐 Autenticação e Segurança

### 9. Sistema de API Keys
- **Níveis de acesso:** Basic, Premium, Enterprise
- Rate limiting por nível
- Monitoramento de uso e quotas
- Logs de auditoria

### 10. CORS e Middleware
- Configuração CORS para desenvolvimento
- Middleware de logging de requisições
- Tratamento de erros padronizado

---

## 📱 Considerações para o Frontend

### Implementação Recomendada:

1. **Cliente HTTP** para APIs REST
2. **WebSocket Client** para dados em tempo real
3. **Sistema de Cache** para otimizar performance
4. **Gerenciamento de Estado** para dados globais
5. **Tratamento de Erros** robusto
6. **Retry Logic** para falhas de rede
7. **Autenticação** com tokens/API keys
8. **Polling** como fallback para WebSocket

### Endpoints Críticos para Tempo Real:

- `/signals/recent` - Atualização constante
- **WebSocket connection** - Dados de spins
- `/system/health` - Monitoramento de status

---

## 🚀 Status da Integração

✅ Todos esses endpoints estão integrados e funcionando no sistema SOFIA, proporcionando:

- Base sólida para desenvolvimento do frontend
- Dados em tempo real
- Monitoramento completo
- Funcionalidades avançadas de IA

---

## 📝 Notas de Desenvolvimento

- Sempre implementar tratamento de erro para cada endpoint
- Usar debouncing para chamadas frequentes
- Implementar loading states para melhor UX
- Considerar implementar cache local para dados menos críticos
- Monitorar performance das chamadas de API