import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Check, 
  Trash2, 
  CheckSquare, 
  Square, 
  DollarSign, 
  Sparkles, 
  ArrowRight, 
  Tag, 
  Archive, 
  Landmark, 
  CreditCard as CardIcon,
  ShoppingBag,
  Home,
  Wrench,
  Pill,
  Briefcase
} from 'lucide-react';
import { ShoppingList, ShoppingListItem, FinancialAccount, CreditCard, TransactionType } from '../types/financial';
import { formatCurrency } from '../lib/formatters';
import confetti from 'canvas-confetti';

interface ShoppingListsPageProps {
  lists: ShoppingList[];
  accounts: FinancialAccount[];
  cards: CreditCard[];
  onSaveList: (list: Omit<ShoppingList, 'id' | 'created_at'>) => void;
  onUpdateList: (id: string, list: Partial<ShoppingList>) => void;
  onDeleteList: (id: string) => void;
  onLaunchExpense: (data: {
    title: string;
    amount: number;
    type: TransactionType;
    account_id?: string;
    card_id?: string;
    category: string;
    date: string;
    notes?: string;
  }) => Promise<void>;
}

const CATEGORY_ICONS: Record<string, any> = {
  Mercado: ShoppingCart,
  Casa: Home,
  Construção: Wrench,
  Farmácia: Pill,
  Escritório: Briefcase,
  Outros: ShoppingBag,
};

const COMMON_MARKET_SUGGESTIONS = [
  'Arroz 5kg', 'Feijão 1kg', 'Café em Pó', 'Leite Integral', 'Ovos (Cartela 30)',
  'Pão Francês', 'Peito de Frango', 'Carne Moída', 'Azeite de Oliva', 'Maçã Gala',
  'Banana Prata', 'Tomate Italiano', 'Sabão em Pó', 'Detergente', 'Papel Higiênico'
];

export const ShoppingListsPage: React.FC<ShoppingListsPageProps> = ({
  lists,
  accounts,
  cards,
  onSaveList,
  onUpdateList,
  onDeleteList,
  onLaunchExpense,
}) => {
  const [selectedListId, setSelectedListId] = useState<string>(lists[0]?.id || '');
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListCategory, setNewListCategory] = useState<ShoppingList['category']>('Mercado');

  // Item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('un');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Launch modal state
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [launchPaymentType, setLaunchPaymentType] = useState<'account' | 'card'>('account');
  const [launchAccountId, setLaunchAccountId] = useState(accounts[0]?.id || '');
  const [launchCardId, setLaunchCardId] = useState(cards[0]?.id || '');
  const [launchAmount, setLaunchAmount] = useState<number>(0);

  const activeList = lists.find(l => l.id === selectedListId) || lists[0];

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    onSaveList({
      title: newListName.trim(),
      category: newListCategory,
      items: [],
      is_completed: false,
    });

    setNewListName('');
    setIsNewListModalOpen(false);
  };

  const handleAddItem = (itemName?: string) => {
    const nameToAdd = itemName || newItemName.trim();
    if (!nameToAdd || !activeList) return;

    const parsedPrice = parseFloat(newItemPrice.replace(/\./g, '').replace(',', '.')) || 0;
    const parsedQty = parseFloat(newItemQty) || 1;

    const newItem: ShoppingListItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: nameToAdd,
      quantity: parsedQty,
      unit: newItemUnit,
      estimated_price: parsedPrice > 0 ? parsedPrice : undefined,
      is_purchased: false,
    };

    const updatedItems = [...activeList.items, newItem];
    onUpdateList(activeList.id, { items: updatedItems });

    if (!itemName) {
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQty('1');
    }
  };

  const handleToggleItem = (itemId: string) => {
    if (!activeList) return;
    const updated = activeList.items.map(i => {
      if (i.id === itemId) {
        return { ...i, is_purchased: !i.is_purchased };
      }
      return i;
    });
    onUpdateList(activeList.id, { items: updated });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!activeList) return;
    const updated = activeList.items.filter(i => i.id !== itemId);
    onUpdateList(activeList.id, { items: updated });
  };

  // Calculations for active list
  const totalItemsCount = activeList?.items.length || 0;
  const purchasedItemsCount = activeList?.items.filter(i => i.is_purchased).length || 0;
  const progressPercent = totalItemsCount > 0 ? Math.round((purchasedItemsCount / totalItemsCount) * 100) : 0;

  const estimatedTotal = activeList?.items.reduce((acc, i) => acc + ((i.estimated_price || 0) * (i.quantity || 1)), 0) || 0;
  const cartTotal = activeList?.items
    .filter(i => i.is_purchased)
    .reduce((acc, i) => acc + ((i.estimated_price || 0) * (i.quantity || 1)), 0) || 0;

  const handleOpenLaunchModal = () => {
    setLaunchAmount(cartTotal > 0 ? cartTotal : estimatedTotal);
    setIsLaunchModalOpen(true);
  };

  const handleConfirmLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (launchAmount <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    await onLaunchExpense({
      title: `Compras: ${activeList.title}`,
      amount: launchAmount,
      type: 'expense',
      account_id: launchPaymentType === 'account' ? launchAccountId : undefined,
      card_id: launchPaymentType === 'card' ? launchCardId : undefined,
      category: activeList.category === 'Mercado' ? 'Alimentação & Refeição' : 'Outros',
      date: today,
      notes: `Compra realizada com ${purchasedItemsCount} itens marcados como comprados na Lista de Compras.`,
    });

    onUpdateList(activeList.id, { is_completed: true });

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 }
    });

    setIsLaunchModalOpen(false);
  };

  const CategoryIcon = CATEGORY_ICONS[activeList?.category || 'Mercado'] || ShoppingCart;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <ShoppingCart className="text-gold-400" size={26} />
            <span>Listas de Compras Inteligentes</span>
          </h1>
          <p className="text-xs text-slate-400">
            Organize listas de Mercado, Casa e Obras, acompanhe itens no carrinho e lance a despesa final com 1 clique
          </p>
        </div>

        <button
          onClick={() => setIsNewListModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-black text-xs hover:brightness-110 transition-all shadow-gold-glow active:scale-95 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Nova Lista</span>
        </button>
      </div>

      {/* Empty State */}
      {lists.length === 0 ? (
        <div className="border border-dark-800 rounded-3xl bg-dark-900/40 p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-3xl bg-gold-400/10 border border-gold-400/30 text-gold-400 flex items-center justify-center mx-auto mb-4 shadow-gold-glow">
            <ShoppingCart size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma Lista de Compras Criada</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Crie sua primeira lista para organizar compras de supermercado, insumos para sua casa ou materiais de escritório.
          </p>
          <button
            onClick={() => setIsNewListModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-gold-400 hover:bg-gold-300 text-dark-950 font-black text-xs transition-all shadow-gold-glow"
          >
            + Criar Minha Primeira Lista
          </button>
        </div>
      ) : (
        <>
          {/* Lists Tab Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {lists.map((l) => {
              const isSelected = l.id === activeList?.id;
              const Icon = CATEGORY_ICONS[l.category] || ShoppingCart;
              const completedItems = l.items.filter(i => i.is_purchased).length;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelectedListId(l.id)}
                  className={`
                    px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all whitespace-nowrap border
                    ${isSelected 
                      ? 'bg-dark-900 border-gold-400 text-gold-400 shadow-sm' 
                      : 'bg-dark-950/70 border-dark-800 text-slate-400 hover:text-slate-200'}
                  `}
                >
                  <Icon size={15} className={isSelected ? 'text-gold-400' : 'text-slate-500'} />
                  <span>{l.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dark-800 text-slate-400 border border-dark-750">
                    {completedItems}/{l.items.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active List Overview Card */}
          <div className="border border-dark-800 rounded-3xl bg-dark-900/60 p-5 sm:p-6 space-y-6">
            {/* Header of Active List */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gold-400/10 border border-gold-400/30 text-gold-400 flex items-center justify-center shrink-0">
                  <CategoryIcon size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>{activeList.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dark-800 text-slate-300 border border-dark-750">
                      {activeList.category}
                    </span>
                    {activeList.is_completed && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Finalizada
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {purchasedItemsCount} de {totalItemsCount} itens comprados ({progressPercent}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  onClick={handleOpenLaunchModal}
                  disabled={totalItemsCount === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400 hover:bg-gold-300 text-dark-950 font-black text-xs transition-all shadow-gold-glow active:scale-95 disabled:opacity-40"
                >
                  <DollarSign size={16} />
                  <span>Finalizar & Lançar no Caixa</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Deseja excluir a lista "${activeList.title}"?`)) {
                      onDeleteList(activeList.id);
                    }
                  }}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-dark-800 transition-colors"
                  title="Excluir lista"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Progress & Value Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Progresso das Compras
                </span>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-200">{purchasedItemsCount} de {totalItemsCount}</span>
                  <span className="text-xs font-black text-gold-400">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-dark-900 overflow-hidden border border-dark-800">
                  <div
                    className="h-full bg-gradient-to-r from-gold-400 to-amber-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Total no Carrinho
                </span>
                <p className="text-xl font-black text-emerald-400">
                  {formatCurrency(cartTotal)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Soma dos itens já marcados</p>
              </div>

              <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Estimado da Lista
                </span>
                <p className="text-xl font-black text-gold-400">
                  {formatCurrency(estimatedTotal)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Previsão total com todos itens</p>
              </div>
            </div>

            {/* Quick Add Suggestions (if Mercado) */}
            {activeList.category === 'Mercado' && (
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-gold-400" />
                  <span>Sugestões rápidas de mercado:</span>
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {COMMON_MARKET_SUGGESTIONS.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleAddItem(item)}
                      className="text-[11px] font-medium px-3 py-1 rounded-xl bg-dark-950 border border-dark-800 hover:border-gold-400/40 text-slate-300 hover:text-gold-300 whitespace-nowrap transition-all"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add Item Input Form */}
            <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                placeholder="Nome do produto ou item (ex: Azeite Gallo 500ml)..."
                className="flex-1 bg-dark-900 border border-dark-750 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-400 w-full"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  placeholder="Qtd"
                  className="w-16 bg-dark-900 border border-dark-750 rounded-xl px-2 py-2 text-xs text-slate-200 text-center focus:outline-none focus:border-gold-400"
                />

                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="bg-dark-900 border border-dark-750 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-gold-400"
                >
                  <option value="un">un</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="l">L</option>
                  <option value="pct">pct</option>
                  <option value="cx">cx</option>
                </select>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="R$ Est."
                  className="w-24 bg-dark-900 border border-dark-750 rounded-xl px-2 py-2 text-xs text-slate-200 text-right focus:outline-none focus:border-gold-400 font-bold text-amber-400"
                />

                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="px-4 py-2 rounded-xl bg-gold-400 hover:bg-gold-300 text-dark-950 font-black text-xs shrink-0 transition-all shadow-gold-glow"
                >
                  + Adicionar
                </button>
              </div>
            </div>

            {/* Checklist of Items */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
                Itens da Lista ({activeList.items.length})
              </h3>

              {activeList.items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-dark-800 rounded-2xl bg-dark-950/40">
                  Nenhum item na lista ainda. Use o campo acima para adicionar itens ou clique nas sugestões rápidas.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {activeList.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`
                        flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none
                        ${item.is_purchased 
                          ? 'bg-dark-950/40 border-dark-850 opacity-60' 
                          : 'bg-dark-950 border-dark-800 hover:border-gold-400/40 hover:bg-dark-900/60'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-slate-400 hover:text-gold-400"
                        >
                          {item.is_purchased ? (
                            <CheckSquare size={18} className="text-emerald-400" />
                          ) : (
                            <Square size={18} className="text-slate-500" />
                          )}
                        </button>
                        <div>
                          <p className={`text-xs font-semibold ${item.is_purchased ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.estimated_price && (
                          <span className={`text-xs font-bold ${item.is_purchased ? 'text-slate-500' : 'text-amber-400'}`}>
                            {formatCurrency(item.estimated_price * item.quantity)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* New List Modal */}
      {isNewListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Nova Lista de Compras</h3>
            <p className="text-xs text-slate-400 mb-4">Crie uma lista para supermercado, casa ou projetos</p>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome da Lista
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Ex: Supermercado Semanal, Reforma Sala"
                  required
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Categoria
                </label>
                <select
                  value={newListCategory}
                  onChange={(e) => setNewListCategory(e.target.value as any)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-400"
                >
                  <option value="Mercado">Mercado & Alimentação</option>
                  <option value="Casa">Casa & Utilidades</option>
                  <option value="Construção">Construção & Reforma</option>
                  <option value="Farmácia">Farmácia & Saúde</option>
                  <option value="Escritório">Escritório & Trabalho</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewListModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gold-400 text-dark-950 font-black text-xs hover:bg-gold-300 shadow-gold-glow"
                >
                  Criar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Launch Expense Modal */}
      {isLaunchModalOpen && activeList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Finalizar Compra e Lançar no Fluxo</h3>
            <p className="text-xs text-slate-400 mb-4">
              Registrar o gasto da lista "{activeList.title}" no seu controle financeiro
            </p>

            <form onSubmit={handleConfirmLaunch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Valor Total da Compra (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={launchAmount}
                  onChange={(e) => setLaunchAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-sm font-bold text-gold-400 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setLaunchPaymentType('account')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border ${
                      launchPaymentType === 'account' ? 'bg-gold-400/20 border-gold-400 text-gold-400' : 'bg-dark-950 border-dark-800 text-slate-400'
                    }`}
                  >
                    <Landmark size={14} />
                    <span>Conta Bancária</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaunchPaymentType('card')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border ${
                      launchPaymentType === 'card' ? 'bg-gold-400/20 border-gold-400 text-gold-400' : 'bg-dark-950 border-dark-800 text-slate-400'
                    }`}
                  >
                    <CardIcon size={14} />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>

                {launchPaymentType === 'account' ? (
                  <select
                    value={launchAccountId}
                    onChange={(e) => setLaunchAccountId(e.target.value)}
                    className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-400"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Saldo: {formatCurrency(a.balance)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={launchCardId}
                    onChange={(e) => setLaunchCardId(e.target.value)}
                    className="w-full bg-dark-950 border border-dark-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-400"
                  >
                    {cards.length === 0 ? (
                      <option value="">Nenhum cartão cadastrado</option>
                    ) : (
                      cards.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.bank} - Final {c.last_digits || '0000'})
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLaunchModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gold-400 text-dark-950 font-black text-xs hover:bg-gold-300 shadow-gold-glow"
                >
                  Confirmar Lançamento ({formatCurrency(launchAmount)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
