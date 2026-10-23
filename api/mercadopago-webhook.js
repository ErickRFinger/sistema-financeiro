/**
 * Vercel Serverless Function: Mercado Pago Webhook / IPN Listener
 * Recebe notificações instantâneas de pagamento (PIX / Cartão) e ativa o usuário no Supabase
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Mercado Pago envia id no query ou no body:
  const paymentId = req.query['data.id'] || req.query.id || req.body?.data?.id || req.body?.id;
  const topic = req.query.topic || req.query.type || req.body?.type;

  if (!paymentId) {
    // Apenas confirma recebimento do webhook ping
    return res.status(200).json({ received: true });
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });

    if (!mpRes.ok) {
      console.warn('Webhook MP: Pagamento não localizado:', paymentId);
      return res.status(200).json({ received: true });
    }

    const payment = await mpRes.json();

    if (payment.status === 'approved') {
      const extRef = payment.external_reference || '';
      console.log('Webhook MP: Pagamento APROVADO!', payment.id, 'Ref:', extRef);

      // Extrai user_id se formato for SUB_userId_invoiceId
      if (extRef.startsWith('SUB_')) {
        const parts = extRef.split('_');
        const userId = parts[1];

        if (userId && userId !== 'CLIENT' && userId !== 'ANON') {
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              plan: 'active',
              subscription_paid_at: new Date().toISOString(),
              last_payment_id: payment.id,
            },
          });
          console.log(`Webhook MP: Usuário ${userId} ativado com sucesso para Plano PRO.`);
        }
      }
    }

    return res.status(200).json({ received: true, status: payment.status });
  } catch (error) {
    console.error('Erro no processamento do webhook MP:', error);
    // Sempre retornar 200 para o Mercado Pago não reenviar em loop
    return res.status(200).json({ received: true, error: error.message });
  }
}
