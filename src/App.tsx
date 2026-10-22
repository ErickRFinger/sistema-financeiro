import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { StatementPage } from './pages/StatementPage';
import { AccountsPage } from './pages/AccountsPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionModal } from './components/TransactionModal';
import { InvoiceScannerModal } from './components/InvoiceScannerModal';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { CFOModal } from './components/CFOModal';
import { 
  FinancialAccount, 
  FinancialTransaction, 
  TransactionType,
  INITIAL_DEFAULT_ACCOUNTS 
} from './types/financial';
import { 
  getAccounts, 
  getTransactions, 
  createTransaction, 
  updateTransactionStatus, 
  deleteTransaction 
} from './lib/supabase';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [accounts, setAccounts] = useState<FinancialAccount[]>(INITIAL_DEFAULT_ACCOUNTS);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [systemName, setSystemName] = useState<string>('Aura Finance');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>('expense');
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isCFOModalOpen, setIsCFOModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);

  // Load initial data from Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accs, txs] = await Promise.all([
        getAccounts(),
        getTransactions(),
      ]);
      setAccounts(accs);
      setTransactions(txs);
    } catch (err) {
      console.error('Erro ao sincronizar dados com Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem('aura_system_name');
    if (savedName) setSystemName(savedName);

    loadData();
  }, [loadData]);

  // Handle open new transaction modal
  const handleOpenNewTransaction = (type: TransactionType = 'expense') => {
    setTransactionModalType(type);
    setIsTransactionModalOpen(true);
  };

  // Handle create transaction
  const handleCreateTransaction = async (data: Omit<FinancialTransaction, 'id' | 'created_at'>) => {
    const created = await createTransaction(data);
    if (created) {
      await loadData();
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (tx: FinancialTransaction, newStatus: 'paid' | 'pending') => {
    const success = await updateTransactionStatus(tx, newStatus);
    if (success) {
      await loadData();
      if (selectedTransaction?.id === tx.id) {
        setSelectedTransaction({ ...selectedTransaction, status: newStatus });
      }
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (tx: FinancialTransaction) => {
    const success = await deleteTransaction(tx);
    if (success) {
      await loadData();
      setSelectedTransaction(null);
    }
  };

  // Seed demo data for showcase & sales presentation
  const handleSeedDemoData = async () => {
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

    await loadData();
  };

  const handleClearData = async () => {
    // optional
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        accounts={accounts}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        onOpenCFO={() => setIsCFOModalOpen(true)}
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
              onSelectTransaction={(tx) => setSelectedTransaction(tx)}
              onNavigateToStatement={() => setActiveTab('statement')}
            />
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
              onRefreshAccounts={loadData}
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
    </div>
  );
}

export default App;
