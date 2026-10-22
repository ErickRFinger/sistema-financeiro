import { createWorker } from 'tesseract.js';
import { InvoiceExtractedData, PaymentMethod, DEFAULT_CATEGORIES } from '../types/financial';
import { parseCurrencyInput } from './formatters';

export interface ScanProgress {
  status: string;
  progress: number;
}

/**
 * Scan an invoice (image or PDF) using Gemini Vision API if key configured,
 * or fallback to high-accuracy Tesseract OCR + Brazilian Fiscal Rules
 */
export async function scanInvoice(
  file: File, 
  onProgress?: (progress: ScanProgress) => void
): Promise<InvoiceExtractedData> {
  const geminiApiKey = localStorage.getItem('aura_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;

  if (geminiApiKey) {
    try {
      onProgress?.({ status: 'Conectando ao modelo de Visão Gemini...', progress: 20 });
      const geminiResult = await scanWithGemini(file, geminiApiKey, onProgress);
      if (geminiResult) {
        return geminiResult;
      }
    } catch (err) {
      console.warn('Falha no Gemini Vision, alternando para OCR inteligente integrado:', err);
    }
  }

  // Fallback / Default engine: Tesseract OCR + Heuristic Parser
  return scanWithOCR(file, onProgress);
}

/**
 * OCR Engine using Tesseract.js with Portuguese recognition
 */
async function scanWithOCR(
  file: File, 
  onProgress?: (progress: ScanProgress) => void
): Promise<InvoiceExtractedData> {
  onProgress?.({ status: 'Inicializando motor OCR de alta precisão...', progress: 15 });

  const worker = await createWorker('por');
  
  onProgress?.({ status: 'Processando imagem e extraindo texto...', progress: 40 });

  const ret = await worker.recognize(file);
  const rawText = ret.data.text;

  onProgress?.({ status: 'Analisando dados fiscais com IA...', progress: 80 });

  await worker.terminate();

  const extracted = parseBrazilianInvoiceText(rawText);
  extracted.raw_text = rawText;
  extracted.receipt_file = file;

  onProgress?.({ status: 'Concluído!', progress: 100 });

  return extracted;
}

/**
 * Scanner with Google Gemini 1.5 / 2.0 Flash Vision
 */
async function scanWithGemini(
  file: File, 
  apiKey: string, 
  onProgress?: (progress: ScanProgress) => void
): Promise<InvoiceExtractedData | null> {
  onProgress?.({ status: 'Codificando documento para análise visual...', progress: 35 });

  const base64Data = await fileToBase64(file);
  const mimeType = file.type || 'image/jpeg';

  const prompt = `Você é um auditor fiscal de elite. Analise esta Nota Fiscal (NF-e, NFC-e, Cupom Fiscal ou DANFE) do Brasil.
Extraia com precisão absoluta os dados no seguinte formato JSON estrito:
{
  "supplier_name": "Razão Social ou Nome Fantasia do Emissor/Loja",
  "supplier_cnpj": "CNPJ com pontos e traço",
  "date": "YYYY-MM-DD",
  "total_amount": 123.45 (número float com ponto decimal),
  "payment_method": "PIX" | "Cartão de Crédito" | "Cartão de Débito" | "Dinheiro" | "Boleto",
  "category": "Alimentação & Refeição" | "Combustível & Transporte" | "Infraestrutura & Ferramentas" | "Equipamentos & Hardware" | "Serviços & Internet" | "Aluguel & Contas Fixas" | "Fornecedores & Peças" | "Outros",
  "access_key": "44 dígitos se houver",
  "items": [
    { "description": "Nome do item", "quantity": 1, "total_price": 10.50 }
  ]
}
Responda APENAS o JSON válido, sem crases markdown adicionais se possível.`;

  onProgress?.({ status: 'Avaliando dados com IA Generativa...', progress: 65 });

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
                  mime_type: mimeType,
                  data: base64Data.split(',')[1] || base64Data,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini HTTP error ${response.status}`);
  }

  const json = await response.json();
  const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) return null;

  // Clean JSON markup
  const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  return {
    supplier_name: parsed.supplier_name || 'Fornecedor Identificado',
    supplier_cnpj: parsed.supplier_cnpj || '',
    date: parsed.date || new Date().toISOString().split('T')[0],
    total_amount: Number(parsed.total_amount) || 0,
    payment_method: (parsed.payment_method || 'PIX') as PaymentMethod,
    category: parsed.category || 'Outros',
    access_key: parsed.access_key || '',
    items: parsed.items || [],
    raw_text: textResponse,
    confidence: 0.95,
    receipt_file: file,
  };
}

/**
 * High-accuracy Regex & Heuristics Parser for Brazilian Invoices
 */
export function parseBrazilianInvoiceText(text: string): InvoiceExtractedData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // 1. Extração de CNPJ
  const cnpjRegex = /\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/;
  const cnpjMatch = text.match(cnpjRegex);
  const supplier_cnpj = cnpjMatch ? cnpjMatch[1].replace(/[^\d]/g, '') : '';

  // 2. Chave de acesso 44 dígitos
  const accessKeyRegex = /(\d{4}\s*){11}/;
  const accessKeyMatch = text.match(accessKeyRegex);
  const access_key = accessKeyMatch ? accessKeyMatch[0].replace(/\s+/g, '') : '';

  // 3. Data de Emissão (DD/MM/YYYY ou YYYY-MM-DD)
  let date = new Date().toISOString().split('T')[0];
  const dateRegex = /\b(0[1-9]|[12][0-9]|3[01])[\/\.-](0[1-9]|1[0-2])[\/\.-](20\d{2})\b/;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  }

  // 4. Valor Total
  let total_amount = 0;
  const totalKeywords = [
    /VALOR\s*TOTAL\s*[:\s]*R?\$?\s*([0-9\.,]+)/i,
    /TOTAL\s*A\s*PAGAR\s*[:\s]*R?\$?\s*([0-9\.,]+)/i,
    /VALOR\s*A\s*PAGAR\s*[:\s]*R?\$?\s*([0-9\.,]+)/i,
    /VALOR\s*L[IÍ]QUIDO\s*[:\s]*R?\$?\s*([0-9\.,]+)/i,
    /TOTAL\s*R?\$?\s*[:\s]*([0-9\.,]+)/i,
    /VLR\s*TOTAL\s*[:\s]*R?\$?\s*([0-9\.,]+)/i,
    /R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/i
  ];

  for (const regex of totalKeywords) {
    const match = text.match(regex);
    if (match && match[1]) {
      const parsedVal = parseCurrencyInput(match[1]);
      if (parsedVal > 0) {
        total_amount = parsedVal;
        break;
      }
    }
  }

  // 5. Nome do Fornecedor / Razão Social
  // Usually in the first 5 lines, ignoring headers like "DANFE", "DOCUMENTO AUXILIAR", "NFC-e"
  const ignoredHeaders = [
    'DANFE', 'DOCUMENTO AUXILIAR', 'NOTA FISCAL', 'CONSUMIDOR ELETRONICA',
    'NFC-E', 'NF-E', 'EXTRATO', 'CUPOM FISCAL', 'RECEITA FEDERAL', 'CNPJ'
  ];

  let supplier_name = 'Fornecedor / Estabelecimento';
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];
    const isIgnored = ignoredHeaders.some(h => line.toUpperCase().includes(h));
    const hasCnpj = cnpjRegex.test(line);
    if (!isIgnored && !hasCnpj && line.length >= 3 && !/^\d+$/.test(line)) {
      supplier_name = line.replace(/[^a-zA-Z0-9\s\.\-&]/g, '').trim();
      break;
    }
  }

  // 6. Forma de Pagamento
  let payment_method: PaymentMethod = 'PIX';
  const upperText = text.toUpperCase();
  if (upperText.includes('CARTAO DE CREDITO') || upperText.includes('CRÉDITO') || upperText.includes('CRED')) {
    payment_method = 'Cartão de Crédito';
  } else if (upperText.includes('CARTAO DE DEBITO') || upperText.includes('DÉBITO') || upperText.includes('DEB')) {
    payment_method = 'Cartão de Débito';
  } else if (upperText.includes('BOLETO')) {
    payment_method = 'Boleto';
  } else if (upperText.includes('DINHEIRO') || upperText.includes('ESPECIE')) {
    payment_method = 'Dinheiro';
  } else if (upperText.includes('TRANSFERENCIA') || upperText.includes('TED') || upperText.includes('DOC')) {
    payment_method = 'Transferência';
  } else if (upperText.includes('PIX')) {
    payment_method = 'PIX';
  }

  // 7. Categoria Inteligente
  const category = detectCategory(upperText, supplier_name);

  // 8. Itens preliminares
  const items: Array<{ description: string; total_price: number }> = [];
  for (const line of lines) {
    if (line.includes('R$') || /\d+,\d{2}/.test(line)) {
      const priceMatch = line.match(/(\d+,\d{2})/);
      if (priceMatch) {
        const val = parseCurrencyInput(priceMatch[1]);
        if (val > 0 && val < total_amount) {
          const desc = line.replace(/(\d+,\d{2})/, '').replace(/R\$/g, '').trim();
          if (desc.length > 2) {
            items.push({ description: desc, total_price: val });
          }
        }
      }
    }
    if (items.length >= 5) break;
  }

  return {
    supplier_name,
    supplier_cnpj,
    access_key,
    date,
    total_amount,
    payment_method,
    category,
    items,
    confidence: total_amount > 0 ? 0.85 : 0.60,
  };
}

/**
 * Intelligent categorization based on Brazilian commerce vocabulary
 */
function detectCategory(text: string, vendor: string): string {
  const combined = `${text} ${vendor}`.toUpperCase();

  if (/POSTO|COMBUSTIVEL|GASOLINA|ETANOL|DIESEL|SHELL|IPIRANGA|PETROBRAS|LUBRIFICANTE|ESTACIONAMENTO|PEDAGIO/.test(combined)) {
    return 'Combustível & Transporte';
  }
  if (/SUPERMERCADO|MERCADO|PADARIA|PANIFICADORA|ACOUGUE|RESTAURANTE|LANCHONETE|BUFFET|CHURRASCARIA|PIZZARIA|IFOOD|CAFE|ALIMENTOS/.test(combined)) {
    return 'Alimentação & Refeição';
  }
  if (/PARAFUSO|BUCHA|FERRAMENTA|CONSTRUCAO|TINTA|MADEIREIRA|ELETRICA|HIDRAULICA|MATERIAL|CONECTOR|ARAME/.test(combined)) {
    return 'Infraestrutura & Ferramentas';
  }
  if (/HIKVISION|INTELBRAS|DVR|CAMERA|SWITCH|ROTEADOR|COMPUTADOR|NOTEBOOK|TECLADO|HARDWARE|INFORMATICA|SERVIDOR/.test(combined)) {
    return 'Equipamentos & Hardware';
  }
  if (/ENEL|COPEL|CEMIG|SANEPAR|SABESP|LUZ|AGUA|ENERGIA|INTERNET|VIVO|CLARO|TIM|ALUGUEL|CONDOMINIO/.test(combined)) {
    return 'Aluguel & Contas Fixas';
  }
  if (/FORNECEDOR|DISTRIBUIDORA|ATACADO|COMERCIAL|IMPORTADORA|PECA|COMPRA/.test(combined)) {
    return 'Fornecedores & Peças';
  }
  if (/GOOGLE|FACEBOOK|META|ANUNCIO|MARKETING|PUBLICIDADE|AGENCIA|DESIGN/.test(combined)) {
    return 'Marketing & Comercial';
  }
  if (/RECEITA FEDERAL|PREFEITURA|SIMPLES NACIONAL|DARF|DAS|IMPOSTO|TAXA/.test(combined)) {
    return 'Impostos & Taxas';
  }

  return 'Outros';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
