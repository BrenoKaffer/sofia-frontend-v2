'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Star, 
  Share2, 
  Heart, 
  Eye, 
  Filter,
  Search,
  Plus,
  Award,
  Target,
  BarChart3,
  Calendar,
  User,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  Send
} from 'lucide-react';

interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    level: number;
    verified: boolean;
  };
  title: string;
  content: string;
  category: 'strategy' | 'analysis' | 'discussion' | 'help';
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  timestamp: string;
  isLiked: boolean;
  isBookmarked: boolean;
}

interface Strategy {
  id: string;
  name: string;
  author: string;
  description: string;
  winRate: number;
  totalTrades: number;
  profitability: number;
  rating: number;
  downloads: number;
  category: string;
  tags: string[];
  isShared: boolean;
}

interface CommunityMember {
  id: string;
  name: string;
  avatar: string;
  level: number;
  reputation: number;
  strategiesShared: number;
  totalPosts: number;
  joinDate: string;
  isOnline: boolean;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');

  useEffect(() => {
    // Simular dados da comunidade
    setPosts([
      {
        id: '1',
        author: {
          name: 'Carlos Silva',
          avatar: '👨‍💼',
          level: 15,
          verified: true
        },
        title: 'Nova estratégia para sequências longas',
        content: 'Desenvolvi uma estratégia que funciona muito bem em sequências de 8+ números da mesma cor. A ideia é...',
        category: 'strategy',
        tags: ['martingale', 'sequencias', 'cores'],
        likes: 24,
        comments: 8,
        views: 156,
        timestamp: '2h atrás',
        isLiked: false,
        isBookmarked: true
      },
      {
        id: '2',
        author: {
          name: 'Ana Costa',
          avatar: '👩‍💻',
          level: 12,
          verified: true
        },
        title: 'Análise do padrão de números vizinhos',
        content: 'Observei um padrão interessante nos números vizinhos na roleta. Nos últimos 1000 giros...',
        category: 'analysis',
        tags: ['padroes', 'vizinhos', 'estatistica'],
        likes: 18,
        comments: 12,
        views: 203,
        timestamp: '4h atrás',
        isLiked: true,
        isBookmarked: false
      },
      {
        id: '3',
        author: {
          name: 'Pedro Santos',
          avatar: '🧑‍🎓',
          level: 8,
          verified: false
        },
        title: 'Dúvida sobre gestão de banca',
        content: 'Pessoal, estou com dificuldade para gerenciar minha banca. Alguém pode me dar dicas?',
        category: 'help',
        tags: ['banca', 'gestao', 'iniciante'],
        likes: 5,
        comments: 15,
        views: 89,
        timestamp: '6h atrás',
        isLiked: false,
        isBookmarked: false
      }
    ]);

    setStrategies([
      {
        id: '1',
        name: 'Fibonacci Adaptativo',
        author: 'Maria Oliveira',
        description: 'Estratégia baseada na sequência de Fibonacci com adaptações para diferentes cenários',
        winRate: 68.5,
        totalTrades: 1250,
        profitability: 15.2,
        rating: 4.7,
        downloads: 342,
        category: 'Progressão',
        tags: ['fibonacci', 'adaptativo', 'conservador'],
        isShared: true
      },
      {
        id: '2',
        name: 'Caça Padrões v2.0',
        author: 'João Ferreira',
        description: 'Sistema avançado para identificação e exploração de padrões em tempo real',
        winRate: 72.1,
        totalTrades: 890,
        profitability: 22.8,
        rating: 4.9,
        downloads: 567,
        category: 'Padrões',
        tags: ['padroes', 'tempo-real', 'avancado'],
        isShared: true
      },
      {
        id: '3',
        name: 'Gestão Inteligente',
        author: 'Sofia AI',
        description: 'Sistema de gestão de banca com IA para otimização automática de apostas',
        winRate: 75.3,
        totalTrades: 2100,
        profitability: 18.9,
        rating: 4.8,
        downloads: 789,
        category: 'Gestão',
        tags: ['ia', 'gestao', 'otimizacao'],
        isShared: true
      }
    ]);

    setMembers([
      {
        id: '1',
        name: 'Carlos Silva',
        avatar: '👨‍💼',
        level: 15,
        reputation: 2450,
        strategiesShared: 8,
        totalPosts: 156,
        joinDate: 'Jan 2024',
        isOnline: true
      },
      {
        id: '2',
        name: 'Ana Costa',
        avatar: '👩‍💻',
        level: 12,
        reputation: 1890,
        strategiesShared: 5,
        totalPosts: 98,
        joinDate: 'Mar 2024',
        isOnline: true
      },
      {
        id: '3',
        name: 'Maria Oliveira',
        avatar: '👩‍🔬',
        level: 18,
        reputation: 3200,
        strategiesShared: 12,
        totalPosts: 234,
        joinDate: 'Nov 2023',
        isOnline: false
      }
    ]);
  }, []);

  const handleLikePost = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleBookmarkPost = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked }
        : post
    ));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strategy': return <Target className="w-4 h-4" />;
      case 'analysis': return <BarChart3 className="w-4 h-4" />;
      case 'discussion': return <MessageSquare className="w-4 h-4" />;
      case 'help': return <Users className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strategy': return 'bg-purple-600';
      case 'analysis': return 'bg-blue-600';
      case 'discussion': return 'bg-green-600';
      case 'help': return 'bg-orange-600';
      default: return 'bg-slate-600';
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <Users className="w-10 h-10 text-purple-400" />
            Comunidade Sofia
          </h1>
          <p className="text-xl text-slate-300">
            Conecte-se, compartilhe estratégias e aprenda com outros traders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Membros Ativos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">1,247</p>
              <p className="text-slate-400 text-sm">+23 esta semana</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-green-400" />
                <span>Estratégias</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">89</p>
              <p className="text-slate-400 text-sm">compartilhadas</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <span>Discussões</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-400">456</p>
              <p className="text-slate-400 text-sm">posts ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <span>Taxa de Sucesso</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-400">73.2%</p>
              <p className="text-slate-400 text-sm">média da comunidade</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="feed" className="data-[state=active]:bg-purple-600">
              Feed
            </TabsTrigger>
            <TabsTrigger value="strategies" className="data-[state=active]:bg-purple-600">
              Estratégias
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-purple-600">
              Membros
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-purple-600">
              Ranking
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
              >
                <option value="all">Todas as categorias</option>
                <option value="strategy">Estratégias</option>
                <option value="analysis">Análises</option>
                <option value="discussion">Discussões</option>
                <option value="help">Ajuda</option>
              </select>
            </div>

            {/* New Post */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Nova Publicação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Título da publicação..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <textarea
                  placeholder="Compartilhe sua estratégia, análise ou dúvida..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full h-24 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white resize-none"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-purple-400 border-purple-400">
                      #estrategia
                    </Badge>
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      #analise
                    </Badge>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Send className="w-4 h-4 mr-2" />
                    Publicar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Posts */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{post.author.avatar}</div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <CardTitle className="text-lg text-white">{post.author.name}</CardTitle>
                            {post.author.verified && (
                              <Badge className="bg-blue-600 text-xs">
                                Verificado
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              Nível {post.author.level}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm">{post.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getCategoryColor(post.category)} text-xs flex items-center space-x-1`}>
                          {getCategoryIcon(post.category)}
                          <span className="capitalize">{post.category}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{post.title}</h3>
                      <p className="text-slate-300">{post.content}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center space-x-2 ${
                            post.isLiked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'
                          } transition-colors`}
                        >
                          <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes}</span>
                        </button>
                        
                        <div className="flex items-center space-x-2 text-slate-400">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-slate-400">
                          <Eye className="w-4 h-4" />
                          <span>{post.views}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleBookmarkPost(post.id)}
                        className={`${
                          post.isBookmarked ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'
                        } transition-colors`}
                      >
                        <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.map((strategy) => (
                <Card key={strategy.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-white">{strategy.name}</CardTitle>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-yellow-400 text-sm">{strategy.rating}</span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm">por {strategy.author}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300 text-sm">{strategy.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Taxa de Vitória</p>
                        <p className="text-green-400 font-semibold">{strategy.winRate}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Rentabilidade</p>
                        <p className="text-purple-400 font-semibold">+{strategy.profitability}%</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Trades</p>
                        <p className="text-white font-semibold">{strategy.totalTrades}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Downloads</p>
                        <p className="text-blue-400 font-semibold">{strategy.downloads}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {strategy.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                        <Share2 className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                      <Button variant="outline" className="border-slate-600 text-slate-300">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Card key={member.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="text-3xl">{member.avatar}</div>
                        {member.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800"></div>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">{member.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            Nível {member.level}
                          </Badge>
                          <span className="text-slate-400 text-sm">desde {member.joinDate}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Reputação</p>
                        <p className="text-yellow-400 font-semibold">{member.reputation}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Estratégias</p>
                        <p className="text-purple-400 font-semibold">{member.strategiesShared}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Posts</p>
                        <p className="text-blue-400 font-semibold">{member.totalPosts}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Status</p>
                        <p className={`font-semibold ${member.isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                          {member.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mensagem
                      </Button>
                      <Button variant="outline" className="border-slate-600 text-slate-300">
                        <User className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center">
                    <Award className="w-5 h-5 mr-2 text-yellow-400" />
                    Top Estrategistas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {members.slice(0, 5).map((member, index) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-600' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-slate-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="text-lg">{member.avatar}</div>
                        <div>
                          <p className="text-white font-semibold">{member.name}</p>
                          <p className="text-slate-400 text-sm">{member.strategiesShared} estratégias</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-semibold">{member.reputation}</p>
                        <p className="text-slate-400 text-sm">pontos</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                    Melhores Performances
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {strategies.slice(0, 5).map((strategy, index) => (
                    <div key={strategy.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-600' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-slate-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{strategy.name}</p>
                          <p className="text-slate-400 text-sm">por {strategy.author}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold">{strategy.winRate}%</p>
                        <p className="text-slate-400 text-sm">vitórias</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}