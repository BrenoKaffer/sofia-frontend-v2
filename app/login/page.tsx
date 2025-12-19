'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2, Brain, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageTransitionWithBackground from '@/components/layout/PageTransitionWithBackground';
import { supabase } from '@/lib/supabase';
import { ShinyButton } from '@/components/ui/shiny-button';

export default function LoginPage() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [welcomeTyped, setWelcomeTyped] = useState('');
  const [welcomeDone, setWelcomeDone] = useState(false);
  const { login, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const welcomeText = 'Bem-vindo de volta...';

  // Redirect if already logged in
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    const timeout = setTimeout(() => setSplashVisible(false), 1800);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    if (reducedMotion) {
      setWelcomeTyped(welcomeText);
      setWelcomeDone(true);
      return;
    }

    if (splashVisible) {
      setWelcomeTyped('');
      setWelcomeDone(false);
      return;
    }

    setWelcomeTyped('');
    setWelcomeDone(false);

    let i = 0;
    let intervalId: number | null = null;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        i += 1;
        setWelcomeTyped(welcomeText.slice(0, i));
        if (i >= welcomeText.length) {
          if (intervalId) window.clearInterval(intervalId);
          setWelcomeDone(true);
        }
      }, 45);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [splashVisible, welcomeText]);

  useEffect(() => {
    try {
      const storedRemember = typeof window !== 'undefined' ? window.localStorage.getItem('sofia_remember_me') : null;
      const storedEmail = typeof window !== 'undefined' ? window.localStorage.getItem('sofia_remember_email') : null;
      if (storedRemember === 'true' && storedEmail) {
        setRememberMe(true);
        setEmail(storedEmail);
      }
    } catch { }
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Tentando fazer login com:', { email, password: password.length + ' caracteres' });
      const success = await login(email, password);
      console.log('Resultado do login:', success);
      if (success) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token && session?.refresh_token) {
            const maxAge = 60 * 60 * 24 * 7;
            document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${maxAge}; samesite=lax`;
            document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=${maxAge}; samesite=lax`;
          }
        } catch { }
        try {
          if (rememberMe) {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('sofia_remember_me', 'true');
              window.localStorage.setItem('sofia_remember_email', email);
            }
          } else {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('sofia_remember_me');
              window.localStorage.removeItem('sofia_remember_email');
            }
          }
        } catch { }
        toast.success('Login realizado com sucesso!');
        router.push('/dashboard');
      } else {
        toast.error('Credenciais inválidas. Verifique se a senha tem pelo menos 6 caracteres.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dark min-h-screen flex">
      <PageTransitionWithBackground isVisible={splashVisible} />
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden bg-black">
        <div
          id="particles-background"
          className="absolute"
          style={{ left: '-51%', top: '-51%', width: '202%', height: '202%', transform: 'scale3d(0.5, 0.5, 1)' }}
        />
        <div
          id="particles-foreground"
          className="absolute"
          style={{ left: '-51%', top: '-51%', width: '202%', height: '202%', transform: 'scale3d(0.5, 0.5, 1)' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.8 }}
          className="w-full max-w-md relative z-10"
        >


          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.8, duration: 0.8, ease: 'easeOut' }}
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

          <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-heading">
                <span>{welcomeTyped}</span>
                <span className={`inline-block w-[1ch] ${welcomeDone ? 'opacity-0' : 'opacity-100 animate-pulse'}`}>|</span>
              </CardTitle>
              <CardDescription className="font-sans">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-sans">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-sans">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-sans"
                    >
                      Lembrar-me
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline font-sans"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                <ShinyButton type="submit" className="w-full h-11" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  <span className="font-sans">{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
                </ShinyButton>

                <div className="text-center text-sm font-sans">
                  <span className="text-muted-foreground">Não tem uma conta? </span>
                  <Link
                    href="/register"
                    className="text-primary hover:underline font-medium"
                  >
                    Cadastre-se
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>



        </motion.div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1932&q=80')] bg-cover bg-center opacity-5" />

        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <h2 className="text-4xl font-heading font-bold mb-6">
              A SOFIA pensa.
              <br />
              <span className="text-accent">Você apenas executa e lucra.</span>
            </h2>
            <p className="text-xl opacity-90 leading-relaxed font-sans">
              Inteligência artificial avançada para análise de roleta online.
              Padrões precisos em tempo real para maximizar seus resultados.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mt-12 grid grid-cols-1 gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">IA Avançada</h3>
                <p className="text-sm opacity-75 font-sans">Machine learning para análise precisa</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Tempo Real</h3>
                <p className="text-sm opacity-75 font-sans">Padrões instantâneos e precisos</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

