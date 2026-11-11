import { useState } from 'react';
import { Sparkles, Search, UserPlus, Filter, Clock, Activity } from 'lucide-react';
import { AdminRecentEvent } from '../../types';

interface ActivityViewProps {
  events: AdminRecentEvent[];
}

function getRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 45) return 'agora';
  if (diffSec < 90) return 'há 1 minuto';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} minutos`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'há 1 hora';
  if (diffHours < 24) return `há ${diffHours} horas`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'ontem';
  return `há ${diffDays} dias`;
}

export function ActivityView({ events }: ActivityViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'anuncio_gerado' | 'anuncio_analisado' | 'novo_usuario'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter((ev) => {
    const matchesType = filterType === 'all' || ev.type === filterType;
    const matchesSearch = !searchTerm || ev.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const countGerado = events.filter((e) => e.type === 'anuncio_gerado').length;
  const countAnalisado = events.filter((e) => e.type === 'anuncio_analisado').length;
  const countUsuario = events.filter((e) => e.type === 'novo_usuario').length;

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-[#0F131D] border border-[#242B38] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Log de Atividades Recentes
              </h2>
            </div>
            <p className="text-xs text-[#8F9BAB]">
              Registro cronológico anônimo das operações em tempo real no AnunciaAI.
            </p>
          </div>

          {/* Quick summary tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-[#080A0F] border border-[#242B38] text-slate-300">
              Total: <strong className="text-white">{events.length}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#080A0F] border border-[#242B38] text-indigo-300">
              Gerados: <strong className="text-white">{countGerado}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#080A0F] border border-[#242B38] text-purple-300">
              Analisados: <strong className="text-white">{countAnalisado}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#080A0F] border border-[#242B38] text-blue-300">
              Novos: <strong className="text-white">{countUsuario}</strong>
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 pt-5 border-t border-[#242B38] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#080A0F] border border-[#242B38] text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('anuncio_gerado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                filterType === 'anuncio_gerado'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[#080A0F] border border-[#242B38] text-slate-400 hover:text-slate-200'
              }`}
            >
              Anúncios Gerados ({countGerado})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('anuncio_analisado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                filterType === 'anuncio_analisado'
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#080A0F] border border-[#242B38] text-slate-400 hover:text-slate-200'
              }`}
            >
              Anúncios Analisados ({countAnalisado})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('novo_usuario')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                filterType === 'novo_usuario'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#080A0F] border border-[#242B38] text-slate-400 hover:text-slate-200'
              }`}
            >
              Novos Usuários ({countUsuario})
            </button>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#080A0F] border border-[#242B38] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-[#0F131D] border border-[#242B38] rounded-2xl p-5 sm:p-6">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Nenhuma atividade encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-[#1E2638]">
            {filteredEvents.map((event) => {
              const relTime = getRelativeTime(event.timestamp);

              if (event.type === 'anuncio_gerado') {
                return (
                  <div key={event.id} className="py-3.5 flex items-start gap-3.5 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                          Anúncio gerado
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0 font-mono">
                          <Clock className="w-3 h-3" />
                          {relTime}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 mt-0.5 font-medium">
                        {event.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Kit completo com 3 variações de copy, ganchos e hashtags
                      </p>
                    </div>
                  </div>
                );
              }

              if (event.type === 'anuncio_analisado') {
                return (
                  <div key={event.id} className="py-3.5 flex items-start gap-3.5 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                      <Search className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
                          Anúncio analisado
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0 font-mono">
                          <Clock className="w-3 h-3" />
                          {relTime}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 mt-0.5 font-medium">
                        {event.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Diagnóstico com pontuação e recomendações estratégicas
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={event.id} className="py-3.5 flex items-start gap-3.5 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
                        Novo usuário ativo
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0 font-mono">
                        <Clock className="w-3 h-3" />
                        {relTime}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 mt-0.5 font-medium">
                      {event.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Nova sessão anônima iniciada na aplicação
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
