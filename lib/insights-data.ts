
export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  locked: boolean;
  category: string;
  badge?: string;
  progress?: number;
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export const insightsData: Module[] = [
  {
    title: "🔰 MÓDULOS DE ONBOARDING / BASE",
    lessons: [
      {
        id: "onboarding-01",
        title: "Bem-vindo à No Alvo da Roleta",
        subtitle: "Entenda como a plataforma funciona e como extrair o máximo de cada conteúdo.",
        duration: "5 min",
        locked: false,
        category: "Bem-vindo",
        badge: "Início"
      },
      {
        id: "onboarding-02",
        title: "Acesso ao Grupo Oficial",
        subtitle: "Comunicação direta, avisos importantes e alinhamento estratégico com a comunidade.",
        duration: "2 min",
        locked: false,
        category: "Grupo",
        badge: "Comunidade"
      },
      {
        id: "onboarding-03",
        title: "Como falar com o suporte",
        subtitle: "Saiba exatamente onde e como pedir ajuda quando precisar.",
        duration: "3 min",
        locked: false,
        category: "Suporte",
        badge: "Ajuda"
      }
    ]
  },
  {
    title: "🎯 CONTROLE DO JOGO",
    lessons: [
      {
        id: "control-01",
        title: "Introdução à Roleta",
        subtitle: "Entenda a estrutura do jogo e por que a maioria perde sem perceber.",
        duration: "10 min",
        locked: true,
        category: "Roleta",
        badge: "Fundamentos"
      },
      {
        id: "control-02",
        title: "Funcionamento da Mesa",
        subtitle: "Como a roleta se comporta ao longo do tempo e o que observar.",
        duration: "12 min",
        locked: true,
        category: "Roleta",
        badge: "Mecânica"
      },
      {
        id: "control-03",
        title: "Tipos de Roleta",
        subtitle: "Europeia, Americana e Francesa: diferenças que impactam seu resultado.",
        duration: "8 min",
        locked: true,
        category: "Roleta",
        badge: "Estratégia"
      },
      {
        id: "control-04",
        title: "Psicologia do Jogador",
        subtitle: "O maior inimigo do lucro é emocional, não matemático.",
        duration: "15 min",
        locked: true,
        category: "Psicologia",
        badge: "Mindset"
      },
      {
        id: "control-05",
        title: "Controle Emocional",
        subtitle: "Técnicas práticas para manter disciplina mesmo sob pressão.",
        duration: "14 min",
        locked: true,
        category: "Psicologia",
        badge: "Mindset"
      }
    ]
  },
  {
    title: "🧩 ESTRATÉGIAS DE BASE",
    lessons: [
      {
        id: "base-01",
        title: "Estratégia de Dúzias",
        subtitle: "Consistência e controle para entradas mais seguras.",
        duration: "12 min",
        locked: true,
        category: "Dúzias",
        badge: "Técnica"
      },
      {
        id: "base-02",
        title: "Estratégia de Colunas",
        subtitle: "Como usar repetições a seu favor.",
        duration: "11 min",
        locked: true,
        category: "Colunas",
        badge: "Técnica"
      },
      {
        id: "base-03",
        title: "Pares e Ímpares",
        subtitle: "Leitura básica com alta eficiência quando bem aplicada.",
        duration: "10 min",
        locked: true,
        category: "Pares & Ímpares",
        badge: "Iniciante"
      },
      {
        id: "base-04",
        title: "Estratégia de Cores",
        subtitle: "Identificando sequências além do óbvio.",
        duration: "10 min",
        locked: true,
        category: "Cores",
        badge: "Iniciante"
      },
      {
        id: "base-05",
        title: "Altos e Baixos",
        subtitle: "Aproveitando ciclos curtos da mesa.",
        duration: "10 min",
        locked: true,
        category: "Altos & Baixos",
        badge: "Iniciante"
      }
    ]
  },
  {
    title: "🚀 ESTRATÉGIAS AVANÇADAS",
    lessons: [
      {
        id: "adv-01",
        title: "Terminais",
        subtitle: "Onde o dinheiro realmente está quando poucos enxergam.",
        duration: "18 min",
        locked: true,
        category: "Terminais",
        badge: "Avançado"
      },
      {
        id: "adv-02",
        title: "Leitura Avançada de Terminais",
        subtitle: "Identificação de padrões ocultos com maior taxa de acerto.",
        duration: "22 min",
        locked: true,
        category: "Terminais",
        badge: "Pro"
      },
      {
        id: "adv-03",
        title: "Estratégia dos Cavalos",
        subtitle: "Entradas progressivas baseadas em comportamento recorrente.",
        duration: "15 min",
        locked: true,
        category: "Cavalos",
        badge: "Técnica"
      },
      {
        id: "adv-04",
        title: "Parte Externa",
        subtitle: "Controle de risco com leitura ampliada da mesa.",
        duration: "14 min",
        locked: true,
        category: "Parte Externa",
        badge: "Defesa"
      },
      {
        id: "adv-05",
        title: "Estratégia Raca",
        subtitle: "Técnica de execução rápida para momentos específicos.",
        duration: "20 min",
        locked: true,
        category: "Race",
        badge: "Racetrack"
      }
    ]
  },
  {
    title: "🔥 MÓDULO AVANÇADO – FLUXO CONTÍNUO",
    lessons: [
      {
        id: "flow-01",
        title: "Casa dos 20",
        subtitle: "Controle estatístico aplicado a sessões longas.",
        duration: "18 min",
        locked: true,
        category: "Casa dos 20",
        badge: "Zona"
      },
      {
        id: "flow-02",
        title: "Triplo Alvo",
        subtitle: "Como dividir risco e potencial de ganho.",
        duration: "20 min",
        locked: true,
        category: "Triplo Alvo",
        badge: "Alavancagem"
      },
      {
        id: "flow-03",
        title: "Loss da Jogada",
        subtitle: "Quando parar é a jogada mais inteligente.",
        duration: "15 min",
        locked: true,
        category: "Loss da Junção",
        badge: "Tática"
      },
      {
        id: "flow-04",
        title: "Estratégia 4-6",
        subtitle: "Método estruturado para execução disciplinada.",
        duration: "16 min",
        locked: true,
        category: "4-6",
        badge: "Matemática"
      },
      {
        id: "flow-05",
        title: "Estratégia 5",
        subtitle: "Simplicidade aplicada com precisão.",
        duration: "16 min",
        locked: true,
        category: "5",
        badge: "Matemática"
      }
    ]
  },
  {
    title: "🔍 ANÁLISES DE POUCAS FICHAS",
    lessons: [
      { id: "ana-01", title: "Bacuri", subtitle: "Leitura objetiva para entradas pontuais.", duration: "8 min", locked: true, category: "Poucas Fichas", badge: "Sniper" },
      { id: "ana-02", title: "Jambu", subtitle: "Controle extremo de risco.", duration: "8 min", locked: true, category: "Poucas Fichas", badge: "Sniper" },
      { id: "ana-03", title: "Mutuí", subtitle: "Técnica compacta para sessões curtas.", duration: "8 min", locked: true, category: "Poucas Fichas", badge: "Sniper" },
      { id: "ana-04", title: "Tucupi", subtitle: "Entradas rápidas e controladas.", duration: "9 min", locked: true, category: "Poucas Fichas", badge: "Sniper" },
      { id: "ana-05", title: "Turu", subtitle: "Estratégia técnica para quem já tem base.", duration: "7 min", locked: true, category: "Poucas Fichas", badge: "Sniper" }
    ]
  },
  {
    title: "🔴 LIVES",
    lessons: [
      { id: "live-01", title: "Live Lucrativa 1", subtitle: "Análises práticas, mesas reais e tomada de decisão ao vivo.", duration: "60 min", locked: true, category: "Live", badge: "Replay" },
      { id: "live-02", title: "Live Lucrativa 2", subtitle: "Análises práticas, mesas reais e tomada de decisão ao vivo.", duration: "55 min", locked: true, category: "Live", badge: "Replay" },
      { id: "live-03", title: "Live Lucrativa 3", subtitle: "Análises práticas, mesas reais e tomada de decisão ao vivo.", duration: "62 min", locked: true, category: "Live", badge: "Replay" },
      { id: "live-04", title: "Live Lucrativa 4", subtitle: "Análises práticas, mesas reais e tomada de decisão ao vivo.", duration: "58 min", locked: true, category: "Live", badge: "Replay" },
      { id: "live-05", title: "Live Lucrativa 5", subtitle: "Análises práticas, mesas reais e tomada de decisão ao vivo.", duration: "65 min", locked: true, category: "Live", badge: "Replay" }
    ]
  },
  {
    title: "🧰 MATERIAIS COMPLEMENTARES",
    lessons: [
      { id: "mat-01", title: "Controle Emocional (Material)", subtitle: "Exercícios práticos para disciplina mental.", duration: "PDF", locked: true, category: "Material", badge: "Download" },
      { id: "mat-02", title: "Racetrack", subtitle: "Uso avançado da área Racetrack.", duration: "IMG", locked: true, category: "Material", badge: "Download" },
      { id: "mat-03", title: "Base", subtitle: "Fundamentos essenciais para revisão.", duration: "ZIP", locked: true, category: "Material", badge: "Download" },
      { id: "mat-04", title: "Gestão de Banca", subtitle: "Como proteger seu capital ao longo do tempo.", duration: "XLSX", locked: true, category: "Material", badge: "Download" },
      { id: "mat-05", title: "Números que Chamam", subtitle: "Leitura estatística aplicada à roleta.", duration: "PDF", locked: true, category: "Material", badge: "Download" }
    ]
  },
  {
    title: "🎁 BÔNUS – FERRAMENTAS",
    lessons: [
      { id: "bonus-01", title: "Calculadora de Probabilidades", subtitle: "Ferramentas práticas para apoiar suas decisões.", duration: "App", locked: true, category: "Ferramenta", badge: "Software" },
      { id: "bonus-02", title: "Simulador de Estratégia", subtitle: "Ferramentas práticas para apoiar suas decisões.", duration: "App", locked: true, category: "Ferramenta", badge: "Software" },
      { id: "bonus-03", title: "Gerador de Números", subtitle: "Ferramentas práticas para apoiar suas decisões.", duration: "App", locked: true, category: "Ferramenta", badge: "Software" },
      { id: "bonus-04", title: "Calculadora de Pagamentos", subtitle: "Ferramentas práticas para apoiar suas decisões.", duration: "App", locked: true, category: "Ferramenta", badge: "Software" }
    ]
  }
];
