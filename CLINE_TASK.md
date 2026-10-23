# 📋 TAREFA PARA O CLINE: Importador Universal de Extratos Bancários (OFX & CSV)

## 🎯 Objetivo
Criar o componente modal executivo `src/components/BankStatementImporterModal.tsx` para permitir que o usuário importe extratos bancários de qualquer banco brasileiro (Nubank, Itaú, Bradesco, Santander, Inter, Caixa, Banco do Brasil) nos formatos **OFX** e **CSV**, com pré-visualização, categorização automática inteligente e importação em lote com 1 clique.

---

## 📁 Arquivos a criar / modificar
1. Criar: `src/components/BankStatementImporterModal.tsx`
2. Modificar: `src/pages/StatementPage.tsx` (adicionar botão executivo "📥 Importar Extrato (OFX/CSV)" ao lado dos botões de exportação de PDF e Excel).

---

## 🛠️ Especificação de `BankStatementImporterModal.tsx`

### 1. Interface & Props:
```typescript
interface BankStatementImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  onImportComplete: (importedTransactions: Omit<FinancialTransaction, 'id'>[]) => Promise<void>;
}
```

### 2. Leitura & Parser de Arquivos (Sem bibliotecas externas pesadas):
- **Suporte a arquivos `.ofx` e `.csv`**:
  - **Parser OFX:** Extrai blocos `<STMTTRN>` capturando:
    - `<TRNTYPE>` (DEBIT = expense, CREDIT = income)
    - `<DTPOSTED>` (ex: `20261022` -> converte para `YYYY-MM-DD`)
    - `<TRNAMT>` (valor monetário, converte sinal)
    - `<MEMO>` ou `<NAME>` (descrição do gasto/depósito)
  - **Parser CSV:** Lê cabeçalhos típicos (Data, Descrição/Histórico, Valor/Quantia). Trata vírgula e ponto decimal brasileiro (`1.250,50`).
- **Auto-Categorização Inteligente:**
  - Se a descrição contiver "SUPERMERCADO", "IFOOD", "PADARIA" -> seleciona categoria `Alimentação`.
  - Se contiver "UBER", "POSTO", "COMBUSTIVEL" -> `Transporte`.
  - Se contiver "FARMACIA", "DROGARIA", "MEDICO" -> `Saúde`.
  - Se contiver "NETFLIX", "SPOTIFY", "AMAZON" -> `Assinaturas / Lazer`.

### 3. Tela de Preview & Seleção em Lote:
- Exibe o total de transações encontradas e o saldo líquido (Receitas vs Despesas do arquivo).
- Seletor de Conta bancária de destino (`select` com as `accounts` cadastradas).
- Tabela com checkboxes individuais e "Selecionar Todas / Desmarcar Todas".
- Dropdown inline em cada linha permitindo trocar a categoria sugerida antes de salvar.
- Botão final: **"Importar X Transações Selecionadas"** com feedback visual de sucesso.

### 4. Design Black Obsidian & Gold:
- Modal em `bg-dark-900 border border-slate-800 rounded-3xl p-6 shadow-dark-card` com backdrop blur.
- Zona de Drag and Drop com borda pontilhada dourada (`border-dashed border-gold-400/30 hover:border-gold-400`).

---

## ✅ Critério de Conclusão Obrigatório
- Não quebrar tipos do TypeScript.
- Executar `npm run build` e certificar que compilou com **código 0**.
