# Regras Editoriais e Padrões de Conteúdo - SOFIA

Este documento define os padrões para cadastro e organização de conteúdo na plataforma SOFIA. O objetivo é manter a consistência visual, a progressão pedagógica e a qualidade da experiência do usuário (UX).

## 1. Estrutura de Conteúdo

A hierarquia de conteúdo segue o padrão: **Módulo > Aula**.

### Módulos
- **Título**: Curto e direto (ex: "Fundamentos", "Estratégias Avançadas").
- **Ordem**: Define a sequência pedagógica.
  - `0-10`: Módulos Introdutórios / Onboarding.
  - `11-50`: Conteúdo Core (Aulas principais).
  - `51+`: Conteúdo Bônus / Lives / Extras.
- **Slug**: Gerado automaticamente, mas deve ser único.

### Aulas (Lessons)
- **Título**: Ação ou benefício claro (ex: "Entendendo o Padrão", não apenas "Aula 1").
- **Subtítulo**: Breve descrição (1-2 frases) que aparece no Hero e nos cards.
- **Categoria**:
  - `Aula`: Conteúdo padrão gravado.
  - `Live`: Gravação de live ou evento ao vivo.
  - `Masterclass`: Conteúdo premium de alta produção.
- **Duração**: Sempre preencher em minutos (ex: "15 min"). O sistema calcula segundos para tracking, mas o display é manual/automático.
- **Thumbnail**: Formato vertical (9:16) ou adaptável. Resolução recomendada: 1080x1920px.

## 2. Regras de Acesso e Monetização (`is_free` vs `locked`)

O controle de acesso é feito nível de aula, permitindo "degustação" dentro de módulos pagos.

- **Aulas Gratuitas (`is_free = true`)**:
  - Devem existir no **primeiro módulo** (Onboarding) para engajamento imediato.
  - A **primeira aula de cada módulo** subsequente pode ser gratuita para servir de "gancho" (Teaser).
  - Lives abertas devem ser marcadas como `is_free`.

- **Aulas PRO (`is_free = false`)**:
  - Conteúdo denso, técnico e estratégico.
  - Masterclasses completas.
  - Exigem assinatura ativa. O sistema bloqueia automaticamente se o usuário não for PRO.

## 3. Destaques e Hero (`featured`)

O Hero da Home (/insights) é dinâmico, mas segue prioridades:

1.  **Continue Assistindo**: Se o usuário tem progresso recente, a aula em andamento assume o Hero.
2.  **Destaque Editorial (`featured = true`)**: Se não há progresso, o sistema busca a aula marcada como `featured` mais recente.
3.  **Fallback**: Se nenhum acima, exibe o conteúdo padrão definido no código (Masterclass de Vendas/Roleta).

**Regra para `featured`**:
- Apenas **uma** aula deve estar marcada como `featured` por vez para garantir previsibilidade (embora o sistema aguente mais, ele pegará a primeira/última).
- Use para lançamentos ou conteúdo que precisa de tração imediata.

## 4. Vídeo e Streaming (Mux)

- **Prioridade**: Use sempre `mux_playback_id`. O `video_url` (MP4 direto) é apenas fallback legado.
- **Configurações Mux**:
  - O player já está configurado para autoplay (muted) no Hero e controles normais na página da aula.
  - Não use vídeos hospedados no YouTube/Vimeo se possível; o Mux garante a experiência "Netflix" sem anúncios e com tracking preciso.

## 5. Boas Práticas de Admin

- **Publicação**: Use o switch "Publicado" (Draft) para cadastrar conteúdo sem revelar aos usuários.
- **Exclusão**: Cuidado ao excluir Módulos; isso pode deixar aulas órfãs ou quebradas (embora o sistema tente proteger, o ideal é arquivar/despublicar).
- **Testes**: Sempre teste uma nova aula com uma conta Free e uma conta PRO para validar o cadeado.
