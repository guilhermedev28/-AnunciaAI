import React from 'react';
import { Clock, PenTool, ShieldCheck, Zap } from 'lucide-react';

export function BenefitsSection() {
  const benefits = [
    {
      title: 'Economize tempo',
      subtitle: 'Pare de começar cada anúncio do zero.',
      description: 'Estruturas completas geradas instantaneamente para que você foque nas suas vendas e atendimento.',
      icon: <Clock className="w-5 h-5 text-[#38BDF8]" />,
    },
    {
      title: 'Escreva melhor',
      subtitle: 'Transforme informações simples em textos mais claros.',
      description: 'Linguagem comercial persuasiva que destaca as vantagens reais do produto sem rodeios.',
      icon: <PenTool className="w-5 h-5 text-[#818CF8]" />,
    },
    {
      title: 'Não inventamos seu produto',
      subtitle: 'A IA trabalha apenas com as informações fornecidas.',
      description: 'Sem falsas promessas ou recursos fantasma. O AnunciaAI respeita estritamente o que você cadastrou.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: 'Crie em segundos',
      subtitle: 'Tenha uma primeira versão pronta rapidamente.',
      description: 'Variadas opções de tom para adequar o tom ao canal: mais vendedor, profissional ou casual.',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
    },
  ];

  return (
    <section className="py-8 sm:py-16 border-t border-[#1E2638]/80 bg-[#080A0F] w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Vantagens reais
          </span>
          <h2 className="text-[22px] xs:text-[26px] sm:text-[34px] md:text-[38px] font-extrabold text-white tracking-tight mt-2.5 leading-snug">
            Feito para quem vende.
          </h2>
          <p className="text-[13.5px] sm:text-[15.5px] text-[#94A3B8] mt-2 leading-relaxed">
            Uma ferramenta pensada para pequenos negócios, lojistas e autônomos do varejo digital.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-[#0D111A] border border-[#1E2638] hover:border-slate-600/70 rounded-2xl p-4 sm:p-6 transition-all duration-200 flex flex-col justify-between shadow-sm w-full"
            >
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#080A0F] border border-[#1E2638] flex items-center justify-center mb-3.5 sm:mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-[15.5px] sm:text-[17px] font-bold text-white mb-1 tracking-tight">
                  {benefit.title}
                </h3>
                <p className="text-[13px] sm:text-[13.5px] font-medium text-slate-300 mb-1.5 sm:mb-2 leading-snug">
                  {benefit.subtitle}
                </p>
                <p className="text-[11.5px] sm:text-[12px] text-[#94A3B8] leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
