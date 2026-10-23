/**
 * Vercel Serverless Function: High-Reliability Financial Data Handler
 * Utiliza o Supabase Service Role para garantir execução 100% confiável de transações,
 * contas bancárias e investimentos sem bloqueios de RLS.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hnfhrjgzeivzrcpumkyk.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZmhyamd6ZWl2enJjcHVta3lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcyODkxNCwiZXhwIjoyMDg4MzA0OTE0fQ.lG8gV39uSSStfgbSUnBJkGogYdn-zYh3ffUdsjj_xWE';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || (req.body && req.body.action);

  try {
    switch (action) {
      // ==========================================
      // 1. CONTAS BANCÁRIAS (ACCOUNTS)
      // ==========================================
      case 'get_accounts': {
        const { data, error } = await supabase
          .from('financial_accounts')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        return res.status(200).json({ success: true, data: data || [] });
      }

      case 'update_account_balance': {
        const { account_id, balance } = req.body;
        const { error } = await supabase
          .from('financial_accounts')
          .update({ balance: Number(balance) })
          .eq('id', account_id);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'reset_all_account_balances': {
        const { error } = await supabase
          .from('financial_accounts')
          .update({ balance: 0.00 })
          .neq('id', 'placeholder_id');

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'create_account': {
        const { account } = req.body;
        const { data, error } = await supabase
          .from('financial_accounts')
          .upsert(account)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ success: true, data });
      }

      // ==========================================
      // 2. TRANSAÇÕES (TRANSACTIONS)
      // ==========================================
      case 'get_transactions': {
        const { data, error } = await supabase
          .from('financial_transactions')
          .select('*')
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ success: true, data: data || [] });
      }

      case 'create_transaction': {
        const { transaction } = req.body;
        const { data, error } = await supabase
          .from('financial_transactions')
          .insert([transaction])
          .select()
          .single();

        if (error) throw error;

        // Atualizar saldo se for status 'paid'
        if (transaction.status === 'paid' && transaction.account_id) {
          const { data: acc } = await supabase
            .from('financial_accounts')
            .select('balance')
            .eq('id', transaction.account_id)
            .single();

          if (acc) {
            const delta = transaction.type === 'income' ? Number(transaction.amount) : -Number(transaction.amount);
            await supabase
              .from('financial_accounts')
              .update({ balance: Number(acc.balance) + delta })
              .eq('id', transaction.account_id);
          }
        }

        return res.status(200).json({ success: true, data });
      }

      case 'update_transaction_status': {
        const { transaction, new_status } = req.body;
        const { error } = await supabase
          .from('financial_transactions')
          .update({ status: new_status })
          .eq('id', transaction.id);

        if (error) throw error;

        // Ajustar saldo se status mudou
        if (transaction.account_id && transaction.status !== new_status) {
          const { data: acc } = await supabase
            .from('financial_accounts')
            .select('balance')
            .eq('id', transaction.account_id)
            .single();

          if (acc) {
            let delta = 0;
            if (new_status === 'paid' && transaction.status !== 'paid') {
              delta = transaction.type === 'income' ? Number(transaction.amount) : -Number(transaction.amount);
            } else if (new_status !== 'paid' && transaction.status === 'paid') {
              delta = transaction.type === 'income' ? -Number(transaction.amount) : Number(transaction.amount);
            }

            if (delta !== 0) {
              await supabase
                .from('financial_accounts')
                .update({ balance: Number(acc.balance) + delta })
                .eq('id', transaction.account_id);
            }
          }
        }

        return res.status(200).json({ success: true });
      }

      case 'delete_transaction': {
        const { transaction } = req.body;
        const { error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', transaction.id);

        if (error) throw error;

        // Reverter saldo se era 'paid'
        if (transaction.status === 'paid' && transaction.account_id) {
          const { data: acc } = await supabase
            .from('financial_accounts')
            .select('balance')
            .eq('id', transaction.account_id)
            .single();

          if (acc) {
            const revertDelta = transaction.type === 'income' ? -Number(transaction.amount) : Number(transaction.amount);
            await supabase
              .from('financial_accounts')
              .update({ balance: Number(acc.balance) + revertDelta })
              .eq('id', transaction.account_id);
          }
        }

        return res.status(200).json({ success: true });
      }

      case 'reset_all_transactions': {
        const { error } = await supabase
          .from('financial_transactions')
          .delete()
          .neq('id', 'placeholder_id');

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'reset_all_investments': {
        const { error } = await supabase
          .from('financial_investments')
          .delete()
          .neq('id', 'placeholder_id');

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      // ==========================================
      // 3. INVESTIMENTOS (INVESTMENTS)
      // ==========================================
      case 'get_investments': {
        const { data, error } = await supabase
          .from('financial_investments')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ success: true, data: data || [] });
      }

      case 'create_investment': {
        const { investment } = req.body;
        const { data, error } = await supabase
          .from('financial_investments')
          .insert([investment])
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ success: true, data });
      }

      case 'delete_investment': {
        const { id } = req.body;
        const { error } = await supabase
          .from('financial_investments')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      case 'reset_all_investments': {
        const { error } = await supabase
          .from('financial_investments')
          .delete()
          .neq('id', 'placeholder_id');

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      // ==========================================
      // 4. ADMIN & GESTÃO SAAS (CLIENTES & PLANOS)
      // ==========================================
      case 'list_users': {
        const { data: listData, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;

        const users = (listData?.users || []).map(u => ({
          id: u.id,
          email: u.email,
          full_name: u.user_metadata?.full_name || 'Usuário',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          plan: u.user_metadata?.plan || (u.email === 'admin@aurafinance.com.br' ? 'lifetime' : 'trial'),
          is_admin: Boolean(u.user_metadata?.is_admin || u.email === 'admin@aurafinance.com.br'),
          trial_days: u.user_metadata?.trial_days || 7,
          trial_start: u.user_metadata?.trial_start || u.created_at,
        }));

        return res.status(200).json({ success: true, data: users });
      }

      case 'update_user_plan': {
        const { user_id, plan, trial_days } = req.body;
        const updates = { plan: plan || 'active' };
        if (trial_days !== undefined) updates.trial_days = trial_days;

        const { data, error } = await supabase.auth.admin.updateUserById(user_id, {
          user_metadata: updates,
        });

        if (error) throw error;
        return res.status(200).json({ success: true, data });
      }

      default:
        return res.status(400).json({ error: `Ação desconhecida: "${action}"` });
    }
  } catch (err) {
    console.error('Erro na API financeira:', err);
    return res.status(500).json({ error: err.message || 'Erro interno na API financeira' });
  }
}
