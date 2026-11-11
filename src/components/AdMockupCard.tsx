import React from 'react';
import { Sparkles, Check } from 'lucide-react';

export function AdMockupCard() {
  return (
    <div className="relative w-full max-w-full sm:max-w-[480px] mx-auto lg:max-w-none">
      {/* Ambient background soft glow */}
      <div className="absolute -inset-1.5 bg-gradient-to-tr from-blue-600/20 via-indigo-500/15 to-purple-600/20 rounded-3xl blur-xl opacity-60 pointer-events-none" />

      {/* Main Mockup Card Container */}
      <div className="relative bg-[#0D111A] border border-[#1E2638] rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/60 overflow-hidden w-full">
        {/* Top Header Layer: Optimization Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-3.5 border-b border-[#1E2638]/80">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#38BDF8] border border-blue-500/25 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#38BDF8] shrink-0" />
              Exemplo de anúncio gerado
            </span>
          </div>
          <span className="text-[10.5px] sm:text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
            <Check className="w-3 h-3" /> Formato estruturado
          </span>
        </div>

        {/* Product Identity Snippet */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8] block mb-1">
                Eletrônicos
              </span>
              <h3 className="text-[17px] sm:text-[20px] font-bold text-white tracking-tight leading-snug break-words">
                Fone Bluetooth
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10.5px] sm:text-[11px] text-[#94A3B8] block">Preço</span>
              <span className="text-[18px] sm:text-[21px] font-extrabold text-emerald-400 tracking-tight">
                R$ 120
              </span>
            </div>
          </div>

          {/* Key tags / bullet highlights (generic structural tags, no invented specs/battery/warranty) */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="px-2.5 py-1 rounded-lg text-[11px] sm:text-[11.5px] font-medium bg-[#080A0F] text-slate-300 border border-[#1E2638] flex items-center gap-1.5">
              <Check className="w-3 h-3 text-[#38BDF8] shrink-0" />
              Dados fornecidos pelo vendedor
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] sm:text-[11.5px] font-medium bg-[#080A0F] text-slate-300 border border-[#1E2638] flex items-center gap-1.5">
              <Check className="w-3 h-3 text-[#38BDF8] shrink-0" />
              Estrutura organizada
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[11px] sm:text-[11.5px] font-medium bg-[#080A0F] text-slate-300 border border-[#1E2638]">
              Linguagem direta
            </span>
          </div>

          {/* Live Generated Description Preview */}
          <div className="p-3 sm:p-4 rounded-xl bg-[#080A0F] border border-[#1E2638] text-[12.5px] sm:text-[13px] text-slate-300 leading-relaxed font-normal space-y-1.5">
            <p className="text-white font-medium text-[13px] sm:text-[13.5px]">
              "Descrição baseada nas informações fornecidas"
            </p>
            <p className="text-[#94A3B8] text-[12px] sm:text-[12.5px] leading-relaxed">
              Texto claro com apresentação do produto, organização dos dados enviados e chamada para atendimento ao comprador, sem adicionar características não informadas.
            </p>
          </div>

          {/* Micro-CTA & Conversion Bar */}
          <div className="pt-2 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-[12px]">
            <div className="flex items-center gap-1.5 text-[#94A3B8]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Tom selecionado: <strong className="text-white font-medium">Vendedor</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-[#38BDF8] border border-blue-500/30 text-[10.5px] sm:text-[11px] font-semibold flex items-center gap-1">
                <span>Mercado Livre • Shopee • WhatsApp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative corner visual stamp */}
        <div className="mt-3.5 pt-2.5 border-t border-[#1E2638]/70 flex flex-wrap items-center justify-between gap-2 text-[10.5px] sm:text-[11px] text-slate-500">
          <span>Exemplo ilustrativo</span>
          <span className="text-[#38BDF8] font-medium">Baseado nas informações fornecidas</span>
        </div>
      </div>
    </div>
  );
}
