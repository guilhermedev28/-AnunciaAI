import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { AdminDayStat } from '../../types';

interface GrowthChartProps {
  history7d: AdminDayStat[];
  history30d: AdminDayStat[];
}

export function GrowthChart({ history7d, history30d }: GrowthChartProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'users' | 'generated' | 'analyzed'>('all');

  const data = timeRange === '7d' ? history7d : history30d;

  return (
    <div className="bg-[#0F131D] border border-[#242B38] rounded-2xl p-5 sm:p-6 flex flex-col">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#242B38]/80">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
              Gráfico de Crescimento e Utilização
            </h3>
          </div>
          <p className="text-xs text-[#8F9BAB] mt-1">
            Evolução diária de usuários ativos e operações realizadas no sistema
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range buttons */}
          <div className="inline-flex rounded-xl bg-[#080A0F] p-1 border border-[#242B38]">
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                timeRange === '7d'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8F9BAB] hover:text-white'
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                timeRange === '30d'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8F9BAB] hover:text-white'
              }`}
            >
              Últimos 30 dias
            </button>
          </div>

          {/* Metric selector */}
          <div className="inline-flex rounded-xl bg-[#080A0F] p-1 border border-[#242B38] text-xs">
            <button
              type="button"
              onClick={() => setSelectedMetric('all')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedMetric === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'text-[#8F9BAB] hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('users')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedMetric === 'users'
                  ? 'bg-emerald-700 text-white'
                  : 'text-[#8F9BAB] hover:text-white'
              }`}
            >
              Usuários
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('generated')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedMetric === 'generated'
                  ? 'bg-blue-700 text-white'
                  : 'text-[#8F9BAB] hover:text-white'
              }`}
            >
              Gerados
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetric('analyzed')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedMetric === 'analyzed'
                  ? 'bg-purple-700 text-white'
                  : 'text-[#8F9BAB] hover:text-white'
              }`}
            >
              Analisados
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 sm:h-80 w-full pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorGenerated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorAnalyzed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1E2638" vertical={false} />

            <XAxis
              dataKey="label"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#242B38' }}
            />

            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0F131D',
                borderColor: '#242B38',
                borderRadius: '0.75rem',
                color: '#F8FAFC',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
              }}
              labelStyle={{ color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}
              formatter={(value: any, name: any) => {
                const labels: Record<string, string> = {
                  activeUsers: 'Usuários Ativos',
                  adsGenerated: 'Anúncios Gerados',
                  adsAnalyzed: 'Anúncios Analisados',
                };
                return [value, labels[name] || name];
              }}
            />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
              formatter={(value) => {
                const map: Record<string, string> = {
                  activeUsers: 'Usuários Ativos',
                  adsGenerated: 'Anúncios Gerados',
                  adsAnalyzed: 'Anúncios Analisados',
                };
                return <span className="text-[#CBD5E1] ml-1">{map[value] || value}</span>;
              }}
            />

            {(selectedMetric === 'all' || selectedMetric === 'users') && (
              <Area
                type="monotone"
                dataKey="activeUsers"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUsers)"
                name="activeUsers"
              />
            )}

            {(selectedMetric === 'all' || selectedMetric === 'generated') && (
              <Area
                type="monotone"
                dataKey="adsGenerated"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGenerated)"
                name="adsGenerated"
              />
            )}

            {(selectedMetric === 'all' || selectedMetric === 'analyzed') && (
              <Area
                type="monotone"
                dataKey="adsAnalyzed"
                stroke="#A855F7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAnalyzed)"
                name="adsAnalyzed"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-[#242B38]/60 flex items-center justify-between text-[11px] text-[#64748B]">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Frequência diária sincronizada em tempo real
        </span>
        <span>Intervalo exibido: {timeRange === '7d' ? '7 dias' : '30 dias'}</span>
      </div>
    </div>
  );
}
