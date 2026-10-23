import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  UserCheck, 
  Shield, 
  LogIn, 
  UserPlus 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onAuthSuccess: (user: any) => void;
  onSignOut: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onSignOut,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const rawEmail = email.trim();
    const cleanEmail = rawEmail.toLowerCase() === 'admin' ? 'admin@aurafinance.com.br' : rawEmail;

    if (!cleanEmail || !password) {
      setErrorMsg('Preencha seu e-mail e senha.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem.');
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { 
              full_name: fullName.trim() || 'Usuário',
              plan: 'trial',
              trial_start: new Date().toISOString(),
              trial_days: 7,
              is_admin: false,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          setSuccessMsg('Conta criada com sucesso! Você tem 7 dias de acesso grátis liberado.');
          onAuthSuccess(data.user);
          setTimeout(() => onClose(), 1500);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao criar conta.');
      } finally {
        setLoading(false);
      }
    } else {
      // Login mode
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (data.user) {
          setSuccessMsg('Login realizado com sucesso!');
          onAuthSuccess(data.user);
          setTimeout(() => onClose(), 1200);
        }
      } catch (err: any) {
        setErrorMsg('E-mail ou senha incorretos.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onSignOut();
    onClose();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-dark-900 border border-gold-400/30 shadow-2xl p-5 sm:p-7 my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold-400/20 border border-gold-400/30 flex items-center justify-center text-gold-400 font-bold">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                {currentUser ? 'Perfil do Usuário' : (mode === 'login' ? 'Acessar Conta' : 'Criar Conta por E-mail')}
              </h2>
              <p className="text-[11px] text-slate-400">
                {currentUser ? 'Sessão ativa no Supabase Auth' : 'Autenticação segura na nuvem'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            title="Fechar janela (Esc)"
            aria-label="Fechar modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 active:scale-90 transition-all duration-150"
          >
            <X size={18} />
          </button>
        </div>

        {currentUser ? (
          /* Logged In View */
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-gold-400/20 border border-gold-400/40 flex items-center justify-center text-gold-400 font-extrabold text-base">
                {currentUser.email?.substring(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  Sessão Conectada
                </span>
                <p className="text-sm font-extrabold text-white truncate mt-1">
                  {currentUser.user_metadata?.full_name || 'Usuário Autenticado'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <LogOut size={16} />
              <span>Desconectar / Sair da Conta</span>
            </button>
          </div>
        ) : (
          /* Login / Register Form */
          <div className="mt-5 space-y-4">
            {/* Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-dark-950 border border-dark-800">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-gold-400 text-dark-950 shadow-gold-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn size={14} />
                <span>Entrar</span>
              </button>

              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-gold-400 text-dark-950 shadow-gold-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus size={14} />
                <span>Criar Conta</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nome Completo ou Razão Social
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Ex: Erick Finger / Empresa"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Senha {mode === 'register' && '(mínimo 6 caracteres)'}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-black text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-glow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" />
                    <span>Conectando ao Supabase...</span>
                  </>
                ) : (
                  <span>{mode === 'login' ? 'Entrar no Sistema' : 'Cadastrar e Entrar'}</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
