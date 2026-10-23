# 🚀 CLINE TASK: Sprint de Elite — Ações em Massa, Relatório Executivo e Toasts Black & Gold

> **Regra Geral:** Seguir rigorosamente a paleta Black Obsidian (`#0D1017`, `bg-dark-900`) e Gold Glow (`#FACC15`, `text-gold-400`, `border-gold-400/30`), com suporte completo a responsividade mobile e acessibilidade.

---

## 🎯 TAREFA 1: Barra de Ações em Massa no Extrato (`src/pages/StatementPage.tsx`)
**Objetivo:** Permitir ao usuário selecionar múltiplas transações com checkboxes e realizar ações em lote (marcar como pagas, excluir ou somar).

### Especificações da UI:
1. **Checkbox no Cabeçalho e em cada Linha:**
   - Adicionar estado `selectedTxIds: string[]`.
   - Checkbox "Selecionar Todos" visíveis no topo da tabela.
   - Cada linha de transação ganha um checkbox customizado em tons dourados.
2. **Barra Flutuante de Ações em Massa (Bottom Floating Bar):**
   - Quando `selectedTxIds.length > 0`, exibir uma barra flutuante fixa na base da tela (`fixed bottom-6 left-1/2 -translate-x-1/2 z-40`):
     - Background: `bg-dark-900/95 backdrop-blur-xl border border-gold-400/40 rounded-2xl shadow-2xl px-6 py-3`.
     - Texto de resumo: *"X selecionadas | Total: R$ Y"* (calculado em tempo real).
     - Botão 1: **"Marcar como Pagas"** (ícone CheckCircle2, cor verde/dourada).
     - Botão 2: **"Excluir Selecionadas"** (ícone Trash2, cor vermelho neon, com confirmação rápida).
     - Botão 3: **"Cancelar Seleção"** (ícone X).

---

## 🎯 TAREFA 2: Sistema de Toasts Executivos Black & Gold (`src/components/Toast.tsx`)
**Objetivo:** Substituir qualquer `alert()` nativo por toasts modernos flutuantes, elegantes e com auto-dismiss.

### Especificações da UI:
1. Criar `src/components/Toast.tsx` e exportar `ToastProvider` e hook `useToast()`:
   ```tsx
   showToast('Transação salva com sucesso!', 'success');
   showToast('Erro ao sincronizar dados', 'error');
   ```
2. **Estilização dos Toasts:**
   - Container no topo direito (`fixed top-5 right-5 z-50 flex flex-col gap-2`).
   - Card com `bg-dark-900/90 backdrop-blur-md border border-gold-400/40 rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-200`.
   - Barra de progresso inferior discreta que vai diminuindo até o toast sumir (3 segundos).
3. Integrar no `src/App.tsx` envolvendo a aplicação com o `<ToastProvider>`.

---

## 🎯 TAREFA 3: Botão de "Relatório Executivo Mensal (PDF)" (`src/pages/StatementPage.tsx`)
**Objetivo:** Gerar um relatório consolidado com layout digno de diretoria para exportar o mês selecionado.

### Especificações:
1. No cabeçalho de exportação de `StatementPage.tsx`, ao lado de "Exportar PDF" e "Excel", destacar o botão:
   - Botão: **"Relatório Executivo"** com ícone `Sparkles` e gradiente dourado (`bg-gradient-to-r from-gold-500 to-amber-500 text-dark-950 font-bold`).
2. Conectar à função geradora de PDF executivo que inclui:
   - Cabeçalho Aura Finance PRO com logo.
   - Resumo em 4 Cards no PDF: Receitas, Despesas, Saldo Líquido e % de Economia.
   - Tabela de Maiores Despesas e Tabela de Receitas.
   - Rodapé com carimbo de autenticidade e data/hora.
