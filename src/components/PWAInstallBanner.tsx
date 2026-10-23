import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      alert('Para instalar o Aura Finance, abra as opções do navegador e clique em "Adicionar à tela inicial" ou "Instalar Aplicativo".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || dismissed) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-gold-400/30 rounded-2xl p-3.5 sm:p-4 mb-5 shadow-lg flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 shrink-0 shadow-sm">
            <Smartphone size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Instalar Aplicativo no Celular</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-400 border border-gold-400/30">PWA</span>
            </h4>
            <p className="text-xs text-slate-400">
              Acesse offline, receba notificações e abra direto da tela inicial como app nativo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gold-400 hover:bg-gold-300 text-dark-950 font-black text-xs transition-all shadow-gold-glow active:scale-95"
          >
            <Download size={14} />
            <span>Baixar App</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            title="Fechar aviso"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* iOS Safari Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-gold-400/30 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-gold-400/10 border border-gold-400/30 text-gold-400 flex items-center justify-center mx-auto mb-4">
              <Smartphone size={26} />
            </div>
            <h3 className="text-base font-extrabold text-white mb-2">
              Como Instalar no iPhone / iPad
            </h3>
            <div className="text-left text-xs text-slate-300 space-y-3 bg-dark-950/70 p-4 rounded-xl border border-dark-800 my-4">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gold-400/20 text-gold-400 font-bold flex items-center justify-center shrink-0">1</span>
                <span>Toque no botão <Share size={13} className="inline mx-1 text-sky-400" /> <strong>Compartilhar</strong> na barra inferior do Safari.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gold-400/20 text-gold-400 font-bold flex items-center justify-center shrink-0">2</span>
                <span>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gold-400/20 text-gold-400 font-bold flex items-center justify-center shrink-0">3</span>
                <span>Toque em <strong>"Adicionar"</strong> no canto superior direito.</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-gold-400 text-dark-950 font-black text-xs hover:bg-gold-300 transition-colors"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
