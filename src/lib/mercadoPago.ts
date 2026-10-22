/**
 * Mercado Pago Client Integration
 * Permite emitir cobranças por PIX e Link de Pagamento com Cartão
 */

const MP_ACCESS_TOKEN = "APP_USR-8673589186123461-082014-4325c7992bf6041ae2e6067dfbc6eeaa-236551533";
export const MP_PUBLIC_KEY = "APP_USR-4a69816c-b010-4e5f-8960-9ecd0dc6b56c";

export interface CreatePaymentChargeParams {
  title: string;
  amount: number;
  customer_name?: string;
  customer_email?: string;
}

export interface PaymentChargeResult {
  order_id: string;
  checkout_url: string;
  amount: number;
  title: string;
  pix_code?: string;
}

export async function createMercadoPagoCharge({
  title,
  amount,
  customer_name,
  customer_email
}: CreatePaymentChargeParams): Promise<PaymentChargeResult> {
  // First try the Vercel serverless function endpoint
  try {
    const res = await fetch('/api/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        amount,
        customer_name,
        customer_email: customer_email || 'cliente@aurafinance.com.br'
      })
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

  // Direct client-side fallback calling Mercado Pago API
  const orderId = 'AURA-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
  const host = window.location.origin;

  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [
        {
          id: orderId,
          title: title || 'Cobrança Financeira',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount
        }
      ],
      payer: {
        name: customer_name || 'Cliente',
        email: customer_email || 'cliente@aurafinance.com.br'
      },
      back_urls: {
        success: `${host}?status=approved&order=${orderId}`,
        failure: `${host}?status=failure&order=${orderId}`,
        pending: `${host}?status=pending&order=${orderId}`
      },
      auto_return: 'approved',
      external_reference: orderId,
      statement_descriptor: 'AURA FINANCE'
    })
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
