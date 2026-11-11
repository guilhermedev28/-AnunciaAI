import React from 'react';
import { Sparkles, SearchCheck, Tag, ListChecks, Camera, ShieldCheck, Heart } from 'lucide-react';
import { AnunciaAILogo } from './brand/AnunciaAILogo';
import { AppTab } from '../types';

interface FooterProps {
  onSelectTab: (tab: AppTab) => void;
  onDotClick: () => void;
}

export function Footer({ onSelectTab, onDotClick }: FooterProps) {
  const tools = [
    { id: 'gerar' as AppTab, label: 'Criar anúncio', icon: Sparkles },
    { id: 'analisar' as AppTab, label: 'Analisar anúncio', icon: SearchCheck },
    { id: 'titulos' as AppTab, label: 'Gerar títulos', icon: Tag },
    { id: 'checklist' as AppTab, label: 'Checklist do anúncio', icon: ListChecks },
    { id: 'foto' as AppTab, label: 'Analisar foto', icon: Camera },
  ];

  return (
    <footer className="w-full border-t border-[#1E2638] bg-[#07090E] pt-12 pb-8 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#1E2638]/70">
          {/* Brand & Mission Column */}
          <div className="md:col-span-6 space-y-3.5">
            <div className="flex items-center gap-3">
              <AnunciaAILogo size="sm" showText={true} />
              <span className="text-[10.5px] font-semibold text-[#38BDF8] bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                Brasil
              </span>
            </div>
            <p className="text-[13px] text-[#94A3B8] max-w-md leading-relaxed">
              Plataforma de inteligência artificial especializada para vendedores, lojistas e autônomos criarem anúncios de alta conversão sem inventar dados.
            </p>
            <div className="flex items-center gap-2 text-[12px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistema operacional e disponível</span>
            </div>
          </div>

          {/* Quick Tools Navigation */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-[12px] uppercase font-bold tracking-wider text-white">
              Ferramentas
            </h4>
            <ul className="space-y-1.5 text-[12.5px]">
              {tools.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab(t.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors flex items-center gap-1.5 text-left cursor-pointer py-0.5"
                  >
                    <t.icon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Commitments & Trust */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-[12px] uppercase font-bold tracking-wider text-white">
              Garantias
            </h4>
            <ul className="space-y-2 text-[12px] text-[#94A3B8]">
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <span>Zero dados inventados (anti-alucinação estrito)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Compatível com Mercado Livre, Shopee e redes</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Privacidade de sessão respeitada</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line with hidden easter-egg dot */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11.5px] sm:text-[12px] text-slate-500 text-center sm:text-left select-none">
          <div>
            © {new Date().getFullYear()} AnunciaAI
            <span
              onClick={onDotClick}
              className="cursor-default select-none mx-1 text-slate-700 hover:text-slate-500 transition-colors"
              role="presentation"
              title=""
            >
              •
            </span>
            Todos os direitos reservados para vendedores brasileiros.
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Desenvolvido para impulsionar o comércio real</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
