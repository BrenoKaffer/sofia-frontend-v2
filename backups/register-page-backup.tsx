'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Brain, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CPFService } from '@/lib/cpf-service';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCPF, setIsLoadingCPF] = useState(false);
  const [nameFromAPI, setNameFromAPI] = useState(false);
  
  // Estados para validação em tempo real
  const [errors, setErrors] = useState({
    fullName: '',
    cpf: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: ''
  });
  
  const [touched, setTouched] = useState({
    fullName: false,
    cpf: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false
  });
  const { register } = useAuth();
  const router = useRouter();
  
  // Funções de validação
  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Nome completo é obrigatório';
        } else if (value.trim().length < 2) {
          error = 'Nome deve ter pelo menos 2 caracteres';
        } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
          error = 'Nome deve conter apenas letras e espaços';
        }
        break;
        
      case 'cpf':
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
        if (!value) {
          error = 'CPF é obrigatório';
        } else if (!cpfRegex.test(value)) {
          error = 'CPF deve estar no formato 000.000.000-00';
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          error = 'Email é obrigatório';
        } else if (!emailRegex.test(value)) {
          error = 'Email deve ter um formato válido';
        }
        break;
        
      case 'password':
        if (!value) {
          error = 'Senha é obrigatória';
        } else if (value.length < 6) {
          error = 'Senha deve ter pelo menos 6 caracteres';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = 'Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula e 1 número';
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          error = 'Confirmação de senha é obrigatória';
        } else if (value !== password) {
          error = 'Senhas não coincidem';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };
  
  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case 'fullName':
        setFullName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
    }
    
    if (touched[field as keyof typeof touched]) {
      validateField(field, value);
    }
  };
  
  const handleFieldBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const handleCPFChange = async (value: string) => {
    // Formatar CPF automaticamente
    let formattedValue = value.replace(/\D/g, '');
    if (formattedValue.length <= 11) {
      formattedValue = formattedValue.replace(/(\d{3})(\d)/, '$1.$2');
      formattedValue = formattedValue.replace(/(\d{3})(\d)/, '$1.$2');
      formattedValue = formattedValue.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      setCpf(formattedValue);
    }

    // Se CPF estiver completo (11 dígitos), buscar nome na API
    const cleanCPF = value.replace(/\D/g, '');
    if (cleanCPF.length === 11) {
      setIsLoadingCPF(true);
      try {
        // Para demonstração, vamos simular uma data de nascimento
        // Em produção, você pode pedir a data de nascimento ou usar outra abordagem
        const birthDate = '01/01/1990'; // Data fictícia para teste
        const response = await CPFService.validateCPF(formattedValue, birthDate);
        
        if (response.success && response.data.name) {
          setFullName(response.data.name);
          setNameFromAPI(true);
          toast.success('Nome encontrado automaticamente!');
        } else {
          toast.warning('CPF não encontrado. Digite o nome manualmente.');
          setNameFromAPI(false);
        }
      } catch (error) {
        console.error('Erro ao buscar CPF:', error);
        setNameFromAPI(false);
        
        // Feedback de erro mais amigável
        const isDevelopment = process.env.NODE_ENV === 'development' || 
                             window.location.hostname === 'localhost';
        
        if (isDevelopment) {
          toast.success('Modo de desenvolvimento: Consulta de CPF simulada. Em produção, dados reais serão consultados.');
        } else {
          toast.error('Erro na consulta do CPF. Não foi possível consultar os dados. Você pode preencher o nome manualmente.');
        }
      } finally {
        setIsLoadingCPF(false);
      }
    } else {
      // Se CPF não estiver completo, permitir edição do nome
      setNameFromAPI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!fullName || !cpf || !email || !password || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    // Validar CPF (formato básico)
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
    if (!cpfRegex.test(cpf)) {
      toast.error('CPF deve estar no formato 000.000.000-00 ou conter 11 dígitos');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (!acceptTerms) {
      toast.error('Você deve aceitar os termos de uso');
      setIsLoading(false);
      return;
    }

    try {
      // Usar fullName como username também, já que removemos o campo separado
      const success = await register(fullName, email, password, cpf, fullName);
      if (success) {
        toast.success('Conta criada com sucesso!');
        router.push('/dashboard');
      } else {
        toast.error('Erro ao criar conta');
      }
    } catch (error) {
      toast.error('Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div 
          className="w-full max-w-md space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center space-y-2 relative">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-sans">
                SOFIA
              </h1>
            </div>
            <p className="text-muted-foreground font-sans">
              Sistema de Operação de Fichas Inteligentes
            </p>
          </div>

          {/* Register Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold font-sans">Criar Conta</CardTitle>
              <CardDescription className="font-sans">
                Junte-se à SOFIA e comece a lucrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* CPF em primeiro lugar */}
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="font-sans">CPF</Label>
                  <div className="relative">
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => {
                        handleCPFChange(e.target.value);
                        if (touched.cpf) validateField('cpf', e.target.value);
                      }}
                      onBlur={(e) => handleFieldBlur('cpf', e.target.value)}
                      className={`h-11 font-sans ${
                        touched.cpf && errors.cpf 
                          ? 'border-red-500 focus:border-red-500' 
                          : touched.cpf && !errors.cpf 
                          ? 'border-green-500 focus:border-green-500' 
                          : ''
                      }`}
                      maxLength={14}
                      required
                    />
                    {isLoadingCPF && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <LoadingSpinner size="sm" />
                      </div>
                    )}
                    {touched.cpf && !errors.cpf && !isLoadingCPF && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {touched.cpf && errors.cpf && (
                    <p className="text-sm text-red-500 font-sans">{errors.cpf}</p>
                  )}
                </div>

                {/* Nome Completo - preenchido automaticamente */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-sans">
                    Nome Completo
                    {nameFromAPI && <span className="text-xs text-green-600 ml-2">(Preenchido automaticamente)</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => {
                        if (!nameFromAPI) {
                          handleFieldChange('fullName', e.target.value);
                        }
                      }}
                      onBlur={(e) => !nameFromAPI && handleFieldBlur('fullName', e.target.value)}
                      className={`h-11 font-sans ${
                        nameFromAPI 
                          ? 'bg-muted cursor-not-allowed border-green-500' 
                          : touched.fullName && errors.fullName 
                          ? 'border-red-500 focus:border-red-500' 
                          : touched.fullName && !errors.fullName 
                          ? 'border-green-500 focus:border-green-500' 
                          : ''
                      }`}
                      readOnly={nameFromAPI}
                      required
                    />
                    {(touched.fullName && !errors.fullName && !nameFromAPI) || nameFromAPI ? (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    ) : null}
                  </div>
                  {touched.fullName && errors.fullName && !nameFromAPI && (
                    <p className="text-sm text-red-500 font-sans">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-sans">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={(e) => handleFieldBlur('email', e.target.value)}
                      className={`h-11 font-sans ${
                        touched.email && errors.email 
                          ? 'border-red-500 focus:border-red-500' 
                          : touched.email && !errors.email 
                          ? 'border-green-500 focus:border-green-500' 
                          : ''
                      }`}
                      required
                    />
                    {touched.email && !errors.email && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {touched.email && errors.email && (
                    <p className="text-sm text-red-500 font-sans">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-sans">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      onBlur={(e) => handleFieldBlur('password', e.target.value)}
                      className={`h-11 pr-10 font-sans ${
                        touched.password && errors.password 
                          ? 'border-red-500 focus:border-red-500' 
                          : touched.password && !errors.password 
                          ? 'border-green-500 focus:border-green-500' 
                          : ''
                      }`}
                      required
                    />
                    <div className="absolute right-0 top-0 h-11 flex items-center">
                      {touched.password && !errors.password && (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-sm text-red-500 font-sans">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-sans">Confirmar Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                      onBlur={(e) => handleFieldBlur('confirmPassword', e.target.value)}
                      className={`h-11 pr-10 font-sans ${
                        touched.confirmPassword && errors.confirmPassword 
                          ? 'border-red-500 focus:border-red-500' 
                          : touched.confirmPassword && !errors.confirmPassword 
                          ? 'border-green-500 focus:border-green-500' 
                          : ''
                      }`}
                      required
                    />
                    <div className="absolute right-0 top-0 h-11 flex items-center">
                      {touched.confirmPassword && !errors.confirmPassword && (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="text-sm text-red-500 font-sans">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm font-sans">
                    Aceito os{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      termos de uso
                    </Link>
                    {' '}e{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      política de privacidade
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  <span className="font-sans">{isLoading ? 'Criando conta...' : 'Criar Conta'}</span>
                </Button>
                
                <div className="text-center text-sm font-sans">
                  <span className="text-muted-foreground">Já tem uma conta? </span>
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    Faça login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground font-sans">
              Crie sua conta para acessar o sistema SOFIA
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right side - Marketing/Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(white,transparent_70%)]" />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold leading-tight font-sans">
              Comece sua jornada
              <span className="block text-accent">rumo ao sucesso</span>
            </h2>
            
            <p className="text-lg text-white/90 leading-relaxed font-sans">
              Junte-se a milhares de usuários que já descobriram o poder da inteligência artificial aplicada à análise de roleta.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span className="font-sans">Conta gratuita para começar</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span className="font-sans">Acesso a todas as funcionalidades</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span className="font-sans">Suporte técnico especializado</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}