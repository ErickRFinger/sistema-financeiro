# 📋 TAREFA PARA O CLINE: Radar de Metas Financeiras com Anéis Circulares (Caixinhas de Sonhos)

## 🎯 Objetivo
Criar o componente executivo `src/components/FinancialGoalsWidget.tsx` para permitir que o usuário crie e gerencie Metas Financeiras (ex: *Reserva de Emergência*, *Viagem de Fim de Ano*, *Troca de Carro*, *Aporte Anual*) com anéis de progresso circulares SVG elegantes em Black Obsidian & Gold, cálculo de porcentagem atingida, prazo estimado e botão de aporte rápido.

---

## 📁 Arquivos a criar / modificar
1. Criar: `src/components/FinancialGoalsWidget.tsx`
2. Modificar: `src/pages/DashboardPage.tsx` (posicionar o widget de metas no Dashboard).

---

## 🛠️ Especificação de `FinancialGoalsWidget.tsx`

### 1. Interface & Modelagem:
```typescript
export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadlineDate?: string;
  category: 'emergency' | 'travel' | 'purchase' | 'investment';
  color: string;
}
```
- Persistência em `localStorage` (`aura_user_financial_goals`) com 3 metas padrão de demonstração:
  1. **Reserva de Emergência (6 Meses):** Alvo R$ 30.000 | Atual R$ 18.500 | Cor Ouro (`#FACC15`)
  2. **Viagem de Férias:** Alvo R$ 8.000 | Atual R$ 5.200 | Cor Ciano (`#06B6D4`)
  3. **Troca de Carro:** Alvo R$ 45.000 | Atual R$ 12.000 | Cor Esmeralda (`#10B981`)

### 2. Recursos & Visual:
- **Anel de Progresso Circular SVG (Progress Ring):**
  - Renderiza um anel circular com `strokeDasharray` e `strokeDashoffset` animado.
  - No centro do anel, exibe a porcentagem em negrito (ex: `62%`).
- **Botão de Aporte Rápido:**
  - Botão "+ Aportar" com mini input para adicionar valor à meta instantaneamente.
- **Formulário para Nova Meta:**
  - Botão "+ Nova Meta" abrindo campos para Nome, Valor Alvo, Valor Inicial e Categoria.
- **Suporte ao Modo Privacidade (`isPrivate`):**
  - Ocultar valores monetários com `••••••` quando `isPrivate` for `true`.

---

## ✅ Critério de Conclusão Obrigatório
- Não quebrar tipos do TypeScript.
- Executar `npm run build` e certificar que compilou com **código 0**.
