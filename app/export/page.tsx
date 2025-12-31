'use client';

import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  File,
  Calendar as CalendarIcon,
  Filter,
  Settings,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Trash2,
  Share2,
  Mail,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: string[];
  formats: string[];
  icon: any;
  estimatedTime: string;
  dataPoints: number;
}

interface ExportJob {
  id: string;
  name: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  createdAt: string;
  fileSize?: string;
  downloadUrl?: string;
  error?: string;
}

interface FilterOptions {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  categories: string[];
  minValue: string;
  maxValue: string;
  includeArchived: boolean;
}

export default function ExportPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { from: undefined, to: undefined },
    categories: [],
    minValue: '',
    maxValue: '',
    includeArchived: false
  });
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      name: 'Relatório de Apostas - Janeiro 2024',
      format: 'PDF',
      status: 'completed',
      progress: 100,
      createdAt: '2024-01-15T10:30:00',
      fileSize: '2.4 MB',
      downloadUrl: '/downloads/apostas-jan-2024.pdf'
    },
    {
      id: '2',
      name: 'Análise de Estratégias - Completa',
      format: 'Excel',
      status: 'processing',
      progress: 65,
      createdAt: '2024-01-15T11:15:00'
    },
    {
      id: '3',
      name: 'Dados Financeiros - Q4 2023',
      format: 'CSV',
      status: 'error',
      progress: 0,
      createdAt: '2024-01-15T09:45:00',
      error: 'Dados insuficientes para o período selecionado'
    }
  ]);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'betting-analysis',
      name: 'Análise de Apostas',
      description: 'Relatório completo com histórico de apostas, resultados e performance',
      category: 'Apostas',
      fields: ['data', 'valor', 'resultado', 'lucro', 'roi', 'estrategia'],
      formats: ['PDF', 'Excel', 'CSV'],
      icon: TrendingUp,
      estimatedTime: '2-5 min',
      dataPoints: 15000
    },
    {
      id: 'financial-summary',
      name: 'Resumo Financeiro',
      description: 'Análise detalhada do bankroll, depósitos, saques e evolução patrimonial',
      category: 'Financeiro',
      fields: ['saldo', 'depositos', 'saques', 'lucro_liquido', 'roi_periodo'],
      formats: ['PDF', 'Excel'],
      icon: DollarSign,
      estimatedTime: '1-3 min',
      dataPoints: 8500
    },
    {
      id: 'strategy-performance',
      name: 'Performance de Estratégias',
      description: 'Comparativo de performance entre diferentes estratégias utilizadas',
      category: 'Estratégias',
      fields: ['estrategia', 'apostas_total', 'taxa_acerto', 'lucro_medio', 'drawdown'],
      formats: ['PDF', 'Excel', 'JSON'],
      icon: BarChart3,
      estimatedTime: '3-7 min',
      dataPoints: 12000
    },
    {
      id: 'user-activity',
      name: 'Atividade do Usuário',
      description: 'Relatório de atividades, sessões e padrões de uso da plataforma',
      category: 'Usuário',
      fields: ['sessoes', 'tempo_uso', 'funcionalidades_usadas', 'preferencias'],
      formats: ['PDF', 'CSV'],
      icon: Users,
      estimatedTime: '1-2 min',
      dataPoints: 5000
    },
    {
      id: 'market-analysis',
      name: 'Análise de Mercado',
      description: 'Tendências de mercado, padrões identificados e oportunidades',
      category: 'Mercado',
      fields: ['tendencias', 'padroes', 'volatilidade', 'oportunidades'],
      formats: ['PDF', 'Excel'],
      icon: LineChart,
      estimatedTime: '5-10 min',
      dataPoints: 25000
    },
    {
      id: 'custom-dashboard',
      name: 'Dashboard Personalizado',
      description: 'Relatório customizável com métricas e KPIs selecionados',
      category: 'Personalizado',
      fields: ['metricas_customizadas', 'kpis', 'graficos', 'comparativos'],
      formats: ['PDF', 'Excel', 'JSON'],
      icon: PieChart,
      estimatedTime: '3-8 min',
      dataPoints: 18000
    }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF', icon: File, description: 'Documento formatado para impressão' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Planilha editável com gráficos' },
    { value: 'csv', label: 'CSV', icon: FileText, description: 'Dados tabulares para análise' },
    { value: 'json', label: 'JSON', icon: FileJson, description: 'Dados estruturados para integração' }
  ];

  const categories = ['Apostas', 'Financeiro', 'Estratégias', 'Usuário', 'Mercado', 'Personalizado'];

  const handleGenerateReport = () => {
    if (!selectedTemplate || !selectedFormat) return;

    const template = reportTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const newJob: ExportJob = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${template.name} - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
      format: selectedFormat.toUpperCase(),
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    setExportJobs(prev => [newJob, ...prev]);
    simulateExportProcess(newJob.id);
  };

  const simulateExportProcess = (jobId: string) => {
    // Simular processamento
    setExportJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'processing' } : job
    ));

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      
      if (progress >= 100) {
        clearInterval(interval);
        const success = Math.random() > 0.15; // 85% de sucesso
        
        setExportJobs(prev => prev.map(job => 
          job.id === jobId ? { 
            ...job, 
            status: success ? 'completed' : 'error',
            progress: 100,
            fileSize: success ? `${(Math.random() * 5 + 0.5).toFixed(1)} MB` : undefined,
            downloadUrl: success ? `/downloads/report-${jobId}.${selectedFormat}` : undefined,
            error: success ? undefined : 'Erro durante a geração do relatório'
          } : job
        ));
      } else {
        setExportJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, progress } : job
        ));
      }
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'completed': return 'Concluído';
      case 'error': return 'Erro';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'error': return AlertCircle;
      case 'processing': return Clock;
      default: return Clock;
    }
  };

  const selectedTemplateData = reportTemplates.find(t => t.id === selectedTemplate);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Exportar Relatórios</h1>
          <p className="text-muted-foreground">
            Gere relatórios personalizados e exporte seus dados em diferentes formatos
          </p>
        </div>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList>
            <TabsTrigger value="generate">Gerar Relatório</TabsTrigger>
            <TabsTrigger value="queue">Fila de Exportação</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Seleção de Template */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Selecionar Template</CardTitle>
                    <CardDescription>
                      Escolha o tipo de relatório que deseja gerar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reportTemplates.map((template) => (
                        <Card 
                          key={template.id}
                          className={`cursor-pointer transition-colors ${
                            selectedTemplate === template.id 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <template.icon className="h-8 w-8 text-primary mt-1" />
                              <div className="flex-1">
                                <h3 className="font-semibold">{template.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {template.description}
                                </p>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{template.category}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {template.estimatedTime}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ~{template.dataPoints.toLocaleString()} pontos de dados
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Filtros */}
                {selectedTemplate && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros e Configurações
                      </CardTitle>
                      <CardDescription>
                        Personalize os dados incluídos no relatório
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Período */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Data Inicial</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {filters.dateRange.from 
                                  ? format(filters.dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                                  : 'Selecionar data'
                                }
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={filters.dateRange.from}
                                onSelect={(date) => setFilters(prev => ({
                                  ...prev,
                                  dateRange: { ...prev.dateRange, from: date }
                                }))}
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Data Final</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                {filters.dateRange.to 
                                  ? format(filters.dateRange.to, 'dd/MM/yyyy', { locale: ptBR })
                                  : 'Selecionar data'
                                }
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={filters.dateRange.to}
                                onSelect={(date) => setFilters(prev => ({
                                  ...prev,
                                  dateRange: { ...prev.dateRange, to: date }
                                }))}
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Valores */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Valor Mínimo</Label>
                          <Input
                            type="number"
                            placeholder="R$ 0,00"
                            value={filters.minValue}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              minValue: e.target.value
                            }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Valor Máximo</Label>
                          <Input
                            type="number"
                            placeholder="R$ 10.000,00"
                            value={filters.maxValue}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              maxValue: e.target.value
                            }))}
                          />
                        </div>
                      </div>

                      {/* Opções */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeArchived"
                          checked={filters.includeArchived}
                          onCheckedChange={(checked) => setFilters(prev => ({
                            ...prev,
                            includeArchived: checked as boolean
                          }))}
                        />
                        <Label htmlFor="includeArchived">
                          Incluir dados arquivados
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Painel de Configuração */}
              <div className="space-y-6">
                {/* Formato */}
                <Card>
                  <CardHeader>
                    <CardTitle>Formato de Exportação</CardTitle>
                    <CardDescription>
                      Escolha o formato do arquivo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedTemplateData && (
                      <div className="space-y-3">
                        {formatOptions
                          .filter(format => selectedTemplateData.formats.includes(format.label))
                          .map((format) => (
                          <Card 
                            key={format.value}
                            className={`cursor-pointer transition-colors ${
                              selectedFormat === format.value 
                                ? 'border-primary bg-primary/5' 
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedFormat(format.value)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <format.icon className="h-6 w-6 text-primary" />
                                <div>
                                  <h4 className="font-medium">{format.label}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {format.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Preview */}
                {selectedTemplateData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Preview do Relatório</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Template:</span>
                          <span className="font-medium">{selectedTemplateData.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Formato:</span>
                          <span className="font-medium">{selectedFormat.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Campos:</span>
                          <span className="font-medium">{selectedTemplateData.fields.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tempo estimado:</span>
                          <span className="font-medium">{selectedTemplateData.estimatedTime}</span>
                        </div>
                        
                        <Separator />
                        
                        <Button 
                          className="w-full" 
                          onClick={handleGenerateReport}
                          disabled={!selectedTemplate || !selectedFormat}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Gerar Relatório
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Estatísticas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Relatórios hoje:</span>
                        <span className="font-medium">8</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Em processamento:</span>
                        <span className="font-medium">2</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de sucesso:</span>
                        <span className="font-medium">94%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="queue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Fila de Exportação</span>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Atualizar
                  </Button>
                </CardTitle>
                <CardDescription>
                  Acompanhe o progresso dos relatórios em processamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {exportJobs
                      .filter(job => job.status === 'pending' || job.status === 'processing')
                      .map((job) => {
                        const StatusIcon = getStatusIcon(job.status);
                        return (
                          <Card key={job.id} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <StatusIcon className="h-5 w-5 text-blue-500" />
                                  <div>
                                    <h4 className="font-medium">{job.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {job.format} • {format(new Date(job.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                    </p>
                                  </div>
                                </div>
                                
                                <Badge 
                                  variant="outline"
                                  className={`${getStatusColor(job.status)} text-white border-0`}
                                >
                                  {getStatusText(job.status)}
                                </Badge>
                              </div>
                              
                              {job.status === 'processing' && (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Progresso</span>
                                    <span>{Math.round(job.progress)}%</span>
                                  </div>
                                  <Progress value={job.progress} />
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    
                    {exportJobs.filter(job => job.status === 'pending' || job.status === 'processing').length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum relatório em processamento</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Exportações</CardTitle>
                <CardDescription>
                  Visualize e gerencie seus relatórios anteriores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {exportJobs.map((job) => {
                      const StatusIcon = getStatusIcon(job.status);
                      return (
                        <Card key={job.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <StatusIcon className={`h-5 w-5 ${
                                job.status === 'completed' ? 'text-green-500' :
                                job.status === 'error' ? 'text-red-500' : 'text-blue-500'
                              }`} />
                              <div>
                                <h4 className="font-medium">{job.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {job.format} • {format(new Date(job.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                  {job.fileSize && ` • ${job.fileSize}`}
                                </p>
                                {job.error && (
                                  <p className="text-sm text-red-500 mt-1">{job.error}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline"
                                className={
                                  job.status === 'completed' 
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : job.status === 'error'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }
                              >
                                {getStatusText(job.status)}
                              </Badge>
                              
                              {job.status === 'completed' && (
                                <>
                                  <Button variant="ghost" size="icon">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}