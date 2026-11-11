import { Activity, UserPlus, Sparkles, Search, Clock } from 'lucide-react';
import { AdminRecentEvent } from '../../types';

interface RecentActivityFeedProps {
  events: AdminRecentEvent[];
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return 'agora mesmo';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays} d`;
}

export function RecentActivityFeed({ events }: RecentActivityFeedProps) {
  return (
    <div className="bg-[#0F131D] border border-[#242B38] rounded-2xl p-5 sm:p-6 flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-[#242B38]/80 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white tracking-tight">Atividade Recente</h3>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          Feed Anônimo
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[380px] custom-scrollbar">
        {events.length === 0 ? (
          <div className="text-center py-12 text-[#64748B]">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Nenhum evento registrado no momento.</p>
          </div>
        ) : (
          events.map((event) => {
            const isUser = event.type === 'novo_usuario';
            const isGen = event.type === 'anuncio_gerado';
            const isAna = event.type === 'anuncio_analisado';

            return (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#080A0F]/60 border border-[#1E2638] hover:border-[#2D3748] transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isUser
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                      : isGen
                      ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                      : 'bg-purple-950/60 text-purple-400 border border-purple-800/40'
                  }`}
                >
                  {isUser && <UserPlus className="w-4 h-4" />}
                  {isGen && <Sparkles className="w-4 h-4" />}
                  {isAna && <Search className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {event.title}
                    </p>
                    <span className="text-[11px] text-[#64748B] whitespace-nowrap shrink-0">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        isUser
                          ? 'bg-emerald-900/30 text-emerald-400'
                          : isGen
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-purple-900/30 text-purple-400'
                      }`}
                    >
                      {isUser ? 'Novo Usuário' : isGen ? 'Geração de Anúncio' : 'Análise de Anúncio'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Sessão anônima
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-[#242B38]/60 text-[11px] text-[#64748B] flex items-center justify-between">
        <span>Privacidade: nenhum IP ou identificador pessoal é retido</span>
        <span>{events.length} eventos</span>
      </div>
    </div>
  );
}
