# TAREFA PARA O CLINE: Componente de Alerta de Contas a Vencer

## 🎯 Objetivo
Criar e exibir um card de alerta inteligente no Dashboard informando contas pendentes que vencem **hoje** ou nos **próximos 3 dias**, evitando atrasos e multas.

## 📁 Arquivos a criar / modificar
1. Criar o componente: `src/components/UpcomingBillsAlert.tsx`
2. Importar e exibir no topo do `src/pages/DashboardPage.tsx` (logo abaixo dos banners de boas-vindas).

## 🛠️ Especificação do Componente `UpcomingBillsAlert.tsx`
- **Props recebidas:**
  - `transactions: FinancialTransaction[]`
  - `onNavigateToStatement: () => void`
  - `isPrivate?: boolean`
- **Lógica de filtro:**
  - Filtrar transações com `type === 'expense'` e `status !== 'paid'`.
  - Comparar `transaction_date` com a data atual.
  - Selecionar contas que vencem hoje (diferença de 0 dias) ou em até +3 dias futuros.
  - Se não houver nenhuma conta a vencer nos próximos 3 dias, retornar `null` (não poluir o layout).
- **Design Visual (Padrão Black Obsidian & Amber/Gold):**
  - Fundo: `bg-dark-900 border border-amber-500/30 rounded-2xl p-4`
  - Ícone: `Clock` ou `AlertTriangle` em `text-amber-400`
  - Título: `X Contas Vencendo em Breve` (ou `1 Conta Vence Hoje`)
  - Lista compacta dos itens (Título, Data formatada e Valor).
  - Botão de ação: `Ver no Extrato →` chamando `onNavigateToStatement()`.

## ✅ Critério de Conclusão Obrigatório
- Executar `npm run build` no terminal e garantir compilação com código de saída 0 (sem erros de TypeScript).
