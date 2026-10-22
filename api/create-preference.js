/**
 * Vercel Serverless Function: Mercado Pago Payment Preference Creator
 * Integração para emissão de cobranças PIX e Cartão de Crédito
 */

export default async function handler(req, res) {
  // CORS configuration
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

  const { title, amount, customer_name, customer_email } = req.body || {};

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valor da cobrança inválido.' });
  }

  const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "APP_USR-8673589186123461-082014-4325c7992bf6041ae2e6067dfbc6eeaa-236551533";
  const orderId = "AURA-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);
  const host = req.headers.origin || `https://${req.headers.host}` || "https://sistema-financeiro-six-self.vercel.app";

  try {
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: [
          {
            id: orderId,
            title: title || "Serviço / Cobrança Financeira",
            description: "Cobrança gerada via Aura Finance Black & Gold",
            quantity: 1,
            currency_id: "BRL",
            unit_price: numAmount
          }
        ],
        payer: {
          name: customer_name || "Cliente",
          email: customer_email || "cliente@aurafinance.com.br"
        },
        back_urls: {
          success: `${host}?status=approved&order=${orderId}`,
          failure: `${host}?status=failure&order=${orderId}`,
          pending: `${host}?status=pending&order=${orderId}`
        },
        auto_return: "approved",
        external_reference: orderId,
        statement_descriptor: "AURA FINANCE"
      })
    });

    const mpData = await mpResponse.json();

    if (mpData && mpData.init_point) {
      return res.status(200).json({
        success: true,
        order_id: orderId,
        checkout_url: mpData.init_point,
        sandbox_url: mpData.sandbox_init_point,
        amount: numAmount,
        title: title || "Cobrança Financeira"
      });
    }

    return res.status(400).json({ 
      error: "Não foi possível gerar preferência no Mercado Pago.",
      details: mpData 
    });

  } catch (error) {
    console.error("Erro Mercado Pago:", error);
    return res.status(500).json({ error: "Erro interno ao processar com Mercado Pago." });
  }
}
