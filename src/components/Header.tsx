import React from 'react';
import { Sparkles, SearchCheck, LayoutDashboard, Tag, ListChecks, Camera } from 'lucide-react';
import { AnunciaAILogo } from './brand/AnunciaAILogo';
import { AppTab } from '../types';

interface HeaderProps {
  generationCount: number;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  isAdminAuthenticated?: boolean;
}

export function Header({
  generationCount,
  activeTab,
  onSelectTab,
  isAdminAuthenticated = false,
}: HeaderProps) {
  const navTabs = [
    { id: 'gerar' as AppTab, label: 'Criar anúncio', shortLabel: 'Criar', icon: Sparkles },
    { id: 'analisar' as AppTab, label: 'Analisar anúncio', shortLabel: 'Analisar', icon: SearchCheck },
    { id: 'titulos' as AppTab, label: 'Gerar títulos', shortLabel: 'Títulos', icon: Tag },
    { id: 'checklist' as AppTab, label: 'Checklist', shortLabel: 'Checklist', icon: ListChecks },
    { id: 'foto' as AppTab, label: 'Analisar foto', shortLabel: 'Foto', icon: Camera },
  ];

  return (
    <header className="w-full border-b border-[#1E2638] bg-[#080A0F]/95 sticky top-0 z-40 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Brand Logo + Badge */}
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={() => onSelectTab('gerar')}
              className="flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl py-1 px-1 -ml-1 transition-transform active:scale-98 min-w-0"
              title="AnunciaAI - Início"
            >
              <AnunciaAILogo
                size="md"
                showText={true}
                className="shrink-0"
              />
              <span className="hidden xl:inline-flex items-center text-[10.5px] font-semibold text-slate-400 bg-[#0D111A] border border-[#1E2638] px-2 py-0.5 rounded-md">
                SaaS para vendedores
              </span>
            </button>
          </div>

          {/* Center: Desktop Navigation Bar */}
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center p-1 bg-[#0D111A] rounded-xl border border-[#1E2638] shadow-xs"
          >
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-3.5 py-1.5 min-h-[36px] rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 select-none ${
                    isActive
                      ? 'bg-[#182030] text-white font-semibold border border-blue-500/30 shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F5F7FA] hover:bg-[#121724]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#38BDF8]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Admin only tab */}
            {isAdminAuthenticated && (
              <button
                id="tab-dashboard"
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ml-1 ${
                  activeTab === 'dashboard'
                    ? 'bg-purple-950/50 text-purple-300 font-semibold border border-purple-500/40 shadow-xs'
                    : 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-950/20'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>Dashboard</span>
              </button>
            )}
          </nav>

          {/* Right: Counter & Live Status */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              id="ad-generation-counter"
              className="flex items-center gap-1.5 sm:gap-2 bg-[#0D111A] border border-[#1E2638] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-xs"
              title="Total de anúncios gerados por você neste dispositivo"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11.5px] sm:text-[12px] text-[#94A3B8] font-medium hidden xs:inline">
                Gerados:
              </span>
              <span className="text-[11.5px] sm:text-[12px] font-bold text-white bg-[#080A0F] px-1.5 sm:px-2 py-0.5 rounded-md border border-[#1E2638] tabular-nums">
                {generationCount}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar: Compact, clean, touch-friendly */}
        <div className="md:hidden pb-2.5 pt-0.5 border-t border-[#1E2638]/70">
          <nav
            aria-label="Navegação móvel"
            className="flex items-center p-1 bg-[#0D111A] rounded-xl border border-[#1E2638] gap-0.5 w-full overflow-x-auto no-scrollbar"
          >
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-mobile-${tab.id}`}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex-1 min-w-0 flex items-center justify-center gap-1 py-2 min-h-[38px] px-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#182030] text-white font-semibold border border-blue-500/30 shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F5F7FA]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#38BDF8]' : 'text-slate-400'}`} />
                  <span className="truncate">{tab.shortLabel}</span>
                </button>
              );
            })}

            {isAdminAuthenticated && (
              <button
                id="tab-mobile-dashboard"
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className={`flex items-center justify-center gap-1 py-2 min-h-[38px] px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                  activeTab === 'dashboard'
                    ? 'bg-purple-950/50 text-purple-300 font-semibold border border-purple-500/40'
                    : 'text-purple-400/80'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>Admin</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
