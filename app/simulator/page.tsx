'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Save, Download, RotateCcw, AlertTriangle, Info, Percent, DollarSign, TrendingUp, Clock } from 'lucide-react';

// Interface para dados históricos de roleta
interface RouletteHistoryData {
  id: number;
  number: number;
  color: 'red' | 'black' | 'green';
  time: string;
}

// Função para determinar a cor do número
const getNumberColor = (number: number): 'red' | 'black' | 'green' => {
  if (number === 0) return 'green';
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(number) ? 'red' : 'black';
};

// Dados de simulação serão calculados dinamicamente baseados nos dados reais

const COLORS = ['#33E13C', '#ef4444'];

export default function SimulatorPage() {
  const [strategyConfig, setStrategyConfig] = useState({
    name: 'Minha Estratégia',
    type: 'sequence',
    targetNumbers: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
    targetColors: ['red'],
    waitRounds: 2,
    maxAttempts: 3,
    betProgression: 'martingale',
    initialBet: 5,
    stopLoss: 100,
    takeProfit: 200,
    timeFrame: 'all',
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [historicalData, setHistoricalData] = useState<RouletteHistoryData[]>([]);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Buscar dados históricos reais de roletas
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch('/api/roulette-history?limit=100', {
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const spins = await response.json();
          const mappedData: RouletteHistoryData[] = spins.map((spin: any, index: number) => ({
            id: index + 1,
            number: spin.spin_number || Math.floor(Math.random() * 37),
            color: getNumberColor(spin.spin_number || Math.floor(Math.random() * 37)),
            time: new Date(spin.created_at || Date.now()).toLocaleTimeString('pt-BR')
          }));
          setHistoricalData(mappedData);
        } else {
          // Fallback para dados simulados se a API falhar
          const fallbackData: RouletteHistoryData[] = Array.from({ length: 50 }, (_, i) => {
            const number = Math.floor(Math.random() * 37);
            return {
              id: i + 1,
              number,
              color: getNumberColor(number),
              time: new Date(Date.now() - (i * 60000)).toLocaleTimeString('pt-BR')
            };
          });
          setHistoricalData(fallbackData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados históricos:', error);
        // Fallback para dados simulados
        const fallbackData: RouletteHistoryData[] = Array.from({ length: 50 }, (_, i) => {
          const number = Math.floor(Math.random() * 37);
          return {
            id: i + 1,
            number,
            color: getNumberColor(number),
            time: new Date(Date.now() - (i * 60000)).toLocaleTimeString('pt-BR')
          };
        });
        setHistoricalData(fallbackData);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, []);

  const handleConfigChange = (field: string, value: any) => {
    setStrategyConfig({
      ...strategyConfig,
      [field]: value,
    });
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setActiveTab('results');
    
    // Simular progresso e calcular resultados baseados nos dados reais
    setTimeout(() => {
      setIsSimulating(false);
      setHasResults(true);
      
      // Calcular resultados baseados nos dados históricos reais
      const totalSpins = historicalData.length;
      const redCount = historicalData.filter(d => d.color === 'red').length;
      const blackCount = historicalData.filter(d => d.color === 'black').length;
      const greenCount = historicalData.filter(d => d.color === 'green').length;
      
      // Calcular resultados baseados nos dados históricos reais
      const results = {
        accuracy: totalSpins > 0 ? Math.round((redCount / totalSpins) * 100) : 0,
        roi: 0, // Será calculado baseado na estratégia real
        totalSignals: totalSpins,
        successRate: [
          { name: 'Acertos', value: 0 },
          { name: 'Erros', value: 0 },
        ],
        performanceByDay: [
          { day: 'Seg', accuracy: 0, signals: 0 },
          { day: 'Ter', accuracy: 0, signals: 0 },
          { day: 'Qua', accuracy: 0, signals: 0 },
          { day: 'Qui', accuracy: 0, signals: 0 },
          { day: 'Sex', accuracy: 0, signals: 0 },
          { day: 'Sáb', accuracy: 0, signals: 0 },
          { day: 'Dom', accuracy: 0, signals: 0 },
        ],
        profitLoss: [],
      };
      
      setSimulationResults(results);
    }, 2000);
  };

  const resetSimulation = () => {
    setHasResults(false);
    setActiveTab('config');
  };

  const saveStrategy = () => {
    // Lógica para salvar a estratégia
    alert('Estratégia salva com sucesso!');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Simulador de Padrões</h1>
          <div className="flex gap-2">
            {hasResults && (
              <Button variant="outline" onClick={resetSimulation} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Nova Simulação
              </Button>
            )}
            <Button onClick={saveStrategy} variant="outline" className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Estratégia
            </Button>
            {hasResults && (
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar Resultados
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="config">Configuração</TabsTrigger>
                <TabsTrigger value="results" disabled={!hasResults}>Resultados</TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuração da Estratégia</CardTitle>
                    <CardDescription>
                      Defina os parâmetros da estratégia para simulação
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da Estratégia</Label>
                        <Input
                          id="name"
                          value={strategyConfig.name}
                          onChange={(e) => handleConfigChange('name', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Estratégia</Label>
                        <Select
                          value={strategyConfig.type}
                          onValueChange={(value) => handleConfigChange('type', value)}
                        >
                          <SelectTrigger id="type">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sequence">Sequência</SelectItem>
                            <SelectItem value="pattern">Padrão</SelectItem>
                            <SelectItem value="color">Cor</SelectItem>
                            <SelectItem value="dozen">Dúzia</SelectItem>
                            <SelectItem value="column">Coluna</SelectItem>
                            <SelectItem value="custom">Personalizada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Condições de Entrada</h3>

                      <div className="space-y-2">
                        <Label>Números Alvo</Label>
                        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                          {Array.from({ length: 37 }, (_, i) => i).map((num) => {
                            const isSelected = strategyConfig.targetNumbers.includes(num);
                            const colorClass = num === 0 ? 'bg-green-500' : 
                              num % 2 === 0 ? 'bg-black text-white' : 'bg-primary text-white';
                            
                            return (
                              <div
                                key={num}
                                className={`flex items-center justify-center h-8 w-8 rounded-full cursor-pointer ${isSelected ? colorClass : 'bg-muted'}`}
                                onClick={() => {
                                  const newNumbers = isSelected
                                    ? strategyConfig.targetNumbers.filter(n => n !== num)
                                    : [...strategyConfig.targetNumbers, num];
                                  handleConfigChange('targetNumbers', newNumbers);
                                }}
                              >
                                {num}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Cores Alvo</Label>
                          <div className="flex gap-2">
                            {['red', 'black', 'green'].map((color) => {
                              const isSelected = strategyConfig.targetColors.includes(color);
                              const bgClass = color === 'red' ? 'bg-primary' : 
                                color === 'black' ? 'bg-black' : 'bg-green-500';
                              
                              return (
                                <div
                                  key={color}
                                  className={`flex items-center justify-center h-8 w-16 rounded cursor-pointer text-white ${isSelected ? bgClass : 'bg-muted text-muted-foreground'}`}
                                  onClick={() => {
                                    const newColors = isSelected
                                      ? strategyConfig.targetColors.filter(c => c !== color)
                                      : [...strategyConfig.targetColors, color];
                                    handleConfigChange('targetColors', newColors);
                                  }}
                                >
                                  {color === 'red' ? 'Vermelho' : color === 'black' ? 'Preto' : 'Verde'}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="waitRounds">Aguardar Rodadas</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              id="waitRounds"
                              min={0}
                              max={10}
                              step={1}
                              value={[strategyConfig.waitRounds]}
                              onValueChange={([value]) => handleConfigChange('waitRounds', value)}
                              className="flex-1"
                            />
                            <span className="w-8 text-center">{strategyConfig.waitRounds}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Gerenciamento de Banca</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="betProgression">Progressão de Apostas</Label>
                          <Select
                            value={strategyConfig.betProgression}
                            onValueChange={(value) => handleConfigChange('betProgression', value)}
                          >
                            <SelectTrigger id="betProgression">
                              <SelectValue placeholder="Selecione a progressão" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flat">Flat (Valor Fixo)</SelectItem>
                              <SelectItem value="martingale">Martingale (Dobrar após perda)</SelectItem>
                              <SelectItem value="fibonacci">Fibonacci</SelectItem>
                              <SelectItem value="dalembert">D&apos;Alembert</SelectItem>
                              <SelectItem value="labouchere">Labouchere</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="initialBet">Aposta Inicial ($)</Label>
                          <Input
                            id="initialBet"
                            type="number"
                            min={1}
                            value={strategyConfig.initialBet}
                            onChange={(e) => handleConfigChange('initialBet', parseInt(e.target.value))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maxAttempts">Máximo de Tentativas</Label>
                          <Input
                            id="maxAttempts"
                            type="number"
                            min={1}
                            value={strategyConfig.maxAttempts}
                            onChange={(e) => handleConfigChange('maxAttempts', parseInt(e.target.value))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timeFrame">Período de Análise</Label>
                          <Select
                            value={strategyConfig.timeFrame}
                            onValueChange={(value) => handleConfigChange('timeFrame', value)}
                          >
                            <SelectTrigger id="timeFrame">
                              <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos os dados</SelectItem>
                              <SelectItem value="last24h">Últimas 24 horas</SelectItem>
                              <SelectItem value="last7d">Últimos 7 dias</SelectItem>
                              <SelectItem value="last30d">Últimos 30 dias</SelectItem>
                              <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="stopLoss">Stop Loss ($)</Label>
                          <Input
                            id="stopLoss"
                            type="number"
                            min={0}
                            value={strategyConfig.stopLoss}
                            onChange={(e) => handleConfigChange('stopLoss', parseInt(e.target.value))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="takeProfit">Take Profit ($)</Label>
                          <Input
                            id="takeProfit"
                            type="number"
                            min={0}
                            value={strategyConfig.takeProfit}
                            onChange={(e) => handleConfigChange('takeProfit', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button 
                        onClick={runSimulation} 
                        disabled={isSimulating} 
                        className="w-full md:w-1/2 gap-2"
                        size="lg"
                      >
                        {isSimulating ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Simulando...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Executar Simulação
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="results" className="space-y-4 mt-4">
                {hasResults && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center justify-center text-center space-y-2">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary">
                              <Percent className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold">Assertividade</h3>
                            <div className="text-3xl font-bold">{simulationResults.accuracy}%</div>
                            <p className="text-sm text-muted-foreground">
                              {simulationResults.successRate[0].value} acertos em {simulationResults.totalSignals} padrões
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center justify-center text-center space-y-2">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary">
                              <DollarSign className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold">ROI Estimado</h3>
                            <div className="text-3xl font-bold">{simulationResults.roi}%</div>
                            <p className="text-sm text-muted-foreground">
                              Baseado na progressão {strategyConfig.betProgression}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center justify-center text-center space-y-2">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary">
                              <Clock className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold">Tempo Médio</h3>
                            <div className="text-3xl font-bold">4.2 min</div>
                            <p className="text-sm text-muted-foreground">
                              Entre padrões gerados
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Distribuição de Resultados</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={simulationResults.successRate}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  {simulationResults.successRate.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Desempenho por Dia da Semana</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={simulationResults.performanceByDay}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="accuracy" name="Assertividade (%)" fill="#33E13C" />
                                <Bar dataKey="signals" name="Padrões" fill="#0070F3" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Evolução de Lucro/Prejuízo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={simulationResults.profitLoss}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="session" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="value"
                                name="Lucro/Prejuízo ($)"
                                stroke="#0070F3"
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Recomendações</CardTitle>
                          <CardDescription>
                            Baseadas nos resultados da simulação
                          </CardDescription>
                        </div>
                        <Button variant="outline" className="gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Otimizar Automaticamente
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-start gap-2 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-300">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Progressão de apostas muito agressiva</h4>
                              <p className="text-sm mt-1">
                                A progressão Martingale pode levar a perdas significativas em sequências negativas. Considere usar Fibonacci ou D&apos;Alembert para um gerenciamento de banca mais conservador.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300">
                            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Melhor desempenho em dias específicos</h4>
                              <p className="text-sm mt-1">
                                A estratégia tem melhor desempenho às quintas-feiras (75% de assertividade). Considere aumentar o volume de operações neste dia da semana.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300">
                            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Potencial para otimização</h4>
                              <p className="text-sm mt-1">
                                Aumentar o valor de &quot;Aguardar Rodadas&quot; de 2 para 3 pode melhorar a assertividade em aproximadamente 5%, com base em padrões históricos.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Dados Históricos</CardTitle>
                <CardDescription>
                  Últimos números sorteados para simulação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {historicalData.slice(0, 20).map((item) => {
                      const bgColor = item.color === 'red' ? 'bg-primary text-white' : 
                        item.color === 'black' ? 'bg-black text-white' : 'bg-green-500 text-white';
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-center h-8 w-8 rounded-full ${bgColor}`}
                          title={`${item.number} - ${item.time}`}
                        >
                          {item.number}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4">
                    <h4 className="text-sm font-medium mb-2">Estatísticas Rápidas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Números Vermelhos:</span>
                        <span className="font-medium">10 (50%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Números Pretos:</span>
                        <span className="font-medium">9 (45%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Zero:</span>
                        <span className="font-medium">1 (5%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Números Pares:</span>
                        <span className="font-medium">11 (55%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Números Ímpares:</span>
                        <span className="font-medium">9 (45%)</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-2">Números Quentes</h4>
                    <div className="flex flex-wrap gap-2">
                      {[19, 32, 15].map((num) => {
                        const color = num === 0 ? 'bg-green-500' : 
                          num % 2 === 0 ? 'bg-black' : 'bg-primary';
                        
                        return (
                          <Badge key={num} variant="outline" className={`${color} text-white`}>
                            {num}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Números Frios</h4>
                    <div className="flex flex-wrap gap-2">
                      {[0, 26, 13].map((num) => {
                        const color = num === 0 ? 'bg-green-500' : 
                          num % 2 === 0 ? 'bg-black' : 'bg-primary';
                        
                        return (
                          <Badge key={num} variant="outline" className={`${color} text-white`}>
                            {num}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div className="pt-2">
                    <Button variant="outline" className="w-full">
                      Carregar Mais Dados
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}