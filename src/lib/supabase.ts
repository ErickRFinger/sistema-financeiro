import { createClient } from '@supabase/supabase-js';
import { FinancialAccount, FinancialTransaction, FinancialInvestment } from '../types/financial';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hnfhrjgzeivzrcpumkyk.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZmhyamd6ZWl2enJjcHVta3lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3Mjg5MTQsImV4cCI6MjA4ODMwNDkxNH0.qWKErHq6vCPRWdDfrnngY8fPiJ05VR586U0GzZ3vmrI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_BUCKET = 'notas_fiscais';

/**
 * Universal Financial API Caller
 * Tenta executar via Vercel Serverless Function ou dev middleware (com Service Role)
 * para garantir 100% de estabilidade sem bloqueio por Row Level Security (RLS).
 */
async function callFinancialApi(bodyOrQuery: any, method: 'GET' | 'POST' = 'POST'): Promise<any> {
  try {
    let url = '/api/financial';
    let options: RequestInit = {};

    if (method === 'GET') {
      const params = new URLSearchParams(bodyOrQuery).toString();
      url += `?${params}`;
      options = { method: 'GET' };
    } else {
      options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyOrQuery),
      };
    }

    const res = await fetch(url, options);
    if (res.ok) {
      const json = await res.json();
      if (json.success) return json.data !== undefined ? json.data : true;
    }
  } catch (err) {
    // API não respondeu, fallback para client direto
  }
  return null;
}

// Fallback initial accounts if database is empty
export const INITIAL_DEFAULT_ACCOUNTS: FinancialAccount[] = [
  { id: 'acc_btg', name: 'BTG Pactual', color: '#facc15', balance: 5000.0 },
  { id: 'acc_inter', name: 'Banco Inter', color: '#f97316', balance: 3200.0 },
  { id: 'acc_sicredi', name: 'Sicredi', color: '#10b981', balance: 1800.0 },
  { id: 'acc_mp', name: 'Mercado Pago', color: '#06b6d4', balance: 1200.0 },
];

/**
 * Fetch all financial accounts from Supabase
 */
export async function getAccounts(): Promise<FinancialAccount[]> {
  try {
    // 1. Try serverless API first
    const apiData = await callFinancialApi({ action: 'get_accounts' }, 'GET');
    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      const accounts = apiData.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        color: acc.color || '#facc15',
        balance: Number(acc.balance) || 0,
        created_at: acc.created_at,
      }));
      localStorage.setItem('aura_accounts_cache', JSON.stringify(accounts));
      return accounts;
    }

    // 2. Direct Supabase client fallback
    const { data, error } = await supabase
      .from('financial_accounts')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Erro ao carregar contas do Supabase:', error.message);
      const cached = localStorage.getItem('aura_accounts_cache');
      return cached ? JSON.parse(cached) : INITIAL_DEFAULT_ACCOUNTS;
    }

    if (!data || data.length === 0) {
      // Seed default accounts
      await seedInitialAccounts();
      return INITIAL_DEFAULT_ACCOUNTS;
    }

    const accounts = data.map((acc: any) => ({
      id: acc.id,
      name: acc.name,
      color: acc.color || '#facc15',
      balance: Number(acc.balance) || 0,
      created_at: acc.created_at,
    }));

    localStorage.setItem('aura_accounts_cache', JSON.stringify(accounts));
    return accounts;
  } catch (err) {
    console.error('Falha na requisição de contas:', err);
    const cached = localStorage.getItem('aura_accounts_cache');
    return cached ? JSON.parse(cached) : INITIAL_DEFAULT_ACCOUNTS;
  }
}

/**
 * Seed initial accounts into Supabase if none exist
 */
async function seedInitialAccounts() {
  try {
    for (const acc of INITIAL_DEFAULT_ACCOUNTS) {
      await supabase.from('financial_accounts').upsert({
        id: acc.id,
        name: acc.name,
        color: acc.color,
        balance: acc.balance,
      });
    }
  } catch (e) {
    console.error('Erro ao semear contas padrão:', e);
  }
}

/**
 * Update account balance
 */
export async function updateAccountBalance(accountId: string, newBalance: number): Promise<boolean> {
  try {
    const apiRes = await callFinancialApi({
      action: 'update_account_balance',
      account_id: accountId,
      balance: newBalance,
    });
    if (apiRes) return true;

    const { error } = await supabase
      .from('financial_accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erro ao atualizar saldo da conta:', err);
    return false;
  }
}

/**
 * Reset all bank accounts balance to zero
 */
export async function resetAllAccountBalances(): Promise<boolean> {
  try {
    const apiRes = await callFinancialApi({ action: 'reset_all_account_balances' });
    if (apiRes) return true;

    const { error } = await supabase
      .from('financial_accounts')
      .update({ balance: 0.00 })
      .neq('id', 'placeholder_id');

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erro ao zerar saldos das contas:', err);
    return false;
  }
}

/**
 * Reset all transactions in database
 */
export async function resetAllTransactions(): Promise<boolean> {
  try {
    const apiRes = await callFinancialApi({ action: 'reset_all_transactions' });
    if (apiRes) return true;

    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .neq('id', 'placeholder_id');

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erro ao zerar transações:', err);
    return false;
  }
}

/**
 * Reset all investments in database
 */
export async function resetAllInvestments(): Promise<boolean> {
  try {
    const apiRes = await callFinancialApi({ action: 'reset_all_investments' });
    if (apiRes) return true;

    const { error } = await supabase
      .from('financial_investments')
      .delete()
      .neq('id', 'placeholder_id');

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erro ao zerar investimentos:', err);
    return false;
  }
}

/**
 * Fetch financial transactions with optional filter
 */
export async function getTransactions(): Promise<FinancialTransaction[]> {
  try {
    // 1. Try serverless API first
    const apiData = await callFinancialApi({ action: 'get_transactions' }, 'GET');
    const rawList = (apiData && Array.isArray(apiData)) ? apiData : null;

    let sourceData = rawList;
    if (!sourceData) {
      // 2. Direct Supabase client fallback
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao carregar transações do Supabase:', error.message);
        const cached = localStorage.getItem('aura_transactions_cache');
        return cached ? JSON.parse(cached) : [];
      }
      sourceData = data || [];
    }

    const transactions: FinancialTransaction[] = sourceData.map((t: any) => {
      // Extract optional metadata encoded in title or notes
      let cleanTitle = t.title || 'Sem descrição';
      let receipt_url: string | null = null;
      let payment_method: any = 'PIX';
      let supplier_name: string | undefined = undefined;

      // Extract metadata tag if present [META:{...}] or [NF:...]
      if (cleanTitle.includes('[NF:')) {
        const match = cleanTitle.match(/\[NF:\s*([^\]]+)\]/);
        if (match) {
          receipt_url = match[1];
          cleanTitle = cleanTitle.replace(/\[NF:\s*([^\]]+)\]/, '').trim();
        }
      }
      if (cleanTitle.includes('[METODO:')) {
        const match = cleanTitle.match(/\[METODO:\s*([^\]]+)\]/);
        if (match) {
          payment_method = match[1];
          cleanTitle = cleanTitle.replace(/\[METODO:\s*([^\]]+)\]/, '').trim();
        }
      }
      if (cleanTitle.includes('[FORNECEDOR:')) {
        const match = cleanTitle.match(/\[FORNECEDOR:\s*([^\]]+)\]/);
        if (match) {
          supplier_name = match[1];
          cleanTitle = cleanTitle.replace(/\[FORNECEDOR:\s*([^\]]+)\]/, '').trim();
        }
      }

      return {
        id: t.id,
        title: cleanTitle,
        amount: Number(t.amount) || 0,
        type: (t.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
        account_id: t.account_id || 'acc_btg',
        category: t.category || 'Outros',
        transaction_date: t.transaction_date || new Date().toISOString().split('T')[0],
        status: (t.status || 'paid') as any,
        created_at: t.created_at,
        receipt_url,
        payment_method,
        supplier_name,
      };
    });

    localStorage.setItem('aura_transactions_cache', JSON.stringify(transactions));
    return transactions;
  } catch (err) {
    console.error('Falha na requisição de transações:', err);
    const cached = localStorage.getItem('aura_transactions_cache');
    return cached ? JSON.parse(cached) : [];
  }
}

/**
 * Create a new transaction in Supabase with auto-sanitization
 */
export async function createTransaction(tx: Omit<FinancialTransaction, 'id' | 'created_at'>): Promise<FinancialTransaction | null> {
  try {
    const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    
    // 1. Sanitize & Normalize Type (MUST be 'income' or 'expense' due to database check constraint)
    const rawType = String(tx.type || '').toLowerCase();
    const safeType: 'income' | 'expense' = (
      rawType.includes('receita') || 
      rawType.includes('entrada') || 
      rawType.includes('ganho') || 
      rawType.includes('venda') || 
      rawType === 'income'
    ) ? 'income' : 'expense';

    // 2. Resolve & Validate Account ID (MUST match existing financial_accounts foreign key)
    const accounts = await getAccounts();
    let safeAccountId = tx.account_id;
    const accountExists = accounts.some(a => a.id === safeAccountId);

    if (!accountExists) {
      const lowerReq = String(safeAccountId || '').toLowerCase();
      // Match by account name or keywords
      const matched = accounts.find(a => 
        a.name.toLowerCase().includes(lowerReq) ||
        lowerReq.includes(a.name.toLowerCase())
      );

      if (matched) {
        safeAccountId = matched.id;
      } else if (lowerReq.includes('caixa') || lowerReq.includes('mercado') || lowerReq.includes('carteira')) {
        const mp = accounts.find(a => a.id === 'acc_mp' || a.name.toLowerCase().includes('mercado'));
        safeAccountId = mp ? mp.id : (accounts[0]?.id || 'acc_btg');
      } else if (lowerReq.includes('inter')) {
        const inter = accounts.find(a => a.id === 'acc_inter' || a.name.toLowerCase().includes('inter'));
        safeAccountId = inter ? inter.id : (accounts[0]?.id || 'acc_btg');
      } else if (lowerReq.includes('sicredi')) {
        const sicredi = accounts.find(a => a.id === 'acc_sicredi' || a.name.toLowerCase().includes('sicredi'));
        safeAccountId = sicredi ? sicredi.id : (accounts[0]?.id || 'acc_btg');
      } else {
        safeAccountId = accounts[0]?.id || 'acc_btg';
      }
    }

    // 3. Sanitize Amount (positive number)
    const safeAmount = Math.abs(Number(tx.amount)) || 0;
    if (safeAmount <= 0) {
      console.warn('Valor inválido para transação:', tx.amount);
      return null;
    }

    // 4. Sanitize Date
    let safeDate = tx.transaction_date;
    if (!safeDate || !/^\d{4}-\d{2}-\d{2}$/.test(safeDate)) {
      safeDate = new Date().toISOString().split('T')[0];
    }

    // 5. Sanitize Status
    const safeStatus = (String(tx.status).toLowerCase().includes('pendente') || tx.status === 'pending') 
      ? 'pending' 
      : 'paid';

    // Encode metadata safely into title to preserve full receipt URL & method without schema change
    let fullTitle = (tx.title || (safeType === 'income' ? 'Entrada Caixa' : 'Despesa')).trim();
    if (tx.supplier_name && !fullTitle.toLowerCase().includes(tx.supplier_name.toLowerCase())) {
      fullTitle = `${tx.supplier_name} - ${fullTitle}`;
    }
    if (tx.payment_method) {
      fullTitle += ` [METODO: ${tx.payment_method}]`;
    }
    if (tx.receipt_url) {
      fullTitle += ` [NF: ${tx.receipt_url}]`;
    }

    const payload = {
      id,
      title: fullTitle.slice(0, 200), // Fit column length 200
      amount: safeAmount,
      type: safeType,
      account_id: safeAccountId,
      category: tx.category || (safeType === 'income' ? 'Vendas & Serviços Prestados' : 'Outros'),
      transaction_date: safeDate,
      status: safeStatus,
    };

    // 1. Try serverless API first
    const apiRes = await callFinancialApi({
      action: 'create_transaction',
      transaction: payload,
    });

    if (apiRes) {
      return {
        id,
        ...tx,
        type: safeType,
        account_id: safeAccountId,
        amount: safeAmount,
        status: safeStatus,
        transaction_date: safeDate,
        created_at: new Date().toISOString(),
      };
    }

    // 2. Direct Supabase client fallback
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir transação no Supabase:', error);
      throw error;
    }

    // Update account balance if transaction is marked as paid
    if (safeStatus === 'paid' && safeAccountId) {
      const targetAccount = accounts.find(a => a.id === safeAccountId);
      if (targetAccount) {
        const delta = safeType === 'income' ? safeAmount : -safeAmount;
        const newBalance = targetAccount.balance + delta;
        await updateAccountBalance(safeAccountId, newBalance);
      }
    }

    return {
      id,
      ...tx,
      type: safeType,
      account_id: safeAccountId,
      amount: safeAmount,
      status: safeStatus,
      transaction_date: safeDate,
      created_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Falha geral ao criar transação:', err);
    return null;
  }
}

/**
 * Delete transaction and revert balance impact
 */
export async function deleteTransaction(tx: FinancialTransaction): Promise<boolean> {
  try {
    const apiRes = await callFinancialApi({
      action: 'delete_transaction',
      transaction: tx,
    });
    if (apiRes) return true;

    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', tx.id);

    if (error) throw error;

    // Revert balance if it was paid
    if (tx.status === 'paid' && tx.account_id) {
      const accounts = await getAccounts();
      const targetAccount = accounts.find(a => a.id === tx.account_id);
      if (targetAccount) {
        const revertDelta = tx.type === 'income' ? -tx.amount : tx.amount;
        await updateAccountBalance(tx.account_id, targetAccount.balance + revertDelta);
      }
    }

    return true;
  } catch (err) {
    console.error('Erro ao deletar transação:', err);
    return false;
  }
}

/**
 * Update transaction status (e.g. Paid <-> Pending)
 */
export async function updateTransactionStatus(tx: FinancialTransaction, newStatus: 'paid' | 'pending'): Promise<boolean> {
  try {
    if (tx.status === newStatus) return true;

    const apiRes = await callFinancialApi({
      action: 'update_transaction_status',
      transaction: tx,
      new_status: newStatus,
    });
    if (apiRes) return true;

    const { error } = await supabase
      .from('financial_transactions')
      .update({ status: newStatus })
      .eq('id', tx.id);

    if (error) throw error;

    // Adjust balance
    const accounts = await getAccounts();
    const targetAccount = accounts.find(a => a.id === tx.account_id);
    if (targetAccount) {
      let delta = 0;
      if (newStatus === 'paid' && tx.status !== 'paid') {
        delta = tx.type === 'income' ? tx.amount : -tx.amount;
      } else if (newStatus !== 'paid' && tx.status === 'paid') {
        delta = tx.type === 'income' ? -tx.amount : tx.amount;
      }
      if (delta !== 0) {
        await updateAccountBalance(tx.account_id, targetAccount.balance + delta);
      }
    }

    return true;
  } catch (err) {
    console.error('Erro ao atualizar status da transação:', err);
    return false;
  }
}

/**
 * Upload receipt / invoice to Supabase Storage Bucket 'notas_fiscais'
 */
export async function uploadReceiptFile(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const filePath = `nf_${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Erro ao fazer upload da nota fiscal no Supabase Storage:', uploadError.message);
      // Fallback: create base64 object URL so it still displays and works seamlessly
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return publicData?.publicUrl || null;
  } catch (err) {
    console.error('Falha geral no upload de nota fiscal:', err);
    return null;
  }
}

/**
 * Fetch investments
 */
export async function getInvestments(): Promise<FinancialInvestment[]> {
  try {
    const apiData = await callFinancialApi({ action: 'get_investments' }, 'GET');
    let sourceData = (apiData && Array.isArray(apiData)) ? apiData : null;

    if (!sourceData) {
      const { data, error } = await supabase
        .from('financial_investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar investimentos:', error.message);
        return [];
      }
      sourceData = data || [];
    }

    return sourceData.map((inv: any) => ({
      id: inv.id,
      name: inv.name,
      category: inv.category || 'Renda Fixa',
      account_id: inv.account_id,
      initial_amount: Number(inv.initial_amount) || 0,
      current_amount: Number(inv.current_amount) || 0,
      last_updated: inv.last_updated,
      created_at: inv.created_at,
    }));
  } catch (err) {
    console.error('Falha ao carregar investimentos:', err);
    return [];
  }
}

/**
 * Create a new investment
 */
export async function createInvestment(
  inv: Omit<FinancialInvestment, 'id' | 'created_at'>
): Promise<FinancialInvestment | null> {
  const id = 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const payload = {
    id,
    name: inv.name.trim(),
    category: inv.category || 'Renda Fixa',
    account_id: inv.account_id || 'acc_btg',
    initial_amount: Number(inv.initial_amount) || 0,
    current_amount: Number(inv.current_amount || inv.initial_amount) || 0,
    last_updated: inv.last_updated || new Date().toISOString().split('T')[0],
  };

  try {
    const apiRes = await callFinancialApi({
      action: 'create_investment',
      investment: payload,
    });
    if (apiRes) return { ...payload, created_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from('financial_investments')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Erro ao cadastrar investimento:', err);
    return null;
  }
}

/**
 * Update investment current amount
 */
export async function updateInvestment(id: string, currentAmount: number): Promise<boolean> {
  try {
    const apiRes = await callFinancialApi({
      action: 'update_investment',
      id,
      current_amount: currentAmount,
    });
    if (apiRes) return true;

    const { error } = await supabase
      .from('financial_investments')
      .update({
        current_amount: currentAmount,
        last_updated: new Date().toISOString().split('T')[0],
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erro ao atualizar valor do investimento:', err);
    return false;
  }
}

/**
 * Delete investment
 */
export async function deleteInvestment(id: string): Promise<boolean> {
  try {
    const apiRes = await callFinancialApi({
      action: 'delete_investment',
      id,
    });
    if (apiRes) return true;

    const { error } = await supabase
      .from('financial_investments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Erro ao excluir investimento:', err);
    return false;
  }
}

/**
 * Create or register a new bank account or wallet
 */
export async function createAccount(
  account: Omit<FinancialAccount, 'created_at'>
): Promise<FinancialAccount | null> {
  try {
    const apiRes = await callFinancialApi({
      action: 'create_account',
      account,
    });
    if (apiRes) return apiRes;

    const { data, error } = await supabase
      .from('financial_accounts')
      .upsert(account)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Erro ao cadastrar nova conta:', err);
    return null;
  }
}

/**
 * Fetch all registered SaaS users (Admin only)
 */
export async function getSaasUsers(): Promise<any[]> {
  try {
    const data = await callFinancialApi({ action: 'list_users' }, 'GET');
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Erro ao buscar usuários do SaaS:', err);
    return [];
  }
}

/**
 * Update user subscription plan or trial days (Admin only)
 */
export async function updateUserPlan(userId: string, plan: string, trialDays?: number): Promise<boolean> {
  try {
    const res = await callFinancialApi({
      action: 'update_user_plan',
      user_id: userId,
      plan,
      trial_days: trialDays,
    });
    return Boolean(res);
  } catch (err) {
    console.error('Erro ao atualizar plano do usuário:', err);
    return false;
  }
}
