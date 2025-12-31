'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Brain, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const router = useRouter();

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
    setIsLoading(true);

    if (!email) {
      toast.error('Por favor, insira seu email');
      setIsLoading(false);
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Por favor, insira um email válido');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Erro ao enviar email de recuperação:', data.error);
        if (data.error && data.error.includes('User not found')) {
          toast.error('Email não encontrado em nossa base de dados');
        } else {
          toast.error(data.error || 'Erro ao enviar email de recuperação');
        }
        return;
      }

      setIsEmailSent(true);
      toast.success('Email de recuperação enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        toast.error('Erro ao reenviar email');
        return;
      }

      toast.success('Email reenviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao reenviar email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen flex">
      {/* Left side - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden bg-black">
        <div id="particles-background" className="absolute" style={{ left: '-51%', top: '-51%', width: '202%', height: '202%', transform: 'scale3d(0.5, 0.5, 1)' }} />
        <div id="particles-foreground" className="absolute" style={{ left: '-51%', top: '-51%', width: '202%', height: '202%', transform: 'scale3d(0.5, 0.5, 1)' }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
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

          <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              {!isEmailSent ? (
                <>
                  <CardTitle className="text-2xl font-heading">Esqueceu sua senha?</CardTitle>
                  <CardDescription className="font-sans">
                    Digite seu email para receber as instruções de recuperação
                  </CardDescription>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4 mx-auto"
                  >
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <CardTitle className="text-2xl font-heading">Email enviado!</CardTitle>
                  <CardDescription className="font-sans">
                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {!isEmailSent ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-sans">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 pl-10"
                        required
                      />
                    </div>
                  </div>

                  <ShinyButton type="submit" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    <span className="font-sans">{isLoading ? 'Enviando...' : 'Enviar instruções'}</span>
                  </ShinyButton>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors font-sans"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Voltar para o login
                    </Link>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground font-sans">
                      Enviamos as instruções para:
                    </p>
                    <p className="font-medium text-primary font-sans">{email}</p>
                    <p className="text-sm text-muted-foreground font-sans">
                      Não recebeu o email? Verifique sua pasta de spam ou clique no botão abaixo para reenviar.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={handleResendEmail}
                      variant="outline"
                      className="w-full h-11"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      <span className="font-sans">
                        {isLoading ? 'ReEnviando...' : 'reenviar email'}
                      </span>
                    </Button>

                    <Button
                      onClick={() => setIsEmailSent(false)}
                      variant="ghost"
                      className="w-full h-11"
                    >
                      <span className="font-sans">Tentar outro email</span>
                    </Button>
                  </div>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors font-sans"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Voltar para o login
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1932&q=80')] bg-cover bg-center opacity-10" />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <h2 className="text-4xl font-heading font-bold mb-6">
              Recupere seu acesso
              <br />
              <span className="text-accent">de forma segura.</span>
            </h2>
            <p className="text-xl opacity-90 leading-relaxed font-sans">
              Enviaremos instruções detalhadas para seu email para que você possa 
              redefinir sua senha com total segurança.
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
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Email Seguro</h3>
                <p className="text-sm opacity-75 font-sans">Link de recuperação criptografado</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">Processo Simples</h3>
                <p className="text-sm opacity-75 font-sans">Recuperação em poucos cliques</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
