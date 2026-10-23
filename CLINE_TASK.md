# 📋 TAREFA PARA O CLINE: Simulador de Quitação de Dívidas (Método Bola de Neve vs Avalanche)

## 🎯 Objetivo
Criar o componente executivo `src/components/DebtSnowballSimulator.tsx` para permitir que o usuário cadastre suas dívidas pendentes (cartão de crédito, cheque especial, financiamento, empréstimos) e simule a estratégia matemática ideal para zerar todas as dívidas no menor tempo e com a maior economia de juros.

---

## 📁 Arquivos a criar / modificar
1. Criar: `src/components/DebtSnowballSimulator.tsx`
2. Modificar: `src/pages/InvestmentsPage.tsx` (adicionar uma aba/seção para alternar entre "Simulador de Juros Compostos" e "Quitação de Dívidas").

---

## 🛠️ Especificação de `DebtSnowballSimulator.tsx`

### 1. Modelagem das Dívidas:
```typescript
interface DebtItem {
  id: string;
  name: string;
  balance: number; // saldo devedor
  interestRate: number; // taxa de juros mensal %
  minPayment: number; // parcela mínima mensal
}
```
- Estado persistido em `localStorage` (`aura_user_debts`) com dívidas padrão para demonstração:
  1. Cartão de Crédito Rotativo: R$ 2.500,00 | Juros: 12.5% a.m. | Mínimo: R$ 250,00
  2. Empréstimo Pessoal: R$ 6.000,00 | Juros: 4.2% a.m. | Mínimo: R$ 380,00
  3. Financiamento de Veículo: R$ 18.000,00 | Juros: 1.8% a.m. | Mínimo: R$ 650,00

### 2. Estratégias Matemáticas:
- **Slider Interativo:** "Aporte Extra Mensal para Abater Dívidas" (de R$ 0 a R$ 3.000/mês).
- **Duas Estratégias com 1 Clique:**
  - ⚡ **Método Avalanche (Maior Juro Primeiro):** Foca o valor extra na dívida com maior taxa de juros (gera a maior economia de dinheiro).
  - ⛄ **Método Bola de Neve (Menor Saldo Primeiro):** Foca na dívida com menor saldo devedor (vitória psicológica mais rápida).
- **Indicadores de Impacto:**
  - Prazo Estimado para Quitação Total (ex: *"14 meses para zerar tudo"*).
  - Economia Estimada em Juros Evitados (ex: *"Economia de R$ 4.820,00"*).
  - Barra de progresso visual de quitação.

### 3. Design Black Obsidian & Gold:
- Padrão visual elegante com `bg-dark-900 border border-slate-800 rounded-3xl p-6 shadow-dark-card`.
- Botões de troca de método (*Avalanche* vs *Bola de Neve*).
- Formulário para adicionar nova dívida e botão para remover dívida quitada.
- Suporte total ao `isPrivate` (`••••••`).

---

## ✅ Critério de Conclusão Obrigatório
- Não cometer erros de sintaxe nos imports (usar `import React from 'react';` em linha própria).
- Executar `npm run build` no terminal e certificar que compilou com **código 0**.
