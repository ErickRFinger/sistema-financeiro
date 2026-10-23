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
import { TransactionModal } from './components/TransactionModal';
import { InvoiceScannerModal } from './components/InvoiceScannerModal';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { CFOModal } from './components/CFOModal';
import { AIAssistantChat } from './components/AIAssistantChat';
import { AuthModal } from './components/AuthModal';
import { MercadoPagoModal } from './components/MercadoPagoModal';
import { LandingAuthGate } from './components/LandingAuthGate';
import { TrialPaywall } from './components/TrialPaywall';
import { 
  FinancialAccount, 
  FinancialTransaction, 
  TransactionType,
  INITIAL_DEFAULT_ACCOUNTS 
} from './types/financial';
import { 
  supabase,
  getAccounts, 
  getTransactions, 
  createTransaction, 
  updateTransactionStatus, 
  deleteTransaction 
} from './lib/supabase';
import { Sparkles, Zap, ShieldCheck } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [accounts, setAccounts] = useState<FinancialAccount[]>(INITIAL_DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
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

  const isSubscriptionActive = isAdmin || isPaidSubscription || trialDaysRemaining > 0;
  const isTrialExpired = Boolean(currentUser && !isAdmin && !isPaidSubscription && trialDaysRemaining <= 0);

  const handleSubscriptionActivated = () => {
    if (currentUser?.id) {
      localStorage.setItem(`aura_sub_${currentUser.id}`, 'active');
      setCurrentUser({
        ...currentUser,
        user_metadata: { ...currentUser.user_metadata, plan: 'active' },
      });
    }
  };

  // Load data: Admin gets corporate database; Regular users start clean and zeroed!
  const loadData = useCallback(async (user?: any) => {
    const activeUser = user !== undefined ? user : currentUser;
    if (!activeUser) return;

    setLoading(true);
    try {
      const userIsAdmin = Boolean(
        activeUser?.email === 'admin@aurafinance.com.br' || 
        activeUser?.user_metadata?.is_admin === true
      );

      if (userIsAdmin) {
        // Admin views the main accounts & all transactions
        const [accs, txs] = await Promise.all([
          getAccounts(),
          getTransactions(),
        ]);
        setAccounts(accs);
        setTransactions(txs);
      } else {
        // Regular user starts clean and zeroed!
        const userKey = `aura_user_${activeUser.id}`;
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

  const handleClearData = async () => {
    if (confirm('Deseja limpar seus dados e reiniciar zerado?')) {
      if (currentUser?.id) {
        localStorage.removeItem(`aura_user_${currentUser.id}_transactions`);
        localStorage.removeItem(`aura_user_${currentUser.id}_accounts`);
        await loadData(currentUser);
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

  // 3. Paywall: 7-day trial expired and no paid subscription
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

  // 4. Authenticated & Active Dashboard View
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
        onOpenMercadoPago={() => {
          setMpModalMode('subscription');
          setIsMercadoPagoModalOpen(true);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        systemName={systemName}
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
          onOpenMercadoPago={() => {
            setMpModalMode('subscription');
            setIsMercadoPagoModalOpen(true);
          }}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-full overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardPage
              accounts={accounts}
              transactions={transactions}
              onOpenNewTransaction={handleOpenNewTransaction}
              onOpenScanner={() => setIsScannerModalOpen(true)}
              onOpenCFO={() => setIsCFOModalOpen(true)}
              onOpenMercadoPago={() => {
                setMpModalMode('subscription');
                setIsMercadoPagoModalOpen(true);
              }}
              onSelectTransaction={(tx) => setSelectedTransaction(tx)}
              onNavigateToStatement={() => setActiveTab('statement')}
            />
          )}

          {activeTab === 'saas_admin' && (
            <AdminSaasPage />
          )}

          {activeTab === 'statement' && (
            <StatementPage
              transactions={transactions}
              accounts={accounts}
              onSelectTransaction={(tx) => setSelectedTransaction(tx)}
              onOpenNewTransaction={handleOpenNewTransaction}
              onToggleStatus={handleToggleStatus}
              onDeleteTransaction={handleDeleteTransaction}
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
        onClose={() => setIsMercadoPagoModalOpen(false)}
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

      {/* Conversational AI Financial Assistant (Full Control) */}
      <AIAssistantChat
        accounts={accounts}
        transactions={transactions}
        onCreateTransaction={handleCreateTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onUpdateTransactionStatus={handleToggleStatus}
        onResetAllData={handleClearData}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        onOpenCFO={() => setIsCFOModalOpen(true)}
        onOpenMercadoPago={() => {
          setMpModalMode('subscription');
          setIsMercadoPagoModalOpen(true);
        }}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}

export default App;
