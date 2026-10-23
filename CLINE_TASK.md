# 📋 TAREFA PARA O CLINE NO ANTIGRAVITY IDE: Score de Saúde Financeira

## 🎯 Objetivo
Criar um componente compacto e elegante de **Score de Saúde Financeira (0 a 1000)** para exibir no Dashboard, dando um diagnóstico instantâneo e uma recomendação financeira personalizada para o usuário.

---

## 📁 Arquivos a criar / modificar
1. Criar o componente: `src/components/FinancialHealthScore.tsx`
2. Importar e adicionar no grid do `src/pages/DashboardPage.tsx` (logo ao lado ou abaixo de `CurrencyQuotesWidget`).

---

## 🛠️ Especificação de `FinancialHealthScore.tsx`

### 1. Props:
```typescript
interface FinancialHealthScoreProps {
  income: number;
  expenses: number;
  transactionsCount: number;
  isPrivate?: boolean;
}
```

### 2. Regra de Cálculo do Score (0 a 1000):
- **Base:** Começa com 500 pontos.
- **Taxa de Poupança:** Se `income > 0`:
  - Se sobrou mais de 30% da receita: `+250 pontos`
  - Se sobrou entre 10% e 30%: `+150 pontos`
  - Se despesas > receitas: `-200 pontos`
- **Volume de Controle:**
  - Se `transactionsCount >= 5`: `+150 pontos` (parabéns pelo hábito de registrar)
  - Se `transactionsCount === 0`: `score = 500` (sem dados suficientes)
- **Trava de Limites:** `Math.min(1000, Math.max(100, scoreCalculado))`

### 3. Níveis & Cores:
- **800 a 1000:** `Excelente` (texto em `text-emerald-400`, barra em verde esmeralda) -> Dica: *"Excelente controle! Considere investir os excedentes no Simulador de Juros Compostos."*
- **600 a 799:** `Bom` (texto em `text-gold-400`, barra em dourado) -> Dica: *"Finanças sob controle. Tente cortar pequenos gastos para atingir 30% de poupança."*
- **400 a 599:** `Atenção` (texto em `text-amber-400`, barra em âmbar) -> Dica: *"Suas despesas estão próximas das receitas. Revise seus tetos de gastos no Dashboard."*
- **Abaixo de 400:** `Crítico` (texto em `text-rose-400`, barra em vermelho) -> Dica: *"Atenção: despesas superando os ganhos este mês. Evite novas dívidas."*

### 4. Design (Padrão Black Obsidian & Gold):
- Card com `bg-dark-900 border border-slate-800 rounded-2xl p-5`.
- Ícone `ShieldCheck` ou `Activity` da biblioteca `lucide-react`.
- Medidor visual: Uma barra horizontal de progresso elegante ou anel com a pontuação destacada (ex: `850 / 1000`).
- Se `isPrivate === true`, exibir `••• / 1000` ou ocultar valores sensíveis.

---

## ✅ Critério de Conclusão Obrigatório
- O código deve compilar perfeitamente sem nenhum erro de TypeScript.
- Executar `npm run build` e confirmar código de saída 0.
