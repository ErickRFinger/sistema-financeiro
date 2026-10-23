import React, { useState } from 'react';
import { DemoVideoPlayer } from '../components/DemoVideoPlayer';
import { 
  PlayCircle, 
  BookOpen, 
  Sparkles, 
  CreditCard, 
  ShoppingCart, 
  ScanLine, 
  Smartphone, 
  Receipt, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink, 
  Download, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Camera, 
  Copy, 
  Check, 
  ChevronRight,
  Info,
  DollarSign,
  Maximize2,
  MessageSquareCode,
  Lock,
  ArrowRight,
  RefreshCw,
  Trash2,
  Undo2,
  FileText,
  ChevronDown
} from 'lucide-react';

interface TutorialPageProps {
  setActiveTab: (tab: string) => void;
  currentUser?: any;
}

export const TutorialPage: React.FC<TutorialPageProps> = ({ setActiveTab }) => {
  const [activeCategory, setActiveCategory] = useState<
    'video' | 'subscription' | 'ia' | 'cards' | 'shopping' | 'scanner' | 'pwa' | 'investments' | 'cheatsheet' | 'faq'
  >('video');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(text);
    setTimeout(() => setCopiedPrompt(null), 2500);
  };

  const categories = [
    { id: 'video', label: 'Vídeo Demonstrativo', icon: PlayCircle, badge: 'Voz Neural' },
    { id: 'subscription', label: '7 Dias Grátis & R$ 9,90/mês', icon: Receipt, badge: 'Assinatura' },
    { id: 'ia', label: 'IA Completa & Prints de Bancos', icon: Sparkles, badge: 'Porquinhos' },
    { id: 'cards', label: 'Cartões & Scanner de Fatura', icon: CreditCard, badge: 'PDF / Foto' },
    { id: 'shopping', label: 'Listas de Compras', icon: ShoppingCart, badge: 'Mercado' },
    { id: 'scanner', label: 'Leitor de Cupom Fiscal', icon: ScanLine, badge: 'NFC-e' },
    { id: 'pwa', label: 'Como Baixar no Celular', icon: Smartphone, badge: 'PWA' },
    { id: 'investments', label: 'Investimentos & Selic 13,75%', icon: TrendingUp, badge: 'Rentabilidade' },
    { id: 'cheatsheet', label: 'Comandos Prontos da IA', icon: MessageSquareCode, badge: 'Copiar' },
    { id: 'faq', label: 'Perguntas Frequentes', icon: HelpCircle, badge: 'Dúvidas' },
  ];

  const faqList = [
    {
      q: 'Como funciona o período de 7 dias grátis?',
      a: 'Assim que você cadastra sua conta com seu e-mail e senha, o sistema libera automaticamente 7 dias de degustação 100% gratuita. Você tem acesso irrestrito a todas as funções, incluindo IA completa, scanner de notas e leitura de faturas em PDF. Não é exigido cadastrar cartão de crédito para iniciar o teste.'
    },
    {
      q: 'Quanto custa a mensalidade e qual é a data de vencimento?',
      a: 'O sistema custa apenas R$ 9,90 por mês após os 7 dias grátis. A fatura mensal vence sempre no dia 10 de cada mês. O pagamento é realizado de forma instantânea via PIX Copia e Cola do Mercado Pago, com compensação em menos de 10 segundos.'
    },
    {
      q: 'O que acontece se a mensalidade estiver atrasada?',
      a: 'Caso a fatura não seja paga até o dia 10 do mês, o sistema continuará funcionando, porém exibirá um aviso amarelo com status "Em Atraso" na aba Faturas do Sistema. Se o atraso ultrapassar 30 dias (1 mês completo de inadimplência), o sistema ativa uma tela de bloqueio temporário até a quitação via PIX, sendo reativado imediatamente após o pagamento.'
    },
    {
      q: 'Meus dados começam zerados ou misturados com outros usuários?',
      a: 'Isolamento total! O Aura Finance é uma plataforma multi-tenant segura via Supabase. Cada novo usuário começa com patrimônio rigorosamente em R$ 0,00 zerado. Seus lançamentos, extratos, cartões e fotos são 100% privados e nunca são compartilhados com outros usuários ou com o administrador.'
    },
    {
      q: 'Como a IA faz a leitura de fotos de Porquinhos e Caixinhas?',
      a: 'No chat da IA (ícone no canto inferior direito), você pode clicar no botão de anexo ou simplesmente colar com Ctrl+V o print da tela do seu banco (ex: NuBank Porquinho/Caixinha, PicPay Cofrinho, Inter Poupança). A IA analisa a imagem, extrai o valor exato (por exemplo R$ 45.000,00) e lança automaticamente na sua carteira de investimentos e saldo consolidado.'
    },
    {
      q: 'Como peço para a IA zerar ou desfazer lançamentos?',
      a: 'A nossa Inteligência Artificial tem controle operacional real sobre o sistema. Se você disser "Zere todos os lançamentos", ela confirma e limpa o extrato. Se você disser "Desfaça o último lançamento", ela reverte a ação anterior. Você também pode pedir para alterar o valor de compras passadas ou excluir gastos específicos pelo nome.'
    },
    {
      q: 'Como ler faturas completas de cartão de crédito em PDF?',
      a: 'Na aba "Cartões & Faturas", clique no botão "Ler Fatura com IA" no cartão correspondente. Carregue o arquivo PDF emitido pelo seu banco (Nubank, Itaú, Inter, etc.). O motor de OCR reconhece todos os lançamentos, parcelas, datas e valores, gerando uma lista que você importa com apenas 1 clique.'
    },
    {
      q: 'Como instalar o aplicativo no celular sem lojas de apps?',
      a: 'O Aura Finance é um Progressive Web App (PWA). No Android (Google Chrome), toque nos 3 pontinhos do topo e selecione "Instalar aplicativo" ou "Adicionar à tela inicial". No iPhone (Safari), toque no botão Compartilhar (quadrado com seta para cima) e selecione "Adicionar à Tela de Início". O aplicativo abre em tela cheia sem barras de navegador e não ocupa espaço na memória.'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900 border border-gold-400/25 p-5 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gold-400/20 border border-gold-400/30 text-gold-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <BookOpen size={14} className="text-gold-400" />
                Central Oficial de Tutoriais
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Sistema Atualizado
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                7 Dias Grátis • R$ 9,90/mês
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Aprenda a Dominar <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500 bg-clip-text text-transparent">Todas as Funções</span> do Sistema
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Manual completo e material de apoio em alta definição. Assista ao vídeo oficial gravado com locução neural em estúdio, aprenda como a Inteligência Artificial gerencia suas contas, envie prints de bancos (Porquinhos NuBank/PicPay), escaneie faturas em PDF e instale o aplicativo no seu celular.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => setActiveCategory('video')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-gold-400 via-amber-400 to-yellow-500 text-dark-950 font-black text-xs sm:text-sm shadow-gold-glow hover:brightness-110 active:scale-95 transition-all"
            >
              <PlayCircle size={18} className="fill-dark-950 text-gold-400" />
              <span>Assistir Vídeo com Áudio</span>
            </button>
            <button
              onClick={() => setActiveCategory('cheatsheet')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-dark-900 border border-dark-750 text-slate-300 hover:text-white hover:border-gold-400/40 text-xs font-semibold transition-all"
            >
              <MessageSquareCode size={14} className="text-gold-400" />
              <span>Comandos Prontos da IA</span>
            </button>
          </div>
        </div>

        {/* System Plan Rule Notice */}
        <div className="mt-6 pt-5 border-t border-dark-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-dark-950/60 border border-dark-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">7 Dias 100% Grátis</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Todo novo usuário ganha 7 dias sem cobrança com acesso ilimitado.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-dark-950/60 border border-dark-800">
            <div className="w-8 h-8 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center shrink-0">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Apenas R$ 9,90 por Mês</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Vencimento todo dia 10. Valor mínimo e acessível para manter toda a IA ativa.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-dark-950/60 border border-dark-800">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Dados 100% Isolados</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cada usuário começa R$ 0,00 zerado. Seus dados nunca se misturam com ninguém.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Pills (Responsive Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-dark-800">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-gold-500/20 to-amber-500/10 border-gold-400 text-gold-300 shadow-sm'
                  : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-slate-200 hover:border-dark-700'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-gold-400' : 'text-slate-400'} />
              <span>{cat.label}</span>
              {cat.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                  isActive ? 'bg-gold-400/20 text-gold-300' : 'bg-dark-850 text-slate-400'
                }`}>
                  {cat.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Viewports */}
      <div className="space-y-6">

        {/* 1. VÍDEO DEMONSTRATIVO */}
        {activeCategory === 'video' && (
          <div className="space-y-6">
            {/* Native Canvas & Neural Studio Voice Video Player */}
            <DemoVideoPlayer />

            {/* Video Chapters Breakdown */}
            <div className="p-5 sm:p-6 rounded-3xl bg-dark-950 border border-dark-800 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <BookOpen size={15} className="text-gold-400" />
                Roteiro do Vídeo & Capítulos Abordados:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800 hover:border-gold-400/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-gold-400">Capítulo 01</span>
                    <span className="text-[10px] text-slate-400">00:00 - 00:22</span>
                  </div>
                  <p className="text-xs font-bold text-white">Boas-Vindas & Arquitetura SaaS</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Apresentação da interface Cyber Gold, 7 dias grátis e isolamento total de dados para cada novo usuário.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800 hover:border-gold-400/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-gold-400">Capítulo 02</span>
                    <span className="text-[10px] text-slate-400">00:22 - 00:52</span>
                  </div>
                  <p className="text-xs font-bold text-white">IA Completa & OCR de Prints de Banco</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Leitura de fotos de Porquinhos NuBank/PicPay, comandos de voz, "zerar tudo" e reverter ações.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800 hover:border-gold-400/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-gold-400">Capítulo 03</span>
                    <span className="text-[10px] text-slate-400">00:52 - 01:21</span>
                  </div>
                  <p className="text-xs font-bold text-white">Cartões de Crédito & Leitura de Fatura</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cadastro de cartões, controle de limites e leitura inteligente de faturas em PDF ou foto.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800 hover:border-gold-400/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-gold-400">Capítulo 04</span>
                    <span className="text-[10px] text-slate-400">01:21 - 01:46</span>
                  </div>
                  <p className="text-xs font-bold text-white">Listas de Compras Inteligentes</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Crie listas de Mercado/Casa com checklist no carrinho e conversão em despesa com 1 clique.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800 hover:border-gold-400/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-gold-400">Capítulo 05</span>
                    <span className="text-[10px] text-slate-400">01:46 - 02:18</span>
                  </div>
                  <p className="text-xs font-bold text-white">Faturas do Sistema (R$ 9,90/mês)</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Assinatura acessível, vencimento no dia 10, quitação instantânea por PIX e regras de atraso.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800 hover:border-gold-400/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-gold-400">Capítulo 06</span>
                    <span className="text-[10px] text-slate-400">02:18 - 02:45</span>
                  </div>
                  <p className="text-xs font-bold text-white">Instalação no Celular (PWA)</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Como baixar o aplicativo direto no Android ou iPhone sem precisar de loja da Google ou Apple.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ASSINATURA, 7 DIAS GRÁTIS & R$ 9,90 */}
        {activeCategory === 'subscription' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-dark-950 border border-gold-400/30 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-850 pb-5">
                <div>
                  <span className="px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase">
                    Modelo de Assinatura Transparente
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">
                    Como Funciona o Acesso ao Sistema e o Pagamento
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    O sistema é 100% pago, porém com o valor mais democrático do Brasil: 7 dias grátis e depois apenas R$ 9,90 por mês.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('subscription_invoices')}
                  className="px-4 py-2.5 rounded-xl bg-gold-400 text-dark-950 font-black text-xs hover:brightness-110 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-gold-glow"
                >
                  <Receipt size={16} />
                  <span>Ver Minhas Faturas</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 7 Dias Grátis Card */}
                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                    <Sparkles size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white">1. Período de Degustação (7 Dias Grátis)</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Assim que você se cadastra com seu e-mail e senha, o sistema libera <strong>7 dias de acesso total e gratuito</strong>. Você pode testar todas as funções:
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li>Conversar com a Inteligência Artificial e lançar por voz;</li>
                    <li>Enviar fotos de prints bancários e faturas em PDF;</li>
                    <li>Criar listas de compras e gerenciar cartões de crédito;</li>
                    <li>Instalar o aplicativo no celular via PWA.</li>
                  </ul>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                    💡 <strong>Sem Pegadinhas:</strong> Não exigimos cartão de crédito prévio para iniciar os 7 dias grátis.
                  </div>
                </div>

                {/* Mensalidade R$ 9,90 Card */}
                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-400/15 text-gold-400 flex items-center justify-center font-bold">
                    <DollarSign size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white">2. Mensalidade Acessível de R$ 9,90</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Após o período de 7 dias, a continuidade do serviço requer o pagamento de apenas <strong>R$ 9,90 por mês</strong>.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li><strong>Vencimento:</strong> Todo dia 10 de cada mês;</li>
                    <li><strong>Formas de Pagamento:</strong> PIX Instantâneo com QR Code Copia e Cola via Mercado Pago;</li>
                    <li><strong>Liberação:</strong> Confirmação em menos de 10 segundos no sistema.</li>
                  </ul>
                  <div className="p-3 rounded-xl bg-gold-400/10 border border-gold-400/20 text-gold-300 text-xs">
                    🪙 <strong>Valor Simbólico:</strong> Esse valor cobre nossos custos de servidores em nuvem e créditos de Inteligência Artificial para que suas respostas nunca parem.
                  </div>
                </div>

                {/* Regra de Atraso e Bloqueio */}
                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                    <Clock size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white">3. Regras de Vencimento e Atraso</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Você pode acompanhar o status das suas faturas a qualquer momento na aba <strong>"Faturas do Sistema"</strong>:
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li><strong>Até o dia 10:</strong> Status <span className="text-emerald-400 font-bold">Em Aberto</span>;</li>
                    <li><strong>Após o dia 10:</strong> Status muda para <span className="text-amber-400 font-bold">Em Atraso</span> com aviso ao lado da fatura;</li>
                    <li><strong>Mais de 30 dias de atraso:</strong> O sistema ativa uma tela de bloqueio temporário até a quitação via PIX.</li>
                  </ul>
                </div>

                {/* Isolamento Total dos Dados */}
                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                    <ShieldCheck size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white">4. Privacidade & Começo Zerado</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Segurança de nível bancário com isolamento multi-tenant:
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li>Cada novo usuário <strong>começa R$ 0,00 zerado</strong>;</li>
                    <li>Nenhum dado é compartilhado entre usuários;</li>
                    <li>O usuário Master Admin possui seu próprio perfil separado;</li>
                    <li>Seus lançamentos, extratos e fotos são 100% criptografados e confidenciais.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. IA COMPLETA & PRINTS BANCÁRIOS */}
        {activeCategory === 'ia' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-dark-950 border border-gold-400/30 shadow-xl space-y-6">
              <div className="border-b border-dark-850 pb-5">
                <span className="px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase">
                  Controle Operacional Total
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  Como Usar a IA Assistente & Leitora de Prints Bancários
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  A Inteligência Artificial do Aura Finance não apenas responde dúvidas: ela executa ações reais dentro das suas contas, lê comprovantes e aceita fotos de investimentos e porquinhos.
                </p>
              </div>

              {/* Destaque: Prints Bancários e Caixinhas */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-dark-900 via-dark-900 to-gold-950/20 border border-gold-400/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-400/20 text-gold-400 flex items-center justify-center font-bold">
                    <Camera size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      📸 Leitura Automática de Prints Bancários & Porquinhos
                    </h3>
                    <p className="text-xs text-slate-300">
                      Envie capturas de tela do NuBank (Porquinho/Caixinha), PicPay (Cofrinho), Inter ou extratos.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-dark-950/80 border border-dark-800">
                    <p className="font-bold text-gold-400 mb-1">1. Tire o Print da Tela</p>
                    <p className="text-slate-400">
                      Tire um print no seu celular ou computador mostrando o saldo (ex: Porquinho guardado de R$ 45.000,00).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-dark-950/80 border border-dark-800">
                    <p className="font-bold text-gold-400 mb-1">2. Envie para o Chat da IA</p>
                    <p className="text-slate-400">
                      Abra o chat da IA e clique no botão de clipe/câmera, ou simplesmente pressione <strong>Ctrl+V</strong> para colar a imagem.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-dark-950/80 border border-dark-800">
                    <p className="font-bold text-gold-400 mb-1">3. Lançamento Automático</p>
                    <p className="text-slate-400">
                      A IA analisa o valor numérico, identifica o banco ou caixinha e cadastra instantaneamente nos seus Investimentos ou Saldo!
                    </p>
                  </div>
                </div>
              </div>

              {/* Ações Drásticas: Zerar, Voltar, Alterar */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap size={18} className="text-gold-400" />
                  Comandos de Superpoderes da IA (Executa Tudo)
                </h3>
                <p className="text-xs text-slate-400">
                  Você pode falar ou digitar naturalmente. Veja exemplos que você pode copiar e testar agora mesmo:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      title: 'Zerar Todos os Lançamentos',
                      cmd: 'Zere todos os lançamentos do sistema e comece do zero',
                      desc: 'A IA limpa com segurança seu extrato para você reiniciar suas contas.',
                    },
                    {
                      title: 'Desfazer / Voltar Ação',
                      cmd: 'Desfaça a última ação que eu fiz, por favor',
                      desc: 'Reverte o último lançamento ou alteração realizada.',
                    },
                    {
                      title: 'Lançar Despesa com Detalhes',
                      cmd: 'Gastei R$ 120,50 no supermercado no cartão Nubank hoje',
                      desc: 'Cadastra o gasto com categoria Alimentação no cartão selecionado.',
                    },
                    {
                      title: 'Lançar Receita / Salário',
                      cmd: 'Recebi um pix de R$ 3.800 de salário na conta Itaú',
                      desc: 'Soma o valor ao saldo da conta correspondente instantaneamente.',
                    },
                    {
                      title: 'Alterar ou Excluir Lançamento',
                      cmd: 'Altere o valor do almoço de ontem para 45 reais e exclua a corrida de Uber',
                      desc: 'Edita e remove registros específicos pelo nome ou valor.',
                    },
                    {
                      title: 'Consultoria Financeira',
                      cmd: 'Como está o meu fluxo de caixa este mês? Sobrou dinheiro?',
                      desc: 'Gera um balanço analítico inteligente do seu patrimônio atual.',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-dark-900 border border-dark-800 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gold-400">{item.title}</span>
                          <button
                            onClick={() => copyToClipboard(item.cmd)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-dark-800 transition-colors"
                            title="Copiar comando"
                          >
                            {copiedPrompt === item.cmd ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                        <p className="text-xs font-mono text-slate-200 bg-dark-950 p-2 rounded-lg mt-2 border border-dark-850">
                          "{item.cmd}"
                        </p>
                        <p className="text-[11px] text-slate-400 mt-2">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CARTÕES & SCANNER DE FATURA */}
        {activeCategory === 'cards' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-dark-950 border border-gold-400/30 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-850 pb-5">
                <div>
                  <span className="px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase">
                    Módulo de Cartões
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">
                    Gestão Completa de Cartões & Leitura de Faturas (PDF ou Foto)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Cadastre múltiplos cartões de qualquer banco, acompanhe limite usado x disponível e escaneie a fatura completa de uma vez só.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('cards')}
                  className="px-4 py-2.5 rounded-xl bg-gold-400 text-dark-950 font-black text-xs hover:brightness-110 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-gold-glow"
                >
                  <CreditCard size={16} />
                  <span>Acessar Cartões</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard size={18} className="text-gold-400" />
                    Como Cadastrar um Cartão
                  </h3>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Acesse a aba <strong>"Cartões & Faturas"</strong> no menu lateral;</li>
                    <li>Clique no botão <strong>"+ Novo Cartão"</strong>;</li>
                    <li>Informe o nome (ex: <em>Nubank Ultravioleta</em>, <em>Itaú Black</em>, <em>Inter Gold</em>);</li>
                    <li>Defina o <strong>Limite Total</strong>, o <strong>Dia de Fechamento</strong> e o <strong>Dia de Vencimento</strong>;</li>
                    <li>Escolha a cor personalizada para o cartão e salve.</li>
                  </ol>
                </div>

                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ScanLine size={18} className="text-gold-400" />
                    Scanner Inteligente de Fatura (PDF / Foto)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Você não precisa digitar compra por compra da fatura do banco:
                  </p>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>No cartão desejado, clique no botão <strong>"Ler Fatura com IA"</strong>;</li>
                    <li>Envie o arquivo <strong>PDF da fatura</strong> gerado pelo banco ou uma <strong>foto/print</strong> das compras;</li>
                    <li>A IA realiza o OCR em segundos, lista todos os lançamentos com valores e datas;</li>
                    <li>Você confere o resumo e clica em <strong>"Confirmar e Lançar Fatura"</strong>!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. LISTAS DE COMPRAS */}
        {activeCategory === 'shopping' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-dark-950 border border-gold-400/30 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-850 pb-5">
                <div>
                  <span className="px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase">
                    App de Compras Integrado
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">
                    Listas de Compras Inteligentes (Mercado, Casa & Mais)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Substitua os bloquinhos de notas: organize suas compras por categoria e converta o total em uma despesa no fluxo de caixa com apenas 1 clique.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('shopping_lists')}
                  className="px-4 py-2.5 rounded-xl bg-gold-400 text-dark-950 font-black text-xs hover:brightness-110 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-gold-glow"
                >
                  <ShoppingCart size={16} />
                  <span>Acessar Listas de Compras</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-400/15 text-gold-400 flex items-center justify-center font-bold">1</div>
                  <h3 className="text-sm font-bold text-white">Criar Listas por Ambiente</h3>
                  <p className="text-xs text-slate-300">
                    Crie listas separadas: <strong>Supermercado do Mês</strong>, <strong>Itens para Casa</strong>, <strong>Material de Construção</strong> ou <strong>Farmácia</strong>.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-400/15 text-gold-400 flex items-center justify-center font-bold">2</div>
                  <h3 className="text-sm font-bold text-white">Checklist no Supermercado</h3>
                  <p className="text-xs text-slate-300">
                    Conforme coloca os produtos no carrinho físico, clique no item para marcar como pego. O sistema recalcula o valor real x estimado na hora.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">3</div>
                  <h3 className="text-sm font-bold text-white">1-Clique para Fluxo de Caixa</h3>
                  <p className="text-xs text-slate-300">
                    Ao passar no caixa, clique em <strong>"Finalizar Compra"</strong>. O valor total vira automaticamente um lançamento na sua conta bancária ou fatura de cartão!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. SCANNER DE NOTAS FISCAIS */}
        {activeCategory === 'scanner' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-dark-950 border border-gold-400/30 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-850 pb-5">
                <div>
                  <span className="px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase">
                    OCR com Visão Computacional
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">
                    Leitor Automático de Notas Fiscais (NFC-e & Cupons)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Esqueça a digitação manual de recibos. Aponte a câmera para o cupom fiscal impresso e deixe a IA cuidar do resto.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('scanner')}
                  className="px-4 py-2.5 rounded-xl bg-gold-400 text-dark-950 font-black text-xs hover:brightness-110 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-gold-glow"
                >
                  <ScanLine size={16} />
                  <span>Abrir Scanner de NF</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <h3 className="text-base font-bold text-white">Como Funciona o Leitor</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    O scanner de notas fiscais utiliza modelos avançados de OCR e Inteligência Artificial para ler fotos de notas fiscais de consumidor (NFC-e), cupons de postos de gasolina, restaurantes e lojas.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li>Detecta o nome do estabelecimento comercial;</li>
                    <li>Extrai o valor total pago com precisão de centavos;</li>
                    <li>Identifica a data exata da compra;</li>
                    <li>Sugere a categoria correspondente (Alimentação, Transporte, Lazer, etc.).</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <h3 className="text-base font-bold text-white">Dicas para Melhor Leitura</h3>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                    <li>Mantenha a nota fiscal sobre uma superfície plana e bem iluminada;</li>
                    <li>Certifique-se de que o cabeçalho e o rodapé (com o valor total) estão visíveis na foto;</li>
                    <li>Evite sombras fortes ou dobras sobre os números do valor;</li>
                    <li>Você pode ajustar qualquer dado antes de confirmar o lançamento.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. PWA - COMO BAIXAR NO CELULAR */}
        {activeCategory === 'pwa' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-dark-950 border border-gold-400/30 shadow-xl space-y-6">
              <div className="border-b border-dark-850 pb-5">
                <span className="px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase">
                  Tecnologia Progressive Web App (PWA)
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  Como Instalar o Aplicativo no Celular (Android & iPhone)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  O Aura Finance é um PWA moderno: você baixa direto pelo navegador sem ocupar memória e sem precisar acessar a Google Play Store ou Apple App Store.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Android / Chrome */}
                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                      <Smartphone size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">No Celular Android (Google Chrome)</h3>
                      <p className="text-xs text-slate-400">Instalação em 3 cliques rápidos</p>
                    </div>
                  </div>

                  <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside leading-relaxed">
                    <li>Abra o link do sistema no navegador <strong>Google Chrome</strong> do celular;</li>
                    <li>Toque no menu de <strong>três pontinhos (⋮)</strong> no canto superior direito do navegador;</li>
                    <li>Toque na opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>;</li>
                    <li>Confirme tocando em <strong>"Instalar"</strong>;</li>
                    <li>O ícone dourado do Aura Finance aparecerá na tela do seu celular como um app nativo!</li>
                  </ol>
                </div>

                {/* iPhone / Safari */}
                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                      <Smartphone size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">No iPhone / iPad (Apple Safari)</h3>
                      <p className="text-xs text-slate-400">Instalação pelo botão de compartilhar</p>
                    </div>
                  </div>

                  <ol className="text-xs text-slate-300 space-y-2.5 list-decimal list-inside leading-relaxed">
                    <li>Abra o link do sistema no navegador oficial <strong>Safari</strong> do iPhone;</li>
                    <li>Toque no botão <strong>Compartilhar</strong> (o ícone de quadrado com uma seta para cima na barra inferior);</li>
                    <li>Role as opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>;</li>
                    <li>Toque em <strong>"Adicionar"</strong> no canto superior direito;</li>
                    <li>Pronto! O app abre em tela cheia sem barras de navegador.</li>
                  </ol>
                </div>
              </div>

              {/* Vantagens do PWA */}
              <div className="p-4 rounded-2xl bg-dark-900/60 border border-dark-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-2">
                  Vantagens do Aplicativo PWA:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Não ocupa espaço na memória do aparelho</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Atualizações instantâneas automáticas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span>Acesso ultra-rápido direto na tela inicial</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. INVESTIMENTOS & SELIC 13,75% */}
        {activeCategory === 'investments' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-dark-950 border border-gold-400/30 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-850 pb-5">
                <div>
                  <span className="px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase">
                    Rentabilidade & Multiplicador
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">
                    Investimentos, Caixinhas & Taxa Selic Oficial (13,75% a.a.)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Monitore seus aportes em CDBs, Tesouro Direto e Caixinhas calculados rigorosamente com a taxa Selic oficial vigente.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('investments')}
                  className="px-4 py-2.5 rounded-xl bg-gold-400 text-dark-950 font-black text-xs hover:brightness-110 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-gold-glow"
                >
                  <TrendingUp size={16} />
                  <span>Ver Meus Investimentos</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp size={18} className="text-gold-400" />
                    Parâmetros Econômicos do Sistema
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    O sistema utiliza indicadores reais e atualizados do Banco Central do Brasil para simular o crescimento do seu patrimônio:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                    <li><strong>Taxa Selic Meta Oficial:</strong> 13,75% ao ano;</li>
                    <li><strong>CDI Estimado:</strong> 13,65% ao ano;</li>
                    <li><strong>Rendimento Médio Mensal:</strong> ~1,08% ao mês líquido em CDB 100% CDI;</li>
                    <li><strong>Comparativo Inteligente:</strong> O sistema mostra visualmente o quanto você ganha a mais em comparação com a poupança tradicional.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Zap size={18} className="text-gold-400" />
                    Diagnóstico com o CFO Virtual
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    O CFO Virtual é o seu diretor financeiro particular acionado pelo botão dourado no topo do sistema:
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li>Calcula a sua taxa de poupança mensal (quanto sobra do que você ganha);</li>
                    <li>Alerta se os gastos fixos ultrapassarem 50% da sua renda;</li>
                    <li>Sugere realocações inteligentes de saldo para render mais juros compostos.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. CHEAT SHEET DE COMANDOS DA IA */}
        {activeCategory === 'cheatsheet' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-dark-950 border border-gold-400/30 shadow-xl space-y-6">
              <div className="border-b border-dark-850 pb-5">
                <span className="px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase">
                  Copiar e Colar com 1 Clique
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  Guia Rápido de Comandos para a Inteligência Artificial
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Clique no ícone de cópia ao lado de qualquer comando e envie direto para o chat da IA pelo microfone ou teclado.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    category: 'Reinício & Limpeza',
                    icon: Trash2,
                    color: 'text-rose-400',
                    items: [
                      { title: 'Zerar todo o sistema', cmd: 'Zere todos os lançamentos do sistema e deixe tudo zerado' },
                      { title: 'Zerar apenas despesas', cmd: 'Limpe todas as despesas deste mês mantendo minhas receitas' },
                    ]
                  },
                  {
                    category: 'Desfazer & Correções',
                    icon: Undo2,
                    color: 'text-amber-400',
                    items: [
                      { title: 'Desfazer última ação', cmd: 'Desfaça o último lançamento que foi adicionado agora' },
                      { title: 'Corrigir valor', cmd: 'Altere o valor da despesa de farmácia de ontem para R$ 68,00' },
                      { title: 'Excluir registro específico', cmd: 'Exclua a corrida de Uber que lancei hoje cedo' },
                    ]
                  },
                  {
                    category: 'Lançamentos Rápidos de Gastos',
                    icon: ShoppingCart,
                    color: 'text-gold-400',
                    items: [
                      { title: 'Gasto em cartão', cmd: 'Gastei R$ 145 no supermercado no cartão Nubank' },
                      { title: 'Despesa fixa em dinheiro', cmd: 'Paguei a conta de energia de R$ 230 via PIX da conta Inter' },
                      { title: 'Compra parcelada', cmd: 'Comprei uma mesa de R$ 900 parcelado em 3x no cartão Itaú' },
                    ]
                  },
                  {
                    category: 'Entradas de Dinheiro & Salário',
                    icon: TrendingUp,
                    color: 'text-emerald-400',
                    items: [
                      { title: 'Recebimento de Salário', cmd: 'Recebi meu salário de R$ 4.500 na conta principal' },
                      { title: 'PIX ou Freelance', cmd: 'Recebi um PIX de R$ 350 referente a consultoria' },
                    ]
                  },
                  {
                    category: 'Porquinhos & Caixinhas de Banco',
                    icon: Camera,
                    color: 'text-purple-400',
                    items: [
                      { title: 'Lançar Porquinho NuBank', cmd: 'Acabei de mandar o print do meu Porquinho com R$ 45.000,00' },
                      { title: 'Aporte em Caixinha', cmd: 'Adicione R$ 1.500 na minha Caixinha de Reserva de Emergência' },
                    ]
                  },
                  {
                    category: 'Relatórios & Diagnósticos',
                    icon: Zap,
                    color: 'text-blue-400',
                    items: [
                      { title: 'Fluxo do mês', cmd: 'Como está o meu saldo e quanto dinheiro sobrou este mês?' },
                      { title: 'Maiores vilões do bolso', cmd: 'Qual categoria consumiu a maior parte dos meus gastos?' },
                    ]
                  },
                ].map((group, gIdx) => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={gIdx} className="p-4 sm:p-5 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <GroupIcon size={18} className={group.color} />
                        <h3 className="text-sm font-bold text-white">{group.category}</h3>
                      </div>

                      <div className="space-y-2">
                        {group.items.map((item, iIdx) => (
                          <div 
                            key={iIdx}
                            className="p-3 rounded-xl bg-dark-950/80 border border-dark-850 hover:border-dark-750 transition-colors flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-gold-400">{item.title}</p>
                              <p className="text-xs font-mono text-slate-300 truncate mt-0.5">
                                "{item.cmd}"
                              </p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(item.cmd)}
                              className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white transition-colors shrink-0"
                              title="Copiar comando"
                            >
                              {copiedPrompt === item.cmd ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 10. FAQ / PERGUNTAS FREQUENTES */}
        {activeCategory === 'faq' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-dark-950 border border-gold-400/30 shadow-xl space-y-6">
              <div className="border-b border-dark-850 pb-5">
                <span className="px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold uppercase">
                  Central de Dúvidas
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  Perguntas Frequentes (FAQ Oficial)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Respostas claras e imediatas sobre cobrança, privacidade, suporte e funcionamento de todos os módulos.
                </p>
              </div>

              <div className="space-y-3">
                {faqList.map((item, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl bg-dark-900 border border-dark-800 overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-dark-850/50 transition-colors"
                      >
                        <span className="text-sm sm:text-base font-bold text-white flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-gold-400/10 text-gold-400 text-xs flex items-center justify-center shrink-0 font-black">
                            {idx + 1}
                          </span>
                          {item.q}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-gold-400' : ''}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-dark-850/60 bg-dark-950/40">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer Update Commitment */}
      <div className="p-4 sm:p-5 rounded-2xl bg-dark-950 border border-dark-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center shrink-0">
            <Info size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Central de Tutoriais em Evolução Contínua</p>
            <p className="text-[11px] text-slate-400">
              Conforme novas ferramentas e melhorias são lançadas no Aura Finance, este material e os vídeos são atualizados em tempo real.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-4 py-2 rounded-xl bg-dark-900 border border-dark-750 text-gold-400 hover:border-gold-400 hover:bg-gold-400/10 text-xs font-bold transition-all shrink-0"
        >
          Voltar para o Dashboard
        </button>
      </div>
    </div>
  );
};
