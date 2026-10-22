import React, { useState, useRef } from 'react';
import { 
  X, 
  ScanLine, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { scanInvoice, ScanProgress } from '../lib/aiScanner';
import { auditSupplierPrices } from '../lib/cfoAdvisor';
import { InvoiceExtractedData, FinancialAccount, FinancialTransaction } from '../types/financial';
import { formatCurrency, formatCNPJ } from '../lib/formatters';
import { uploadReceiptFile } from '../lib/supabase';

interface InvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  transactions?: FinancialTransaction[];
  onConfirmAndCreate: (tx: Omit<FinancialTransaction, 'id' | 'created_at'>) => Promise<void>;
}

export const InvoiceScannerModal: React.FC<InvoiceScannerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions = [],
  onConfirmAndCreate,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [extractedData, setExtractedData] = useState<InvoiceExtractedData | null>(null);
  
  // Editable form fields after extraction
  const [supplierName, setSupplierName] = useState('');
  const [supplierCnpj, setSupplierCnpj] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Outros');
  const [paymentMethod, setPaymentMethod] = useState<any>('PIX');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc_btg');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Supplier audit result in real-time
  const audit = auditSupplierPrices(transactions, supplierName, amount);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg('');
    setExtractedData(null);

    // Create preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }

    // Start AI Scan
    setIsScanning(true);
    try {
      const result = await scanInvoice(file, (p) => setScanProgress(p));
      setExtractedData(result);

      // Prepopulate editable fields
      setSupplierName(result.supplier_name);
      setSupplierCnpj(result.supplier_cnpj);
      setAmount(result.total_amount);
      setDate(result.date);
      setCategory(result.category);
      setPaymentMethod(result.payment_method);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Não foi possível extrair dados automaticamente. Você pode preencher manualmente abaixo.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmLaunch = async () => {
    if (amount <= 0) {
      setErrorMsg('Por favor, informe um valor total válido para a nota.');
      return;
    }

    setIsSubmitting(true);
    try {
      let receiptUrl: string | null = null;
      if (selectedFile) {
        receiptUrl = await uploadReceiptFile(selectedFile);
      }

      await onConfirmAndCreate({
        title: `${supplierName.trim() || 'Nota Fiscal'} [NF]`,
        amount: Number(amount),
        type: 'expense',
        account_id: accountId,
        category,
        transaction_date: date,
        status: 'paid',
        payment_method: paymentMethod,
        receipt_url: receiptUrl,
        supplier_name: supplierName,
        supplier_cnpj: supplierCnpj,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#facc15', '#22c55e', '#ffffff'],
      });

      onClose();
      // Reset
      setSelectedFile(null);
      setExtractedData(null);
      setFilePreview(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao registrar transação no Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-dark-900 border border-gold-400/30 shadow-2xl p-5 sm:p-7 my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-400/20 border border-gold-400/40 flex items-center justify-center text-gold-400">
              <Sparkles size={20} className="animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Leitor Inteligente de NF com IA
              </h2>
              <p className="text-xs text-slate-400">
                Extração automática com auditoria anti-cobrança abusiva de fornecedor
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="mt-5 space-y-5">
          {!selectedFile ? (
            /* Upload & Camera Buttons */
            <div className="flex flex-col gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-dark-750 hover:border-gold-400 rounded-3xl bg-dark-950/60 cursor-pointer transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-dark-850 border border-dark-800 group-hover:border-gold-400 flex items-center justify-center text-slate-400 group-hover:text-gold-400 transition-colors shadow-lg">
                  <Upload size={28} />
                </div>
                <h4 className="mt-3 text-sm font-bold text-slate-200 group-hover:text-gold-400 transition-colors">
                  Arraste ou Selecione o Arquivo da Nota
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos suportados: Imagens (JPG, PNG, WEBP) ou PDF
                </p>
                <span className="mt-4 px-3.5 py-1.5 rounded-full bg-dark-850 text-gold-400 text-xs font-semibold border border-dark-750">
                  Navegar no Computador / Celular
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {/* Direct Camera Button (Mobile/Tablet friendly) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-2xl bg-dark-950 border border-dark-800 hover:border-gold-400 text-slate-200 font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.99]"
              >
                <Camera size={20} className="text-gold-400" />
                <span>Tirar Foto da Nota com a Câmera</span>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
              </button>
            </div>
          ) : (
            /* Scanning Animation or Extracted Results */
            <div className="space-y-4">
              {isScanning ? (
                /* Animated Laser Scanner */
                <div className="relative rounded-2xl bg-dark-950 border border-gold-400/30 p-8 flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
                  {/* Laser Line Animation */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent shadow-gold-glow animate-scan pointer-events-none" />

                  {filePreview ? (
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="max-h-44 rounded-xl opacity-30 object-contain mb-4" 
                    />
                  ) : (
                    <FileText size={48} className="text-gold-400/40 mb-4 animate-pulse" />
                  )}

                  <div className="flex items-center gap-2 text-gold-400 font-bold text-sm">
                    <ScanLine size={20} className="animate-spin" />
                    <span>{scanProgress?.status || 'Processando com IA...'}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-xs bg-dark-850 h-2 rounded-full mt-4 overflow-hidden border border-dark-800">
                    <div 
                      className="bg-gradient-to-r from-gold-500 to-amber-400 h-full transition-all duration-300"
                      style={{ width: `${scanProgress?.progress || 30}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 font-mono">
                    {scanProgress?.progress || 30}% Concluído
                  </span>
                </div>
              ) : (
                /* Extracted Form & Preview */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Document Thumbnail Preview */}
                  <div className="md:col-span-4 flex flex-col gap-2">
                    <div className="p-2 rounded-2xl bg-dark-950 border border-dark-800 flex flex-col items-center justify-center min-h-[170px]">
                      {filePreview ? (
                        <img 
                          src={filePreview} 
                          alt="Nota Fiscal" 
                          className="max-h-44 rounded-xl object-contain" 
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 p-4">
                          <FileText size={40} className="text-gold-400 mb-2" />
                          <span className="text-xs truncate max-w-[140px] text-center font-medium">
                            {selectedFile.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setExtractedData(null);
                      }}
                      className="text-xs text-slate-400 hover:text-gold-400 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-dark-950 border border-dark-800"
                    >
                      <RefreshCw size={12} />
                      <span>Escanear Outra Nota</span>
                    </button>
                  </div>

                  {/* Extracted Fields Form */}
                  <div className="md:col-span-8 space-y-3">
                    <div className="p-3 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-gold-400" />
                        <span className="text-xs font-bold text-gold-300">
                          Dados Fiscais Identificados pela IA
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 font-semibold">
                        {Math.round((extractedData?.confidence || 0.9) * 100)}% Precisão
                      </span>
                    </div>

                    {/* Real-time Supplier Audit Card */}
                    {audit.isAnomaly && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-pulse">
                        <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold uppercase tracking-wide block">Auditoria de Preço Detectada:</span>
                          <span>{audit.alertMessage}</span>
                        </div>
                      </div>
                    )}

                    {/* Valor & Data */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Valor Total da Nota
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-400 font-extrabold text-sm">
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={amount || ''}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            className="w-full pl-9 pr-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-lg font-black text-gold-400 focus:outline-none focus:border-gold-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Data de Emissão
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-gold-400"
                        />
                      </div>
                    </div>

                    {/* Fornecedor / Estabelecimento */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Razão Social / Fornecedor
                      </label>
                      <input
                        type="text"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-gold-400"
                      />
                    </div>

                    {/* CNPJ & Categoria */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          CNPJ do Emissor
                        </label>
                        <input
                          type="text"
                          value={formatCNPJ(supplierCnpj)}
                          onChange={(e) => setSupplierCnpj(e.target.value)}
                          placeholder="00.000.000/0000-00"
                          className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-gold-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Categoria Sugerida
                        </label>
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
                        />
                      </div>
                    </div>

                    {/* Conta e Pagamento */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Debitar da Conta
                        </label>
                        <select
                          value={accountId}
                          onChange={(e) => setAccountId(e.target.value)}
                          className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
                        >
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({formatCurrency(acc.balance)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Forma de Pagamento
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-gold-400"
                        >
                          <option value="PIX">PIX</option>
                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                          <option value="Cartão de Débito">Cartão de Débito</option>
                          <option value="Boleto">Boleto Bancário</option>
                          <option value="Dinheiro">Dinheiro em Espécie</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Confirmation Action */}
          {selectedFile && !isScanning && (
            <div className="pt-2 border-t border-dark-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLaunch}
                disabled={isSubmitting || amount <= 0}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-extrabold text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                    <span>Lançando no Supabase...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Aprovar e Lançar no Financeiro</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
