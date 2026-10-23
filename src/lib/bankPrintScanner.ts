import { createWorker } from 'tesseract.js';
import { FinancialAccount } from '../types/financial';

export interface BankPrintAnalysisResult {
  detected: boolean;
  type: 'porquinho' | 'caixinha' | 'reserva' | 'investimento' | 'pix_in' | 'pix_out' | 'saldo';
  title: string;
  amount: number;
  bankName: string;
  category: string;
  suggestedAction: 'create_investment' | 'create_transaction' | 'update_balance';
  confidence: number;
  rawText: string;
  yieldInfo?: string;
}

/**
 * Analyzes a bank screenshot (prints of porquinhos, caixinhas, cofrinhos, PIX, saldos)
 * using Gemini Vision API if key configured, or local Tesseract OCR + Heuristic Financial Parser.
 */
export async function analyzeBankScreenshot(
  file: File | string,
  accounts: FinancialAccount[],
  onProgress?: (msg: string) => void
): Promise<BankPrintAnalysisResult> {
  const geminiApiKey = localStorage.getItem('aura_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;

  if (geminiApiKey && typeof file !== 'string') {
    try {
      onProgress?.('Analisando print bancário com IA multimodal (Gemini Vision)...');
      const geminiResult = await analyzeWithGeminiVision(file, geminiApiKey);
      if (geminiResult) return geminiResult;
    } catch (err) {
      console.warn('Fallback para OCR local de print bancário:', err);
    }
  }

  // Tesseract OCR Fallback
  return analyzeWithOCR(file, onProgress);
}

/**
 * OCR Engine for banking prints
 */
async function analyzeWithOCR(
  file: File | string,
  onProgress?: (msg: string) => void
): Promise<BankPrintAnalysisResult> {
  onProgress?.('Reconhecendo dados do print bancário (OCR)...');

  try {
    const worker = await createWorker('por');
    const ret = await worker.recognize(file);
    await worker.terminate();

    const rawText = ret.data.text || '';
    return parseBankPrintText(rawText);
  } catch (err) {
    console.error('Erro no OCR do print bancário:', err);
    return {
      detected: false,
      type: 'investimento',
      title: 'Reserva Bancária',
      amount: 0,
      bankName: 'Banco',
      category: 'Investimentos',
      suggestedAction: 'create_investment',
      confidence: 0,
      rawText: '',
    };
  }
}

/**
 * High-accuracy Regex & NLP Parser for Brazilian Bank Screens:
 * - Nubank (Caixinhas, Porquinho, Dinheiro Guardado)
 * - Banco Inter (Meu Porquinho, Poupança, CDB)
 * - PicPay (Cofrinho)
 * - BTG Pactual / XP (Investimentos)
 * - Itaú / Bradesco / Santander / Caixa
 * - Comprovantes PIX
 */
export function parseBankPrintText(rawText: string): BankPrintAnalysisResult {
  const lower = rawText.toLowerCase();

  // 1. Detect Bank
  let bankName = 'Banco';
  if (lower.includes('nubank') || lower.includes('nu pagamentos') || lower.includes('nuconta') || lower.includes('roxinho') || lower.includes('caixinha') || lower.includes('guardado')) {
    bankName = 'Nubank';
  } else if (lower.includes('inter') || lower.includes('banco inter')) {
    bankName = 'Banco Inter';
  } else if (lower.includes('picpay')) {
    bankName = 'PicPay';
  } else if (lower.includes('btg') || lower.includes('pactual')) {
    bankName = 'BTG Pactual';
  } else if (lower.includes('xp') || lower.includes('xp investimentos')) {
    bankName = 'XP Investimentos';
  } else if (lower.includes('mercado pago') || lower.includes('mercadopago')) {
    bankName = 'Mercado Pago';
  } else if (lower.includes('itau') || lower.includes('itaú') || lower.includes('iti')) {
    bankName = 'Itaú';
  } else if (lower.includes('bradesco') || lower.includes('next')) {
    bankName = 'Bradesco';
  } else if (lower.includes('santander')) {
    bankName = 'Santander';
  } else if (lower.includes('sicredi')) {
    bankName = 'Sicredi';
  } else if (lower.includes('caixa')) {
    bankName = 'Caixa Econômica';
  } else if (lower.includes('banco do brasil') || lower.includes('bb')) {
    bankName = 'Banco do Brasil';
  }

  // 2. Detect Type of Screen
  const isPorquinho = lower.includes('porquinho') || lower.includes('porco') || lower.includes('cofrinho');
  const isCaixinha = lower.includes('caixinha') || lower.includes('caixinhas') || lower.includes('dinheiro guardado') || lower.includes('guardado');
  const isReserva = lower.includes('reserva') || lower.includes('emergencia') || lower.includes('emergência');
  const isPoupanca = lower.includes('poupança') || lower.includes('poupanca') || lower.includes('cdi') || lower.includes('cdb');
  const isPixIn = lower.includes('pix recebido') || lower.includes('transferência recebida') || lower.includes('você recebeu');
  const isPixOut = lower.includes('pix enviado') || lower.includes('comprovante de transferência') || lower.includes('pagamento efetuado');

  let type: BankPrintAnalysisResult['type'] = 'porquinho';
  let suggestedAction: BankPrintAnalysisResult['suggestedAction'] = 'create_investment';
  let title = `${bankName} - Porquinho / Reserva`;

  if (isPixIn) {
    type = 'pix_in';
    suggestedAction = 'create_transaction';
    title = `PIX Recebido no ${bankName}`;
  } else if (isPixOut) {
    type = 'pix_out';
    suggestedAction = 'create_transaction';
    title = `PIX Enviado pelo ${bankName}`;
  } else if (isCaixinha) {
    type = 'caixinha';
    suggestedAction = 'create_investment';
    title = `Caixinha Reserva - ${bankName}`;
  } else if (isPorquinho) {
    type = 'porquinho';
    suggestedAction = 'create_investment';
    title = `Porquinho / Cofrinho - ${bankName}`;
  } else if (isReserva || isPoupanca) {
    type = 'reserva';
    suggestedAction = 'create_investment';
    title = `Reserva de Emergência - ${bankName}`;
  }

  // 3. Extract Amount
  // Matches: "R$ 45.000,00", "R$ 45000", "45.000,00", "45000"
  const amountRegex = /(?:R\$\s*|BRL\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d+(?:[,\.]\d{2})?|\d+)/g;
  const matches = [...rawText.matchAll(amountRegex)];
  const candidateAmounts: number[] = [];

  for (const match of matches) {
    const rawNum = match[1];
    let val = 0;
    if (rawNum.includes(',') && rawNum.includes('.')) {
      val = parseFloat(rawNum.replace(/\./g, '').replace(',', '.'));
    } else if (rawNum.includes(',')) {
      val = parseFloat(rawNum.replace(',', '.'));
    } else {
      val = parseFloat(rawNum);
    }

    // Ignore obvious dates, years (2024, 2025, 2026), percentages (100) or tiny numbers
    if (val > 10 && val !== 2024 && val !== 2025 && val !== 2026 && val !== 100) {
      candidateAmounts.push(val);
    }
  }

  // Pick the most relevant amount (often the highest or first prominent currency)
  let extractedAmount = 0;
  if (candidateAmounts.length > 0) {
    // Sort by value descending if it's a balance or reserve
    extractedAmount = Math.max(...candidateAmounts);
  }

  // Yield info
  let yieldInfo: string | undefined = undefined;
  if (lower.includes('100%') || lower.includes('cdi')) {
    yieldInfo = 'Rendimento 100% do CDI com liquidez diária';
  } else if (lower.includes('selic')) {
    yieldInfo = 'Indexado à taxa Selic';
  } else if (lower.includes('ipca')) {
    yieldInfo = 'Indexado ao IPCA + taxa fixa';
  }

  return {
    detected: extractedAmount > 0,
    type,
    title,
    amount: extractedAmount,
    bankName,
    category: isPixIn ? 'Vendas & Serviços Prestados' : (isPixOut ? 'Outros' : 'Renda Fixa & Reserva'),
    suggestedAction,
    confidence: extractedAmount > 0 ? 0.95 : 0.4,
    rawText,
    yieldInfo,
  };
}

/**
 * Gemini Vision processing for complex prints
 */
async function analyzeWithGeminiVision(
  file: File,
  apiKey: string
): Promise<BankPrintAnalysisResult | null> {
  const base64Data = await fileToBase64(file);

  const prompt = `Analise este print de tela bancária ou comprovante financeiro (ex: Porquinho do Nubank, Caixinhas, Cofrinho do PicPay, Saldo Inter, Poupança, Investimentos ou Comprovante PIX).
Extraia as informações em formato JSON estrito:
{
  "detected": true,
  "type": "porquinho" | "caixinha" | "reserva" | "investimento" | "pix_in" | "pix_out" | "saldo",
  "title": "Título descritivo (ex: Porquinho Nubank, Caixinha Reserva Inter)",
  "amount": 45000.00,
  "bankName": "Nubank" | "Banco Inter" | "PicPay" | "BTG Pactual" | "Itaú" | "Outro",
  "category": "Renda Fixa & Reserva" ou "Outros",
  "suggestedAction": "create_investment" ou "create_transaction",
  "yieldInfo": "100% do CDI (se houver)",
  "confidence": 0.98
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: file.type || 'image/jpeg',
                  data: base64Data.split(',')[1] || base64Data,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) return null;
  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) return null;

  const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      ...parsed,
      rawText: textResponse,
    };
  }

  return null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
