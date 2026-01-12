## 📌 PROMPT OFICIAL — PROCESSO DE DESENVOLVIMENTO SOFIA (v2)

### Contexto

A SOFIA já possui fluxos **críticos estabilizados** (login, cadastro, autenticação e upgrade).
O objetivo agora é **evoluir rápido sem quebrar produção**.

Aqui, velocidade vem de processo.
Improviso vira bug.

---

## 🔒 Regras obrigatórias (sem exceção)

### 1️⃣ A `main` é sagrada

* **Proibido push direto na `main`**
* A `main` deve estar **sempre deployável**
* Código em `main` = código em produção

---

### 2️⃣ Uma branch por alteração relevante

Sim, **uma branch nova para cada mudança**.

Branch é **descartável**, não patrimônio.

Padrão de nomes:

* `feat/nome-da-feature`
* `fix/nome-do-bug`
* `chore/ajuste-tecnico`

Exemplos corretos:

* `fix/login-redirect`
* `feat/premium-access-modal`
* `chore/refactor-auth-guard`

Exemplos proibidos:

* `ajustes-gerais`
* `teste`
* `final-agora-vai`

---

### 3️⃣ Faça o push na branch correspondente

---

## 🧪 Testes obrigatórios antes do merge

Todo PR **deve ser testado na Preview URL do Vercel**.

Checklist mínimo:

* Cadastro
* Confirmação de email
* Login
* Acesso ao dashboard
* Fluxo diretamente afetado pela mudança

Se mexer em:

* autenticação
* planos
* checkout
* upgrade

➡️ **teste manual completo é obrigatório**.

---

## ❄️ Código congelado (atenção máxima)

Os seguintes fluxos estão **congelados**:

* Login
* Register
* Reset de senha
* Autenticação
* Upgrade de plano

Alterações nessas áreas:

* Devem ser **explicitamente justificadas no PR**
* Devem ser pequenas e isoladas
* Preferencialmente protegidas por **feature flag**
* Review mais rigoroso

---

## 🏷️ Versionamento

Sempre que um fluxo crítico estabilizar:

* Criar **tag de versão** (`v1.0.0`, `v1.1.0`, etc.)
* Tag representa um ponto seguro de rollback

Sem tag = sem memória.

---

## 🧠 Mentalidade do time

* Código estável > feature nova
* PR pequeno > PR gigante
* Branch viva demais = trabalho inacabado
* Branch mergeada = branch deletada
* Confiança vem de processo, não de pressa

---

## ✅ Definition of Done (DoD)

Um PR só pode ser mergeado se:

* Build passar
* Preview testado
* Fluxo crítico intacto
* Objetivo da mudança claro
* Branch deletada após merge

---

## 🧩 Frase para alinhar a cultura

> “Aqui a gente constrói rápido, mas nunca às cegas.”
