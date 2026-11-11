import { useState } from 'react';
import { CreatorDashboardMetrics } from '../../types';
import { GrowthChart } from './GrowthChart';
import { BarChart3, Database, HardDrive, Sparkles, Search, Users, ShieldCheck } from 'lucide-react';

interface AnalyticsViewProps {
  metrics: CreatorDashboardMetrics;
}

export function AnalyticsView({ metrics }: AnalyticsViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d'>('7d');
  const historyData = selectedPeriod === '7d' ? metrics.growthHistory7d : metrics.growthHistory30d;

  // Compute calculated metrics
  const totalDays = historyData.length || 1;
  const periodGenSum = historyData.reduce((acc, curr) => acc + curr.adsGenerated, 0);
  const periodAnaSum = historyData.reduce((acc, curr) => acc + curr.adsAnalyzed, 0);
  const periodUserSum = historyData.reduce((acc, curr) => acc + curr.activeUsers, 0);

  const avgGenPerDay = (periodGenSum / totalDays).toFixed(1);
  const avgAnaPerDay = (periodAnaSum / totalDays).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Banner with Architecture Transparency */}
      <div className="bg-[#0F131D] border border-[#242B38] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Analytics & Métricas Operacionais
              </h2>
            </div>
            <p className="text-xs text-[#8F9BAB]">
              Telemetria em tempo real do AnunciaAI. Dados coletados das requisições reais do servidor Express.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Janela analítica:</span>
            <div className="inline-flex rounded-xl bg-[#080A0F] p-1 border border-[#242B38]">
              <button
                type="button"
                onClick={() => setSelectedPeriod('7d')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedPeriod === '7d'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                7 Dias
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('30d')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedPeriod === '30d'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                30 Dias
              </button>
            </div>
          </div>
        </div>

        {/* Calculated KPI Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#242B38]">
          <div className="p-3 rounded-xl bg-[#080A0F] border border-[#1E2638]">
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">Média Gerações / Dia</span>
            </div>
            <span className="text-xl font-bold text-white">{avgGenPerDay}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">no período de {selectedPeriod === '7d' ? '7 dias' : '30 dias'}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080A0F] border border-[#1E2638]">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Search className="w-4 h-4" />
              <span className="text-xs font-medium">Média Análises / Dia</span>
            </div>
            <span className="text-xl font-bold text-white">{avgAnaPerDay}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">diagnósticos avaliados</span>
          </div>

          <div className="p-3 rounded-xl bg-[#080A0F] border border-[#1E2638]">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Usuários Únicos (Sessão)</span>
            </div>
            <span className="text-xl font-bold text-white">{metrics.totalUsers}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">total acumulado no servidor</span>
          </div>
        </div>
      </div>

      {/* Main Growth Chart */}
      <GrowthChart
        history7d={metrics.growthHistory7d}
        history30d={metrics.growthHistory30d}
      />

      {/* Daily Breakdown Table */}
      <div className="bg-[#0F131D] border border-[#242B38] rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Tabela Diária Consolidada
            </h3>
            <p className="text-xs text-[#8F9BAB]">
              Detalhamento dia a dia das atividades operacionais
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {historyData.length} dias listados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#242B38] text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3 text-center">Usuários Ativos</th>
                <th className="py-3 px-3 text-center">Anúncios Gerados</th>
                <th className="py-3 px-3 text-center">Anúncios Analisados</th>
                <th className="py-3 px-3 text-right">Volume Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638]/70">
              {historyData.slice().reverse().map((day) => {
                const totalActivity = day.adsGenerated + day.adsAnalyzed;
                return (
                  <tr key={day.date} className="hover:bg-[#141926] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {day.label} <span className="text-slate-500 text-[10px]">({day.date})</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-blue-400">
                      {day.activeUsers}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-indigo-400">
                      {day.adsGenerated}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-purple-400">
                      {day.adsAnalyzed}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-white">
                      {totalActivity}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database & Architecture Note for Admin */}
      <div className="bg-[#0F131D] border border-[#242B38] rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">
            Infraestrutura de Coleta de Métricas
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          O AnunciaAI armazena e agrega métricas de sessão em tempo real através do servidor Express (<code className="text-indigo-300 font-mono">server/adminMetrics.ts</code>).
          Cada requisição de geração (<code className="text-indigo-300 font-mono">/api/generate-ad</code>), análise (<code className="text-indigo-300 font-mono">/api/analyze-ad</code>) e heartbeat anônimo (<code className="text-indigo-300 font-mono">/api/track-session</code>) é contabilizada sem reter dados pessoais, garantindo conformidade com privacidade e transparência para o criador.
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Estruturado para persistência permanente via Firestore ou Cloud SQL quando provisionado.</span>
        </div>
      </div>
    </div>
  );
}
