import { Users, Server, Radio, Database, Cpu, ShieldCheck, Laptop } from 'lucide-react';
import { CreatorDashboardMetrics } from '../../types';

interface OnlineUsersSectionProps {
  metrics: CreatorDashboardMetrics;
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export function OnlineUsersSection({ metrics }: OnlineUsersSectionProps) {
  const { onlineUsers, activeUsersToday, serverStatus, activeAnonymousSessions = [] } = metrics;

  return (
    <div className="bg-[#0F131D] border border-[#242B38] rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#242B38]/80 mb-5">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white tracking-tight">
              Usuários online agora
            </h3>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sessão Ativa
          </span>
        </div>

        {/* Big Online Users Counter */}
        <div className="p-4 rounded-xl bg-[#080A0F] border border-[#1E2638] mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#8F9BAB]">Usuários Online Agora</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-white">
                    {onlineUsers}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">sessão(ões) ativa(s)</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Janela de inatividade</span>
              <span className="text-xs font-semibold text-slate-300">5 minutos</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Ativos hoje: <strong className="text-white">{activeUsersToday}</strong></span>
            <span className="text-[11px] text-emerald-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              Sessões anônimas em tempo real
            </span>
          </div>
        </div>

        {/* Anonymous Sessions List */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Sessões Ativas (Anônimas)
            </span>
            <span className="text-[11px] text-slate-500">
              {activeAnonymousSessions.length} detectada(s)
            </span>
          </div>

          <div className="bg-[#080A0F] border border-[#1E2638] rounded-xl overflow-hidden divide-y divide-[#1E2638]">
            {activeAnonymousSessions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                Nenhuma sessão anônima ativa no momento.
              </div>
            ) : (
              activeAnonymousSessions.slice(0, 5).map((session, idx) => (
                <div key={session.idHash || idx} className="p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-slate-300 text-[11px]">{session.idHash}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">
                      {session.lastSeenSecondsAgo < 15
                        ? 'agora'
                        : `há ${session.lastSeenSecondsAgo}s`}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                      {session.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Privacidade garantida: apenas hashes transitórios em memória, sem IPs ou dados cadastrais.
          </p>
        </div>

        {/* Technical architecture & transparent status */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#080A0F]/50 border border-[#1E2638]">
            <Server className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Servidor Backend</span>
                <span className="text-[11px] text-blue-400">Uptime: {formatUptime(serverStatus.uptimeSeconds)}</span>
              </div>
              <p className="text-[11px] text-[#8F9BAB] mt-0.5">
                Node.js Express em execução contínua na porta 3000
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#080A0F]/50 border border-[#1E2638]">
            <Cpu className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-300">Motor de IA e Processamento</span>
              <p className="text-[11px] text-[#8F9BAB] mt-0.5">
                {serverStatus.aiEngine}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#080A0F]/50 border border-[#1E2638]">
            <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-300">Persistência de Dados</span>
              <p className="text-[11px] text-[#8F9BAB] mt-0.5 leading-relaxed">
                {serverStatus.metricsStorage}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-[#242B38]/60 flex items-center gap-1.5 text-[11px] text-emerald-400/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>Dados operacionais protegidos e restritos ao criador</span>
      </div>
    </div>
  );
}
