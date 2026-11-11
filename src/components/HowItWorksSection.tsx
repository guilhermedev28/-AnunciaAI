import React from 'react';
import { PenLine, Cpu, CopyCheck, ArrowRight } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Conte sobre o produto',
      description: 'Informe as características que você conhece.',
      detail: 'Nome, diferenciais, preço e público. Sem complicação ou formulários infinitos.',
      icon: <PenLine className="w-5 h-5 text-[#38BDF8]" />,
    },
    {
      number: '02',
      title: 'A IA transforma',
      description: 'O AnunciaAI organiza as informações em um anúncio melhor.',
      detail: 'Estruturação de títulos atrativos, descrição persuasiva e pontos de valor reais.',
      icon: <Cpu className="w-5 h-5 text-[#818CF8]" />,
    },
    {
      number: '03',
      title: 'Copie e publique',
      description: 'Use o resultado onde quiser.',
      detail: 'Formatações prontas para Mercado Livre, Shopee, Instagram, WhatsApp e OLX.',
      icon: <CopyCheck className="w-5 h-5 text-emerald-400" />,
    },
  ];

  return (
    <section id="como-funciona" className="py-8 sm:py-16 border-t border-[#1E2638]/80 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            Fluxo simplificado
          </span>
          <h2 className="text-[22px] xs:text-[26px] sm:text-[34px] md:text-[38px] font-extrabold text-white tracking-tight mt-2.5 leading-snug">
            Do produto ao anúncio em segundos.
          </h2>
          <p className="text-[13.5px] sm:text-[15.5px] text-[#94A3B8] mt-2 leading-relaxed">
            Criar textos que vendem nunca foi tão direto. Três passos para anúncios profissionais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className="relative group bg-[#0D111A] border border-[#1E2638] hover:border-blue-500/40 rounded-2xl p-4 sm:p-7 transition-all duration-200 flex flex-col justify-between shadow-sm w-full"
            >
              <div>
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <span className="text-[24px] sm:text-[28px] font-extrabold text-slate-600 group-hover:text-blue-400/80 transition-colors font-mono tracking-tighter">
                    {step.number}
                  </span>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#080A0F] border border-[#1E2638] flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-[16px] sm:text-[18px] font-bold text-white mb-1.5 sm:mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-[13.5px] sm:text-[14px] font-medium text-slate-300 leading-snug mb-1.5 sm:mb-2">
                  {step.description}
                </p>
                <p className="text-[12px] sm:text-[12.5px] text-[#94A3B8] leading-relaxed">
                  {step.detail}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-[#080A0F] border border-[#1E2638] text-slate-500">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
