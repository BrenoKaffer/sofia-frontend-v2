'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2, Brain, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'framer-motion';
import PageTransitionWithBackground from '@/components/layout/PageTransitionWithBackground';
import BrandSVG from '@/components/layout/BrandSVG';

export default function LoginPage() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => setSplashVisible(false), 1800);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const makeParticles = (container: HTMLElement, options: {
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
    }) => {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) return () => { };
      const resize = () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      };
      resize();
      let raf = 0;
      const count = Math.round((canvas.width * canvas.height) / options.density);
      const particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() < 0.5 ? -1 : 1) * (Math.random() * (options.maxSpeedX - options.minSpeedX) + options.minSpeedX),
        vy: (Math.random() < 0.5 ? -1 : 1) * (Math.random() * (options.maxSpeedY - options.minSpeedY) + options.minSpeedY),
        px: 0,
        py: 0,
        layer: Math.ceil(Math.random() * 3),
      }));
      const onMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const rx = (e.clientX - rect.left) / rect.width - 0.5;
        const ry = (e.clientY - rect.top) / rect.height - 0.5;
        for (const p of particles) {
          const mult = p.layer !== 1 ? 0.5 * options.parallaxMultiplier : options.parallaxMultiplier;
          p.px = rx * mult;
          p.py = ry * mult;
        }
      };
      const step = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x + p.px > canvas.width) p.x = 0;
          if (p.x + p.px < 0) p.x = canvas.width;
          if (p.y + p.py > canvas.height) p.y = 0;
          if (p.y + p.py < 0) p.y = canvas.height;
          ctx.fillStyle = options.dotColor;
          ctx.beginPath();
          ctx.arc(p.x + p.px, p.y + p.py, options.particleRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = options.lineColor;
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const dx = a.x + a.px - (b.x + b.px);
            const dy = a.y + a.py - (b.y + b.py);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < options.proximity) {
              ctx.beginPath();
              ctx.moveTo(a.x + a.px, a.y + a.py);
              ctx.lineTo(b.x + b.px, b.y + b.py);
              ctx.stroke();
            }
          }
        }
        raf = requestAnimationFrame(step);
      };
      window.addEventListener('resize', resize);
      container.addEventListener('mousemove', onMouseMove);
      raf = requestAnimationFrame(step);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        container.removeEventListener('mousemove', onMouseMove);
        canvas.remove();
      };
    };
    const bg = document.getElementById('particles-background');
    const fg = document.getElementById('particles-foreground');
    if (!bg || !fg) return;
    const cleanupFg = makeParticles(fg, {
      dotColor: 'rgba(255, 255, 255, 1)',
      lineColor: 'rgba(255, 255, 255, 0.05)',
      minSpeedX: 0.3,
      maxSpeedX: 0.6,
      minSpeedY: 0.3,
      maxSpeedY: 0.6,
      density: 50000,
      curvedLines: false,
      proximity: 250,
      parallaxMultiplier: 10,
      particleRadius: 4,
    });
    const cleanupBg = makeParticles(bg, {
      dotColor: 'rgba(255, 255, 255, 0.5)',
      lineColor: 'rgba(255, 255, 255, 0.05)',
      minSpeedX: 0.075,
      maxSpeedX: 0.15,
      minSpeedY: 0.075,
      maxSpeedY: 0.15,
      density: 30000,
      curvedLines: false,
      proximity: 20,
      parallaxMultiplier: 20,
      particleRadius: 2,
    });
    return () => {
      cleanupFg();
      cleanupBg();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Tentando fazer login com:', { email, password: password.length + ' caracteres' });
      const success = await login(email, password);
      console.log('Resultado do login:', success);
      if (success) {
        toast.success('Login realizado com sucesso!');
        router.push('/dashboard');
      } else {
        toast.error('Credenciais inválidas. Verifique se a senha tem pelo menos 6 caracteres.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
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
          <div className="absolute top-6 right-6 z-50">
            <ThemeToggle />
          </div>

          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.8, duration: 0.8, ease: 'easeOut' }}
              className="inline-flex items-center justify-center mb-2"
            >
              <BrandSVG width={220} height={55} enableFlash={true} />
            </motion.div>
            <p className="text-muted-foreground mt-2 font-sans">
              Sistema de Operação de Fichas Inteligentes e Autônomas
            </p>
          </div>

          <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-heading">Bem-vindo de volta</CardTitle>
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

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-[#34E13C] to-[#0C1C25] hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  <span className="font-sans">{isLoading ? 'Entrando...' : 'Entrar'}</span>
                </Button>

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

