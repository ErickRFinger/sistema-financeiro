# 📋 TAREFA PARA O CLINE: Command Palette Executivo & Spotlight Global (⌘K / Ctrl+K)

## 🎯 Objetivo
Criar o componente executivo de alta produtividade `src/components/CommandPalette.tsx` (estilo Linear, Raycast e Mac Spotlight). 
Permite que o usuário navegue instantaneamente pelo sistema, dispare ações financeiras rápidas e pesquise transações em tempo real usando apenas o teclado (`Cmd+K` ou `Ctrl+K`).

---

## 📁 Arquivos a criar / modificar
1. **Criar:** `src/components/CommandPalette.tsx`
2. **Modificar:** `src/components/Navbar.tsx` (adicionar botão elegante de busca rápida com badge `⌘K` na barra).
3. **Modificar:** `src/App.tsx` (adicionar o listener global `Cmd+K` / `Ctrl+K` e renderizar o `<CommandPalette />`).

---

## 🛠️ Especificação de `src/components/CommandPalette.tsx`

### 1. Props e Interface:
```typescript
import { FinancialTransaction, TransactionType } from '../types/financial';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: (type?: TransactionType) => void;
  onOpenScanner: () => void;
  onOpenCFO?: () => void;
  onTogglePrivacy?: () => void;
  onOpenImporter?: () => void;
  transactions: FinancialTransaction[];
  onSelectTransaction: (tx: FinancialTransaction) => void;
  isPrivate?: boolean;
}
```

### 2. Comportamento e Funcionalidades:
- **Abertura / Fechamento:**
  - Controlado por `isOpen` e `onClose`.
  - Fecha ao pressionar `Escape` ou clicar no backdrop escuro (`backdrop-blur-md bg-black/75`).
  - Input com `autoFocus` imediato ao abrir.
- **Navegação por Teclado:**
  - Seta para Baixo (`ArrowDown`) e Seta para Cima (`ArrowUp`) para alternar a seleção do item ativo (`selectedIndex`).
  - `Enter` executa a ação do item atualmente selecionado e fecha a palette.
- **Seções Filtradas por Busca:**
  Quando o input estiver vazio ou o usuário digitar algo:
  1. **🚀 Navegação Rápida:**
     - Ir para Dashboard
     - Ir para Extrato & Lançamentos
     - Ir para Cartões de Crédito
     - Ir para Contas Bancárias
     - Ir para Investimentos & Quitação de Dívidas
     - Ir para Listas de Compras
     - Ir para Tutoriais & Guias
  2. **⚡ Ações Imediatas:**
     - + Nova Despesa (abre modal de despesa)
     - + Nova Receita (abre modal de receita)
     - 📥 Importar Extrato (OFX / CSV)
     - 📸 Escanear Fatura com IA
     - 🤖 Abrir CFO Virtual & Chat IA
     - 👁️ Alternar Modo Privacidade
  3. **🔍 Transações Encontradas:**
     - Se o usuário digitar algo que combine com a descrição de transações (ex: "uber", "ifood", "salario", "mercado"), exibe as top 5 transações correspondentes.
     - Ao clicar ou teclar `Enter` em uma transação, chama `onSelectTransaction(tx)`.

### 3. Design Executivo (Padrão Black Obsidian & Gold):
- Modal centralizado flutuante com largura máxima `max-w-2xl` e cantos arredondados `rounded-2xl`.
- Fundo: `bg-[#0D1017]/95 border border-white/10 shadow-2xl backdrop-blur-xl`.
- Barra de busca superior com ícone de lupa (`Search` de `lucide-react`), input limpo sem bordas feias, e botão `ESC` para fechar.
- Item ativo com destaque: `bg-yellow-500/10 text-yellow-400 border-l-2 border-yellow-400`.
- Rodapé do modal com dicas táteis de teclado:
  - `↑↓ Navegar` | `↵ Executar` | `esc Fechar`

---

## 🛠️ Especificação de Modificação no `Navbar.tsx`
- Adicionar ao lado do botão do Modo Privacidade um botão elegante de busca rápida:
  - Ex: Botão com ícone `Search`, texto sutil "Buscar ou comando..." (visível no desktop) e um badge mono `⌘K`.
  - Ao clicar, chama `onOpenCommandPalette()`.

---

## 🛠️ Especificação de Modificação no `App.tsx`
- Adicionar estado `const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);`.
- Adicionar listener global para `keydown` interceptando `(e.metaKey || e.ctrlKey) && e.key === 'k'`, prevenindo o default e abrindo a palette.
- Renderizar `<CommandPalette ... />` passando as funções de controle e a lista de transações.

---

## ✅ Critério de Conclusão Obrigatório
- Não quebrar tipos do TypeScript.
- Executar `npm run build` e certificar que compilou com **código 0**.
