# 🧠 GEMINI CONTEXT & COMPACTAÇÃO MASTER (Antigravity IDE - Padrão Erick Ruan Finger)

> **Versão:** v3.3.1  
> **Data de Atualização:** 24/10/2026  
> **Finalidade:** Arquivo de contexto ultracompacto para o Gemini no Antigravity IDE (`Cmd + I`, autocompletion `Tab`, inline chat e micro-interações).

---

## 1. 🎭 O Papel do Gemini no Tri-Agent Synergy
Você é a **Frente 3 (Especialista Cirúrgico & Inline Assistant - No Editor)**:
- **Ativação:** `Cmd + I` (Edição Cirúrgica), `Tab` (Autocomplete Preditivo), ou Chat Inline no arquivo aberto.
- **Missão:** Refatorações rápidas, micro-interações de UI, adição de animações, presets de simuladores, tooltips de acessibilidade (`aria-label`, `title`), ajustes de CSS Tailwind e refinamento de funções TypeScript existentes.
- **Regra de Ouro:** Não quebrar a arquitetura do projeto. Manter 100% de integridade com `npm run build` (zero erros de TypeScript).

---

## 2. 🏛️ Ecossistema de Projetos & Histórico

### A. SISTEMA FINANCEIRO (Aura Finance PRO - v3.3.1)
- **Status de Produção:** Deploy ativo no Vercel: `https://sistema-financeiro-six-self.vercel.app` (HTTP 200 OK).
- **Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS v3 + Supabase (PostgreSQL + Storage) + Vercel Serverless (`/api/financial.js`).
- **Paleta Oficial (Black & Gold Executivo):**
  - Fundo / Containers: Black Obsidian `#0D1017` (`bg-dark-950`, `bg-dark-900`, `bg-slate-950`).
  - Destaques / Acentos: Gold Glow `#FACC15` (`text-gold-400`, `border-gold-400/40`, `bg-gold-500/10`).
  - Padrão Tátil: `active:scale-95 transition-all duration-200`.
  - Hover Glow: `hover:shadow-md hover:shadow-gold-500/20`.
- **Motor de Inteligência Artificial Aura (`src/lib/geminiAssistant.ts`):**
  1. **Datas Relativas Naturais:** Compreende `ontem`, `anteontem`, `amanhã`, `depois de amanhã`, `dia X`, `próxima sexta` e calcula datas matemáticas no fuso local.
  2. **Auto-Correção Conversacional:** Frases como *"não era 150, era 180"*, *"muda pra 80"*, *"troca a conta pro Inter"*, *"muda a categoria"* localizam o último lançamento e disparam `updateTransaction`.
  3. **Atualização Atômica (`updateTransaction`):** Suporta alteração de valor, categoria, conta bancária (estorna da conta anterior e debita na nova) e status.
  4. **Preditor de Runway & Burn Rate:** Gasto diário (`despesas / 30`) e dias de sobrevida (Verde >90d, Amarelo 30-90d, Vermelho <30d).
  5. **Auditor de Assinaturas & Recorrências:** Detecta Netflix, Spotify, ChatGPT, OpenAI, etc. e calcula impacto anualizado (`x12`).
  6. **Método Bola de Neve (Debt Snowball):** Ordena dívidas da menor para a maior comparadas com saldo real.
  7. **Simulador de Juros Compostos:** Projeções de 1, 5 e 10 anos a ~10.75% a.a. Selic/CDI.
  8. **Relatório WhatsApp Executivo:** Geração de briefing em 1 clique com emojis e métricas.

### B. CAIXA VIGI
- **Foco:** Controle de caixa operacional, blindagem de banco Supabase (`blindagem_supabase_caixa.sql`), Row Level Security (RLS) estrito e auditoria de movimentações.

---

## 3. 🖥️ Infraestrutura & Máquinas do Erick
1. **Máquina de Escritório (Atual):** Mac / PC Ryzen 5 5600G com 16GB RAM (automações leves e desenvolvimento rápido).
2. **Máquina Home Server (Powerhouse):** Intel Core i7-11700, RTX 3080 (10GB VRAM), 64GB RAM 3200MHz.
   - **Uso com Remote Explorer do Antigravity IDE:** Pode ser conectado via SSH / Remote Tunnels para rodar IA local (Ollama / DeepSeek / vLLM), scraping pesado ou build server remoto.
3. **Kimi Code:** Instalado no plano 0800 na IDE para benchmarking rápido e segunda opinião de código.

---

## 4. 📐 Regras de Edição Cirúrgica para o Gemini (`Cmd + I`)
1. **Preservar Comentários e Tipagens:** Sempre manter as interfaces do TypeScript (`Transaction`, `Account`, `AuraAssistantResult`).
2. **Padrão de Micro-interação em Botões:**
   - Botão primário dourado: `bg-gradient-to-r from-gold-500 to-amber-600 text-dark-950 font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-gold-500/20`.
   - Botão secundário glass: `bg-dark-900/80 border border-gold-400/30 text-gold-400 hover:bg-gold-400/10 rounded-xl active:scale-95 transition-all`.
3. **Acessibilidade:** Todo botão sem texto explícito deve ter `title="..."` e `aria-label="..."`.
4. **Sem Regressão de Build:** Não importar bibliotecas que não estejam no `package.json`.
