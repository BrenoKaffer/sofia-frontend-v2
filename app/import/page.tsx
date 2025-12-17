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
import { 
  Upload, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Download,
  FileSpreadsheet,
  FileJson,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  Eye,
  Trash2,
  Settings
} from 'lucide-react';

interface ImportFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  records?: number;
  errors?: string[];
  preview?: any[];
}

interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  format: string;
  fields: string[];
  example: string;
  icon: any;
}

export default function ImportPage() {
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [importHistory, setImportHistory] = useState([
    {
      id: '1',
      filename: 'dados_janeiro_2024.csv',
      date: '2024-01-15',
      records: 1250,
      status: 'completed',
      type: 'Histórico de Apostas'
    },
    {
      id: '2',
      filename: 'estrategias_backup.json',
      date: '2024-01-10',
      records: 45,
      status: 'completed',
      type: 'Estratégias'
    },
    {
      id: '3',
      filename: 'bankroll_data.xlsx',
      date: '2024-01-08',
      records: 890,
      status: 'error',
      type: 'Dados Financeiros'
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates: ImportTemplate[] = [
    {
      id: 'betting-history',
      name: 'Histórico de Apostas',
      description: 'Importar dados de apostas anteriores com resultados e valores',
      format: 'CSV, Excel',
      fields: ['data', 'valor_aposta', 'resultado', 'lucro', 'estrategia'],
      example: 'historico_apostas_template.csv',
      icon: TrendingUp
    },
    {
      id: 'strategies',
      name: 'Estratégias',
      description: 'Importar configurações de estratégias personalizadas',
      format: 'JSON, CSV',
      fields: ['nome', 'tipo', 'parametros', 'condicoes', 'stop_loss'],
      example: 'estrategias_template.json',
      icon: Settings
    },
    {
      id: 'bankroll',
      name: 'Dados Financeiros',
      description: 'Importar histórico de bankroll e movimentações financeiras',
      format: 'CSV, Excel',
      fields: ['data', 'saldo_inicial', 'deposito', 'saque', 'saldo_final'],
      example: 'bankroll_template.xlsx',
      icon: DollarSign
    },
    {
      id: 'users',
      name: 'Dados de Usuários',
      description: 'Importar informações de usuários e perfis',
      format: 'CSV, JSON',
      fields: ['nome', 'email', 'nivel', 'data_cadastro', 'status'],
      example: 'usuarios_template.csv',
      icon: Users
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (fileList: File[]) => {
    const newFiles: ImportFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // Simular upload e processamento
    newFiles.forEach(file => {
      simulateFileProcessing(file.id);
    });
  };

  const simulateFileProcessing = (fileId: string) => {
    // Simular upload
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'uploading' } : f
    ));

    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        clearInterval(uploadInterval);
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'processing', 
            progress: 100 
          } : f
        ));
        
        // Simular processamento
        setTimeout(() => {
          const success = Math.random() > 0.2; // 80% de sucesso
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { 
              ...f, 
              status: success ? 'completed' : 'error',
              records: success ? Math.floor(Math.random() * 1000) + 100 : undefined,
              errors: success ? undefined : ['Formato de arquivo inválido', 'Dados corrompidos na linha 45'],
              preview: success ? generatePreviewData() : undefined
            } : f
          ));
        }, 2000);
      } else {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ));
      }
    }, 200);
  };

  const generatePreviewData = () => {
    return [
      { data: '2024-01-15', valor: 'R$ 50,00', resultado: 'Vitória', lucro: 'R$ 25,00' },
      { data: '2024-01-14', valor: 'R$ 30,00', resultado: 'Derrota', lucro: '-R$ 30,00' },
      { data: '2024-01-13', valor: 'R$ 75,00', resultado: 'Vitória', lucro: 'R$ 37,50' }
    ];
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      case 'uploading': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'uploading': return 'Enviando';
      case 'processing': return 'Processando';
      case 'completed': return 'Concluído';
      case 'error': return 'Erro';
      default: return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Importar Dados</h1>
          <p className="text-muted-foreground">
            Importe dados externos para enriquecer suas análises e estratégias
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upload">Upload de Arquivos</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Área de Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload de Arquivos
                </CardTitle>
                <CardDescription>
                  Arraste e solte arquivos ou clique para selecionar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Solte seus arquivos aqui
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Suporte para CSV, Excel, JSON (máx. 10MB por arquivo)
                  </p>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    Selecionar Arquivos
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>

                {/* Lista de Arquivos */}
                {files.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="font-semibold">Arquivos em Processamento</h4>
                    {files.map((file) => (
                      <Card key={file.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{file.name}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`${getStatusColor(file.status)} text-white border-0`}
                                >
                                  {getStatusText(file.status)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)}
                                {file.records && ` • ${file.records} registros`}
                              </p>
                              
                              {(file.status === 'uploading' || file.status === 'processing') && (
                                <Progress value={file.progress} className="mt-2" />
                              )}
                              
                              {file.errors && (
                                <Alert className="mt-2">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    {file.errors.join(', ')}
                                  </AlertDescription>
                                </Alert>
                              )}
                              
                              {file.preview && (
                                <div className="mt-2">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    Visualizar Dados
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Arquivos Hoje</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">12</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Registros</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">8.4K</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Sucessos</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">95%</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Processando</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">3</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Importação</CardTitle>
                <CardDescription>
                  Use nossos templates pré-configurados para importar dados específicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
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
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{template.format}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Campos: {template.fields.join(', ')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="h-4 w-4 mr-1" />
                            Baixar Template
                          </Button>
                          <Button size="sm" className="flex-1">
                            <Upload className="h-4 w-4 mr-1" />
                            Usar Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Histórico de Importações</span>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Atualizar
                  </Button>
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie suas importações anteriores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {importHistory.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                            <div>
                              <h4 className="font-medium">{item.filename}</h4>
                              <p className="text-sm text-muted-foreground">
                                {item.type} • {item.records} registros
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline"
                              className={
                                item.status === 'completed' 
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }
                            >
                              {item.status === 'completed' ? 'Sucesso' : 'Erro'}
                            </Badge>
                            
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button variant="ghost" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
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