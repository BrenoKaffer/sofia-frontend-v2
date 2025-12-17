'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Send, 
  X, 
  Paperclip, 
  Star, 
  Phone, 
  Video, 
  MoreVertical,
  Clock,
  CheckCheck,
  AlertCircle,
  Smile,
  FileText,
  Download,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  agentInfo?: {
    name: string;
    avatar?: string;
    department: string;
  };
}

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  rating: number;
  responseTime: string;
}

interface ChatSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  agent?: Agent;
  rating?: number;
  feedback?: string;
  status: 'active' | 'waiting' | 'ended';
  queuePosition?: number;
}

interface LiveChatProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
  minimized?: boolean;
  onMinimize?: () => void;
}

export function LiveChat({ 
  isOpen = false, 
  onToggle, 
  className, 
  minimized = false, 
  onMinimize 
}: LiveChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [currentTab, setCurrentTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<ChatSession>({
    id: 'session-' + Date.now(),
    startTime: new Date(),
    status: 'waiting',
    queuePosition: 2
  });

  const [currentAgent] = useState<Agent>({
    id: 'agent-1',
    name: 'Ana Silva',
    avatar: '/agents/ana.jpg',
    department: 'Suporte Técnico',
    status: 'online',
    rating: 4.8,
    responseTime: '< 2 min'
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Olá! Você está na posição 2 da fila. Um agente estará com você em breve.',
      sender: 'system',
      timestamp: new Date()
    }
  ]);

  // Simular conexão com agente
  useEffect(() => {
    if (session.status === 'waiting') {
      const timer = setTimeout(() => {
        setSession(prev => ({ ...prev, status: 'active', agent: currentAgent }));
        setMessages(prev => [...prev, {
          id: 'agent-connected',
          content: `Olá! Sou a ${currentAgent.name} do ${currentAgent.department}. Como posso ajudar você hoje?`,
          sender: 'agent',
          timestamp: new Date(),
          agentInfo: currentAgent
        }]);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [session.status, currentAgent]);

  // Auto scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simular digitação do usuário
  useEffect(() => {
    if (newMessage.length > 0) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [newMessage]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    
    // Simular status de entrega
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 500);

    // Simular resposta do agente
    if (session.status === 'active') {
      setAgentTyping(true);
      setTimeout(() => {
        setAgentTyping(false);
        const responses = [
          'Entendi sua solicitação. Vou verificar isso para você.',
          'Obrigada pela informação. Deixe-me analisar os detalhes.',
          'Perfeito! Vou te ajudar com isso agora mesmo.',
          'Compreendo. Vou buscar a melhor solução para seu caso.',
          'Ótima pergunta! Vou explicar isso detalhadamente.'
        ];
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: responses[Math.floor(Math.random() * responses.length)],
          sender: 'agent',
          timestamp: new Date(),
          agentInfo: currentAgent
        };
        setMessages(prev => [...prev, agentResponse]);
      }, 2000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const attachment = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file)
    };

    const messageWithAttachment: Message = {
      id: Date.now().toString(),
      content: `Arquivo enviado: ${file.name}`,
      sender: 'user',
      timestamp: new Date(),
      attachments: [attachment]
    };

    setMessages(prev => [...prev, messageWithAttachment]);
  };

  const submitRating = () => {
    setSession(prev => ({ ...prev, rating, feedback }));
    setShowRating(false);
    setMessages(prev => [...prev, {
      id: 'rating-submitted',
      content: 'Obrigado pela sua avaliação! Sua opinião é muito importante para nós.',
      sender: 'system',
      timestamp: new Date()
    }]);
  };

  const endChat = () => {
    setSession(prev => ({ ...prev, status: 'ended', endTime: new Date() }));
    setShowRating(true);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
        {session.status === 'waiting' && (
          <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white animate-pulse">
            {session.queuePosition}
          </Badge>
        )}
      </div>
    );
  }

  if (minimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 shadow-2xl z-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Chat ao Vivo</span>
              {session.agent && (
                <Badge variant="outline" className="text-xs">
                  {session.agent?.name}
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMinimize}>
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 w-96 h-[600px] shadow-2xl z-50 flex flex-col",
      className
    )}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Chat ao Vivo</CardTitle>
              {session.agent && (
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={session.agent?.avatar} />
                    <AvatarFallback className="text-xs">
                      {session.agent?.name?.split(' ').map(n => n[0]).join('') || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-muted-foreground">
                    {session.agent?.name} • {session.agent?.department}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      session.agent?.status === 'online' && "bg-green-50 text-green-700 border-green-200"
                    )}
                  >
                    {session.agent?.status}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {onMinimize && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMinimize}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opções do Chat</DialogTitle>
                  <DialogDescription>
                    Gerencie sua sessão de chat e configurações
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Solicitar Transcrição
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Phone className="h-4 w-4" />
                    Solicitar Ligação
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Video className="h-4 w-4" />
                    Iniciar Videochamada
                  </Button>
                  <Separator />
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start gap-2"
                    onClick={endChat}
                  >
                    <X className="h-4 w-4" />
                    Encerrar Chat
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
            <TabsTrigger value="info" className="text-xs">Informações</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-2">
          <CardContent className="flex-1 p-4 flex flex-col">
            {session.status === 'waiting' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-orange-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Posição na fila: {session.queuePosition}
                  </span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Tempo estimado de espera: 3-5 minutos
                </p>
              </div>
            )}

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] space-y-1",
                      message.sender === 'user' ? "items-end" : "items-start"
                    )}>
                      {message.sender === 'agent' && message.agentInfo && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={message.agentInfo.avatar} />
                            <AvatarFallback className="text-xs">
                              {message.agentInfo.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {message.agentInfo.name}
                          </span>
                        </div>
                      )}
                      
                      <div className={cn(
                        "px-3 py-2 rounded-lg text-sm",
                        message.sender === 'user' 
                          ? "bg-primary text-primary-foreground" 
                          : message.sender === 'system'
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-muted"
                      )}>
                        {message.content}
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2 p-2 bg-white/10 rounded">
                                <Paperclip className="h-3 w-3" />
                                <span className="text-xs">{attachment.name}</span>
                                <Button size="icon" variant="ghost" className="h-4 w-4 ml-auto">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {message.sender === 'user' && message.status && (
                          <CheckCheck className={cn(
                            "h-3 w-3",
                            message.status === 'delivered' ? "text-blue-500" : "text-muted-foreground"
                          )} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {agentTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">digitando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>
            
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  disabled={session.status === 'ended'}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={session.status === 'ended'}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={sendMessage} 
                  size="icon"
                  disabled={!newMessage.trim() || session.status === 'ended'}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {session.status === 'ended' && (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">Chat encerrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="info" className="flex-1 mt-2">
          <CardContent className="p-4 space-y-4">
            {session.agent && (
              <div className="space-y-3">
                <h3 className="font-medium">Informações do Agente</h3>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={session.agent?.avatar} />
                    <AvatarFallback>
                      {session.agent?.name?.split(' ').map(n => n[0]).join('') || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{session.agent?.name}</p>
                    <p className="text-sm text-muted-foreground">{session.agent?.department}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={cn(
                              "h-3 w-3",
                              i < Math.floor(session.agent?.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            )} 
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                          {session.agent?.rating}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        • Resposta: {session.agent?.responseTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <h3 className="font-medium">Sessão</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Iniciado:</span>
                  <span>{session.startTime.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className={cn(
                    session.status === 'active' && "bg-green-50 text-green-700 border-green-200",
                    session.status === 'waiting' && "bg-orange-50 text-orange-700 border-orange-200",
                    session.status === 'ended' && "bg-gray-50 text-gray-700 border-gray-200"
                  )}>
                    {session.status === 'active' ? 'Ativo' : 
                     session.status === 'waiting' ? 'Aguardando' : 'Encerrado'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID da Sessão:</span>
                  <span className="font-mono text-xs">{session.id}</span>
                </div>
              </div>
            </div>

            {session.status === 'active' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-medium">Ações Rápidas</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Phone className="h-3 w-3 mr-1" />
                      Ligar
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Video className="h-3 w-3 mr-1" />
                      Vídeo
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Ticket
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Histórico
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>

      {/* Modal de Avaliação */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avalie nosso atendimento</DialogTitle>
            <DialogDescription>
              Sua opinião nos ajuda a melhorar nosso suporte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Como foi nosso atendimento?</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setRating(star)}
                  >
                    <Star 
                      className={cn(
                        "h-5 w-5",
                        star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      )} 
                    />
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comentários (opcional)</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Conte-nos sobre sua experiência..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRating(false)}>
                Pular
              </Button>
              <Button onClick={submitRating} disabled={rating === 0}>
                Enviar Avaliação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}