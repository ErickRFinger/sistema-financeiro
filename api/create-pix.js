/**
 * Vercel Serverless Function: Mercado Pago PIX Payment Creator
 * Cria uma cobrança PIX nativa com QR Code em Base64 e código Copia e Cola
 */

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "APP_USR-8673589186123461-082014-4325c7992bf6041ae2e6067dfbc6eeaa-236551533";

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { 
    amount, 
    title, 
    customer_name, 
    customer_email, 
    user_id, 
    invoice_id 
  } = req.body || {};

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valor da cobrança inválido.' });
  }

  const host = req.headers.origin || `https://${req.headers.host}` || "https://sistema-financeiro-six-self.vercel.app";
  const idempotencyKey = `aura-pix-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Parse first and last name safely
  const fullName = (customer_name || 'Assinante Aura').trim();
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || 'Assinante';
  const lastName = nameParts.slice(1).join(' ') || 'Aura';
  const email = (customer_email || 'assinante@aurafinance.com.br').trim();

  const externalRef = `SUB_${user_id || 'CLIENT'}_${invoice_id || Date.now()}`;

  const payload = {
    transaction_amount: numAmount,
    description: title || 'Assinatura Mensal Aura Finance PRO',
    payment_method_id: 'pix',
    payer: {
      email: email,
      first_name: firstName,
      last_name: lastName,
    },
    external_reference: externalRef,
    notification_url: `${host}/api/mercadopago-webhook`,
  };

  try {
    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error('Mercado Pago PIX Error:', mpData);
      return res.status(400).json({
        error: 'Erro ao gerar PIX com Mercado Pago.',
        details: mpData,
      });
    }

    const transactionData = mpData.point_of_interaction?.transaction_data;

    return res.status(200).json({
      success: true,
      payment_id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail,
      amount: mpData.transaction_amount,
      title: title || 'Assinatura Aura Finance PRO',
      qr_code: transactionData?.qr_code || '',
      qr_code_base64: transactionData?.qr_code_base64 || '',
      ticket_url: transactionData?.ticket_url || '',
      date_of_expiration: mpData.date_of_expiration,
      external_reference: externalRef,
    });
  } catch (error) {
    console.error('Falha geral ao criar PIX:', error);
    return res.status(500).json({ error: 'Erro de comunicação com o Mercado Pago.' });
  }
}
