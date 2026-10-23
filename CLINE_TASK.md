# 📋 TAREFA PARA O CLINE: Padronização Executiva & Blindagem de Todos os Modais (UI & UX)

## 🎯 Objetivo
Corrigir os modais que estão "meio fora" e despadronizados no sistema, garantindo experiência executiva de alto padrão em qualquer dispositivo (Desktop, Tablet e Celular).

---

## 🛑 Problemas Identificados para Correção Imediata
1. **Clique Fora do Modal (Backdrop Dismiss):** Usuários clicam no fundo escuro borrado esperando fechar o modal, mas nada acontece.
2. **Atalho Teclado `Escape`:** Pressionar `Esc` não fecha os modais secundários.
3. **Corte de Conteúdo em Telas Menores / Celulares:** Falta de `overflow-y-auto` no container externo faz com que em telas menores ou com teclado virtual aberto, os botões de ação ("Salvar", "Cancelar", "Fechar") fiquem cortados fora da tela.
4. **Acabamento Visual Despadronizado:** Alguns modais ainda usam `border-dark-800` cinza apagado ou cantos `rounded-2xl` antigos, sem o brilho dourado sutil do padrão Aura Finance PRO.

---

## 📐 Padrão Obrigatório a ser Aplicado em CADA Modal

### 1. Listener de Teclado `Escape`:
```tsx
useEffect(() => {
  if (!isOpen) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onClose]);
```

### 2. Container Externo (Backdrop com Fechamento & Rolagem Segura):
```tsx
<div 
  onClick={(e) => {
    if (e.target === e.currentTarget) onClose();
  }}
  className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
>
```

### 3. Card do Modal (Borda Dourada, Sombra Profunda e Animação Fluida):
```tsx
<div className="relative w-full max-w-lg rounded-3xl bg-dark-900 border border-gold-400/30 shadow-2xl p-5 sm:p-7 my-6 animate-in fade-in zoom-in-95 duration-150">
```

---

## 📁 Lista de Arquivos para o Cline Refatorar

### 1. `src/components/BankStatementImporterModal.tsx`
- Adicionar listener de `Escape`.
- Adicionar `overflow-y-auto` no backdrop exterior (`div.fixed.inset-0`).
- Adicionar `onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}` no backdrop exterior.
- Adicionar `border-gold-400/30` na caixa do modal.

### 2. `src/components/CardInvoiceScannerModal.tsx`
- Adicionar listener de `Escape`.
- Adicionar `overflow-y-auto` no backdrop exterior.
- Adicionar `onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}` no backdrop exterior.
- Atualizar cantos para `rounded-3xl` e borda `border-gold-400/30`.

### 3. `src/components/CardModal.tsx` e `src/components/CardExpenseModal.tsx`
- Adicionar listener de `Escape` em ambos.
- Adicionar `overflow-y-auto` no backdrop exterior.
- Adicionar `onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}` no backdrop exterior.
- Atualizar cantos para `rounded-3xl` e borda `border-gold-400/30`.

### 4. `src/components/AccountModal.tsx` e `src/components/InvestmentModal.tsx`
- Adicionar listener de `Escape` em ambos.
- Adicionar `onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}` no backdrop exterior.
- Garantir `animate-in fade-in zoom-in-95 duration-150`.

### 5. `src/components/AuthModal.tsx` e `src/components/MercadoPagoModal.tsx`
- Adicionar listener de `Escape` em ambos.
- Adicionar `onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}` no backdrop exterior.
- Garantir que nenhum input perca o foco indevidamente.

### 6. Modais Embutidos em Páginas:
- **`src/pages/CardsPage.tsx` (`isPayInvoiceModalOpen`):**
  - Adicionar `onClick={(e) => { if (e.target === e.currentTarget) setIsPayInvoiceModalOpen(false); }}` no backdrop.
  - Adicionar `overflow-y-auto` e atualizar card para `rounded-3xl border border-gold-400/30`.
- **`src/pages/ShoppingListsPage.tsx` (`isNewListModalOpen` e `isLaunchModalOpen`):**
  - Adicionar backdrop click dismiss e `overflow-y-auto` nos dois modais da página.
  - Atualizar cards para `rounded-3xl border border-gold-400/30`.
- **`src/pages/SubscriptionInvoicesPage.tsx` (`selectedReceipt`):**
  - Adicionar backdrop click dismiss (`onClick={() => setSelectedReceipt(null)}`), listener `Escape` e `overflow-y-auto`.
- **`src/components/CategoryBudgetWidget.tsx` (`isModalOpen`):**
  - Adicionar listener `Escape` e backdrop click dismiss.
- **`src/components/PWAInstallBanner.tsx` (`showIOSModal`):**
  - Adicionar backdrop click dismiss (`onClick={() => setShowIOSModal(false)}`).

---

## 🧪 Validação Obrigatória
- Executar `npm run build` ao finalizar.
- O build DEVE terminar com **0 erros TypeScript** e código de saída 0.

---

## ✅ Status da Execução: 100% Concluído & Auditado (v2.8.2)
- **12 Modais de Componentes + 5 Modais Embutidos Atualizados:**
  1. `BankStatementImporterModal.tsx`
  2. `InvestmentModal.tsx`
  3. `AccountModal.tsx`
  4. `CardModal.tsx`
  5. `CardExpenseModal.tsx`
  6. `CardInvoiceScannerModal.tsx`
  7. `AuthModal.tsx`
  8. `MercadoPagoModal.tsx`
  9. `CFOModal.tsx`
  10. `InvoiceScannerModal.tsx`
  11. `TransactionDetailsModal.tsx`
  12. `TransactionModal.tsx`
  13. `CardsPage.tsx` (`isPayInvoiceModalOpen`)
  14. `ShoppingListsPage.tsx` (`isNewListModalOpen`)
  15. `ShoppingListsPage.tsx` (`isLaunchModalOpen`)
  16. `SubscriptionInvoicesPage.tsx` (`selectedReceipt`)
  17. `CategoryBudgetWidget.tsx` (`isModalOpen`)
  18. `PWAInstallBanner.tsx` (`showIOSModal`)
- **Micro-interações aplicadas em todos:**
  - `title="Fechar janela (Esc)"`
  - `aria-label="Fechar modal"`
  - `active:scale-90 hover:bg-dark-800 transition-all duration-150`
  - `animate-in fade-in zoom-in-95 duration-150`
  - Backdrop dismiss & listener de teclado `Escape`
- **Build verificado:** `npm run build` executado com **0 erros TypeScript** e gerando todos os chunks em 1.30s.
