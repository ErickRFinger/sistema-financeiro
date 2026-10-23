import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Trash2,
  Building2,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { FinancialTransaction, FinancialAccount, DEFAULT_CATEGORIES, FinancialCategory } from '../types/financial';
import { formatCurrency } from '../lib/formatters';

export interface BankStatementImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  categories?: FinancialCategory[];
  onImportComplete: (importedTransactions: Omit<FinancialTransaction, 'id'>[]) => Promise<void>;
}

export interface ParsedBankItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  selected: boolean;
}

// Auto-categorizador por palavras-chave brasileiras
const guessCategory = (description: string, type: 'income' | 'expense'): string => {
  const desc = description.toUpperCase();

  if (type === 'income') {
    if (desc.includes('SALARIO') || desc.includes('TED RECEBIDA') || desc.includes('PIX RECEBIDO') || desc.includes('HONORARIOS')) {
      return 'Salários & Pró-labore';
    }
    return 'Vendas & Serviços Prestados';
  }

  if (desc.includes('MERCADO') || desc.includes('SUPERMERCADO') || desc.includes('IFOOD') || desc.includes('PADARIA') || desc.includes('RESTAURANTE') || desc.includes('BURGER') || desc.includes('ACAI')) {
    return 'Alimentação & Refeição';
  }
  if (desc.includes('POSTO') || desc.includes('COMBUSTIVEL') || desc.includes('IPIRANGA') || desc.includes('SHELL') || desc.includes('UBER') || desc.includes('99APP') || desc.includes('ESTACIONAMENTO') || desc.includes('PEDAGIO')) {
    return 'Combustível & Transporte';
  }
  if (desc.includes('NETFLIX') || desc.includes('SPOTIFY') || desc.includes('AMAZON') || desc.includes('APPLE') || desc.includes('INTERNET') || desc.includes('CLARO') || desc.includes('VIVO') || desc.includes('TIM') || desc.includes('GOOGLE')) {
    return 'Serviços & Internet';
  }
  if (desc.includes('ALUGUEL') || desc.includes('CONDOMINIO') || desc.includes('ENEL') || desc.includes('CPFL') || desc.includes('SABESP') || desc.includes('SANEPAR') || desc.includes('LUZ') || desc.includes('AGUA')) {
    return 'Aluguel & Contas Fixas';
  }
  if (desc.includes('FARMACIA') || desc.includes('DROGARIA') || desc.includes('PANVEL') || desc.includes('RAIA') || desc.includes('HOSPITAL') || desc.includes('MEDICO') || desc.includes('LABORATORIO')) {
    return 'Outros';
  }
  if (desc.includes('TRIBUTO') || desc.includes('DARF') || desc.includes('DAS') || desc.includes('IMPOSTO') || desc.includes('TAXA') || desc.includes('IOF')) {
    return 'Impostos & Taxas';
  }

  return 'Outros';
};

export const BankStatementImporterModal: React.FC<BankStatementImporterModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onImportComplete
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => accounts[0]?.id || '');
  const [parsedItems, setParsedItems] = useState<ParsedBankItem[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Processador de OFX (SGML / XML bancário comum brasileiro)
  const parseOFX = (content: string): ParsedBankItem[] => {
    const items: ParsedBankItem[] = [];
    // Divide os blocos de transação <STMTTRN>
    const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = trnRegex.exec(content)) !== null) {
      const block = match[1];

      // Extrai Tipo (DEBIT ou CREDIT)
      const typeMatch = block.match(/<TRNTYPE>([A-Z]+)/i);
      const trnType = typeMatch ? typeMatch[1].toUpperCase() : 'DEBIT';

      // Extrai Data (YYYYMMDD...)
      const dateMatch = block.match(/<DTPOSTED>(\d{4})(\d{2})(\d{2})/);
      let dateStr = new Date().toISOString().split('T')[0];
      if (dateMatch) {
        dateStr = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }

      // Extrai Valor
      const amtMatch = block.match(/<TRNAMT>([-\d.,]+)/);
      let rawAmt = amtMatch ? parseFloat(amtMatch[1].replace(',', '.')) : 0;
      if (isNaN(rawAmt)) rawAmt = 0;

      const isIncome = rawAmt > 0 || trnType === 'CREDIT';
      const absAmount = Math.abs(rawAmt);

      // Extrai Memo / Descrição
      const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i);
      const nameMatch = block.match(/<NAME>([^<\r\n]+)/i);
      const title = (memoMatch ? memoMatch[1] : (nameMatch ? nameMatch[1] : 'Transação Bancária')).trim();

      const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';
      const category = guessCategory(title, type);

      items.push({
        id: `ofx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: dateStr,
        title,
        amount: absAmount,
        type,
        category,
        selected: true
      });
    }

    return items;
  };

  // Processador de CSV (Nubank, Inter, Itaú, Bradesco)
  const parseCSV = (content: string): ParsedBankItem[] => {
    const items: ParsedBankItem[] = [];
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return items;

    // Detecta separador (vírgula ou ponto-e-vírgula)
    const header = lines[0];
    const delimiter = header.includes(';') ? ';' : ',';

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(delimiter).map(cell => cell.replace(/^["']|["']$/g, '').trim());
      if (row.length < 3) continue;

      // Padrões de coluna comuns: [Data, Valor, Identificador, Descrição] ou [Data, Descrição, Valor]
      let dateRaw = row[0];
      let titleRaw = '';
      let amountRaw = 0;

      // Tenta normalizar data (DD/MM/YYYY ou YYYY-MM-DD)
      let dateFormatted = new Date().toISOString().split('T')[0];
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateRaw)) {
        const [d, m, y] = dateRaw.split('/');
        dateFormatted = `${y}-${m}-${d}`;
      } else if (/^\d{4}-\d{2}-\d{2}/.test(dateRaw)) {
        dateFormatted = dateRaw.substring(0, 10);
      }

      // Procura qual coluna tem número de valor
      if (row.length === 3) {
        titleRaw = row[1];
        const valStr = row[2].replace(/\./g, '').replace(',', '.');
        amountRaw = parseFloat(valStr);
      } else {
        // Tenta achar índice numérico
        for (let col = 1; col < row.length; col++) {
          const clean = row[col].replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
          const parsed = parseFloat(clean);
          if (!isNaN(parsed) && /[0-9]/.test(row[col])) {
            amountRaw = parsed;
            // O título costuma ser a outra coluna
            titleRaw = row.filter((_, idx) => idx !== 0 && idx !== col).join(' - ');
            break;
          }
        }
      }

      if (isNaN(amountRaw) || amountRaw === 0) continue;

      const isIncome = amountRaw > 0;
      const absAmount = Math.abs(amountRaw);
      const title = titleRaw || 'Transação Importada';
      const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';
      const category = guessCategory(title, type);

      items.push({
        id: `csv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
        date: dateFormatted,
        title,
        amount: absAmount,
        type,
        category,
        selected: true
      });
    }

    return items;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const ext = file.name.split('.').pop()?.toLowerCase();

        let parsed: ParsedBankItem[] = [];
        if (ext === 'ofx') {
          parsed = parseOFX(text);
        } else {
          parsed = parseCSV(text);
        }

        if (parsed.length === 0) {
          setErrorMsg('Nenhuma movimentação legível foi encontrada no arquivo. Verifique se o extrato é OFX ou CSV padrão.');
        } else {
          setParsedItems(parsed);
        }
      } catch (err) {
        setErrorMsg('Erro ao ler o arquivo. Certifique-se de que é um extrato bancário válido (.ofx ou .csv).');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Falha na leitura física do arquivo.');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleToggleSelectAll = (check: boolean) => {
    setParsedItems(prev => prev.map(item => ({ ...item, selected: check })));
  };

  const handleToggleItem = (id: string) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleCategoryChange = (id: string, newCat: string) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, category: newCat } : item));
  };

  const handleRemoveItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  // Estatísticas das transações lidas
  const selectedCount = parsedItems.filter(i => i.selected).length;
  const totalExpense = useMemo(() => {
    return parsedItems.filter(i => i.selected && i.type === 'expense').reduce((acc, i) => acc + i.amount, 0);
  }, [parsedItems]);

  const totalIncome = useMemo(() => {
    return parsedItems.filter(i => i.selected && i.type === 'income').reduce((acc, i) => acc + i.amount, 0);
  }, [parsedItems]);

  const handleExecuteImport = async () => {
    const toImport = parsedItems.filter(i => i.selected);
    if (toImport.length === 0) return;

    setIsImporting(true);
    try {
      const payload: Omit<FinancialTransaction, 'id' | 'created_at'>[] = toImport.map(item => ({
        title: item.title,
        amount: item.amount,
        type: item.type,
        account_id: selectedAccountId || accounts[0]?.id || '',
        category: item.category,
        transaction_date: item.date,
        status: 'paid', // Extratos bancários passados já estão pagos/liquidados
        payment_method: 'Transferência',
        notes: `Importado de extrato bancário (${fileName})`
      }));

      await onImportComplete(payload);
      onClose();
    } catch (err) {
      setErrorMsg('Erro ao salvar as transações importadas. Tente novamente.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-dark-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-dark-900 border border-slate-800 shadow-2xl overflow-hidden text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gold-400/10 text-gold-400 border border-gold-400/20">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Importador de Extrato Bancário</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-400 font-extrabold uppercase border border-gold-400/30">
                  OFX & CSV
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Conciliação bancária universal: Nubank, Itaú, Inter, Bradesco, Santander e Caixa.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Upload Box / Drag & Drop */}
          {parsedItems.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gold-400/30 hover:border-gold-400 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-dark-950/40 hover:bg-gold-400/5 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ofx,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-gold-400/10 text-gold-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                Clique para selecionar seu arquivo de Extrato
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Aceita arquivos padrão <strong>.OFX</strong> (Internet Banking) ou planilhas <strong>.CSV</strong>.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-500">
                <Sparkles size={13} className="text-gold-400" />
                <span>Auto-categorização com IA e detecção de sinais (+ receitas / - despesas)</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Barra de Controles e Conta de Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-dark-950 border border-dark-800">
                <div className="sm:col-span-6 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Arquivo Carregado:
                  </span>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-gold-400 shrink-0" />
                    <span className="text-xs font-bold text-white truncate max-w-xs">{fileName}</span>
                    <button
                      onClick={() => { setParsedItems([]); setFileName(''); }}
                      className="text-[10px] text-rose-400 hover:underline ml-2"
                    >
                      Trocar arquivo
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Destinar lançamentos para a Conta:
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-dark-750 text-white text-xs font-semibold focus:border-gold-400 outline-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Saldo: {formatCurrency(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Métricas do Extrato */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Lançamentos</span>
                  <span className="text-sm font-black text-white">{selectedCount} / {parsedItems.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 text-center">
                  <span className="text-[10px] text-emerald-400 block">Entradas / Receitas</span>
                  <span className="text-sm font-black text-emerald-400">+{formatCurrency(totalIncome)}</span>
                </div>
                <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 text-center">
                  <span className="text-[10px] text-rose-400 block">Saídas / Despesas</span>
                  <span className="text-sm font-black text-rose-400">-{formatCurrency(totalExpense)}</span>
                </div>
              </div>

              {/* Tabela de Lançamentos Detectados */}
              <div className="border border-dark-800 rounded-2xl overflow-hidden">
                <div className="p-3 bg-dark-950 border-b border-dark-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSelectAll(true)}
                      className="text-[11px] font-bold text-gold-400 hover:underline"
                    >
                      Selecionar Todas
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={() => handleToggleSelectAll(false)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-white"
                    >
                      Desmarcar Todas
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Revise as categorias antes de confirmar
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-dark-850">
                  {parsedItems.map(item => (
                    <div
                      key={item.id}
                      className={`p-3 flex items-center gap-3 transition-colors ${
                        item.selected ? 'bg-dark-900' : 'bg-dark-950/60 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItem(item.id)}
                        className="w-4 h-4 rounded border-dark-700 text-gold-400 focus:ring-0 cursor-pointer accent-gold-400"
                      />

                      <div className="w-24 text-[11px] font-mono text-slate-400 shrink-0">
                        {item.date}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {item.title}
                        </span>
                      </div>

                      <div className="w-48 shrink-0">
                        <select
                          value={item.category}
                          onChange={e => handleCategoryChange(item.id, e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-dark-950 border border-dark-750 text-slate-200 text-[11px] focus:border-gold-400 outline-none"
                        >
                          {DEFAULT_CATEGORIES.map(cat => (
                            <option key={cat.name} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28 text-right font-black text-xs shrink-0 font-mono">
                        <span className={item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                        title="Descartar item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-dark-800 flex items-center justify-between bg-dark-950">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 font-bold text-xs transition-colors"
          >
            Cancelar
          </button>

          {parsedItems.length > 0 && (
            <button
              onClick={handleExecuteImport}
              disabled={isImporting || selectedCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-black text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                  <span>Importando Lote...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Importar {selectedCount} Lançamentos</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
