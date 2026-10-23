/**
 * Mercado Pago Client Integration
 * Suporte a PIX Direto dentro do App (com QR Code em tempo real) e Checkout Web por Cartão
 */

const MP_ACCESS_TOKEN = "APP_USR-8673589186123461-082014-4325c7992bf6041ae2e6067dfbc6eeaa-236551533";
export const MP_PUBLIC_KEY = "APP_USR-4a69816c-b010-4e5f-8960-9ecd0dc6b56c";

export interface CreatePaymentChargeParams {
  title: string;
  amount: number;
  customer_name?: string;
  customer_email?: string;
  user_id?: string;
  invoice_id?: string;
}

export interface PaymentChargeResult {
  order_id: string;
  checkout_url: string;
  amount: number;
  title: string;
}

export interface PixPaymentResult {
  payment_id: number | string;
  status: string;
  status_detail?: string;
  amount: number;
  title: string;
  qr_code: string;
  qr_code_base64: string;
  ticket_url?: string;
  date_of_expiration?: string;
  external_reference?: string;
}

/**
 * Cria cobrança PIX nativa com QR Code diretamente na API do Mercado Pago
 */
export async function createPixPayment({
  title,
  amount,
  customer_name,
  customer_email,
  user_id,
  invoice_id,
}: CreatePaymentChargeParams): Promise<PixPaymentResult> {
  // 1. Tenta endpoint serverless Vercel
  try {
    const res = await fetch('/api/create-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        amount,
        customer_name,
        customer_email,
        user_id,
        invoice_id,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.qr_code || data.payment_id) {
        return {
          payment_id: data.payment_id,
          status: data.status,
          status_detail: data.status_detail,
          amount: data.amount,
          title: data.title,
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
          ticket_url: data.ticket_url,
          date_of_expiration: data.date_of_expiration,
          external_reference: data.external_reference,
        };
      }
    }
  } catch (err) {
    console.warn('Endpoint /api/create-pix não respondeu, tentando chamada direta:', err);
  }

  // 2. Fallback direto ao Mercado Pago API
  const fullName = (customer_name || 'Assinante Aura').trim();
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || 'Assinante';
  const lastName = nameParts.slice(1).join(' ') || 'Aura';
  const email = (customer_email || 'assinante@aurafinance.com.br').trim();
  const idempotencyKey = `aura-pix-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      transaction_amount: amount,
      description: title || 'Assinatura Mensal Aura Finance PRO',
      payment_method_id: 'pix',
      payer: {
        email: email,
        first_name: firstName,
        last_name: lastName,
      },
      external_reference: `SUB_${user_id || 'CLIENT'}_${invoice_id || Date.now()}`,
    }),
  });

  if (!mpRes.ok) {
    const errorData = await mpRes.json();
    throw new Error(errorData.message || 'Falha ao gerar PIX com Mercado Pago.');
  }

  const mpData = await mpRes.json();
  const transactionData = mpData.point_of_interaction?.transaction_data;

  return {
    payment_id: mpData.id,
    status: mpData.status,
    status_detail: mpData.status_detail,
    amount: mpData.transaction_amount,
    title: title || 'Assinatura Aura Finance PRO',
    qr_code: transactionData?.qr_code || '',
    qr_code_base64: transactionData?.qr_code_base64 || '',
    ticket_url: transactionData?.ticket_url || '',
    date_of_expiration: mpData.date_of_expiration,
    external_reference: mpData.external_reference,
  };
}

/**
 * Consulta status de pagamento em tempo real
 */
export async function checkPaymentStatus(
  paymentId: string | number,
  userId?: string
): Promise<{ approved: boolean; status: string; detail?: string }> {
  try {
    let url = `/api/check-payment?id=${paymentId}`;
    if (userId) url += `&user_id=${userId}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return {
        approved: Boolean(data.approved || data.status === 'approved'),
        status: data.status,
        detail: data.status_detail,
      };
    }
  } catch (err) {
    // Fallback direto
  }

  // Fallback direto ao Mercado Pago
  try {
    const directRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });

    if (directRes.ok) {
      const data = await directRes.json();
      return {
        approved: data.status === 'approved',
        status: data.status,
        detail: data.status_detail,
      };
    }
  } catch (e) {
    console.error('Erro na checagem direta do Mercado Pago:', e);
  }

  return { approved: false, status: 'pending' };
}

/**
 * Cria preferência de pagamento Web (Cartão de Crédito ou Checkout Externo)
 */
export async function createMercadoPagoCharge({
  title,
  amount,
  customer_name,
  customer_email,
}: CreatePaymentChargeParams): Promise<PaymentChargeResult> {
  try {
    const res = await fetch('/api/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        amount,
        customer_name,
        customer_email: customer_email || 'cliente@aurafinance.com.br',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.checkout_url) {
        return {
          order_id: data.order_id,
          checkout_url: data.checkout_url,
          amount: data.amount,
          title: data.title,
        };
      }
    }
  } catch (err) {
    console.warn('API serverless não respondeu, usando direct checkout:', err);
  }

  const orderId = 'AURA-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
  const host = window.location.origin;

  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          id: orderId,
          title: title || 'Cobrança Financeira',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount,
        },
      ],
      payer: {
        name: customer_name || 'Cliente',
        email: customer_email || 'cliente@aurafinance.com.br',
      },
      back_urls: {
        success: `${host}?status=approved&order=${orderId}`,
        failure: `${host}?status=failure&order=${orderId}`,
        pending: `${host}?status=pending&order=${orderId}`,
      },
      auto_return: 'approved',
      external_reference: orderId,
      statement_descriptor: 'AURA FINANCE',
    }),
  });

  if (!mpResponse.ok) {
    throw new Error('Falha ao comunicar com o Mercado Pago.');
  }

  const mpData = await mpResponse.json();

  return {
    order_id: orderId,
    checkout_url: mpData.init_point,
    amount,
    title,
  };
}
