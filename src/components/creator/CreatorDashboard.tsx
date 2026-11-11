import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Sparkles,
  Search,
  Calendar,
  TrendingUp,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Radio,
  LayoutDashboard,
  BarChart3,
  Activity,
} from 'lucide-react';
import { CreatorDashboardMetrics } from '../../types';
import { GrowthChart } from './GrowthChart';
import { RecentActivityFeed } from './RecentActivityFeed';
import { AnunciaAILogo } from '../brand/AnunciaAILogo';
import { OnlineUsersSection } from './OnlineUsersSection';
import { AnalyticsView } from './AnalyticsView';
import { ActivityView } from './ActivityView';

interface CreatorDashboardProps {
  token: string;
  onLogout: () => void;
  onBackToApp: () => void;
}

type AdminTab = 'dashboard' | 'analytics' | 'atividade';

export function CreatorDashboard({ token, onLogout, onBackToApp }: CreatorDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [metrics, setMetrics] = useState<CreatorDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/admin/metrics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        // Unauthorized or expired token
        onLogout();
        return;
      }

      if (!res.ok) {
        throw new Error('Falha ao obter métricas do servidor.');
      }

      const data: CreatorDashboardMetrics = await res.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o painel.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchMetrics();
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMetrics(false);
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F5F7FA] selection:bg-blue-600/30 selection:text-white pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0D111A]/95 backdrop-blur-md border-b border-[#1E2638] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <AnunciaAILogo size="sm" showText={false} className="border border-[#1E2638]" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Creator Dashboard
                </h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-[#38BDF8] border border-blue-500/25">
                  Privado
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] flex items-center gap-1.5">
                <span>Visão geral do AnunciaAI</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080A0F] border border-[#1E2638] text-[11px] text-emerald-400 font-medium mr-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Conectado</span>
            </div>

            {/* Refresh Button */}
            <button
              id="btn-refresh-metrics"
              type="button"
              onClick={() => fetchMetrics(true)}
              disabled={refreshing || loading}
              className="px-3 py-1.5 rounded-xl bg-[#080A0F] border border-[#1E2638] hover:border-slate-600 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Atualizar métricas agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden md:inline">Atualizar</span>
            </button>

            {/* Back to App */}
            <button
              id="btn-back-to-public-app"
              type="button"
              onClick={onBackToApp}
              className="px-3 py-1.5 rounded-xl bg-[#080A0F] border border-[#1E2638] hover:border-slate-600 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver App Público</span>
            </button>

            {/* Logout */}
            <button
              id="btn-creator-logout"
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Encerrar sessão administrativa"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Administrative Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-[#1E2638] flex items-center gap-1 sm:gap-2">
          <button
            id="admin-nav-dashboard"
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#080A0F]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            id="admin-nav-analytics"
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#080A0F]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            id="admin-nav-atividade"
            type="button"
            onClick={() => setActiveTab('atividade')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'atividade'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#080A0F]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Atividade</span>
            {metrics?.recentActivity && metrics.recentActivity.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#080A0F] text-slate-300 font-mono">
                {metrics.recentActivity.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchMetrics(true)}
              className="text-xs underline font-medium text-rose-300 hover:text-rose-100 cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Tab 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Informational banner about real backend metrics */}
            <div className="p-3.5 rounded-xl bg-[#0D111A] border border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Telemetria em tempo real do AnunciaAI. Métricas calculadas diretamente das interações dos usuários com o servidor Express.
                </span>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0">
                Atualização periódica a cada 30s
              </span>
            </div>

            {/* 6 Main Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* 1. 🟢 Usuários online */}
              <div
                id="metric-card-online"
                className="bg-[#0D111A] border border-[#1E2638] hover:border-emerald-500/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#94A3B8]">🟢 Usuários online</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
                    {loading && !metrics ? '...' : metrics?.onlineUsers}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Conectados agora</p>
              </div>

              {/* 2. 👥 Usuários totais */}
              <div
                id="metric-card-total-users"
                className="bg-[#0D111A] border border-[#1E2638] hover:border-blue-500/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#94A3B8]">👥 Usuários totais</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {loading && !metrics ? '...' : metrics?.totalUsers}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Visitantes únicos</p>
              </div>

              {/* 3. ✨ Anúncios gerados */}
              <div
                id="metric-card-generated"
                className="bg-[#0D111A] border border-[#1E2638] hover:border-indigo-500/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#94A3B8]">✨ Anúncios gerados</span>
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {loading && !metrics ? '...' : metrics?.adsGenerated}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Kits completos</p>
              </div>

              {/* 4. 🔎 Anúncios analisados */}
              <div
                id="metric-card-analyzed"
                className="bg-[#0D111A] border border-[#1E2638] hover:border-purple-500/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#94A3B8]">🔎 Anúncios analisados</span>
                  <Search className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {loading && !metrics ? '...' : metrics?.adsAnalyzed}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Diagnósticos feitos</p>
              </div>

              {/* 5. 📅 Ativos hoje */}
              <div
                id="metric-card-today"
                className="bg-[#0D111A] border border-[#1E2638] hover:border-amber-500/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#94A3B8]">📅 Ativos hoje</span>
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {loading && !metrics ? '...' : metrics?.activeUsersToday}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Data corrente</p>
              </div>

              {/* 6. 📈 Ativos nos últimos 7 dias */}
              <div
                id="metric-card-last-7-days"
                className="bg-[#0D111A] border border-[#1E2638] hover:border-emerald-500/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#94A3B8]">📈 Ativos 7 dias</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {loading && !metrics ? '...' : metrics?.activeUsersLast7Days}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Janela semanal</p>
              </div>
            </div>

            {/* Growth Chart */}
            {metrics && (
              <GrowthChart
                history7d={metrics.growthHistory7d}
                history30d={metrics.growthHistory30d}
              />
            )}

            {/* Bottom 2 Columns: Recent Activity & Online Monitoring */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {metrics && <RecentActivityFeed events={metrics.recentActivity} />}
              {metrics && <OnlineUsersSection metrics={metrics} />}
            </div>
          </div>
        )}

        {/* Tab 2: Analytics View */}
        {activeTab === 'analytics' && metrics && (
          <AnalyticsView metrics={metrics} />
        )}

        {/* Tab 3: Atividade View */}
        {activeTab === 'atividade' && metrics && (
          <ActivityView events={metrics.recentActivity} />
        )}
      </main>
    </div>
  );
}
