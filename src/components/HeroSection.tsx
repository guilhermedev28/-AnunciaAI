import React from 'react';
import {
  Sparkles,
  SearchCheck,
  Tag,
  ListChecks,
  Camera,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { AdMockupCard } from './AdMockupCard';
import { AppTab } from '../types';

interface HeroSectionProps {
  onCtaClick: () => void;
  onHowItWorksClick: () => void;
  onSelectTab: (tab: AppTab) => void;
  activeTab?: AppTab;
}

export function HeroSection({
  onCtaClick,
  onHowItWorksClick,
  onSelectTab,
  activeTab = 'gerar',
}: HeroSectionProps) {
  const tools = [
    {
      id: 'gerar' as AppTab,
      badge: 'Principal',
      title: 'Criar anúncio',
      desc: 'Gera título, descrição completa, tópicos de benefícios, texto para WhatsApp e chamadas para ação.',
      icon: Sparkles,
      color: 'text-[#38BDF8]',
      bgIcon: 'bg-blue-500/10 border-blue-500/20 text-[#38BDF8]',
      actionText: 'Criar anúncio agora',
    },
    {
      id: 'analisar' as AppTab,
      badge: 'Auditoria',
      title: 'Analisar anúncio',
      desc: 'Avalie a nota de 0 a 100, identifique pontos fortes, dados ausentes e receba uma versão melhorada.',
      icon: SearchCheck,
      color: 'text-amber-400',
      bgIcon: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      actionText: 'Avaliar meu texto',
    },
    {
      id: 'titulos' as AppTab,
      badge: 'SEO & Busca',
      title: 'Gerar títulos',
      desc: 'Crie 10 opções de títulos chamativos, focado em busca ou profissional para qualquer plataforma.',
      icon: Tag,
      color: 'text-indigo-400',
      bgIcon: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      actionText: 'Gerar 10 títulos',
    },
    {
      id: 'checklist' as AppTab,
      badge: 'Validação',
      title: 'Checklist do anúncio',
      desc: 'Verifique se seu anúncio contém informações essenciais, recomendadas e opcionais antes de publicar.',
      icon: ListChecks,
      color: 'text-purple-400',
      bgIcon: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      actionText: 'Verificar itens',
    },
    {
      id: 'foto' as AppTab,
      badge: 'Diagnóstico visual',
      title: 'Analisar foto',
      desc: 'Descubra a nota da sua imagem com diagnóstico de iluminação, enquadramento e visibilidade do produto.',
      icon: Camera,
      color: 'text-emerald-400',
      bgIcon: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      actionText: 'Analisar foto',
    },
  ];

  return (
    <section className="relative pt-3 pb-8 sm:pt-8 sm:pb-12 lg:pb-16 overflow-hidden">
      {/* Background subtle radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[380px] bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Hero: Headline + Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-4 sm:space-y-5 w-full">
            {/* Badge: O que é o AnunciaAI */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1424] border border-blue-500/30 text-[#38BDF8] text-[12px] sm:text-[13px] font-semibold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
              <span>Inteligência Artificial para vendedores</span>
            </div>

            {/* Main Grand Title */}
            <h1 className="text-[28px] xs:text-[32px] sm:text-[42px] md:text-[48px] lg:text-[52px] font-extrabold text-white tracking-tight leading-[1.15] max-w-[640px] break-words">
              Anúncios profissionais para seus produtos,{' '}
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                sem inventar informações.
              </span>
            </h1>

            {/* Supporting Pitch Paragraph (O que é e o que faz) */}
            <p className="text-[14.5px] sm:text-[16.5px] md:text-[17.5px] font-normal text-[#94A3B8] leading-relaxed max-w-[560px]">
              O AnunciaAI transforma as informações do seu produto em anúncios claros e estruturados para diferentes canais de venda, priorizando os dados reais fornecidos pelo vendedor.
            </p>

            {/* Para quem é (Target Audience Chipset) */}
            <div className="w-full pt-0.5">
              <div className="text-[11.5px] sm:text-[12px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>Formatos para múltiplos canais de venda:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {['Mercado Livre', 'Shopee', 'Instagram', 'WhatsApp', 'OLX', 'E-commerce'].map((channel) => (
                  <span
                    key={channel}
                    className="text-[11.5px] sm:text-[12px] font-medium text-slate-300 bg-[#0D111A] border border-[#1E2638] px-2.5 py-1 rounded-lg"
                  >
                    {channel}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onCtaClick}
                className="w-full sm:w-auto min-h-[48px] sm:min-h-[50px] px-6 sm:px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-[14.5px] sm:text-[15px] shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-center"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Criar meu anúncio agora</span>
              </button>

              <button
                type="button"
                onClick={onHowItWorksClick}
                className="w-full sm:w-auto min-h-[46px] sm:min-h-[50px] px-5 py-3 rounded-xl bg-[#0D111A] hover:bg-[#151C2C] text-slate-300 hover:text-white border border-[#1E2638] hover:border-slate-600 text-[13.5px] sm:text-[14px] font-medium transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-center"
              >
                <span>Ver como funciona</span>
              </button>
            </div>

            {/* Trust Points */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 text-[12px] sm:text-[12.5px] text-[#94A3B8] font-normal w-full">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Baseado nos seus dados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Sem dados inventados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Estrutura pronta para usar</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Mockup */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end mt-2 lg:mt-0">
            <AdMockupCard />
          </div>
        </div>

        {/* Section: "O QUE CONSIGO FAZER AQUI?" - Interactive Tool Hub */}
        <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-[#1E2638]/70">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full mb-2">
                <span>O que consigo fazer aqui</span>
              </div>
              <h2 className="text-[20px] sm:text-[26px] font-bold text-white tracking-tight">
                Ferramentas especializadas para cada etapa do anúncio
              </h2>
            </div>
            <p className="text-[13px] sm:text-[13.5px] text-[#94A3B8] max-w-md">
              Escolha uma ferramenta abaixo para começar ou use o menu de navegação.
            </p>
          </div>

          {/* 5-Tool Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isCurrent = activeTab === tool.id;
              return (
                <div
                  key={tool.id}
                  onClick={() => onSelectTab(tool.id)}
                  className={`group relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer border ${
                    isCurrent
                      ? 'bg-[#111726] border-blue-500/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30'
                      : 'bg-[#0D111A] border-[#1E2638] hover:border-slate-600/80 hover:bg-[#111624]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${tool.bgIcon}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10.5px] font-semibold text-slate-400 bg-[#080A0F] border border-[#1E2638] px-2 py-0.5 rounded-md">
                        {tool.badge}
                      </span>
                    </div>
                    <h3 className="text-[14.5px] sm:text-[15px] font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-[12px] text-[#94A3B8] leading-relaxed mb-4">
                      {tool.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1E2638]/60 flex items-center justify-between text-[12px] font-semibold">
                    <span className={isCurrent ? 'text-[#38BDF8]' : 'text-slate-300 group-hover:text-white transition-colors'}>
                      {isCurrent ? 'Em uso' : tool.actionText}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${isCurrent ? 'text-[#38BDF8]' : 'text-slate-400 group-hover:text-white'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
