import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { StatementPage } from './pages/StatementPage';
import { AccountsPage } from './pages/AccountsPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminSaasPage } from './pages/AdminSaasPage';
import { CardsPage } from './pages/CardsPage';
import { ShoppingListsPage } from './pages/ShoppingListsPage';
import { SubscriptionInvoicesPage } from './pages/SubscriptionInvoicesPage';
import { TutorialPage } from './pages/TutorialPage';
import { TransactionModal } from './components/TransactionModal';
import { InvoiceScannerModal } from './components/InvoiceScannerModal';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { CFOModal } from './components/CFOModal';
import { AIAssistantChat } from './components/AIAssistantChat';
import { AuthModal } from './components/AuthModal';
import { MercadoPagoModal } from './components/MercadoPagoModal';
import { LandingAuthGate } from './components/LandingAuthGate';
import { TrialPaywall } from './components/TrialPaywall';
import { OverdueLockScreen } from './components/OverdueLockScreen';
import { CommandPalette } from './components/CommandPalette';
import { 
  FinancialAccount, 
  FinancialTransaction, 
  FinancialInvestment,
  TransactionType,
  CreditCard,
  CreditCardExpense,
  ShoppingList,
  SystemSubscriptionInvoice,
  INITIAL_DEFAULT_ACCOUNTS 
} from './types/financial';
import { 
  supabase,
  getAccounts, 
  getTransactions, 
  createTransaction, 
  updateTransactionStatus, 
  deleteTransaction,
  createInvestment,
  updateAccountBalance,
  resetAllAccountBalances,
  resetAllTransactions,
  resetAllInvestments 
} from './lib/supabase';
import { Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { formatCurrency } from './lib/formatters';

// Generate recurring monthly invoices due on day 10 for SaaS subscription
function generateDefaultInvoicesForUser(userId: string, createdAtStr: string): SystemSubscriptionInvoice[] {
  const now = new Date();
  const invoices: SystemSubscriptionInvoice[] = [];

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  for (let offset = -2; offset <= 1; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 10);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    const dueDate = `${monthKey}-10`;

    const paidKey = `aura_invoice_paid_${userId}_${monthKey}`;
    const isPaid = localStorage.getItem(paidKey) === 'paid';

    let status: 'paid' | 'pending' | 'overdue' = 'pending';
    if (isPaid) {
      status = 'paid';
    } else {
      const dueTime = new Date(d.getFullYear(), d.getMonth(), 10, 23, 59, 59).getTime();
      if (now.getTime() > dueTime) {
        status = 'overdue';
      } else {
        status = 'pending';
      }
    }

    invoices.push({
      id: `inv_${userId}_${monthKey}`,
      user_id: userId,
      reference_month: monthKey,
      reference_label: monthLabel,
      due_date: dueDate,
      amount: 9.90,
      status,
      paid_at: isPaid ? 'Pago via Mercado Pago' : undefined,
      payment_method: 'Mercado Pago PIX',
    });
  }

  return invoices;
}

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [accounts, setAccounts] = useState<FinancialAccount[]>(INITIAL_DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [cardExpenses, setCardExpenses] = useState<CreditCardExpense[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [systemInvoices, setSystemInvoices] = useState<SystemSubscriptionInvoice[]>([]);
  const [payingInvoice, setPayingInvoice] = useState<SystemSubscriptionInvoice | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [systemName, setSystemName] = useState<string>('Aura Finance');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>('expense');
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isCFOModalOpen, setIsCFOModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('login');
  const [isMercadoPagoModalOpen, setIsMercadoPagoModalOpen] = useState(false);
  const [mpModalMode, setMpModalMode] = useState<'subscription' | 'custom'>('subscription');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);

  // Privacy Mode (Hide balances with 1-click)
  const [isPrivate, setIsPrivate] = useState<boolean>(() => {
    return localStorage.getItem('aura_privacy_mode') === 'true';
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener for Executive Spotlight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTogglePrivacy = () => {
    setIsPrivate(prev => {
      const next = !prev;
      localStorage.setItem('aura_privacy_mode', String(next));
      return next;
    });
  };

  // Check Supabase Auth state on boot
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      setAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // Determine user permissions & subscription/trial state
  const isAdmin = Boolean(
    currentUser?.email === 'admin@aurafinance.com.br' || 
    currentUser?.user_metadata?.is_admin === true ||
    currentUser?.user_metadata?.role === 'admin'
  );

  // Calculate 7-day trial window
  const userCreatedAt = new Date(currentUser?.created_at || Date.now());
  const trialEndDate = new Date(userCreatedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const remainingTrialMs = trialEndDate.getTime() - Date.now();
  const trialDaysRemaining = Math.max(0, Math.ceil(remainingTrialMs / (24 * 60 * 60 * 1000)));

  // Check if user has active paid subscription
  const isPaidSubscription = Boolean(
    currentUser && (
      localStorage.getItem(`aura_sub_${currentUser.id}`) === 'active' ||
      currentUser.user_metadata?.plan === 'active' ||
      currentUser.user_metadata?.plan === 'lifetime'
    )
  );

  const isTrialExpired = Boolean(currentUser && !isAdmin && !isPaidSubscription && trialDaysRemaining <= 0);

  // Delinquency Lock: after 1 month (30 days) of overdue invoice on day 10
  const isDelinquentLocked = Boolean(
    currentUser &&
    !isAdmin &&
    !isPaidSubscription &&
    systemInvoices.some(inv => {
      if (inv.status !== 'overdue') return false;
      const dueTime = new Date(inv.due_date).getTime();
      const daysLate = (Date.now() - dueTime) / (24 * 60 * 60 * 1000);
      return daysLate > 30;
    })
  );

  const handleSubscriptionActivated = () => {
    if (currentUser?.id) {
      localStorage.setItem(`aura_sub_${currentUser.id}`, 'active');
      
      // If paying a specific monthly invoice, mark it as paid
      if (payingInvoice) {
        localStorage.setItem(`aura_invoice_paid_${currentUser.id}_${payingInvoice.reference_month}`, 'paid');
      }

      const updatedInvoices = systemInvoices.map(inv => {
        if (!payingInvoice || inv.id === payingInvoice.id) {
          return {
            ...inv,
            status: 'paid' as const,
            paid_at: new Date().toLocaleDateString('pt-BR'),
          };
        }
        return inv;
      });

      setSystemInvoices(updatedInvoices);
      localStorage.setItem(`aura_user_${currentUser.id}_system_invoices`, JSON.stringify(updatedInvoices));

      setCurrentUser({
        ...currentUser,
        user_metadata: { ...currentUser.user_metadata, plan: 'active' },
      });
      setPayingInvoice(null);
    }
  };

  // Load data: Admin gets corporate database; Regular users start 100% clean and zeroed!
  const loadData = useCallback(async (user?: any) => {
    const activeUser = user !== undefined ? user : currentUser;
    if (!activeUser) return;

    setLoading(true);
    try {
      const userIsAdmin = Boolean(
        activeUser?.email === 'admin@aurafinance.com.br' || 
        activeUser?.user_metadata?.is_admin === true
      );

      const userKey = `aura_user_${activeUser.id}`;

      if (userIsAdmin) {
        // Admin views the main accounts & all transactions
        const [accs, txs] = await Promise.all([
          getAccounts(),
          getTransactions(),
        ]);
        setAccounts(accs);
        setTransactions(txs);

        // Admin Cards
        const savedCards = localStorage.getItem(`${userKey}_cards`);
        if (savedCards) {
          setCards(JSON.parse(savedCards));
        } else {
          const adminCards: CreditCard[] = [
            {
              id: 'card_xp_admin',
              name: 'XP Visa Infinite',
              bank: 'XP Investimentos',
              color: 'black',
              limit_total: 35000.00,
              closing_day: 25,
              due_day: 10,
              card_brand: 'visa',
              last_digits: '9012'
            }
          ];
          setCards(adminCards);
          localStorage.setItem(`${userKey}_cards`, JSON.stringify(adminCards));
        }

        // Admin Card Expenses
        const savedExpenses = localStorage.getItem(`${userKey}_card_expenses`);
        if (savedExpenses) {
          setCardExpenses(JSON.parse(savedExpenses));
        } else {
          const adminExpenses: CreditCardExpense[] = [
            { 
              id: 'exp_1', 
              card_id: 'card_xp_admin', 
              title: 'Dell Computadores Servidor', 
              amount: 3200.00, 
              date: new Date().toISOString().split('T')[0], 
              category: 'Equipamentos & Hardware', 
              installments_total: 3, 
              installments_current: 1 
            }
          ];
          setCardExpenses(adminExpenses);
          localStorage.setItem(`${userKey}_card_expenses`, JSON.stringify(adminExpenses));
        }

        // Admin Shopping Lists
        const savedLists = localStorage.getItem(`${userKey}_shopping_lists`);
        if (savedLists) {
          setShoppingLists(JSON.parse(savedLists));
        } else {
          const adminLists: ShoppingList[] = [
            { 
              id: 'list_admin_office', 
              title: 'Insumos Escritório & Café', 
              category: 'Mercado', 
              items: [
                { id: '1', name: 'Café Grão Gourmet 1kg', quantity: 2, unit: 'kg', estimated_price: 65.00, is_purchased: true },
                { id: '2', name: 'Papel A4 Chamex', quantity: 5, unit: 'cx', estimated_price: 32.00, is_purchased: false }
              ], 
              is_completed: false 
            }
          ];
          setShoppingLists(adminLists);
          localStorage.setItem(`${userKey}_shopping_lists`, JSON.stringify(adminLists));
        }

        // Admin System Invoices
        const defaultInvoices = generateDefaultInvoicesForUser(activeUser.id, activeUser.created_at);
        setSystemInvoices(defaultInvoices);

      } else {
        // Regular user starts clean and zeroed!
        const savedAccs = localStorage.getItem(`${userKey}_accounts`);
        const savedTxs = localStorage.getItem(`${userKey}_transactions`);

        if (savedAccs) {
          setAccounts(JSON.parse(savedAccs));
        } else {
          // Zero balance initial accounts
          const zeroed: FinancialAccount[] = [
            { id: `acc_btg_${activeUser.id.substring(0, 8)}`, name: 'BTG Pactual', color: '#facc15', balance: 0.00 },
            { id: `acc_inter_${activeUser.id.substring(0, 8)}`, name: 'Banco Inter', color: '#f97316', balance: 0.00 },
            { id: `acc_sicredi_${activeUser.id.substring(0, 8)}`, name: 'Sicredi', color: '#10b981', balance: 0.00 },
            { id: `acc_mp_${activeUser.id.substring(0, 8)}`, name: 'Mercado Pago', color: '#06b6d4', balance: 0.00 },
          ];
          setAccounts(zeroed);
          localStorage.setItem(`${userKey}_accounts`, JSON.stringify(zeroed));
        }

        if (savedTxs) {
          setTransactions(JSON.parse(savedTxs));
        } else {
          setTransactions([]);
          localStorage.setItem(`${userKey}_transactions`, JSON.stringify([]));
        }

        // Regular User Cards: starts with []
        const savedCards = localStorage.getItem(`${userKey}_cards`);
        if (savedCards) {
          setCards(JSON.parse(savedCards));
        } else {
          setCards([]);
          localStorage.setItem(`${userKey}_cards`, JSON.stringify([]));
        }

        // Regular User Card Expenses: starts with []
        const savedCardExpenses = localStorage.getItem(`${userKey}_card_expenses`);
        if (savedCardExpenses) {
          setCardExpenses(JSON.parse(savedCardExpenses));
        } else {
          setCardExpenses([]);
          localStorage.setItem(`${userKey}_card_expenses`, JSON.stringify([]));
        }

        // Regular User Shopping Lists: starts with 2 clean default lists
        const savedLists = localStorage.getItem(`${userKey}_shopping_lists`);
        if (savedLists) {
          setShoppingLists(JSON.parse(savedLists));
        } else {
          const defaultLists: ShoppingList[] = [
            { id: `list_mercado_${activeUser.id.substring(0, 6)}`, title: 'Supermercado Semanal', category: 'Mercado', items: [], is_completed: false },
            { id: `list_casa_${activeUser.id.substring(0, 6)}`, title: 'Casa & Utilidades', category: 'Casa', items: [], is_completed: false },
          ];
          setShoppingLists(defaultLists);
          localStorage.setItem(`${userKey}_shopping_lists`, JSON.stringify(defaultLists));
        }

        // Regular User System Invoices (R$ 9,90/mês due on day 10)
        const savedInvoices = localStorage.getItem(`${userKey}_system_invoices`);
        if (savedInvoices) {
          setSystemInvoices(JSON.parse(savedInvoices));
        } else {
          const defaultInvoices = generateDefaultInvoicesForUser(activeUser.id, activeUser.created_at);
          setSystemInvoices(defaultInvoices);
          localStorage.setItem(`${userKey}_system_invoices`, JSON.stringify(defaultInvoices));
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar dados com Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const savedName = localStorage.getItem('aura_system_name');
    if (savedName) setSystemName(savedName);

    if (currentUser) {
      loadData(currentUser);
    }
  }, [currentUser, loadData]);

  // Handle open new transaction modal
  const handleOpenNewTransaction = (type: TransactionType = 'expense') => {
    setTransactionModalType(type);
    setIsTransactionModalOpen(true);
  };

  // Handle create transaction (multi-tenant safe)
  const handleCreateTransaction = async (data: Omit<FinancialTransaction, 'id' | 'created_at'>) => {
    if (isAdmin) {
      const created = await createTransaction(data);
      if (created) {
        setTransactions((prev) => [created, ...prev.filter(t => t.id !== created.id)]);
        await loadData(currentUser);
      }
    } else if (currentUser) {
      const userKey = `aura_user_${currentUser.id}`;
      const newTx: FinancialTransaction = {
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        ...data,
        created_at: new Date().toISOString(),
      };
      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem(`${userKey}_transactions`, JSON.stringify(updatedTxs));

      if (data.status === 'paid' && data.account_id) {
        const delta = data.type === 'income' ? data.amount : -data.amount;
        const updatedAccs = accounts.map(a => a.id === data.account_id ? { ...a, balance: a.balance + delta } : a);
        setAccounts(updatedAccs);
        localStorage.setItem(`${userKey}_accounts`, JSON.stringify(updatedAccs));
      }

      await createTransaction(data);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (tx: FinancialTransaction, newStatus: 'paid' | 'pending') => {
    if (isAdmin) {
      const success = await updateTransactionStatus(tx, newStatus);
      if (success) {
        await loadData(currentUser);
        if (selectedTransaction?.id === tx.id) {
          setSelectedTransaction({ ...selectedTransaction, status: newStatus });
        }
      }
    } else if (currentUser) {
      const userKey = `aura_user_${currentUser.id}`;
      const updatedTxs = transactions.map(t => t.id === tx.id ? { ...t, status: newStatus } : t);
      setTransactions(updatedTxs);
      localStorage.setItem(`${userKey}_transactions`, JSON.stringify(updatedTxs));

      if (tx.account_id && tx.status !== newStatus) {
        let delta = 0;
        if (newStatus === 'paid' && tx.status !== 'paid') {
          delta = tx.type === 'income' ? tx.amount : -tx.amount;
        } else if (newStatus !== 'paid' && tx.status === 'paid') {
          delta = tx.type === 'income' ? -tx.amount : tx.amount;
        }
        if (delta !== 0) {
          const updatedAccs = accounts.map(a => a.id === tx.account_id ? { ...a, balance: a.balance + delta } : a);
          setAccounts(updatedAccs);
          localStorage.setItem(`${userKey}_accounts`, JSON.stringify(updatedAccs));
        }
      }

      if (selectedTransaction?.id === tx.id) {
        setSelectedTransaction({ ...selectedTransaction, status: newStatus });
      }
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (tx: FinancialTransaction) => {
    if (isAdmin) {
      const success = await deleteTransaction(tx);
      if (success) {
        await loadData(currentUser);
        setSelectedTransaction(null);
      }
    } else if (currentUser) {
      const userKey = `aura_user_${currentUser.id}`;
      const updatedTxs = transactions.filter(t => t.id !== tx.id);
      setTransactions(updatedTxs);
      localStorage.setItem(`${userKey}_transactions`, JSON.stringify(updatedTxs));

      if (tx.status === 'paid' && tx.account_id) {
        const revertDelta = tx.type === 'income' ? -tx.amount : tx.amount;
        const updatedAccs = accounts.map(a => a.id === tx.account_id ? { ...a, balance: a.balance + revertDelta } : a);
        setAccounts(updatedAccs);
        localStorage.setItem(`${userKey}_accounts`, JSON.stringify(updatedAccs));
      }
      setSelectedTransaction(null);
    }
  };

  // Card Handlers
  const handleSaveCard = (cardData: Omit<CreditCard, 'id' | 'created_at'>) => {
    if (!currentUser) return;
    const newCard: CreditCard = {
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...cardData,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
    };
    const updated = [...cards, newCard];
    setCards(updated);
    localStorage.setItem(`aura_user_${currentUser.id}_cards`, JSON.stringify(updated));
  };

  const handleUpdateCard = (id: string, updates: Partial<CreditCard>) => {
    if (!currentUser) return;
    const updated = cards.map(c => c.id === id ? { ...c, ...updates } : c);
    setCards(updated);
    localStorage.setItem(`aura_user_${currentUser.id}_cards`, JSON.stringify(updated));
  };

  const handleDeleteCard = (id: string) => {
    if (!currentUser) return;
    const updated = cards.filter(c => c.id !== id);
    setCards(updated);
    localStorage.setItem(`aura_user_${currentUser.id}_cards`, JSON.stringify(updated));
  };

  const handleAddCardExpense = (expenseData: Omit<CreditCardExpense, 'id' | 'created_at'>) => {
    if (!currentUser) return;
    const newExpense: CreditCardExpense = {
      id: `card_exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...expenseData,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
    };
    const updated = [newExpense, ...cardExpenses];
    setCardExpenses(updated);
    localStorage.setItem(`aura_user_${currentUser.id}_card_expenses`, JSON.stringify(updated));
  };

  const handleDeleteCardExpense = (expenseId: string) => {
    if (!currentUser) return;
    const updated = cardExpenses.filter(e => e.id !== expenseId);
    setCardExpenses(updated);
    localStorage.setItem(`aura_user_${currentUser.id}_card_expenses`, JSON.stringify(updated));
  };

  const handlePayCardInvoice = async (cardId: string, accountId: string, amount: number) => {
    if (!currentUser) return;
    const card = cards.find(c => c.id === cardId);
    const cardName = card ? card.name : 'Cartão de Crédito';

    // Debit from bank account
    await handleCreateTransaction({
      title: `Pagamento Fatura: ${cardName}`,
      amount,
      type: 'expense',
      account_id: accountId,
      category: 'Outros',
      transaction_date: new Date().toISOString().split('T')[0],
      status: 'paid',
      payment_method: 'Cartão de Crédito',
      notes: `Quitação da fatura do cartão ${cardName}`,
    });

    // Clear card expenses for this card
    const remaining = cardExpenses.filter(e => e.card_id !== cardId);
    setCardExpenses(remaining);
    localStorage.setItem(`aura_user_${currentUser.id}_card_expenses`, JSON.stringify(remaining));

    alert(`Fatura de ${formatCurrency(amount)} paga com sucesso! Limite liberado.`);
  };

  const handleImportInvoiceExpenses = (cardId: string, expenses: Omit<CreditCardExpense, 'id' | 'created_at'>[]) => {
    if (!currentUser) return;
    const newItems: CreditCardExpense[] = expenses.map(e => ({
      id: `card_exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...e,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
    }));

    const updated = [...newItems, ...cardExpenses];
    setCardExpenses(updated);
    localStorage.setItem(`aura_user_${currentUser.id}_card_expenses`, JSON.stringify(updated));
  };

  // Shopping List Handlers
  const handleSaveShoppingList = (listData: Omit<ShoppingList, 'id' | 'created_at'>) => {
    if (!currentUser) return;
    const newList: ShoppingList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...listData,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
    };
    const updated = [...shoppingLists, newList];
    setShoppingLists(updated);
    localStorage.setItem(`aura_user_${currentUser.id}_shopping_lists`, JSON.stringify(updated));
  };

  const handleUpdateShoppingList = (id: string, updates: Partial<ShoppingList>) => {
    if (!currentUser) return;
    const updated = shoppingLists.map(l => l.id === id ? { ...l, ...updates } : l);
    setShoppingLists(updated);
    localStorage.setItem(`aura_user_${currentUser.id}_shopping_lists`, JSON.stringify(updated));
  };

  const handleDeleteShoppingList = (id: string) => {
    if (!currentUser) return;
    const updated = shoppingLists.filter(l => l.id !== id);
    setShoppingLists(updated);
    localStorage.setItem(`aura_user_${currentUser.id}_shopping_lists`, JSON.stringify(updated));
  };

  const handleLaunchExpenseFromList = async (data: any) => {
    if (data.card_id) {
      handleAddCardExpense({
        card_id: data.card_id,
        title: data.title,
        amount: data.amount,
        date: data.date,
        category: data.category,
        installments_current: 1,
        installments_total: 1,
      });
    }

    if (data.account_id) {
      await handleCreateTransaction({
        title: data.title,
        amount: data.amount,
        type: 'expense',
        account_id: data.account_id,
        category: data.category,
        transaction_date: data.date,
        status: 'paid',
        notes: data.notes,
      });
    }
  };

  // Investment & Bank Assets Handler (Porquinhos, Caixinhas, Cofrinhos)
  const handleCreateInvestment = async (invData: {
    name: string;
    category: string;
    amount: number;
    bank?: string;
    account_id?: string;
  }) => {
    if (!currentUser) return;

    const today = new Date().toISOString().split('T')[0];
    const userKey = `aura_user_${currentUser.id}`;

    const newInv: FinancialInvestment = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: invData.name,
      category: invData.category || 'Renda Fixa & Reserva',
      account_id: invData.account_id || accounts[0]?.id || 'acc_btg',
      initial_amount: invData.amount,
      current_amount: invData.amount,
      last_updated: today,
      created_at: new Date().toISOString(),
    };

    // Save investment for multi-tenant isolation
    const savedInvestments = localStorage.getItem(`${userKey}_investments`);
    const currentList: FinancialInvestment[] = savedInvestments ? JSON.parse(savedInvestments) : [];
    const updatedList = [newInv, ...currentList];
    localStorage.setItem(`${userKey}_investments`, JSON.stringify(updatedList));

    if (isAdmin) {
      await createInvestment({
        name: invData.name,
        category: invData.category || 'Renda Fixa & Reserva',
        account_id: newInv.account_id,
        initial_amount: invData.amount,
        current_amount: invData.amount,
        last_updated: today,
      });
    }

    // Match or create account so consolidated balance reflects this porquinho/reserva!
    const bankQuery = (invData.bank || '').toLowerCase();
    let targetAcc = accounts.find(a => 
      a.name.toLowerCase().includes(bankQuery) ||
      (bankQuery && bankQuery.includes(a.name.toLowerCase()))
    );

    if (targetAcc) {
      const updatedAccs = accounts.map(a => a.id === targetAcc.id ? { ...a, balance: a.balance + invData.amount } : a);
      setAccounts(updatedAccs);
      localStorage.setItem(`${userKey}_accounts`, JSON.stringify(updatedAccs));
    } else {
      const updatedAccs = accounts.map((a, idx) => idx === 0 ? { ...a, balance: a.balance + invData.amount } : a);
      setAccounts(updatedAccs);
      localStorage.setItem(`${userKey}_accounts`, JSON.stringify(updatedAccs));
    }

    // Record an aporte transaction in the statement
    await handleCreateTransaction({
      title: `Aporte / Reserva: ${invData.name}`,
      amount: invData.amount,
      type: 'income',
      account_id: targetAcc?.id || accounts[0]?.id || 'acc_btg',
      category: 'Vendas & Serviços Prestados',
      transaction_date: today,
      status: 'paid',
      payment_method: 'PIX',
      notes: `Identificado automaticamente por IA através do print bancário (${invData.bank || 'Banco'}).`,
    });
  };

  // System Invoices Handlers
  const handlePaySystemInvoice = (invoice: SystemSubscriptionInvoice) => {
    setPayingInvoice(invoice);
    setMpModalMode('subscription');
    setIsMercadoPagoModalOpen(true);
  };

  // Seed demo data for showcase & sales presentation (Admin only)
  const handleSeedDemoData = async () => {
    if (!isAdmin) {
      alert('Apenas administradores podem carregar dados de demonstração corporativos.');
      return;
    }

    const today = new Date();
    const formatDateStr = (daysAgo: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    const demoItems = [
      {
        title: 'Distribuidora Hikvision - Lote Câmeras IP & DVR',
        amount: 3450.00,
        type: 'expense' as const,
        account_id: 'acc_btg',
        category: 'Equipamentos & Hardware',
        transaction_date: formatDateStr(1),
        status: 'paid' as const,
        payment_method: 'PIX' as const,
      },
      {
        title: 'Recebimento Contrato Manutenção - Cliente Alpha',
        amount: 8900.00,
        type: 'income' as const,
        account_id: 'acc_btg',
        category: 'Vendas & Serviços Prestados',
        transaction_date: formatDateStr(2),
        status: 'paid' as const,
        payment_method: 'PIX' as const,
      },
      {
        title: 'Auto Posto Ipiranga - Abastecimento Frota',
        amount: 380.50,
        type: 'expense' as const,
        account_id: 'acc_inter',
        category: 'Combustível & Transporte',
        transaction_date: formatDateStr(3),
        status: 'paid' as const,
        payment_method: 'Cartão de Crédito' as const,
      },
      {
        title: 'Supermercado Tauste - Insumos e Café Escritório',
        amount: 245.90,
        type: 'expense' as const,
        account_id: 'acc_mp',
        category: 'Alimentação & Refeição',
        transaction_date: formatDateStr(4),
        status: 'paid' as const,
        payment_method: 'Cartão de Débito' as const,
      },
      {
        title: 'Vivo Fibra Dedicada - Internet Escritório',
        amount: 349.90,
        type: 'expense' as const,
        account_id: 'acc_sicredi',
        category: 'Serviços & Internet',
        transaction_date: formatDateStr(6),
        status: 'paid' as const,
        payment_method: 'Boleto' as const,
      },
      {
        title: 'Venda de Licença Software SaaS Anual',
        amount: 4800.00,
        type: 'income' as const,
        account_id: 'acc_inter',
        category: 'Vendas & Serviços Prestados',
        transaction_date: formatDateStr(7),
        status: 'paid' as const,
        payment_method: 'PIX' as const,
      },
      {
        title: 'Fornecedor Ferramentas & Buchas - Obra Predial',
        amount: 620.00,
        type: 'expense' as const,
        account_id: 'acc_btg',
        category: 'Infraestrutura & Ferramentas',
        transaction_date: formatDateStr(10),
        status: 'paid' as const,
        payment_method: 'PIX' as const,
      },
      {
        title: 'Aluguel Sala Comercial & Condomínio',
        amount: 2200.00,
        type: 'expense' as const,
        account_id: 'acc_btg',
        category: 'Aluguel & Contas Fixas',
        transaction_date: formatDateStr(15),
        status: 'pending' as const,
        payment_method: 'Boleto' as const,
      }
    ];

    for (const item of demoItems) {
      await createTransaction(item);
    }

    await loadData(currentUser);
  };

  // Reset all bank accounts balance to R$ 0,00
  const handleResetBankBalances = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        await resetAllAccountBalances();
      }
      const zeroedAccounts = accounts.map(a => ({ ...a, balance: 0.00 }));
      setAccounts(zeroedAccounts);
      if (currentUser?.id) {
        localStorage.setItem(`aura_user_${currentUser.id}_accounts`, JSON.stringify(zeroedAccounts));
      }
      localStorage.setItem('aura_accounts_cache', JSON.stringify(zeroedAccounts));
    } catch (err) {
      console.error('Erro ao zerar saldos bancários:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update specific account balance
  const handleUpdateAccountBalance = async (accountId: string, newBalance: number) => {
    try {
      if (isAdmin) {
        await updateAccountBalance(accountId, newBalance);
      }
      const updatedAccounts = accounts.map(a => a.id === accountId ? { ...a, balance: newBalance } : a);
      setAccounts(updatedAccounts);
      if (currentUser?.id) {
        localStorage.setItem(`aura_user_${currentUser.id}_accounts`, JSON.stringify(updatedAccounts));
      }
      localStorage.setItem('aura_accounts_cache', JSON.stringify(updatedAccounts));
    } catch (err) {
      console.error('Erro ao atualizar saldo da conta:', err);
    }
  };

  // Reset transactions (Extrato)
  const handleResetTransactions = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        await resetAllTransactions();
      }
      setTransactions([]);
      if (currentUser?.id) {
        localStorage.removeItem(`aura_user_${currentUser.id}_transactions`);
      }
    } catch (err) {
      console.error('Erro ao zerar extrato:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset investments
  const handleResetInvestments = async () => {
    try {
      if (isAdmin) {
        await resetAllInvestments();
      }
      if (currentUser?.id) {
        localStorage.removeItem(`aura_user_${currentUser.id}_investments`);
      }
    } catch (err) {
      console.error('Erro ao zerar investimentos:', err);
    }
  };

  const handleClearData = async (skipConfirm = false) => {
    if (skipConfirm || confirm('Deseja limpar seus dados e reiniciar zerado?')) {
      setLoading(true);
      try {
        if (isAdmin) {
          await Promise.all([
            resetAllAccountBalances(),
            resetAllTransactions(),
            resetAllInvestments(),
          ]);
        }
        const zeroedAccounts = accounts.map(a => ({ ...a, balance: 0.00 }));
        setAccounts(zeroedAccounts);
        setTransactions([]);
        setCardExpenses([]);

        if (currentUser?.id) {
          const userKey = `aura_user_${currentUser.id}`;
          localStorage.removeItem(`${userKey}_transactions`);
          localStorage.removeItem(`${userKey}_investments`);
          localStorage.removeItem(`${userKey}_cards`);
          localStorage.removeItem(`${userKey}_card_expenses`);
          localStorage.removeItem(`${userKey}_shopping_lists`);
          localStorage.setItem(`${userKey}_accounts`, JSON.stringify(zeroedAccounts));
        }
        localStorage.setItem('aura_accounts_cache', JSON.stringify(zeroedAccounts));
      } catch (err) {
        console.error('Erro ao limpar dados:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // 1. Initial Loading Screen
  if (authChecking) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gold-400/20 text-gold-400 flex items-center justify-center animate-pulse mb-3">
          <Zap size={28} />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Iniciando Aura Finance PRO...
        </p>
      </div>
    );
  }

  // 2. Auth Gate: User NOT logged in
  if (!currentUser) {
    return (
      <>
        <LandingAuthGate
          onOpenLogin={() => {
            setAuthModalInitialMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenRegister={() => {
            setAuthModalInitialMode('register');
            setIsAuthModalOpen(true);
          }}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
          }}
          onSignOut={handleSignOut}
        />
      </>
    );
  }

  // 3. Delinquency Lock Screen: invoice overdue by > 30 days (1 mês de atraso)
  if (isDelinquentLocked) {
    const overdueInvoice = systemInvoices.find(inv => inv.status === 'overdue');
    return (
      <>
        <OverdueLockScreen
          userEmail={currentUser.email}
          overdueDate={overdueInvoice ? `${overdueInvoice.reference_label} (Dia 10)` : 'Dia 10 do mês'}
          amount={9.90}
          onPayNow={() => {
            if (overdueInvoice) setPayingInvoice(overdueInvoice);
            setMpModalMode('subscription');
            setIsMercadoPagoModalOpen(true);
          }}
          onSignOut={handleSignOut}
        />

        <MercadoPagoModal
          isOpen={isMercadoPagoModalOpen}
          onClose={() => setIsMercadoPagoModalOpen(false)}
          accounts={accounts}
          currentUser={currentUser}
          initialMode="subscription"
          onRegisterIncome={async (tx) => {
            await handleCreateTransaction(tx);
          }}
          onSubscriptionActivated={handleSubscriptionActivated}
        />
      </>
    );
  }

  // 4. Paywall: 7-day trial expired and no paid subscription
  if (isTrialExpired) {
    return (
      <>
        <TrialPaywall
          userEmail={currentUser.email}
          onOpenCheckout={() => {
            setMpModalMode('subscription');
            setIsMercadoPagoModalOpen(true);
          }}
          onSignOut={handleSignOut}
        />

        <MercadoPagoModal
          isOpen={isMercadoPagoModalOpen}
          onClose={() => setIsMercadoPagoModalOpen(false)}
          accounts={accounts}
          currentUser={currentUser}
          initialMode="subscription"
          onRegisterIncome={async (tx) => {
            await handleCreateTransaction(tx);
          }}
          onSubscriptionActivated={handleSubscriptionActivated}
        />
      </>
    );
  }

  // 5. Authenticated & Active Dashboard View
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans">
      {/* 7-Day Free Trial Notice Banner (non-admin, not lifetime) */}
      {!isAdmin && !isPaidSubscription && (
        <div className="bg-gradient-to-r from-amber-500/15 via-gold-400/20 to-amber-500/15 border-b border-gold-400/30 px-4 py-2 text-center text-xs text-gold-300 font-semibold flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-gold-400" />
            <span>Período de Teste Gratuito: <strong>{trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes'}</strong>.</span>
          </span>
          <button
            onClick={() => {
              setMpModalMode('subscription');
              setIsMercadoPagoModalOpen(true);
            }}
            className="px-3 py-1 rounded-xl bg-gold-400 text-dark-950 font-black text-[11px] hover:brightness-110 active:scale-95 transition-all shadow-gold-glow"
          >
            Assinar Plano PRO (R$ 9,90/mês)
          </button>
        </div>
      )}

      {/* Admin Lifetime Badge */}
      {isAdmin && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-1 text-center text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-2">
          <ShieldCheck size={14} />
          <span>Perfil Administrador Master Ativo (Acesso Completo & Vitalício)</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        accounts={accounts}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        onOpenCFO={() => setIsCFOModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        currentUser={currentUser}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        systemName={systemName}
        isPrivate={isPrivate}
        onTogglePrivacy={handleTogglePrivacy}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop/Tablet Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          accounts={accounts}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
          onOpenCFO={() => setIsCFOModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-full overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardPage
              accounts={accounts}
              transactions={transactions}
              currentUser={currentUser}
              isPrivate={isPrivate}
              onOpenNewTransaction={handleOpenNewTransaction}
              onOpenScanner={() => setIsScannerModalOpen(true)}
              onOpenCFO={() => setIsCFOModalOpen(true)}
              onSelectTransaction={(tx: FinancialTransaction) => setSelectedTransaction(tx)}
              onNavigateToStatement={() => setActiveTab('statement')}
              onNavigateToCards={() => setActiveTab('cards')}
              onNavigateToShopping={() => setActiveTab('shopping_lists')}
              onNavigateToTutorial={() => setActiveTab('tutorial')}
              onNavigateToSubscription={() => setActiveTab('subscription_invoices')}
              isPaidSubscription={isPaidSubscription}
              trialDaysRemaining={trialDaysRemaining}
            />
          )}

          {activeTab === 'tutorial' && (
            <TutorialPage
              setActiveTab={setActiveTab}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'cards' && (
            <CardsPage
              cards={cards}
              cardExpenses={cardExpenses}
              accounts={accounts}
              onSaveCard={handleSaveCard}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
              onAddCardExpense={handleAddCardExpense}
              onDeleteCardExpense={handleDeleteCardExpense}
              onPayInvoice={handlePayCardInvoice}
              onImportInvoiceExpenses={handleImportInvoiceExpenses}
            />
          )}

          {activeTab === 'shopping_lists' && (
            <ShoppingListsPage
              lists={shoppingLists}
              accounts={accounts}
              cards={cards}
              onSaveList={handleSaveShoppingList}
              onUpdateList={handleUpdateShoppingList}
              onDeleteList={handleDeleteShoppingList}
              onLaunchExpense={handleLaunchExpenseFromList}
            />
          )}

          {activeTab === 'subscription_invoices' && (
            <SubscriptionInvoicesPage
              currentUser={currentUser}
              isAdmin={isAdmin}
              isPaidSubscription={isPaidSubscription}
              trialDaysRemaining={trialDaysRemaining}
              invoices={systemInvoices}
              onPayInvoice={handlePaySystemInvoice}
            />
          )}

          {activeTab === 'saas_admin' && (
            <AdminSaasPage />
          )}

          {activeTab === 'statement' && (
            <StatementPage
              transactions={transactions}
              accounts={accounts}
              onSelectTransaction={(tx: FinancialTransaction) => setSelectedTransaction(tx)}
              onOpenNewTransaction={handleOpenNewTransaction}
              onToggleStatus={handleToggleStatus}
              onDeleteTransaction={handleDeleteTransaction}
              onImportTransactions={async (importedList) => {
                for (const item of importedList) {
                  await handleCreateTransaction(item);
                }
              }}
            />
          )}

          {activeTab === 'scanner' && (
            <div className="py-6">
              <InvoiceScannerModal
                isOpen={true}
                onClose={() => setActiveTab('dashboard')}
                accounts={accounts}
                transactions={transactions}
                onConfirmAndCreate={async (tx) => {
                  await handleCreateTransaction(tx);
                  setActiveTab('statement');
                }}
              />
            </div>
          )}

          {activeTab === 'accounts' && (
            <AccountsPage
              accounts={accounts}
              onRefreshAccounts={() => loadData(currentUser)}
            />
          )}

          {activeTab === 'investments' && (
            <InvestmentsPage
              accounts={accounts}
              currentUser={currentUser}
              isPrivate={isPrivate}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              systemName={systemName}
              setSystemName={setSystemName}
              onSeedDemoData={handleSeedDemoData}
              onClearData={handleClearData}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Phone & small tablet) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        onOpenNewTransaction={() => handleOpenNewTransaction('expense')}
      />

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleCreateTransaction}
        accounts={accounts}
        initialType={transactionModalType}
      />

      <InvoiceScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        accounts={accounts}
        transactions={transactions}
        onConfirmAndCreate={async (tx) => {
          await handleCreateTransaction(tx);
          setActiveTab('statement');
        }}
      />

      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        accounts={accounts}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteTransaction}
      />

      {/* CFO Virtual Modal */}
      <CFOModal
        isOpen={isCFOModalOpen}
        onClose={() => setIsCFOModalOpen(false)}
        transactions={transactions}
        accounts={accounts}
      />

      {/* Mercado Pago Payment Modal (R$ 9,90/mês ou Custom) */}
      <MercadoPagoModal
        isOpen={isMercadoPagoModalOpen}
        onClose={() => {
          setIsMercadoPagoModalOpen(false);
          setPayingInvoice(null);
        }}
        accounts={accounts}
        currentUser={currentUser}
        initialMode={mpModalMode}
        onRegisterIncome={async (tx) => {
          await handleCreateTransaction(tx);
        }}
        onSubscriptionActivated={handleSubscriptionActivated}
      />

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
        onSignOut={handleSignOut}
      />

      {/* Conversational AI Financial Assistant (Full Control & Bank Prints) */}
      <AIAssistantChat
        accounts={accounts}
        transactions={transactions}
        onCreateTransaction={handleCreateTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onUpdateTransactionStatus={handleToggleStatus}
        onResetBankBalances={handleResetBankBalances}
        onUpdateAccountBalance={handleUpdateAccountBalance}
        onResetTransactions={handleResetTransactions}
        onResetInvestments={handleResetInvestments}
        onResetAllData={handleClearData}
        onCreateInvestment={handleCreateInvestment}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        onOpenCFO={() => setIsCFOModalOpen(true)}
        onOpenMercadoPago={() => {
          setMpModalMode('subscription');
          setIsMercadoPagoModalOpen(true);
        }}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Global Executive Command Palette & Spotlight (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        onOpenCFO={() => setIsCFOModalOpen(true)}
        onTogglePrivacy={handleTogglePrivacy}
        onOpenImporter={() => {
          setActiveTab('statement');
        }}
        transactions={transactions}
        onSelectTransaction={(tx: FinancialTransaction) => setSelectedTransaction(tx)}
        isPrivate={isPrivate}
      />
    </div>
  );
}

export default App;
