
export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  locked: boolean;
  category: string;
  badge?: string;
  progress?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  muxPlaybackId?: string;
  muxEmbedUrl?: string;
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export const insightsData: Module[] = [
  {
    title: "Comece por Aqui",
    lessons: [
      {
        id: "onboarding-01",
        title: "Bem-vindo à SOFIA",
        subtitle: "Comece sua jornada por aqui. Entenda como a plataforma funciona e o que esperar.",
        duration: "5 min",
        locked: false,
        category: "Bem-vindo",
        badge: "Início",
        videoUrl: "https://www.youtube.com/embed/u31qwQUeGuM?si=6OXq0jdXKTzFCVrE",
        thumbnailUrl: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "onboarding-02",
        title: "Acesso ao Grupo Oficial",
        subtitle: "Faça parte da nossa comunidade exclusiva e troque experiências com outros jogadores.",
        duration: "2 min",
        locked: false,
        category: "Grupo",
        badge: "Comunidade",
        thumbnailUrl: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "onboarding-03",
        title: "Como falar com o suporte",
        subtitle: "Dúvidas ou problemas? Saiba exatamente como e onde pedir ajuda.",
        duration: "3 min",
        locked: false,
        category: "Suporte",
        badge: "Ajuda",
        thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop"
      }
    ]
  },
  {
    title: "Controle do Jogo",
    lessons: [
      {
        id: "control-01",
        title: "Introdução à Roleta",
        subtitle: "Os fundamentos essenciais que todo jogador precisa dominar antes de apostar.",
        duration: "10 min",
        locked: true,
        category: "Roleta",
        badge: "Fundamentos",
        thumbnailUrl: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "control-02",
        title: "Funcionamento da Mesa",
        subtitle: "Entenda a mecânica da mesa, os pagamentos e as regras do jogo.",
        duration: "12 min",
        locked: true,
        category: "Roleta",
        badge: "Mecânica",
        thumbnailUrl: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "control-03",
        title: "Tipos de Roleta",
        subtitle: "Europeia, Americana, Francesa. Qual escolher e por quê?",
        duration: "8 min",
        locked: true,
        category: "Roleta",
        badge: "Estratégia",
        thumbnailUrl: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "control-04",
        title: "Psicologia do Jogador",
        subtitle: "A diferença mental entre quem lucra e quem quebra a banca.",
        duration: "15 min",
        locked: true,
        category: "Psicologia",
        badge: "Mindset",
        thumbnailUrl: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "control-05",
        title: "Controle Emocional",
        subtitle: "Técnicas para manter a calma e a disciplina durante as sessões.",
        duration: "14 min",
        locked: true,
        category: "Psicologia",
        badge: "Mindset",
        thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "control-06",
        title: "Mentalidade de Lucro",
        subtitle: "Como pensar como um investidor e não como um apostador.",
        duration: "11 min",
        locked: true,
        category: "Psicologia",
        badge: "Mindset",
        thumbnailUrl: "https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "control-07",
        title: "Gestão de Banca",
        subtitle: "O pilar mais importante: como gerenciar seu capital para longevidade.",
        duration: "20 min",
        locked: false,
        category: "Gestão",
        badge: "Essencial",
        thumbnailUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "control-08",
        title: "Gestão Emocional",
        subtitle: "Como suas emoções afetam sua banca e como blindar seu dinheiro.",
        duration: "16 min",
        locked: true,
        category: "Gestão",
        badge: "Essencial",
        thumbnailUrl: "https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "control-09",
        title: "Controle do Dinheiro",
        subtitle: "Saques, metas e limites. A matemática financeira do jogo.",
        duration: "18 min",
        locked: true,
        category: "Gestão",
        badge: "Financeiro",
        thumbnailUrl: "https://images.unsplash.com/photo-1565514020176-dbf2277f260e?q=80&w=600&auto=format&fit=crop"
      }
    ]
  },
  {
    title: "Estratégias de Base",
    lessons: [
      {
        id: "base-01",
        title: "Estratégia de Dúzias",
        subtitle: "Aprenda a operar com alta probabilidade cobrindo grandes áreas da mesa.",
        duration: "12 min",
        locked: true,
        category: "Dúzias",
        badge: "Técnica",
        thumbnailUrl: "https://images.unsplash.com/photo-1605870445919-838d190e8e1b?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "base-02",
        title: "Estratégia de Colunas",
        subtitle: "Domine as colunas e explore tendências verticais na mesa.",
        duration: "11 min",
        locked: true,
        category: "Colunas",
        badge: "Técnica",
        thumbnailUrl: "https://images.unsplash.com/photo-1502920514313-52581002a659?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "base-03",
        title: "Estratégia de Pares",
        subtitle: "Simplificando o jogo com apostas de 50/50. Quando e como entrar.",
        duration: "10 min",
        locked: true,
        category: "Pares",
        badge: "Iniciante",
        thumbnailUrl: "https://images.unsplash.com/photo-1614026480209-cd9934144671?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "base-04",
        title: "Estratégia de Cores",
        subtitle: "Vermelho ou Preto? Identifique sequências e quebras de padrão.",
        duration: "10 min",
        locked: false,
        category: "Cores",
        badge: "Iniciante",
        thumbnailUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "base-05",
        title: "Altos e Baixos",
        subtitle: "Explore a divisão da mesa entre números baixos (1-18) e altos (19-36).",
        duration: "10 min",
        locked: true,
        category: "Altos & Baixos",
        badge: "Iniciante",
        thumbnailUrl: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "base-06",
        title: "Introdução a Padrões",
        subtitle: "O que são padrões na roleta e por que eles se repetem.",
        duration: "14 min",
        locked: true,
        category: "Padrões",
        badge: "Análise",
        thumbnailUrl: "https://images.unsplash.com/photo-1509228627129-6690a87531bc?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "base-07",
        title: "Identificação de Padrões",
        subtitle: "Treine seu olho para ver oportunidades onde outros veem caos.",
        duration: "16 min",
        locked: true,
        category: "Padrões",
        badge: "Prática",
        thumbnailUrl: "https://images.unsplash.com/photo-1555616635-640960031058?q=80&w=600&auto=format&fit=crop"
      }
    ]
  },
  {
    title: "Estratégias Avançadas",
    lessons: [
      {
        id: "adv-01",
        title: "Terminais",
        subtitle: "O conceito poderoso dos números finais. A chave para leituras precisas.",
        duration: "18 min",
        locked: true,
        category: "Terminais",
        badge: "Avançado",
        thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "adv-02",
        title: "Leitura Avançada",
        subtitle: "Combine terminais para prever zonas exatas de aterrissagem.",
        duration: "22 min",
        locked: true,
        category: "Terminais",
        badge: "Pro",
        thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "adv-03",
        title: "Estratégia dos Cavalos",
        subtitle: "Apostas divididas (Splits) para maximizar cobertura com baixo custo.",
        duration: "15 min",
        locked: true,
        category: "Cavalos",
        badge: "Técnica",
        thumbnailUrl: "https://images.unsplash.com/photo-1535320903710-d9cf98946b9e?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "adv-04",
        title: "Parte Externa",
        subtitle: "Como proteger seu capital jogando nas bordas enquanto busca lucro.",
        duration: "14 min",
        locked: true,
        category: "Defesa",
        badge: "Estratégia",
        thumbnailUrl: "https://images.unsplash.com/photo-1626265774643-f1943311a86b?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "adv-05",
        title: "Estratégia Race",
        subtitle: "Corrida de números na Racetrack. Domine a pista de corrida.",
        duration: "20 min",
        locked: true,
        category: "Race",
        badge: "Racetrack",
        thumbnailUrl: "https://images.unsplash.com/photo-1533561797500-4fad4750814e?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "adv-06",
        title: "Estratégia de Espelhos",
        subtitle: "Números que espelham posições. Uma técnica visual poderosa.",
        duration: "16 min",
        locked: true,
        category: "Espelhos",
        badge: "Visual",
        thumbnailUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "adv-07",
        title: "Estratégia de Laterais",
        subtitle: "Explore os vizinhos laterais na mesa física e na roda.",
        duration: "15 min",
        locked: true,
        category: "Laterais",
        badge: "Espacial",
        thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "adv-08",
        title: "Percepções de Mesa",
        subtitle: "Desenvolva o 'feeling' do jogador experiente. O que os dados não mostram.",
        duration: "25 min",
        locked: true,
        category: "Percepções",
        badge: "Mastery",
        thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop"
      }
    ]
  },
  {
    title: "Fluxo de Alavancagem",
    lessons: [
      {
        id: "flow-01",
        title: "Casa dos 20",
        subtitle: "Dominando a região dos 20. Uma das zonas mais frequentes.",
        duration: "18 min",
        locked: true,
        category: "Casa dos 20",
        badge: "Zona",
        thumbnailUrl: "https://images.unsplash.com/photo-1605870445919-838d190e8e1b?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "flow-02",
        title: "Triplo Alvo",
        subtitle: "Buscando três objetivos simultâneos para multiplicar ganhos.",
        duration: "20 min",
        locked: true,
        category: "Triplo Alvo",
        badge: "Alavancagem",
        thumbnailUrl: "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "flow-03",
        title: "Loss da Jogada",
        subtitle: "Como aceitar e usar o loss tático para preparar a próxima vitória.",
        duration: "15 min",
        locked: true,
        category: "Tática",
        badge: "Mental",
        thumbnailUrl: "https://images.unsplash.com/photo-1555616635-640960031058?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "flow-04",
        title: "Estratégia +5",
        subtitle: "A técnica de adição para prever deslocamentos na roda.",
        duration: "16 min",
        locked: true,
        category: "+5",
        badge: "Matemática",
        thumbnailUrl: "https://images.unsplash.com/photo-1509228627129-6690a87531bc?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "flow-05",
        title: "Estratégia -5",
        subtitle: "A técnica de subtração. O inverso simétrico do +5.",
        duration: "16 min",
        locked: true,
        category: "-5",
        badge: "Matemática",
        thumbnailUrl: "https://images.unsplash.com/photo-1614026480209-cd9934144671?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "flow-06",
        title: "Pré-Depósito",
        subtitle: "O que fazer (e não fazer) antes de colocar dinheiro novo na casa.",
        duration: "12 min",
        locked: true,
        category: "Segurança",
        badge: "Essencial",
        thumbnailUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "flow-07",
        title: "Zero Verde",
        subtitle: "Caçando o Zero. Alto risco, recompensa massiva.",
        duration: "14 min",
        locked: true,
        category: "Zero Verde",
        badge: "High Risk",
        thumbnailUrl: "https://images.unsplash.com/photo-1533561797500-4fad4750814e?q=80&w=600&auto=format&fit=crop"
      }
    ]
  },
  {
    title: "Análises de Poucas Fichas",
    lessons: [
      { id: "ana-01", title: "Bacuri", subtitle: "Análise de precisão cirúrgica: Bacuri.", duration: "8 min", locked: true, category: "Poucas Fichas", badge: "Sniper", thumbnailUrl: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=600&auto=format&fit=crop" },
      { id: "ana-02", title: "Jambu", subtitle: "O efeito Jambu: paralisando a mesa com poucas fichas.", duration: "8 min", locked: true, category: "Poucas Fichas", badge: "Sniper", thumbnailUrl: "https://images.unsplash.com/photo-1502920514313-52581002a659?q=80&w=600&auto=format&fit=crop" },
      { id: "ana-03", title: "Muriti", subtitle: "Técnica Muriti para entradas rápidas.", duration: "8 min", locked: true, category: "Poucas Fichas", badge: "Sniper", thumbnailUrl: "https://images.unsplash.com/photo-1626265774643-f1943311a86b?q=80&w=600&auto=format&fit=crop" },
      { id: "ana-04", title: "Tucupí", subtitle: "O molho secreto das entradas de baixo custo.", duration: "9 min", locked: true, category: "Poucas Fichas", badge: "Sniper", thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop" },
      { id: "ana-05", title: "Turú", subtitle: "Estratégia Turú: cavando oportunidades.", duration: "7 min", locked: true, category: "Poucas Fichas", badge: "Sniper", thumbnailUrl: "https://images.unsplash.com/photo-1535320903710-d9cf98946b9e?q=80&w=600&auto=format&fit=crop" },
      { id: "ana-06", title: "Áçaí", subtitle: "Energia pura: alavancagem rápida com Áçaí.", duration: "8 min", locked: true, category: "Poucas Fichas", badge: "Sniper", thumbnailUrl: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=600&auto=format&fit=crop" },
      { id: "ana-07", title: "Tacacá", subtitle: "Quente e forte: entradas agressivas com Tacacá.", duration: "9 min", locked: true, category: "Poucas Fichas", badge: "Sniper", thumbnailUrl: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=600&auto=format&fit=crop" },
      { id: "ana-08", title: "Maniçoba", subtitle: "Cozimento lento: paciência para o tiro certo.", duration: "10 min", locked: true, category: "Poucas Fichas", badge: "Sniper", thumbnailUrl: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=600&auto=format&fit=crop" },
      { id: "ana-09", title: "Cupuaçu", subtitle: "Doce vitória: fechando o ciclo com Cupuaçu.", duration: "8 min", locked: true, category: "Poucas Fichas", badge: "Sniper", thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  {
    title: "Lives",
    lessons: [
      { id: "live-01", title: "Live Lucrativa 1", subtitle: "Gravação na íntegra da sessão ao vivo #1.", duration: "60 min", locked: true, category: "Live", badge: "Replay", thumbnailUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop" },
      { id: "live-02", title: "Live Lucrativa 2", subtitle: "Gravação na íntegra da sessão ao vivo #2.", duration: "55 min", locked: true, category: "Live", badge: "Replay", thumbnailUrl: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?q=80&w=600&auto=format&fit=crop" },
      { id: "live-03", title: "Live Lucrativa 3", subtitle: "Gravação na íntegra da sessão ao vivo #3.", duration: "62 min", locked: true, category: "Live", badge: "Replay", thumbnailUrl: "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=600&auto=format&fit=crop" },
      { id: "live-04", title: "Live Lucrativa 4", subtitle: "Gravação na íntegra da sessão ao vivo #4.", duration: "58 min", locked: true, category: "Live", badge: "Replay", thumbnailUrl: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=600&auto=format&fit=crop" },
      { id: "live-05", title: "Live Lucrativa 5", subtitle: "Gravação na íntegra da sessão ao vivo #5.", duration: "65 min", locked: true, category: "Live", badge: "Replay", thumbnailUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e63?q=80&w=600&auto=format&fit=crop" },
      { id: "live-06", title: "Live Lucrativa 6", subtitle: "Gravação na íntegra da sessão ao vivo #6.", duration: "50 min", locked: true, category: "Live", badge: "Replay", thumbnailUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop" },
      { id: "live-07", title: "Live Lucrativa 7", subtitle: "Gravação na íntegra da sessão ao vivo #7.", duration: "70 min", locked: true, category: "Live", badge: "Replay", thumbnailUrl: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=600&auto=format&fit=crop" },
      { id: "live-08", title: "Live Lucrativa 8", subtitle: "Gravação na íntegra da sessão ao vivo #8.", duration: "60 min", locked: true, category: "Live", badge: "Replay", thumbnailUrl: "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  {
    title: "Materiais Complementares",
    lessons: [
      { id: "mat-01", title: "Controle Emocional (Material)", subtitle: "PDF Guia de Bolso para controle emocional.", duration: "PDF", locked: true, category: "Material", badge: "Download", thumbnailUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop" },
      { id: "mat-02", title: "Racetrack", subtitle: "Mapa visual da Racetrack para impressão.", duration: "IMG", locked: true, category: "Material", badge: "Download", thumbnailUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop" },
      { id: "mat-03", title: "Base", subtitle: "Arquivos base para suas estratégias.", duration: "ZIP", locked: true, category: "Material", badge: "Download", thumbnailUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=600&auto=format&fit=crop" },
      { id: "mat-04", title: "Gestão de Banca", subtitle: "Planilha automatizada de gestão financeira.", duration: "XLSX", locked: true, category: "Material", badge: "Download", thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop" },
      { id: "mat-05", title: "Números que se Chamam", subtitle: "Tabela de referência rápida de puxadas.", duration: "PDF", locked: true, category: "Material", badge: "Download", thumbnailUrl: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?q=80&w=600&auto=format&fit=crop" },
      { id: "mat-06", title: "Jogo Responsável", subtitle: "Diretrizes para manter o jogo saudável.", duration: "PDF", locked: false, category: "Material", badge: "Importante", thumbnailUrl: "https://images.unsplash.com/photo-1494178270175-e96de2971df9?q=80&w=600&auto=format&fit=crop" }
    ]
  },
  {
    title: "Bônus",
    lessons: [
      { id: "bonus-01", title: "Calculadora de Probabilidades", subtitle: "Ferramenta exclusiva para calcular suas chances.", duration: "App", locked: true, category: "Ferramenta", badge: "Software", thumbnailUrl: "https://images.unsplash.com/photo-1509228627129-6690a87531bc?q=80&w=600&auto=format&fit=crop" },
      { id: "bonus-02", title: "Simulador de Estratégia", subtitle: "Teste suas teses sem arriscar dinheiro real.", duration: "App", locked: true, category: "Ferramenta", badge: "Software", thumbnailUrl: "https://images.unsplash.com/photo-1611974765270-ca1258634369?q=80&w=600&auto=format&fit=crop" },
      { id: "bonus-03", title: "Gerador de Números", subtitle: "Gere sequências aleatórias para treino.", duration: "App", locked: true, category: "Ferramenta", badge: "Software", thumbnailUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600&auto=format&fit=crop" },
      { id: "bonus-04", title: "Calculadora de Pagamentos", subtitle: "Saiba exatamente quanto cada aposta paga.", duration: "App", locked: true, category: "Ferramenta", badge: "Software", thumbnailUrl: "https://images.unsplash.com/photo-1580519542054-0a296383dcce?q=80&w=600&auto=format&fit=crop" }
    ]
  }
];
