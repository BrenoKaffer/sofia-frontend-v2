'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Palette, 
  Database, 
  Key, 
  Activity,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  Upload,
  Download,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  location: string;
  birthDate: string;
  language: string;
  timezone: string;
  bio: string;
  joinDate: string;
  lastLogin: string;
  accountType: 'free' | 'premium' | 'enterprise';
  isVerified: boolean;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    alerts: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
    dataSharing: boolean;
  };
  trading: {
    defaultStrategy: string;
    riskLevel: 'low' | 'medium' | 'high';
    autoStop: boolean;
    maxLoss: number;
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  activeSessions: number;
  loginHistory: Array<{
    date: string;
    location: string;
    device: string;
    ip: string;
  }>;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    id: 'user_123',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '+55 11 99999-9999',
    avatar: '/api/placeholder/150/150',
    location: 'São Paulo, SP',
    birthDate: '1990-05-15',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    bio: 'Trader experiente com foco em estratégias de roulette.',
    joinDate: '2023-01-15',
    lastLogin: '2024-01-15 14:30',
    accountType: 'premium',
    isVerified: true
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    notifications: {
      email: true,
      push: true,
      sms: false,
      alerts: true
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
      dataSharing: false
    },
    trading: {
      defaultStrategy: 'martingale',
      riskLevel: 'medium',
      autoStop: true,
      maxLoss: 1000
    }
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: true,
    lastPasswordChange: '2023-12-01',
    activeSessions: 3,
    loginHistory: [
      { date: '2024-01-15 14:30', location: 'São Paulo, SP', device: 'Chrome/Windows', ip: '192.168.1.1' },
      { date: '2024-01-14 09:15', location: 'São Paulo, SP', device: 'Mobile/Android', ip: '192.168.1.2' },
      { date: '2024-01-13 16:45', location: 'Rio de Janeiro, RJ', device: 'Safari/macOS', ip: '192.168.2.1' }
    ]
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
      // Toast de sucesso
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({ ...prev, avatar: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const variants = {
      free: 'secondary',
      premium: 'default',
      enterprise: 'destructive'
    };
    return <Badge variant={variants[type as keyof typeof variants] as any}>{type.toUpperCase()}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Meu Perfil</h1>
          <p className="text-slate-300">Gerencie suas informações pessoais e preferências</p>
        </div>

        {/* Profile Summary Card */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={profile.avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-purple-500"
              />
              <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-700 transition-colors">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadAvatar}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                {profile.isVerified && <Check className="w-6 h-6 text-green-500" />}
                {getAccountTypeBadge(profile.accountType)}
              </div>
              <p className="text-slate-300 mb-1">{profile.email}</p>
              <p className="text-slate-400 text-sm">Membro desde {new Date(profile.joinDate).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-300 text-sm">Último acesso</p>
              <p className="text-white font-medium">{profile.lastLogin}</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Preferências</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Dados</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Informações Pessoais</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isEditing ? 'Cancelar' : 'Editar'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-slate-300">Nome Completo</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Telefone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Localização</Label>
                  <Input
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={profile.birthDate}
                    onChange={(e) => setProfile(prev => ({ ...prev, birthDate: e.target.value }))}
                    disabled={!isEditing}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Idioma</Label>
                  <select
                    value={profile.language}
                    onChange={(e) => setProfile(prev => ({ ...prev, language: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded-md"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <Label className="text-slate-300">Bio</Label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-md resize-none"
                  placeholder="Conte um pouco sobre você..."
                />
              </div>

              {isEditing && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Theme Settings */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Aparência
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Tema</Label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value as any }))}
                      className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded-md"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Escuro</option>
                      <option value="auto">Automático</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Notification Settings */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notificações
                </h3>
                <div className="space-y-4">
                  {Object.entries(preferences.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-slate-300 capitalize">{key}</Label>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, [key]: e.target.checked }
                        }))}
                        className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Privacy Settings */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Privacidade
                </h3>
                <div className="space-y-4">
                  {Object.entries(preferences.privacy).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          privacy: { ...prev.privacy, [key]: e.target.checked }
                        }))}
                        className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Trading Settings */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Trading
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Estratégia Padrão</Label>
                    <select
                      value={preferences.trading.defaultStrategy}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        trading: { ...prev.trading, defaultStrategy: e.target.value }
                      }))}
                      className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded-md"
                    >
                      <option value="martingale">Martingale</option>
                      <option value="fibonacci">Fibonacci</option>
                      <option value="labouchere">Labouchere</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-300">Nível de Risco</Label>
                    <select
                      value={preferences.trading.riskLevel}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        trading: { ...prev.trading, riskLevel: e.target.value as any }
                      }))}
                      className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded-md"
                    >
                      <option value="low">Baixo</option>
                      <option value="medium">Médio</option>
                      <option value="high">Alto</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-300">Perda Máxima (R$)</Label>
                    <Input
                      type="number"
                      value={preferences.trading.maxLoss}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        trading: { ...prev.trading, maxLoss: Number(e.target.value) }
                      }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Security Overview */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Visão Geral de Segurança
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Autenticação 2FA</span>
                    <Badge variant={security.twoFactorEnabled ? "default" : "destructive"}>
                      {security.twoFactorEnabled ? "Ativada" : "Desativada"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Sessões Ativas</span>
                    <span className="text-white font-medium">{security.activeSessions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Última Alteração de Senha</span>
                    <span className="text-white font-medium">{new Date(security.lastPasswordChange).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </Card>

              {/* Password Change */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Alterar Senha
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="bg-slate-700 border-slate-600 text-white pr-10"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Nova Senha</Label>
                    <Input
                      type="password"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <button className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Alterar Senha
                  </button>
                </div>
              </Card>
            </div>

            {/* Login History */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Histórico de Login</h3>
              <div className="space-y-3">
                {security.loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{login.location}</p>
                      <p className="text-slate-400 text-sm">{login.device} • {login.ip}</p>
                    </div>
                    <span className="text-slate-300 text-sm">{login.date}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Export */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Exportar Dados
                </h3>
                <p className="text-slate-300 mb-4">Baixe uma cópia de todos os seus dados.</p>
                <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Solicitar Exportação
                </button>
              </Card>

              {/* Data Import */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Importar Dados
                </h3>
                <p className="text-slate-300 mb-4">Importe dados de outras plataformas.</p>
                <button className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Importar Arquivo
                </button>
              </Card>

              {/* Account Deletion */}
              <Card className="bg-slate-800/50 border-red-500 p-6 md:col-span-2">
                <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Zona de Perigo
                </h3>
                <p className="text-slate-300 mb-4">
                  Ações irreversíveis que afetarão permanentemente sua conta.
                </p>
                <div className="space-y-3">
                  <button className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Excluir Conta Permanentemente
                  </button>
                  <p className="text-slate-400 text-sm">
                    Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}