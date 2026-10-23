/**
 * Vercel Serverless Function: Check Mercado Pago Payment Status
 * Consulta o status em tempo real do pagamento por ID e ativa o usuário no Supabase se aprovado
 */

import { createClient } from '@supabase/supabase-js';

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "APP_USR-8673589186123461-082014-4325c7992bf6041ae2e6067dfbc6eeaa-236551533";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hnfhrjgzeivzrcpumkyk.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZmhyamd6ZWl2enJjcHVta3lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcyODkxNCwiZXhwIjoyMDg4MzA0OTE0fQ.lG8gV39uSSStfgbSUnBJkGogYdn-zYh3ffUdsjj_xWE';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const paymentId = req.query.id || (req.body && req.body.id);
  const userId = req.query.user_id || (req.body && req.body.user_id);

  if (!paymentId) {
    return res.status(400).json({ error: 'ID do pagamento não fornecido.' });
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });

    if (!mpRes.ok) {
      return res.status(400).json({ error: 'Falha ao consultar pagamento no Mercado Pago.' });
    }

    const data = await mpRes.json();
    const isApproved = data.status === 'approved';

    // Se aprovado e tiver userId, atualiza o Supabase automaticamente
    if (isApproved && userId) {
      try {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            plan: 'active',
            subscription_paid_at: new Date().toISOString(),
            last_payment_id: paymentId,
          },
        });
      } catch (errDb) {
        console.warn('Erro ao atualizar metadata do usuário no Supabase:', errDb);
      }
    }

    return res.status(200).json({
      success: true,
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      approved: isApproved,
      amount: data.transaction_amount,
      date_approved: data.date_approved,
      payer_email: data.payer?.email,
      payment_method_id: data.payment_method_id,
    });
  } catch (error) {
    console.error('Erro na checagem de pagamento:', error);
    return res.status(500).json({ error: 'Erro interno ao consultar pagamento.' });
  }
}
