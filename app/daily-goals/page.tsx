'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  TrendingUp, 
  Trophy, 
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Star,
  Flame,
  Award,
  Plus,
  Save,
  Shield,
  Lightbulb
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar
} from 'recharts';

// Dados mock para demonstração
const initialTodayGoals = [
  {
    id: 1,
    title: 'Número de Sessões',
    target: 5,
    current: 3,
    type: 'sessions',
    priority: 'high',
    deadline: '22:00',
    completed: false
  },
  {
    id: 2,
    title: 'Taxa de Acerto',
    target: 70,
    current: 75,
    type: 'winrate',
    priority: 'medium',
    deadline: '23:59',
    completed: true
  },
  {
    id: 3,
    title: 'Tempo de Jogo',
    target: 180,
    current: 120,
    type: 'time',
    priority: 'low',
    deadline: '20:00',
    completed: false
  }
];

const weeklyProfitProgress = [
  { day: 'Seg', goal: 200, achieved: 180, completed: false },
  { day: 'Ter', goal: 200, achieved: 250, completed: true },
  { day: 'Qua', goal: 200, achieved: 120, completed: false },
  { day: 'Qui', goal: 200, achieved: 300, completed: true },
  { day: 'Sex', goal: 200, achieved: 190, completed: false },
  { day: 'Sáb', goal: 250, achieved: 280, completed: true },
  { day: 'Dom', goal: 150, achieved: 150, completed: true }
];

const weeklyProcessProgress = [
  { day: 'Seg', planned: 4, completed: 3, achieved: false },
  { day: 'Ter', planned: 4, completed: 4, achieved: true },
  { day: 'Qua', planned: 4, completed: 2, achieved: false },
  { day: 'Qui', planned: 4, completed: 4, achieved: true },
  { day: 'Sex', planned: 4, completed: 3, achieved: false },
  { day: 'Sáb', planned: 4, completed: 4, achieved: true },
  { day: 'Dom', planned: 4, completed: 4, achieved: true }
];

const achievements = [
  {
    id: 1,
    title: 'Sequência de 3 dias',
    description: 'Atingiu a meta por 3 dias consecutivos',
    icon: <Flame className="h-6 w-6 text-orange-500" />,
    unlocked: true,
    date: '15/01/2024'
  },
  {
    id: 2,
    title: 'Meta Superada',
    description: 'Superou a meta diária em 50%',
    icon: <TrendingUp className="h-6 w-6 text-green-600" />,
    unlocked: true,
    date: '12/01/2024'
  },
  {
    id: 3,
    title: 'Semana Perfeita',
    description: 'Atingiu todas as metas da semana',
    icon: <Award className="h-6 w-6 text-blue-600" />,
    unlocked: false,
    date: null
  },
  {
    id: 4,
    title: 'Disciplina Total',
    description: 'Não ultrapassou limites por 7 dias',
    icon: <Shield className="h-6 w-6 text-purple-600" />,
    unlocked: true,
    date: '10/01/2024'
  }
];

const profitGoalHistory = [
  { date: '15/01', profit: 220, goal: 200, sessions: 4, winRate: 75, completed: true },
  { date: '14/01', profit: 180, goal: 200, sessions: 3, winRate: 60, completed: false },
  { date: '13/01', profit: 250, goal: 200, sessions: 5, winRate: 80, completed: true },
  { date: '12/01', profit: 300, goal: 200, sessions: 6, winRate: 70, completed: true },
  { date: '11/01', profit: 150, goal: 200, sessions: 3, winRate: 50, completed: false },
  { date: '10/01', profit: 280, goal: 250, sessions: 5, winRate: 85, completed: true },
  { date: '09/01', profit: 190, goal: 200, sessions: 4, winRate: 65, completed: false }
];

const processGoalHistory = [
  { date: '15/01', planned: 4, completed: 4, sessions: 4, winRate: 75, achieved: true },
  { date: '14/01', planned: 4, completed: 2, sessions: 3, winRate: 60, achieved: false },
  { date: '13/01', planned: 4, completed: 4, sessions: 5, winRate: 80, achieved: true },
  { date: '12/01', planned: 4, completed: 4, sessions: 6, winRate: 70, achieved: true },
  { date: '11/01', planned: 4, completed: 1, sessions: 3, winRate: 50, achieved: false },
  { date: '10/01', planned: 4, completed: 4, sessions: 5, winRate: 85, achieved: true },
  { date: '09/01', planned: 4, completed: 3, sessions: 4, winRate: 65, achieved: false }
];

export default function DailyGoalsPage() {
  const [todayGoals, setTodayGoals] = useState(initialTodayGoals);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalType, setNewGoalType] = useState('sessions');
  const [newGoalDeadline, setNewGoalDeadline] = useState('23:59');
  const [goalValueType, setGoalValueType] = useState('fixed'); // 'fixed' ou 'percentage'
  const [baseValue, setBaseValue] = useState('1000'); // Valor base para cálculo percentual
  const [isProfitGoalEnabled, setIsProfitGoalEnabled] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState(
    "Bom dia. Disciplina hoje protege sua banca amanhã."
  );
  const [showMotivationalAlert, setShowMotivationalAlert] = useState(false);
  const [currentStreak] = useState(3);
  const [totalGoalsCompleted] = useState(12);
  
  // Estados para missões
  const [missions, setMissions] = useState([
    {
      id: 1,
      title: "Fazer 10 apostas com estratégia Martingale",
      description: "Use a estratégia Martingale em pelo menos 10 apostas hoje",
      target: 10,
      current: 3,
      type: "strategy",
      strategy: "Martingale",
      reward: "50 XP",
      completed: false
    },
    {
      id: 2,
      title: "Manter taxa de acerto acima de 70%",
      description: "Mantenha sua taxa de acerto acima de 70% durante todo o dia",
      target: 70,
      current: 85,
      type: "winrate",
      reward: "100 XP",
      completed: false
    },
    {
      id: 3,
      title: "Não exceder 5% da banca por aposta",
      description: "Mantenha a disciplina e não aposte mais que 5% da banca",
      target: 1,
      current: 1,
      type: "discipline",
      reward: "75 XP",
      completed: true
    }
  ]);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await fetch('/api/user-preferences');
        if (!res.ok) throw new Error('Erro ao buscar preferências');
        const prefs = await res.json();
        const targetProfit = Number(prefs?.daily_goal ?? 0);
        const base = Number(prefs?.initial_bankroll ?? 1000);
        setBaseValue(String(base));
        const shouldEnableProfitGoal = targetProfit > 0;
        setIsProfitGoalEnabled(shouldEnableProfitGoal);
        setTodayGoals(prev => {
          const withoutProfit = prev.filter(g => g.type !== 'profit');
          if (!shouldEnableProfitGoal) return withoutProfit;
          const existing = prev.find(g => g.type === 'profit');
          if (existing) {
            return [{ ...existing, target: targetProfit }, ...withoutProfit];
          }
          return [
            {
              id: Date.now(),
              title: 'Meta de Lucro',
              target: targetProfit,
              current: 0,
              type: 'profit',
              priority: 'low',
              deadline: '23:59',
              completed: false
            },
            ...withoutProfit
          ];
        });
      } catch (e) {
        // fallback silencioso
      }
    };
    fetchPrefs();
  }, []);

  // Calcular estatísticas do dia
  const todayStats = {
    totalGoals: todayGoals.length,
    completedGoals: todayGoals.filter(g => g.completed).length,
    totalProgress: todayGoals.length > 0
      ? todayGoals.reduce((sum, goal) => {
        const progress = Math.min((goal.current / goal.target) * 100, 100);
        return sum + progress;
      }, 0) / todayGoals.length
      : 0,
    estimatedCompletion: '18:30' // Mock
  };

  // Função para calcular valor da meta baseado no tipo
  const calculateGoalValue = () => {
    if (newGoalType === 'profit' && goalValueType === 'percentage') {
      const base = parseFloat(baseValue) || 1000;
      const percentage = parseFloat(newGoalTarget) || 0;
      return (base * percentage) / 100;
    }
    return parseFloat(newGoalTarget) || 0;
  };

  // Função para gerar feedback motivacional com LLM
  const generateMotivationalFeedback = async (type: 'achievement' | 'encouragement') => {
    const messages = {
      achievement: [
        "Meta concluída. Boa execução e disciplina.",
        "Você manteve o processo. Isso protege sua banca no longo prazo.",
        "Ótimo. Consistência hoje reduz risco amanhã.",
        "Execução sólida. Continue no ritmo."
      ],
      encouragement: [
        "Mantenha o foco no processo. Uma decisão por vez.",
        "Menos pressa, mais controle. Continue.",
        "Disciplina antes de volume. Ajuste e siga.",
        "Você está no ritmo. Priorize consistência."
      ]
    };
    
    const randomMessage = messages[type][Math.floor(Math.random() * messages[type].length)];
    setMotivationalMessage(randomMessage);
    setShowMotivationalAlert(true);
    
    setTimeout(() => setShowMotivationalAlert(false), 5000);
  };

  const handleAddGoal = () => {
    // Calcular ou definir padrão para o alvo
    let calculatedTarget = calculateGoalValue();
    if (!newGoalTarget || calculatedTarget <= 0) {
      // Valores padrão por tipo quando o usuário não preenche
      calculatedTarget =
        newGoalType === 'profit' ? 100 :
        newGoalType === 'sessions' ? 5 :
        newGoalType === 'winrate' ? 70 :
        newGoalType === 'time' ? 60 : 100;
    }

    // Título padrão quando não informado
    const defaultTitle =
      newGoalType === 'profit' ? `Meta de Lucro` :
      newGoalType === 'sessions' ? `Número de Sessões` :
      newGoalType === 'winrate' ? `Taxa de Acerto` :
      newGoalType === 'time' ? `Tempo de Jogo` : 'Nova Meta';

    const titleWithValue = () => {
      if (newGoalType === 'profit') return `${defaultTitle} (${calculatedTarget} R$)`;
      if (newGoalType === 'sessions') return `${defaultTitle} (${calculatedTarget})`;
      if (newGoalType === 'winrate') return `${defaultTitle} (${calculatedTarget}%)`;
      if (newGoalType === 'time') return `${defaultTitle} (${calculatedTarget} min)`;
      return defaultTitle;
    };

    const newGoal = {
      id: Date.now(),
      title: newGoalTitle ? newGoalTitle : titleWithValue(),
      target: calculatedTarget,
      current: 0,
      type: newGoalType as 'profit' | 'sessions' | 'winrate' | 'time',
      deadline: newGoalDeadline,
      priority: 'medium' as const,
      completed: false,
      valueType: goalValueType,
      originalTarget: newGoalTarget
    };

    setTodayGoals([...todayGoals, newGoal]);
    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalType('sessions');
    setNewGoalDeadline('23:59');
    setGoalValueType('fixed');

    generateMotivationalFeedback('encouragement');
  };

  const handleCompleteGoal = (goalId: number) => {
    setTodayGoals(todayGoals.map(goal => 
      goal.id === goalId 
        ? { ...goal, completed: true, current: goal.target }
        : goal
    ));
    
    generateMotivationalFeedback('achievement');
  };

  // Função para completar missão
  const handleCompleteMission = (missionId: number) => {
    setMissions(missions.map(mission => 
      mission.id === missionId 
        ? { ...mission, completed: true, current: mission.target }
        : mission
    ));
    
    generateMotivationalFeedback('achievement');
  };

  // Função para simular progresso de missão
  const simulateMissionProgress = (missionId: number, increment: number = 1) => {
    setMissions(missions.map(mission => {
      if (mission.id === missionId && !mission.completed) {
        const newCurrent = Math.min(mission.current + increment, mission.target);
        const completed = newCurrent >= mission.target;
        
        if (completed && !mission.completed) {
          generateMotivationalFeedback('achievement');
        }
        
        return { ...mission, current: newCurrent, completed };
      }
      return mission;
    }));
  };

  const handleSaveGoals = async () => {
    try {
      const profitGoal = todayGoals.find(g => g.type === 'profit');
      await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_goal: isProfitGoalEnabled ? (profitGoal?.target ?? 0) : 0
        })
      });
    } catch {
      setMotivationalMessage('Não foi possível salvar agora. Tente novamente.');
      setShowMotivationalAlert(true);
      setTimeout(() => setShowMotivationalAlert(false), 5000);
    }
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'profit': return <DollarSign className="h-4 w-4" />;
      case 'sessions': return <Target className="h-4 w-4" />;
      case 'winrate': return <TrendingUp className="h-4 w-4" />;
      case 'time': return <Clock className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-600 bg-red-100 dark:border-red-700 dark:bg-red-900/20';
      case 'medium': return 'border-yellow-600 bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900/20';
      case 'low': return 'border-green-600 bg-green-100 dark:border-green-700 dark:bg-green-900/20';
      default: return 'border-slate-600 bg-slate-100 dark:border-slate-700 dark:bg-slate-900/20';
    }
  };

  const getMotivationalMessage = () => {
    const completionRate = (todayStats.completedGoals / todayStats.totalGoals) * 100;
    
    if (completionRate === 100) {
      return "Você concluiu suas metas de processo hoje. Disciplina protege sua banca amanhã.";
    } else if (completionRate >= 75) {
      return "Você está no ritmo. Termine o que falta e mantenha o controle.";
    } else if (completionRate >= 50) {
      return "Bom progresso. Priorize consistência e siga o plano.";
    } else if (completionRate >= 25) {
      return "Comece pequeno e execute com disciplina. O resto vem junto.";
    } else {
      return "Defina o próximo passo e execute. Hoje é sobre hábito, não sobre resultado.";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Metas Diárias</h1>
            <p className="text-muted-foreground">
              Condicione disciplina diária. O porquê fica em Relatórios e Meu Lucro
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-orange-600">
              <Flame className="h-3 w-3 mr-1" />
              {currentStreak} dias seguidos
            </Badge>
            <Badge variant="outline" className="text-green-600">
              <Trophy className="h-3 w-3 mr-1" />
              {totalGoalsCompleted} metas atingidas
            </Badge>
          </div>
        </div>

        {/* Mensagem Motivacional */}
        <Alert className="border-blue-500 bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20">
          <Star className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {getMotivationalMessage()}
          </AlertDescription>
        </Alert>

        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            Cumprir essas metas reforça disciplina e reduz risco na Gestão de Banca.
          </AlertDescription>
        </Alert>

        {/* Alerta Motivacional Dinâmico */}
        {showMotivationalAlert && (
          <Alert className="border-green-500 bg-green-100 dark:border-green-700 dark:bg-green-900/20 animate-pulse">
            <Trophy className="h-4 w-4" />
            <AlertDescription>
              {motivationalMessage}
            </AlertDescription>
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-2 right-2"
              onClick={() => setShowMotivationalAlert(false)}
            >
              ×
            </Button>
          </Alert>
        )}

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.totalProgress.toFixed(0)}%</div>
              <Progress value={todayStats.totalProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {todayStats.completedGoals} de {todayStats.totalGoals} metas concluídas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sequência Atual</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
              <p className="text-xs text-muted-foreground">
                Dias consecutivos atingindo metas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Previsão</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.estimatedCompletion}</div>
              <p className="text-xs text-muted-foreground">
                Horário estimado para conclusão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiência recente</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">85%</div>
              <p className="text-xs text-muted-foreground">
                Consistência de execução nos últimos 30 dias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="missions">Missões</TabsTrigger>
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="achievements">Conquistas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Metas de Hoje */}
              <Card>
                <CardHeader>
                  <CardTitle>Metas de Hoje</CardTitle>
                  <CardDescription>
                    Acompanhe o progresso das suas metas diárias
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {todayGoals.map((goal) => {
                    const progress = Math.min((goal.current / goal.target) * 100, 100);
                    const isOverTarget = goal.current > goal.target;
                    
                    return (
                      <div
                        key={goal.id}
                        className={`p-4 border-l-4 rounded-lg ${getPriorityColor(goal.priority)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getGoalIcon(goal.type)}
                            <h4 className="font-medium">{goal.title}</h4>
                            {goal.completed && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {goal.deadline}
                            </Badge>
                            {!goal.completed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteGoal(goal.id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso:</span>
                            <span className={isOverTarget ? 'text-green-600 font-medium' : ''}>
                              {goal.current} / {goal.target}
                              {goal.type === 'profit' && ' R$'}
                              {goal.type === 'winrate' && '%'}
                              {goal.type === 'time' && ' min'}
                            </span>
                          </div>
                          <Progress 
                            value={progress} 
                            className={`h-2 ${isOverTarget ? 'bg-green-100' : ''}`}
                          />
                          <p className="text-xs text-muted-foreground">
                            {progress.toFixed(0)}% concluído
                            {isOverTarget && ' (Meta superada)'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Adicionar Nova Meta */}
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Nova Meta</CardTitle>
                  <CardDescription>
                    Crie uma nova meta para hoje
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-title">Título da Meta</Label>
                    <Input
                      id="goal-title"
                      placeholder="Ex: 5 sessões, 70% de acerto, 120 min"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={newGoalType}
                        onValueChange={(value) => {
                          setNewGoalType(value);
                          if (value !== 'profit') setGoalValueType('fixed');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sessions">Sessões</SelectItem>
                          <SelectItem value="winrate">Taxa de Acerto (%)</SelectItem>
                          <SelectItem value="time">Tempo (min)</SelectItem>
                          {isProfitGoalEnabled ? <SelectItem value="profit">Lucro (opcional)</SelectItem> : null}
                        </SelectContent>
                      </Select>
                    </div>

                    {newGoalType === 'profit' ? (
                      <>
                        <div className="space-y-2">
                          <Label>Tipo de valor</Label>
                          <Select value={goalValueType} onValueChange={setGoalValueType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Valor fixo</SelectItem>
                              <SelectItem value="percentage">Percentual da banca</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {goalValueType === 'percentage' ? (
                          <div className="space-y-2">
                            <Label htmlFor="base-value">Valor base da banca (R$)</Label>
                            <Input
                              id="base-value"
                              type="number"
                              placeholder="1000"
                              value={baseValue}
                              onChange={(e) => setBaseValue(e.target.value)}
                            />
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="goal-target">
                        {newGoalType === 'profit' && goalValueType === 'percentage' ? 'Percentual (%)' : 'Valor alvo'}
                      </Label>
                      <Input
                        id="goal-target"
                        type="number"
                        placeholder={newGoalType === 'profit' && goalValueType === 'percentage' ? '10' : '5'}
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(e.target.value)}
                      />
                      {newGoalType === 'profit' && goalValueType === 'percentage' && newGoalTarget ? (
                        <p className="text-xs text-muted-foreground">
                          Valor calculado: R$ {calculateGoalValue().toFixed(2)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal-deadline">Prazo</Label>
                    <Input
                      id="goal-deadline"
                      type="time"
                      value={newGoalDeadline}
                      onChange={(e) => setNewGoalDeadline(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleAddGoal} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Meta
                  </Button>
                  <Button variant="outline" onClick={handleSaveGoals} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Metas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="missions" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Missões Ativas */}
              <Card>
                <CardHeader>
                  <CardTitle>Missões Diárias</CardTitle>
                  <CardDescription>
                    Complete missões para ganhar XP e desbloquear conquistas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {missions.map((mission) => {
                    const progress = Math.min((mission.current / mission.target) * 100, 100);
                    const isOverTarget = mission.current > mission.target;
                    
                    return (
                      <div
                        key={mission.id}
                        className={`p-4 border rounded-lg ${
                          mission.completed 
                            ? 'border-green-600 bg-green-100 dark:border-green-700 dark:bg-green-900/20' 
                            : 'border-slate-600 bg-slate-100 dark:border-slate-700 dark:bg-slate-900/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {mission.type === 'strategy' && <Target className="h-4 w-4 text-blue-600" />}
                            {mission.type === 'winrate' && <TrendingUp className="h-4 w-4 text-green-600" />}
                            {mission.type === 'discipline' && <Shield className="h-4 w-4 text-purple-600" />}
                            <h4 className="font-medium">{mission.title}</h4>
                            {mission.completed && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {mission.reward}
                            </Badge>
                            {!mission.completed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteMission(mission.id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {mission.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso:</span>
                            <span className={isOverTarget ? 'text-green-600 font-medium' : ''}>
                              {mission.current} / {mission.target}
                              {mission.type === 'winrate' && '%'}
                            </span>
                          </div>
                          <Progress 
                            value={progress} 
                            className={`h-2 ${isOverTarget ? 'bg-green-100 dark:bg-green-900/20' : ''}`}
                          />
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">
                              {progress.toFixed(0)}% concluído
                              {isOverTarget && ' (Superado)'}
                            </p>
                            {!mission.completed && mission.type === 'strategy' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => simulateMissionProgress(mission.id)}
                                className="text-xs"
                              >
                                Simular +1
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Estatísticas de Missões */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas de Missões</CardTitle>
                  <CardDescription>
                    Seu progresso geral em missões
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg bg-slate-100 dark:bg-slate-900/20 border-slate-600 dark:border-slate-700">
                      <div className="text-2xl font-bold text-green-600">
                        {missions.filter(m => m.completed).length}
                      </div>
                      <p className="text-sm text-muted-foreground">Concluídas</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg bg-slate-100 dark:bg-slate-900/20 border-slate-600 dark:border-slate-700">
                      <div className="text-2xl font-bold text-blue-600">
                        {missions.filter(m => !m.completed).length}
                      </div>
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">XP Total Disponível:</span>
                      <span className="font-medium">
                        {missions.reduce((total, mission) => {
                          const xp = parseInt(mission.reward.replace(' XP', ''));
                          return total + xp;
                        }, 0)} XP
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">XP Conquistado:</span>
                      <span className="font-medium text-green-600">
                        {missions
                          .filter(m => m.completed)
                          .reduce((total, mission) => {
                            const xp = parseInt(mission.reward.replace(' XP', ''));
                            return total + xp;
                          }, 0)} XP
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => generateMotivationalFeedback('encouragement')}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Motivação Sofia
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progresso Semanal</CardTitle>
                <CardDescription>
                  Visualize seu desempenho ao longo da semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={isProfitGoalEnabled ? weeklyProfitProgress : weeklyProcessProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        isProfitGoalEnabled ? `R$ ${value}` : String(value),
                        isProfitGoalEnabled
                          ? (name === 'goal' ? 'Meta de lucro' : 'Lucro do dia')
                          : (name === 'planned' ? 'Metas planejadas' : 'Metas concluídas')
                      ]}
                    />
                    <Legend />
                    {isProfitGoalEnabled ? (
                      <>
                        <Bar dataKey="goal" fill="#475569" name="Meta" />
                        <Bar dataKey="achieved" fill="#10b981" name="Atingido" />
                      </>
                    ) : (
                      <>
                        <Bar dataKey="planned" fill="#475569" name="Planejado" />
                        <Bar dataKey="completed" fill="#10b981" name="Concluído" />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {isProfitGoalEnabled
                    ? weeklyProfitProgress.map((day, index) => (
                      <div key={index} className="text-center">
                        <div
                          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${
                            day.completed
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400'
                          }`}
                        >
                          {day.completed ? 'OK' : '-'}
                        </div>
                        <p className="text-xs mt-1">{day.day}</p>
                      </div>
                    ))
                    : weeklyProcessProgress.map((day, index) => (
                      <div key={index} className="text-center">
                        <div
                          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${
                            day.achieved
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400'
                          }`}
                        >
                          {day.achieved ? 'OK' : '-'}
                        </div>
                        <p className="text-xs mt-1">{day.day}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conquistas</CardTitle>
                <CardDescription>
                  Suas conquistas e marcos alcançados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 border rounded-lg ${
                        achievement.unlocked 
                          ? 'border-green-600 bg-green-100 dark:border-green-700 dark:bg-green-900/20' 
                          : 'border-slate-600 bg-slate-100 dark:border-slate-700 dark:bg-slate-900/20 opacity-80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          {achievement.unlocked ? (
                            <Badge variant="outline" className="text-green-600">
                              Desbloqueado em {achievement.date}
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Metas</CardTitle>
                <CardDescription>
                  Acompanhe seu histórico de metas dos últimos dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isProfitGoalEnabled ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Meta (lucro)</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Sessões</TableHead>
                        <TableHead>Taxa</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profitGoalHistory.map((day, index) => (
                        <TableRow key={index}>
                          <TableCell>{day.date}</TableCell>
                          <TableCell>R$ {day.goal}</TableCell>
                          <TableCell className={day.profit >= day.goal ? 'text-green-600' : 'text-red-600'}>
                            R$ {day.profit}
                          </TableCell>
                          <TableCell>{day.sessions}</TableCell>
                          <TableCell>
                            <Badge variant={day.winRate >= 70 ? 'default' : 'secondary'}>{day.winRate}%</Badge>
                          </TableCell>
                          <TableCell>
                            {day.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Metas</TableHead>
                        <TableHead>Concluídas</TableHead>
                        <TableHead>Sessões</TableHead>
                        <TableHead>Taxa</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processGoalHistory.map((day, index) => (
                        <TableRow key={index}>
                          <TableCell>{day.date}</TableCell>
                          <TableCell>{day.planned}</TableCell>
                          <TableCell className={day.completed === day.planned ? 'text-green-600' : 'text-muted-foreground'}>
                            {day.completed}
                          </TableCell>
                          <TableCell>{day.sessions}</TableCell>
                          <TableCell>
                            <Badge variant={day.winRate >= 70 ? 'default' : 'secondary'}>{day.winRate}%</Badge>
                          </TableCell>
                          <TableCell>
                            {day.achieved ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
