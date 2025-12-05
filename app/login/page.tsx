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
    const bg = document.getElementById('particles-background');
    const fg = document.getElementById('particles-foreground');
    if (!bg || !fg) return;

    if (!(window as any).particleground) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.text = `!function(a,b){"use strict";function c(a){a=a||{};for(var b=1;b<arguments.length;b++){var c=arguments[b];if(c)for(var d in c)c.hasOwnProperty(d)&&("object"==typeof c[d]?deepExtend(a[d],c[d]):a[d]=c[d])}return a}function d(d,g){function h(){if(y){r=b.createElement("canvas"),r.className="pg-canvas",r.style.display="block",r.style.position="absolute",r.style.top="0",r.style.left="0",r.style.width="100%",r.style.height="100%",r.width=s.offsetWidth,r.height=s.offsetHeight,s.insertBefore(r,s.firstChild),t=r.getContext("2d"),i()}else{j(),k()}n(),o()}function i(){for(var a=0;a<Math.round(r.width*r.height/g.density);a++){var b=new q;b.setStackPos(a),m.push(b)}b.addEventListener("resize",x),b.addEventListener("mousemove",w)}function j(){r=b.createElement("div"),r.className="pg-canvas",r.style.position="absolute",r.style.top="0",r.style.left="0",r.style.width="100%",r.style.height="100%",r.style.overflow="hidden",s.insertBefore(r,s.firstChild);for(var a=0;a<Math.round(r.clientWidth*r.clientHeight/g.density);a++){var c=b.createElement("div");c.className="pg-dot",c.style.position="absolute",c.style.width=g.particleRadius*2+"px",c.style.height=g.particleRadius*2+"px",c.style.background=g.dotColor,c.style.borderRadius="50%",r.appendChild(c);var d=new q;d.setStackPos(a),d.el=c,m.push(d)}b.addEventListener("resize",x),b.addEventListener("mousemove",w)}function k(){for(var a=0;a<m.length;a++)m[a].el.parentNode===r&&r.removeChild(m[a].el);m=[]}function l(){for(var a=0;a<m.length;a++)m[a].updatePosition()}function n(){t&&(t.clearRect(0,0,r.width,r.height),t.beginPath());for(var a=0;a<m.length;a++)m[a].draw();t&&t.stroke()}function o(){l(),n(),p=requestAnimationFrame(o)}function pCancel(){p&&cancelAnimationFrame(p)}function q(){this.stackPos,this.active=!0,this.layer=Math.ceil(3*Math.random()),this.parallaxOffsetX=0,this.parallaxOffsetY=0,this.position={x:Math.ceil(Math.random()*r.width),y:Math.ceil(Math.random()*r.height)},this.speed={x:Math.random()*(g.maxSpeedX-g.minSpeedX)+g.minSpeedX,y:Math.random()*(g.maxSpeedY-g.minSpeedY)+g.minSpeedY},this.velocity={x:this.speed.x*(Math.random()<.5?-1:1),y:this.speed.y*(Math.random()<.5?-1:1)}}q.prototype.setStackPos=function(a){this.stackPos=a},q.prototype.updatePosition=function(){if(y){this.position.x+=this.velocity.x,this.position.y+=this.velocity.y,this.position.x+this.parallaxOffsetX>r.width?this.position.x=0:this.position.x+this.parallaxOffsetX<0&&(this.position.x=r.width),this.position.y+this.parallaxOffsetY>r.height?this.position.y=0:this.position.y+this.parallaxOffsetY<0&&(this.position.y=r.height)}else{var a=this.el.style;this.position.x+=this.velocity.x,this.position.y+=this.velocity.y,this.position.x+this.parallaxOffsetX>r.clientWidth?this.position.x=0:this.position.x+this.parallaxOffsetX<0&&(this.position.x=r.clientWidth),this.position.y+this.parallaxOffsetY>r.clientHeight?this.position.y=0:this.position.y+this.parallaxOffsetY<0&&(this.position.y=r.clientHeight),a.transform="translate("+Math.floor(this.position.x)+"px,"+Math.floor(this.position.y)+"px)"}},q.prototype.draw=function(){if(y){t.closePath(),t.beginPath(),t.arc(this.position.x+this.parallaxOffsetX,this.position.y+this.parallaxOffsetY,g.particleRadius,0,2*Math.PI),t.fillStyle=g.dotColor,t.fill(),t.strokeStyle=g.lineColor;for(var a=this.position.x+this.parallaxOffsetX,b=this.position.y+this.parallaxOffsetY,c=0;c<m.length;c++){var d=m[c],e=d.position.x+d.parallaxOffsetX,f=d.position.y+d.parallaxOffsetY,h=Math.sqrt((a-e)*(a-e)+(b-f)*(b-f));h<g.proximity&&(t.moveTo(a,b),t.lineTo(e,f))}}},q.prototype.setVelocity=function(a,b){this.velocity.x=a,this.velocity.y=b},q.prototype.setParallax=function(a,b){this.parallaxOffsetX=a,this.parallaxOffsetY=b};var r,s,d,e,f,t,u,v,w=function(a){var c=s.getBoundingClientRect(),d=a.pageX-c.left,e=a.pageY-c.top;u=d,s.width,f=e,s.height,v=u/s.width-0.5,w=f/s.height-0.5;for(var h=0;h<m.length;h++){var i=m[h];i.setParallax(w*g.parallaxMultiplier,i.layer!==1?0.5*w*g.parallaxMultiplier:w*g.parallaxMultiplier)}};const x=function(){y&&(r.width=s.offsetWidth,r.height=s.offsetHeight)},y=!!b.createElement("canvas").getContext,m=[];return s=d,void 0===g&&(g={}),g=c(g,{minSpeedX:0.1,maxSpeedX:0.7,minSpeedY:0.1,maxSpeedY:0.7,directionX:"center",directionY:"center",density:10000,dotColor:"#666666",lineColor:"#666666",particleRadius:6,lineWidth:1,curvedLines:!1,proximity:100,parallax:!0,parallaxMultiplier:5,onInit:function(){},onDestroy:function(){}}),h(),{destroy:function(){pCancel(),k(),b.removeEventListener("mousemove",w)}}}a.particleground=function(a,b){return d(a,b)}}(window,document);`;
      document.body.appendChild(script);
    }

    const pg = (window as any).particleground;
    if (typeof pg === 'function') {
      pg(fg, {
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
      pg(bg, {
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
    }
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

