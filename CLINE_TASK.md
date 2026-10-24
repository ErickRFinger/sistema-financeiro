# 🚀 CLINE TASK: Sprint de Elite — Cards de Lançamento Inteligente & Micro-Interações Black & Gold (v3.3.0)

> **Diretriz de Design:** Paleta Black Obsidian (`#0D1017`, `bg-dark-900`) e Gold Glow (`#FACC15`, `text-gold-400`, `border-gold-400/40`), com feedback tátil `active:scale-95` e responsividade total mobile.

---

## 🎯 TAREFA 1: Estilização do Card Executivo de Lançamento (`src/pages/AIChatPage.tsx` e `src/components/AIAssistantChat.tsx`)

**Objetivo:** Elevar o visual dos cards de lançamentos gerados pela IA no chat para um padrão de acabamento executivo de luxo.

### Especificações da UI:
1. **Container do Card de Lançamento:**
   - Background: `bg-dark-900/90 border border-gold-400/40 rounded-2xl p-4 shadow-xl shadow-gold-500/5 transition-all hover:border-gold-400/70`.
   - Cabeçalho:
     - Badge de Tipo: `Receita` (`bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`) ou `Despesa` (`bg-rose-500/20 text-rose-400 border border-rose-500/30`).
     - Título do lançamento em negrito com `text-white text-sm font-bold truncate`.
     - Valor em destaque com tipografia monoespacada: `text-sm sm:text-base font-black` (`text-emerald-400` para receitas, `text-gold-400` para despesas).
2. **Grade de Metadados (2 Colunas):**
   - 🏦 **Conta:** Ícone `Wallet` ou `Building2` (12px) + Nome do Banco (`text-slate-200 font-medium`).
   - 📅 **Data:** Ícone `Calendar` (12px) + Data Relativa formatada (`Ontem`, `Hoje`, ou `DD/MM/AAAA`).
   - 🏷️ **Categoria:** Ícone `Tag` (12px) + Nome da Categoria.
   - 💳 **Forma:** Ícone `CreditCard` (12px) + `PIX`, `Cartão de Crédito`, `Boleto` ou `Dinheiro`.
   - ⚡ **Status:** Badge com check verde (`Pago ✅`) ou relógio amarelo (`Pendente ⏳`).
3. **Barra de Ações Rápidas Inline (1 Toque):**
   - Botão **[📑 Ver no Extrato]**: `bg-gold-400/10 hover:bg-gold-400/20 text-gold-400 border border-gold-400/30 rounded-xl py-1.5 px-3 text-xs font-bold active:scale-95`.
   - Botão **[✏️ Editar]**: Dispara mensagem rápida de alteração de valor ou abre modal de detalhes.
   - Botão **[↩️ Desfazer]**: Dispara `handleUndoAction()`.

---

## 🎯 TAREFA 2: Sincronização do Card Flutuante (`src/components/AIAssistantChat.tsx`)
**Objetivo:** Garantir que o widget flutuante de chat exiba exatamente a mesma sofisticação do card de lançamentos em tela cheia, adaptado para telas estreitas de celular (`max-w-[280px]`).

---

## 🎯 TAREFA 3 (Para Gemini no Editor via `Cmd + I`):
- No arquivo `src/pages/AIChatPage.tsx`, selecionar os botões de ação dos cards e aplicar:
  - Shimmer dourado suave no hover: `hover:shadow-md hover:shadow-gold-500/20 transition-all duration-200`.
  - Tooltips com acessibilidade `aria-label` e `title`.
