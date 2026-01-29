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
import { GradientAlert } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Target, 
  TrendingUp, 
  Trophy, 
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Flame,
  Award,
  Plus,
  MoreVertical,
  Shield,
  Lightbulb,
  Pencil,
  Trash2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  BarChart,
  Bar
} from 'recharts';

// Dados mock para demonstração
const initialTodayGoals = [
  {
    id: 1,
    title: 'Número de Entradas',
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
  function formatDayMonth(date: Date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  const sanitizeGoalTitle = (value: string) => value.replace(/\s+/g, ' ').trim().slice(0, 80);

  const sanitizePositiveNumberInput = (
    value: string,
    opts?: { allowDecimals?: boolean }
  ) => {
    const allowDecimals = opts?.allowDecimals ?? false;
    let v = value.replace(/\s+/g, '').replace(',', '.');
    v = allowDecimals ? v.replace(/[^\d.]/g, '') : v.replace(/[^\d]/g, '');
    if (allowDecimals) {
      const parts = v.split('.');
      if (parts.length > 2) v = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    return v;
  };

  const [todayGoals, setTodayGoals] = useState(() => initialTodayGoals.filter(g => !g.completed));
  const [completedGoalsHistory, setCompletedGoalsHistory] = useState(() => {
    const completedAt = new Date();
    return initialTodayGoals
      .filter(g => g.completed)
      .map(g => ({
        ...g,
        completedAt: completedAt.toISOString(),
        date: formatDayMonth(completedAt)
      }));
  });
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'profit' | 'sessions' | 'winrate' | 'time'>('all');
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<'all' | '7d' | '30d'>('30d');
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalType, setNewGoalType] = useState('sessions');
  const [newGoalDeadline, setNewGoalDeadline] = useState('23:59');
  const [goalValueType, setGoalValueType] = useState('fixed'); // 'fixed' ou 'percentage'
  const [baseValue, setBaseValue] = useState('1000'); // Valor base para cálculo percentual
  const [isProfitGoalEnabled, setIsProfitGoalEnabled] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState(
    "Bom dia. Disciplina hoje protege sua banca amanhã."
  );
  const [showMotivationalAlert, setShowMotivationalAlert] = useState(false);
  const [currentStreak] = useState(3);
  const [totalGoalsCompleted] = useState(12);

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

  useEffect(() => {
    setHistoryPage(1);
  }, [historyQuery, historyTypeFilter, historyPeriodFilter, historyPageSize]);

  // Calcular estatísticas do dia
  const allTodayGoals = [...todayGoals, ...completedGoalsHistory];
  const todayStats = {
    totalGoals: allTodayGoals.length,
    completedGoals: allTodayGoals.filter(g => g.completed).length,
    estimatedCompletion: '18:30' // Mock
  };

  const normalizedHistoryQuery = historyQuery.trim().toLowerCase();
  const historyPeriodDays = historyPeriodFilter === '7d' ? 7 : historyPeriodFilter === '30d' ? 30 : null;
  const historyCutoff = historyPeriodDays ? new Date(Date.now() - historyPeriodDays * 24 * 60 * 60 * 1000) : null;

  const filteredCompletedGoalsHistory = completedGoalsHistory.filter((goal: any) => {
    if (historyTypeFilter !== 'all' && goal.type !== historyTypeFilter) return false;

    if (historyCutoff) {
      const completedAt = goal.completedAt ? new Date(goal.completedAt) : null;
      if (completedAt && completedAt < historyCutoff) return false;
    }

    if (!normalizedHistoryQuery) return true;
    const label =
      goal.type === 'profit' ? 'Lucro' :
      goal.type === 'sessions' ? 'Entradas' :
      goal.type === 'winrate' ? 'Taxa de Acerto' :
      goal.type === 'time' ? 'Tempo' : String(goal.type ?? '');
    const haystack = `${goal.title ?? ''} ${label}`.toLowerCase();
    return haystack.includes(normalizedHistoryQuery);
  });

  const historyTotalPages = Math.max(1, Math.ceil(filteredCompletedGoalsHistory.length / historyPageSize));
  const historyPageSafe = Math.min(historyPage, historyTotalPages);
  const paginatedCompletedGoalsHistory = filteredCompletedGoalsHistory.slice(
    (historyPageSafe - 1) * historyPageSize,
    historyPageSafe * historyPageSize
  );

  // Função para calcular valor da meta baseado no tipo
  const calculateGoalValue = () => {
    if (newGoalType === 'profit' && goalValueType === 'percentage') {
      const base = parseFloat(baseValue) || 1000;
      const percentage = parseFloat(newGoalTarget) || 0;
      return (base * percentage) / 100;
    }
    return parseFloat(newGoalTarget) || 0;
  };

  const resetGoalForm = () => {
    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalType('sessions');
    setNewGoalDeadline('23:59');
    setGoalValueType('fixed');
  };

  const openAddGoalModal = () => {
    setEditingGoalId(null);
    resetGoalForm();
    setIsAddGoalModalOpen(true);
  };

  const openEditGoalModal = (goal: any) => {
    setEditingGoalId(goal.id);
    setNewGoalTitle(sanitizeGoalTitle(String(goal.title || '')));
    setNewGoalType(String(goal.type || 'sessions'));
    setNewGoalDeadline(String(goal.deadline || '23:59'));
    const inferredValueType = String(goal.valueType || 'fixed');
    setGoalValueType(goal.type === 'profit' ? inferredValueType : 'fixed');
    if (goal.type === 'profit' && inferredValueType === 'percentage' && goal.originalTarget) {
      setNewGoalTarget(sanitizePositiveNumberInput(String(goal.originalTarget), { allowDecimals: true }));
    } else {
      setNewGoalTarget(sanitizePositiveNumberInput(String(goal.target ?? ''), { allowDecimals: goal.type === 'profit' }));
    }
    setIsAddGoalModalOpen(true);
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
      newGoalType === 'sessions' ? `Número de Entradas` :
      newGoalType === 'winrate' ? `Taxa de Acerto` :
      newGoalType === 'time' ? `Tempo de Jogo` : 'Nova Meta';

    const titleWithValue = () => {
      if (newGoalType === 'profit') return `${defaultTitle} (R$${calculatedTarget})`;
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
    resetGoalForm();

    generateMotivationalFeedback('encouragement');
  };

  const handleUpdateGoal = () => {
    if (editingGoalId == null) return;

    let calculatedTarget = calculateGoalValue();
    if (!newGoalTarget || calculatedTarget <= 0) {
      calculatedTarget =
        newGoalType === 'profit' ? 100 :
        newGoalType === 'sessions' ? 5 :
        newGoalType === 'winrate' ? 70 :
        newGoalType === 'time' ? 60 : 100;
    }

    const defaultTitle =
      newGoalType === 'profit' ? `Meta de Lucro` :
      newGoalType === 'sessions' ? `Número de Entradas` :
      newGoalType === 'winrate' ? `Taxa de Acerto` :
      newGoalType === 'time' ? `Tempo de Jogo` : 'Nova Meta';

    const titleWithValue = () => {
      if (newGoalType === 'profit') return `${defaultTitle} (R$${calculatedTarget})`;
      if (newGoalType === 'sessions') return `${defaultTitle} (${calculatedTarget})`;
      if (newGoalType === 'winrate') return `${defaultTitle} (${calculatedTarget}%)`;
      if (newGoalType === 'time') return `${defaultTitle} (${calculatedTarget} min)`;
      return defaultTitle;
    };

    const isEditingToday = todayGoals.some((g: any) => g.id === editingGoalId);

    if (isEditingToday) {
      const completedAt = new Date();
      setTodayGoals(prev => {
        const updatedGoals = prev.map((goal: any) => {
          if (goal.id !== editingGoalId) return goal;
          const current = Number(goal.current ?? 0);
          return {
            ...goal,
            title: newGoalTitle ? newGoalTitle : titleWithValue(),
            target: calculatedTarget,
            type: newGoalType as 'profit' | 'sessions' | 'winrate' | 'time',
            deadline: newGoalDeadline,
            valueType: goalValueType,
            originalTarget: newGoalTarget,
            completed: current >= calculatedTarget
          };
        });

        const updatedGoal = updatedGoals.find((g: any) => g.id === editingGoalId);
        if (updatedGoal?.completed) {
          setCompletedGoalsHistory(history => [
            {
              ...updatedGoal,
              completed: true,
              current: updatedGoal.target,
              completedAt: completedAt.toISOString(),
              date: formatDayMonth(completedAt)
            },
            ...history
          ]);
          return updatedGoals.filter((g: any) => g.id !== editingGoalId);
        }

        return updatedGoals;
      });
    } else {
      setCompletedGoalsHistory(prev => prev.map((goal: any) => {
        if (goal.id !== editingGoalId) return goal;
        return {
          ...goal,
          title: newGoalTitle ? newGoalTitle : titleWithValue(),
          target: calculatedTarget,
          type: newGoalType as 'profit' | 'sessions' | 'winrate' | 'time',
          deadline: newGoalDeadline,
          valueType: goalValueType,
          originalTarget: newGoalTarget,
          completed: true,
          current: calculatedTarget
        };
      }));
    }

    setEditingGoalId(null);
    resetGoalForm();
    generateMotivationalFeedback('encouragement');
  };

  const handleDeleteGoal = (goalId: number) => {
    setTodayGoals(todayGoals.filter((g: any) => g.id !== goalId));
  };

  const handleDeleteHistoryGoal = (goalId: number) => {
    setCompletedGoalsHistory(prev => prev.filter((g: any) => g.id !== goalId));
  };

  const finalizeGoal = (goalId: number, outcome: 'success' | 'failed') => {
    const finishedAt = new Date();
    setTodayGoals(prev => {
      const goal = prev.find(g => g.id === goalId);
      if (!goal) return prev;
      setCompletedGoalsHistory(history => [
        {
          ...goal,
          completed: outcome === 'success',
          current: outcome === 'success' ? goal.target : goal.current,
          completedAt: finishedAt.toISOString(),
          date: formatDayMonth(finishedAt),
          outcome
        },
        ...history
      ]);
      return prev.filter(g => g.id !== goalId);
    });
    generateMotivationalFeedback(outcome === 'success' ? 'achievement' : 'encouragement');
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

  const formatGoalDisplayTitle = (goal: any) => {
    const rawTitle = String(goal?.title ?? '').trim();
    const title =
      rawTitle ||
      (goal?.type === 'profit' ? 'Meta de Lucro' :
        goal?.type === 'sessions' ? 'Número de Entradas' :
        goal?.type === 'winrate' ? 'Taxa de Acerto' :
        goal?.type === 'time' ? 'Tempo de Jogo' : 'Meta');

    if (/\([^)]*\)\s*$/.test(title)) return title;

    const target = goal?.target ?? '';
    if (goal?.type === 'profit') return `${title} (R$${target})`;
    if (goal?.type === 'winrate') return `${title} (${target}%)`;
    if (goal?.type === 'time') return `${title} (${target} min)`;
    return `${title} (${target})`;
  };

  const getPriorityColor = (_priority: string) => {
    return 'border-green-600 bg-green-100 dark:border-green-700 dark:bg-green-900/20';
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
      <TooltipProvider>
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

        <GradientAlert
          variant={showMotivationalAlert ? 'success' : 'information'}
          title={
            <div className="flex w-full items-start justify-between gap-3">
              <span className="flex-1 font-medium">
                {showMotivationalAlert ? motivationalMessage : getMotivationalMessage()}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Ajuda">
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Cumprir essas metas reforça disciplina e reduz risco na Gestão de Banca.
                </TooltipContent>
              </Tooltip>
            </div>
          }
          onClose={showMotivationalAlert ? () => setShowMotivationalAlert(false) : undefined}
        />

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayStats.completedGoals}/{todayStats.totalGoals}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Metas concluídas hoje</p>
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
              <CardTitle className="text-sm font-medium">Eficiência de execução</CardTitle>
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
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="achievements">Conquistas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <div className="grid gap-6">
              {/* Metas de Hoje */}
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="space-y-1.5">
                    <CardTitle>Metas de Hoje</CardTitle>
                    <CardDescription>
                      Compromissos configuráveis para manter disciplina
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={openAddGoalModal}
                    aria-label="Adicionar nova meta"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {todayGoals.map((goal) => {
                    return (
                      <div
                        key={goal.id}
                        className={`p-4 border-l-4 rounded-lg ${getPriorityColor(goal.priority)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getGoalIcon(goal.type)}
                            <h4 className="font-medium">{formatGoalDisplayTitle(goal)}</h4>
                            {goal.completed && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {goal.deadline}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" aria-label="Mais ações">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                              {!goal.completed ? (
                                <>
                                  <DropdownMenuItem onClick={() => finalizeGoal(goal.id, 'success')}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Concluir
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => finalizeGoal(goal.id, 'failed')}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Não atingida
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                                <DropdownMenuItem onClick={() => openEditGoalModal(goal)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteGoal(goal.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <Dialog open={isAddGoalModalOpen} onOpenChange={setIsAddGoalModalOpen}>
              <DialogContent
                className="max-w-xl overflow-hidden border border-white/20 bg-black/60 p-6 shadow-2xl backdrop-blur-xl !rounded-none sm:!rounded-none dark:border-white/10 dark:bg-zinc-950/50"
                style={{
                  clipPath:
                    'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
                }}
              >
                <DialogHeader>
                  <DialogTitle>{editingGoalId == null ? 'Adicionar Nova Meta' : 'Editar Meta'}</DialogTitle>
                  <DialogDescription>
                    {editingGoalId == null ? 'Crie uma nova meta para hoje' : 'Ajuste sua meta atual'}
                  </DialogDescription>
                </DialogHeader>

                  <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-title">Título da Meta</Label>
                    <Input
                      id="goal-title"
                      placeholder="Ex: 5 entradas, R$ 100, 70% de acerto, 120 min"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(sanitizeGoalTitle(e.target.value))}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={newGoalType}
                        onValueChange={(value) => {
                          setNewGoalType(value);
                          if (value === 'profit') setIsProfitGoalEnabled(true);
                          if (value !== 'profit') setGoalValueType('fixed');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="profit">Valor em dinheiro (R$)</SelectItem>
                          <SelectItem value="sessions">Entradas (Nº)</SelectItem>
                          <SelectItem value="winrate">Taxa de Acerto (%)</SelectItem>
                          <SelectItem value="time">Tempo (min)</SelectItem>
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
                              onChange={(e) => setBaseValue(sanitizePositiveNumberInput(e.target.value, { allowDecimals: true }))}
                            />
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="goal-target">
                        {newGoalType === 'profit' && goalValueType === 'percentage'
                          ? 'Percentual (%)'
                          : newGoalType === 'profit'
                            ? 'Valor alvo (R$)'
                            : 'Valor alvo'}
                      </Label>
                      <Input
                        id="goal-target"
                        type="number"
                        placeholder={
                          newGoalType === 'profit' && goalValueType === 'percentage'
                            ? '10'
                            : newGoalType === 'profit'
                              ? '100'
                              : '5'
                        }
                        value={newGoalTarget}
                        onChange={(e) => {
                          const allowDecimals = newGoalType === 'profit';
                          setNewGoalTarget(sanitizePositiveNumberInput(e.target.value, { allowDecimals }));
                        }}
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
                    <Select value={newGoalDeadline} onValueChange={setNewGoalDeadline}>
                      <SelectTrigger id="goal-deadline">
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {(() => {
                          const base: string[] = []
                          for (let h = 0; h < 24; h++) {
                            for (let m = 0; m < 60; m += 5) {
                              const hh = String(h).padStart(2, '0')
                              const mm = String(m).padStart(2, '0')
                              base.push(`${hh}:${mm}`)
                            }
                          }
                          if (!base.includes('23:59')) base.push('23:59')
                          if (newGoalDeadline && !base.includes(newGoalDeadline)) base.push(newGoalDeadline)
                          const uniqueSorted = Array.from(new Set(base)).sort()
                          return uniqueSorted.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        if (editingGoalId == null) {
                          handleAddGoal();
                        } else {
                          handleUpdateGoal();
                        }
                        setIsAddGoalModalOpen(false);
                        setEditingGoalId(null);
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {editingGoalId == null ? 'Adicionar Meta' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                    <RechartsTooltip
                      formatter={(value: number | string, name: string) => [
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
              <CardContent className="space-y-6">
                {completedGoalsHistory.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label>Buscar</Label>
                          <Input
                            value={historyQuery}
                            onChange={(e) => setHistoryQuery(e.target.value)}
                            placeholder="Buscar por meta"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Tipo</Label>
                          <Select value={historyTypeFilter} onValueChange={(v) => setHistoryTypeFilter(v as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="sessions">Entradas</SelectItem>
                              <SelectItem value="winrate">Taxa de Acerto</SelectItem>
                              <SelectItem value="time">Tempo</SelectItem>
                              <SelectItem value="profit">Lucro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Período</Label>
                          <Select value={historyPeriodFilter} onValueChange={(v) => setHistoryPeriodFilter(v as any)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7d">Últimos 7 dias</SelectItem>
                              <SelectItem value="30d">Últimos 30 dias</SelectItem>
                              <SelectItem value="all">Tudo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <Select value={String(historyPageSize)} onValueChange={(v) => setHistoryPageSize(Number(v))}>
                          <SelectTrigger className="w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 / pág</SelectItem>
                            <SelectItem value="20">20 / pág</SelectItem>
                            <SelectItem value="50">50 / pág</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                          disabled={historyPageSafe <= 1}
                        >
                          Anterior
                        </Button>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          Página {historyPageSafe} de {historyTotalPages}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                          disabled={historyPageSafe >= historyTotalPages}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Meta</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCompletedGoalsHistory.length > 0 ? paginatedCompletedGoalsHistory.map((goal: any) => {
                          const label =
                            goal.type === 'profit' ? 'Lucro' :
                            goal.type === 'sessions' ? 'Entradas' :
                            goal.type === 'winrate' ? 'Taxa de Acerto' :
                            goal.type === 'time' ? 'Tempo' : String(goal.type ?? '');
                          const suffix =
                            goal.type === 'profit' ? ' R$' :
                            goal.type === 'winrate' ? '%' :
                            goal.type === 'time' ? ' min' : '';

                          return (
                            <TableRow key={goal.id}>
                              <TableCell>{goal.date ?? (goal.completedAt ? formatDayMonth(new Date(goal.completedAt)) : '')}</TableCell>
                              <TableCell>{goal.title}</TableCell>
                              <TableCell>{label}</TableCell>
                              <TableCell>
                                {goal.target}
                                {suffix}
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      {goal.completed ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                      )}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {goal.completed ? 'Meta batida' : 'Meta não batida'}
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="inline-flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (!confirm('Excluir esta meta do histórico?')) return;
                                      handleDeleteHistoryGoal(goal.id);
                                    }}
                                    aria-label="Excluir meta do histórico"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-sm text-muted-foreground">
                              Nenhuma meta encontrada com os filtros atuais.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}

                {isProfitGoalEnabled ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Meta (lucro)</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Entradas</TableHead>
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
                        <TableHead>Entradas</TableHead>
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
      </TooltipProvider>
    </DashboardLayout>
  );
}
