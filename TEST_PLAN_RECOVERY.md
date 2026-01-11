# Plano de Testes e Debug: Recuperação de Senha SOFIA

Este documento descreve os passos para testar e depurar o fluxo de recuperação de senha, focando na identificação de falhas de sessão e validação de token.

## 1. Preparação

- **Email de Teste:** `b.kaffer07@gmail.com`
- **Ambiente:** Produção (Link da Vercel)
- **Ferramenta de Logs:** Console do Navegador (F12 > Console)

## 2. Fluxo de Teste Passo a Passo

### Passo 1: Solicitação de Recuperação
1. Acesse a página de login (`/login`).
2. Clique em "Esqueci minha senha".
3. Digite o email `b.kaffer07@gmail.com` e envie.
4. **Verificação:** O toast de sucesso deve aparecer.

### Passo 2: Recebimento do Email
1. Abra a caixa de entrada do email.
2. Localize o email de recuperação do SOFIA.
3. **Atenção:** Copie o link do botão "Redefinir Senha" (botão direito -> Copiar endereço do link) para análise se necessário, ou clique diretamente.

### Passo 3: Acesso à Página de Redefinição (`/reset-password`)
1. Ao clicar no link, você será redirecionado para a página de redefinição.
2. **Abra o Console do Desenvolvedor (F12) IMEDIATAMENTE.**
3. **Logs Esperados (Filtrar por "ResetPasswordPage" ou "Debug"):**
   - `Debug Reset Password: { code: ..., accessToken: ..., ... }` -> Verifica quais parâmetros chegaram.
   - `Tentando definir sessão com cliente ISOLADO...` -> Início da validação manual.
   - `Sessão definida e confirmada com sucesso no cliente isolado` -> Sucesso na validação do token.
   - `AuthContext` logs -> Eventos globais de autenticação.

### Passo 4: Redefinição da Senha
1. Digite a nova senha (ex: `Sofia@2024`).
2. Confirme a senha.
3. Clique em "Redefinir Senha".
4. **Logs Esperados ao Clicar:**
   - `Iniciando redefinição de senha...`
   - `Sessão atual antes do update: Ativa` (Idealmente)
   - Se a sessão for "Nenhuma": `Tentando restaurar sessão com tokens salvos...`
   - `Chamando updateUser...`
   - `Senha atualizada com sucesso` OU erro detalhado.

## 3. Análise de Erros Comuns

### Erro: Botão fica carregando infinitamente
- **Causa Provável:** `updateUser` foi chamado mas a promessa nunca resolveu ou ocorreu um erro não tratado (agora mitigado com `finally`).
- **O que procurar nos logs:** Veja se apareceu `Erro no fluxo de redefinição:` ou se travou antes de `Chamando updateUser...`.
- **Ação:** Verifique se a sessão estava ativa antes do update.

### Erro: "Sessão expirada ou inválida"
- **Causa:** O token da URL foi consumido ou é inválido, e a restauração manual falhou.
- **O que procurar:** Logs de `Falha ao restaurar sessão`.
- **Ação:** Solicitar novo link. Tokens são de uso único.

### Erro: 401 Unauthorized
- **Causa:** Tentativa de acessar dados protegidos (como perfil) sem sessão válida.
- **Impacto:** Se ocorrer durante `fetchAndConvertUser` no `AuthContext`, é "normal" se a sessão ainda não estiver estabelecida. Não deve bloquear o reset se a lógica de `reset-password/page.tsx` estiver correta.

## 4. Próximos Passos
Se o teste falhar, copie **todos** os logs do console (botão direito no console -> Save as...) e compartilhe para análise.
