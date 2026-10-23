import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  CalendarDays, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { getSaasUsers, updateUserPlan } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/formatters';

interface AdminSaasUser {
  id: string;
  name: string;
  email: string;
  const mockUsers: AdminSaasUser[] = [
    { id: 'u1', name: 'João Silva', email: 'joao@empresa.com', created_at: '2025-10-15', status: 'active', subscription_started_at: '2025-10-22' },
    { id: 'u2', name: 'Maria Santos', email: 'maria@tech.com.br', created_at: '2025-10-18', status: 'trial', trial_ends_at: '2025-10-25' },
    { id: 'u3', name: 'Carlos Mendes', email: 'carlos@servicos.com', created_at: '2025-10-20', status: 'trial', trial_ends_at: '2025-10-27' },
    { id: 'u4', name: 'Ana Oliveira', email: 'ana@loja.com', created_at: '2025-10-10', status: 'inactive' },
    { id: 'u5', name: 'Pedro Costa', email: 'pedro@consultoria.net', created_at: '2025-10-12', status: 'active', subscription_started_at: '2025-10-19' },
  ];

  const totalCustomers = mockUsers.length;
  const trialCustomers = mockUsers.filter(u => u.status === 'trial').length;
  const activeCustomers = mockUsers.filter(u => u.status === 'active').length;
  const mrr = activeCustomers * 9.90;

  const handleExtendTrial = (user: AdminSaasUser) => {
    alert(`Teste estendido para ${user.name} (${user.email}) por mais 7 dias`);
  };

  const handleActivateSubscription = (user: AdminSaasUser) => {
    alert(`Assinatura ativada manualmente para ${user.name} - R$ 9,90/mês`);
  };
  created_at: string;
  last_sign_in_at?: string;
  plan: string;
  is_admin: boolean;
  trial_days: number;
}

export const AdminSaasPage: React.FC = () => {
  const [users, setUsers] = useState<AdminSaasUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'trial' | 'active' | 'admin'>('all');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getSaasUsers();
      const mapped: AdminSaasUser[] = data.map((u: any) => ({
        id: u.id,
        name: u.full_name || 'Usuário',
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        plan: u.is_admin ? 'lifetime' : (u.plan || 'trial'),
        is_admin: Boolean(u.is_admin),
        trial_days: u.trial_days || 7,
      }));
      setUsers(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleActivateUser = async (userId: string, email: string) => {
    const success = await updateUserPlan(userId, 'active');
    if (success) {
      setActionSuccess(`Assinatura de "${email}" ativada com sucesso!`);
      setTimeout(() => setActionSuccess(''), 3000);
      await loadUsers();
    }
  };

  const handleExtendTrial = async (userId: string, email: string) => {
    const success = await updateUserPlan(userId, 'trial', 14);
    if (success) {
      setActionSuccess(`Período de teste de "${email}" estendido para 14 dias!`);
      setTimeout(() => setActionSuccess(''), 3000);
      await loadUsers();
    }
  };

  // Metrics
  const totalUsers = users.length;
  const trialUsers = users.filter(u => u.plan === 'trial' && !u.is_admin).length;
  const activeSubscribers = users.filter(u => u.plan === 'active' || u.plan === 'lifetime').length;
  const projectedMRR = activeSubscribers * 9.90;

  // Filtered List
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterPlan === 'trial') return u.plan === 'trial' && !u.is_admin;
    if (filterPlan === 'active') return u.plan === 'active';
    if (filterPlan === 'admin') return u.is_admin;
    return true;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck size={28} className="text-gold-400" />
            <span>Painel do Dono do SaaS</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gestão de clientes, períodos de teste grátis e faturamento mensal recorrente (MRR)
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-dark-950 border border-dark-800 text-slate-300 hover:text-gold-400 text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-gold-400' : ''} />
          <span>Atualizar Clientes</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total de Cadastros</span>
            <div className="w-8 h-8 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {totalUsers}
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Contas no Supabase Auth</span>
        </div>

        <div className="p-5 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Clientes em Teste (7d)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-3">
            {trialUsers}
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Potenciais assinantes</span>
        </div>

        <div className="p-5 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Assinantes Ativos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">
            {activeSubscribers}
          </div>
          <span className="text-[11px] text-slate-500 mt-1">R$ 9,90 / mês por usuário</span>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-gold-500/15 via-dark-900 to-dark-900 border border-gold-400/40 shadow-dark-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gold-400 uppercase tracking-wider">MRR Projetado</span>
            <div className="w-8 h-8 rounded-xl bg-gold-400/20 text-gold-400 flex items-center justify-center shadow-gold-glow">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-3">
            {formatCurrency(projectedMRR)}
          </div>
          <span className="text-[11px] text-gold-400/80 mt-1">Faturamento Mensal Recorrente</span>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-dark-900 border border-dark-800 shadow-dark-card">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-dark-950 border border-dark-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterPlan('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterPlan === 'all'
                  ? 'bg-gold-400 text-dark-950 shadow-gold-glow'
                  : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setFilterPlan('trial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterPlan === 'trial'
                  ? 'bg-amber-500 text-dark-950'
                  : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
              }`}
            >
              Trial ({trialUsers})
            </button>
            <button
              onClick={() => setFilterPlan('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterPlan === 'active'
                  ? 'bg-emerald-500 text-dark-950'
                  : 'bg-dark-950 text-slate-400 hover:text-white border border-dark-800'
              }`}
            >
              Assinantes ({activeSubscribers})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dark-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Cliente</th>
                <th className="pb-3">Data de Cadastro</th>
                <th className="pb-3">Status do Plano</th>
                <th className="pb-3 text-right pr-2">Ações Administrativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-850">
              {filteredUsers.map((u) => {
                const isUserAdmin = u.is_admin || u.email === 'admin@aurafinance.com.br';
                const isTrial = u.plan === 'trial' && !isUserAdmin;
                const isActive = u.plan === 'active' || isUserAdmin;

                return (
                  <tr key={u.id} className="hover:bg-dark-950/50 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                          isUserAdmin 
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : (isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-400/20 text-gold-400')
                        }`}>
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{u.name}</p>
                          <p className="text-slate-400 text-[11px] truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 text-slate-300">
                      {formatDate(u.created_at)}
                    </td>

                    <td className="py-3">
                      {isUserAdmin ? (
                        <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold text-[10px]">
                          Admin Vitalício
                        </span>
                      ) : isTrial ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                          Teste 7 Dias ({u.trial_days}d)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                          Assinante PRO (R$ 9,90)
                        </span>
                      )}
                    </td>

                    <td className="py-3 text-right pr-2">
                      {!isUserAdmin && (
                        <div className="flex items-center justify-end gap-2">
                          {isTrial && (
                            <>
                              <button
                                onClick={() => handleExtendTrial(u.id, u.email)}
                                className="px-2.5 py-1 rounded-lg bg-dark-950 hover:bg-dark-850 text-slate-300 border border-dark-800 text-[11px] font-semibold transition-colors"
                                title="Estender período de teste para 14 dias"
                              >
                                +7 Dias
                              </button>
                              <button
                                onClick={() => handleActivateUser(u.id, u.email)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-colors"
                                title="Liberar assinatura manualmente"
                              >
                                Ativar PRO
                              </button>
                            </>
                          )}
                          {isActive && !isUserAdmin && (
                            <span className="text-[11px] text-emerald-400 font-bold">
                              ✓ Assinatura Ativa
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
