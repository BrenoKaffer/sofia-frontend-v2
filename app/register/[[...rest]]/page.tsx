'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ShinyButton({ children, className = '', type = 'button', disabled = false }: { children: React.ReactNode; className?: string; type?: 'button' | 'submit' | 'reset'; disabled?: boolean }) {
  return (
    <>
      <style jsx>{`
        @property --gradient-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
        @property --gradient-angle-offset { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
        @property --gradient-percent { syntax: "<percentage>"; initial-value: 5%; inherits: false; }
        @property --gradient-shine { syntax: "<color>"; initial-value: white; inherits: false; }
        .shiny-cta {
          --shiny-cta-bg: linear-gradient(90deg, #34E13C, #0C1C25);
          --shiny-cta-bg-subtle: #0C1C25;
          --shiny-cta-fg: #ffffff;
          --shiny-cta-highlight: #34E13C;
          --shiny-cta-highlight-subtle: #34E13C;
          --animation: gradient-angle linear infinite;
          --duration: 3s;
          --shadow-size: 2px;
          --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);
          isolation: isolate;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          outline-offset: 4px;
          padding: 0.5rem 1rem;
          font-family: inherit;
          font-size: 0.875rem;
          line-height: 1.2;
          font-weight: 500;
          border: 1px solid transparent;
          border-radius: 0.5rem;
          color: var(--shiny-cta-fg);
          background: var(--shiny-cta-bg) padding-box,
            conic-gradient(
              from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
              transparent,
              var(--shiny-cta-highlight) var(--gradient-percent),
              var(--gradient-shine) calc(var(--gradient-percent) * 2),
              var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
              transparent calc(var(--gradient-percent) * 4)
            ) border-box;
          box-shadow: inset 0 0 0 1px var(--shiny-cta-bg-subtle);
          transition: var(--transition);
          transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine, opacity;
        }
        .shiny-cta::before, .shiny-cta::after, .shiny-cta span::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset-inline-start: 50%;
          inset-block-start: 50%;
          translate: -50% -50%;
          z-index: -1;
        }
        .shiny-cta:active { translate: 0 1px; }
        .shiny-cta::before {
          --size: calc(100% - var(--shadow-size) * 3);
          --position: 2px;
          --space: calc(var(--position) * 2);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(circle at var(--position) var(--position), white calc(var(--position) / 4), transparent 0) padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
          mask-image: conic-gradient(from calc(var(--gradient-angle) + 45deg), black, transparent 10% 90%, black);
          border-radius: inherit;
          opacity: 0.2;
          z-index: -1;
        }
        .shiny-cta::after {
          --animation: shimmer linear infinite;
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(-50deg, transparent, var(--shiny-cta-highlight), transparent);
          mask-image: radial-gradient(circle at bottom, transparent 40%, black);
          opacity: 0.4;
        }
        .shiny-cta span { z-index: 1; display: inline-flex; align-items: center; justify-content: center; }
        .shiny-cta span::before {
          --size: calc(100% + 1rem);
          width: var(--size);
          height: var(--size);
          box-shadow: inset 0 -1ex 2rem 4px var(--shiny-cta-highlight);
          opacity: 0;
          transition: opacity var(--transition);
          animation: calc(var(--duration) * 1.5) breathe linear infinite;
        }
        .shiny-cta, .shiny-cta::before, .shiny-cta::after { animation: var(--animation) var(--duration), var(--animation) calc(var(--duration) / 0.4) reverse paused; animation-composition: add; }
        .shiny-cta:is(:hover, :focus-visible) { --gradient-percent: 20%; --gradient-angle-offset: 95deg; --gradient-shine: var(--shiny-cta-highlight-subtle); }
        .shiny-cta:is(:hover, :focus-visible), .shiny-cta:is(:hover, :focus-visible)::before, .shiny-cta:is(:hover, :focus-visible)::after { animation-play-state: running; }
        .shiny-cta:is(:hover, :focus-visible) span::before { opacity: 1; }
        @keyframes gradient-angle { to { --gradient-angle: 360deg; } }
        @keyframes shimmer { to { rotate: 360deg; } }
        @keyframes breathe { from, to { scale: 1; } 50% { scale: 1.2; } }
      `}</style>
      <button type={type} disabled={disabled} className={`shiny-cta ${className}`}>
        <span>{children}</span>
      </button>
    </>
  )
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para validação em tempo real
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: ''
  });

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false
  });
  const router = useRouter();
  const { register, user, isLoading: isAuthLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

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



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      setIsSubmitting(false);
      return;
    }

    if (!acceptTerms) {
      toast.error('Você deve aceitar os termos de uso');
      setIsSubmitting(false);
      return;
    }

    try {
      // Use auth-context register function which uses backend API
      // Backend now handles user creation, profile insertion, and sending premium verification email
      const success = await register(fullName, email, password, '', fullName);
      
      if (success) {
        // Success message is handled by auth-context, but we can redirect here
        router.push('/login');
      }
      // If failed, toast is already handled by auth-context
    } catch (error) {
      console.error('Erro no registro:', error);
      toast.error('Erro inesperado ao tentar registrar');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const particleground = (container: HTMLElement, opts: {
      dotColor: string;
      lineColor: string;
      minSpeedX: number;
      maxSpeedX: number;
      minSpeedY: number;
      maxSpeedY: number;
      density: number;
      curvedLines: boolean;
      proximity: number;
      parallaxMultiplier: number;
      particleRadius: number;
      lineWidth?: number;
    }) => {
      const canvas = document.createElement('canvas');
      canvas.className = 'pg-canvas';
      canvas.style.display = 'block';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.insertBefore(canvas, container.firstChild);
      const ctx = canvas.getContext('2d');
      if (!ctx) return { destroy: () => { } };
      const resize = () => {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        ctx.fillStyle = opts.dotColor;
        ctx.strokeStyle = opts.lineColor;
        ctx.lineWidth = opts.lineWidth ?? 1;
      };
      resize();
      let running = true;
      const particles: Array<{
        stackPos: number;
        active: boolean;
        layer: number;
        parallaxOffsetX: number;
        parallaxOffsetY: number;
        position: { x: number; y: number };
        speed: { x: number; y: number };
      }> = [];
      const count = Math.round(canvas.width * canvas.height / opts.density);
      for (let i = 0; i < count; i++) {
        const p = {
          stackPos: i,
          active: true,
          layer: Math.ceil(3 * Math.random()),
          parallaxOffsetX: 0,
          parallaxOffsetY: 0,
          position: { x: Math.ceil(Math.random() * canvas.width), y: Math.ceil(Math.random() * canvas.height) },
          speed: { x: 0, y: 0 },
        };
        p.speed.x = (Math.random() * (opts.maxSpeedX - opts.minSpeedX) + opts.minSpeedX) * (Math.random() < 0.5 ? -1 : 1);
        p.speed.y = (Math.random() * (opts.maxSpeedY - opts.minSpeedY) + opts.minSpeedY) * (Math.random() < 0.5 ? -1 : 1);
        particles.push(p);
      }
      let mouseX = 0, mouseY = 0;
      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        const rx = mouseX / rect.width - 0.5;
        const ry = mouseY / rect.height - 0.5;
        for (const p of particles) {
          const mult = p.layer !== 1 ? 0.5 * opts.parallaxMultiplier : opts.parallaxMultiplier;
          p.parallaxOffsetX = rx * mult;
          p.parallaxOffsetY = ry * mult;
        }
      };
      const step = () => {
        if (!running || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = opts.lineColor;
        ctx.lineWidth = opts.lineWidth ?? 1;
        for (const p of particles) {
          p.position.x += p.speed.x;
          p.position.y += p.speed.y;
          if (p.position.x + p.parallaxOffsetX > canvas.width) p.position.x = 0;
          else if (p.position.x + p.parallaxOffsetX < 0) p.position.x = canvas.width;
          if (p.position.y + p.parallaxOffsetY > canvas.height) p.position.y = 0;
          else if (p.position.y + p.parallaxOffsetY < 0) p.position.y = canvas.height;
          ctx.beginPath();
          ctx.arc(p.position.x + p.parallaxOffsetX, p.position.y + p.parallaxOffsetY, opts.particleRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          const ax = a.position.x + a.parallaxOffsetX;
          const ay = a.position.y + a.parallaxOffsetY;
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const bx = b.position.x + b.parallaxOffsetX;
            const by = b.position.y + b.parallaxOffsetY;
            const dx = ax - bx;
            const dy = ay - by;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < opts.proximity) {
              ctx.moveTo(ax, ay);
              ctx.lineTo(bx, by);
            }
          }
        }
        ctx.stroke();
        requestAnimationFrame(step);
      };
      window.addEventListener('resize', resize);
      container.addEventListener('mousemove', onMouseMove);
      requestAnimationFrame(step);
      return {
        destroy: () => {
          running = false;
          window.removeEventListener('resize', resize);
          container.removeEventListener('mousemove', onMouseMove);
          canvas.remove();
        }
      };
    };
    const bg = document.getElementById('particles-background');
    const fg = document.getElementById('particles-foreground');
    if (!bg || !fg) return;
    const instFg = particleground(fg, {
      dotColor: 'rgba(255, 255, 255, 0.85)',
      lineColor: 'rgba(255, 255, 255, 0.22)',
      minSpeedX: 0.3,
      maxSpeedX: 0.6,
      minSpeedY: 0.3,
      maxSpeedY: 0.6,
      density: 50000,
      curvedLines: false,
      proximity: 160,
      parallaxMultiplier: 10,
      particleRadius: 3,
      lineWidth: 1.6,
    });
    const instBg = particleground(bg, {
      dotColor: 'rgba(255, 255, 255, 0.45)',
      lineColor: 'rgba(255, 255, 255, 0.12)',
      minSpeedX: 0.075,
      maxSpeedX: 0.15,
      minSpeedY: 0.075,
      maxSpeedY: 0.15,
      density: 30000,
      curvedLines: false,
      proximity: 90,
      parallaxMultiplier: 20,
      particleRadius: 2,
      lineWidth: 1.2,
    });
    return () => {
      instFg.destroy();
      instBg.destroy();
    };
  }, []);

  return (
    <div className="dark min-h-screen flex">
      {/* Left side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden bg-black">
        <div id="particles-background" className="absolute" style={{ left: '-51%', top: '-51%', width: '202%', height: '202%', transform: 'scale3d(0.5, 0.5, 1)' }} />
        <div id="particles-foreground" className="absolute" style={{ left: '-51%', top: '-51%', width: '202%', height: '202%', transform: 'scale3d(0.5, 0.5, 1)' }} />
        <motion.div
          className="w-full max-w-md space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="inline-flex items-center justify-center mb-2"
            >
              <div className="relative w-[240px] h-[60px] md:w-[280px] md:h-[70px] mx-auto">
                <Image
                  src="/logo_sofia.png"
                  alt="SOFIA"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>
            <p className="text-muted-foreground mt-2 font-sans">
              Sistema de Operação de Fichas Inteligentes e Autônomas
            </p>
          </div>

          {/* Register Card */}
          <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold font-sans">Criar Conta</CardTitle>
              <CardDescription className="font-sans">
                Junte-se à SOFIA e comece a lucrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome Completo */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-sans">
                    Nome Completo
                  </Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => {
                        handleFieldChange('fullName', e.target.value);
                      }}
                      onBlur={(e) => handleFieldBlur('fullName', e.target.value)}
                      className={`h-11 font-sans ${touched.fullName && errors.fullName
                          ? 'border-red-500 focus:border-red-500'
                          : touched.fullName && !errors.fullName
                            ? 'border-green-500 focus:border-green-500'
                            : ''
                        }`}
                      required
                    />
                    {touched.fullName && !errors.fullName ? (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    ) : null}
                  </div>
                  {touched.fullName && errors.fullName && (
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
                      className={`h-11 font-sans ${touched.email && errors.email
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
                      className={`h-11 pr-10 font-sans ${touched.password && errors.password
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
                      className={`h-11 pr-10 font-sans ${touched.confirmPassword && errors.confirmPassword
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

                <ShinyButton type="submit" className="w-full h-11" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  <span className="font-sans">{isSubmitting ? 'Criando conta...' : 'Criar Conta'}</span>
                </ShinyButton>

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
