import React, { useState } from 'react';
import {
  Tag,
  FileText,
  Star,
  Smartphone,
  MessageCircle,
  Copy,
  Check,
  RotateCcw,
  ArrowLeft,
  ShieldCheck,
  SearchCheck,
} from 'lucide-react';
import { GeneratedAdResult, AdFormData } from '../types';
import { ResultCard } from './ResultCard';
import { buildCleanFullAdText, cleanSingleCta } from '../lib/adGeneratorCore';

interface AdResultsProps {
  result: GeneratedAdResult;
  formData: AdFormData;
  onReset: () => void;
  onRegenerate: () => void;
  onAnalyzeAd?: (adText: string) => void;
  isGenerating: boolean;
}

export function AdResults({
  result,
  formData,
  onReset,
  onRegenerate,
  onAnalyzeAd,
  isGenerating,
}: AdResultsProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCtaIndex, setCopiedCtaIndex] = useState<number | null>(null);

  const hasBenefits = result.benefits && result.benefits.length > 0;
  const fullKitText = buildCleanFullAdText(result);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(fullKitText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2200);
    } catch (err) {
      console.error('Erro ao copiar tudo:', err);
    }
  };

  const handleCopyCta = async (ctaText: string, index: number) => {
    try {
      await navigator.clipboard.writeText(ctaText);
      setCopiedCtaIndex(index);
      setTimeout(() => setCopiedCtaIndex(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar CTA:', err);
    }
  };

  return (
    <section id="anuncio-resultados" className="w-full space-y-5 sm:space-y-6 pt-2 sm:pt-4">
      {/* Workspace Header Bar */}
      <div className="bg-[#0D111A] rounded-2xl border border-[#1E2638] p-4 sm:p-7 shadow-xl w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Informações verificadas (Sem invenções)
              </span>
              {formData.platform && (
                <span className="text-[11.5px] font-medium text-[#38BDF8] bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                  {formData.platform}
                </span>
              )}
              <span className="text-[12px] text-[#94A3B8]">
                Tom: <strong className="text-white font-medium capitalize">{formData.tone}</strong>
              </span>
            </div>
            <h2 className="text-[20px] sm:text-[26px] font-extrabold text-white tracking-tight leading-snug break-words">
              Seu anúncio está organizado e pronto.
            </h2>
            <p className="text-[13px] sm:text-[13.5px] text-[#94A3B8] break-words">
              Produto: <span className="text-white font-semibold">{formData.productName}</span>
              {formData.price && (
                <> • Preço: <span className="text-emerald-400 font-medium">{formData.price}</span></>
              )}
              {formData.category && (
                <> • Categoria: <span className="text-slate-300 font-medium">{formData.category}</span></>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            {/* Primary Action: Copiar Anúncio Completo (somente dados úteis do anúncio) */}
            <button
              id="btn-copiar-tudo"
              type="button"
              onClick={handleCopyAll}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] rounded-xl font-semibold text-[13.5px] sm:text-[14px] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-md active:scale-98 ${
                copiedAll
                  ? 'bg-emerald-600 text-white shadow-emerald-900/30 ring-2 ring-emerald-400/40'
                  : 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/20'
              }`}
              title="Copiar anúncio limpo pronto para colar (sem textos de interface)"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 text-white shrink-0" />
                  <span className="font-bold">✓ Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 shrink-0" />
                  <span>Copiar anúncio</span>
                </>
              )}
            </button>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Analisar este anúncio diretamente */}
              {onAnalyzeAd && (
                <button
                  id="btn-analisar-este-anuncio"
                  type="button"
                  onClick={() => onAnalyzeAd(fullKitText)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] sm:min-h-[46px] rounded-xl font-semibold text-[13px] text-[#38BDF8] hover:text-white bg-blue-500/10 hover:bg-blue-600 border border-blue-500/25 hover:border-blue-500 transition-all cursor-pointer shadow-2xs"
                  title="Enviar anúncio diretamente para o diagnóstico profissional"
                >
                  <SearchCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Analisar anúncio</span>
                </button>
              )}

              {/* Variation button */}
              <button
                id="btn-gerar-novamente"
                type="button"
                onClick={onRegenerate}
                disabled={isGenerating}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] sm:min-h-[46px] rounded-xl font-medium text-[13px] text-slate-300 hover:text-white bg-[#080A0F] border border-[#1E2638] hover:border-slate-600 transition-all disabled:opacity-50 cursor-pointer"
                title="Gerar nova variação mantendo as informações fornecidas"
              >
                <RotateCcw className={`w-3.5 h-3.5 shrink-0 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Gerar novamente</span>
              </button>

              {/* Novo anúncio */}
              <button
                type="button"
                onClick={onReset}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] sm:min-h-[46px] rounded-xl font-medium text-[13px] text-[#94A3B8] hover:text-white bg-[#080A0F] border border-[#1E2638] hover:border-slate-600 transition-all cursor-pointer"
                title="Começar um novo anúncio do zero"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span>Novo anúncio</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Workspace Blocks (1 a 5) */}
      <div className="space-y-4 sm:space-y-5 w-full">
        {/* 1. Título */}
        <ResultCard
          id="card-titulo"
          badgeNumber={1}
          title="Título"
          subtitle="Formulado com clareza, palavras-chave reais e alta atratividade"
          icon={<Tag className="w-4 h-4 text-[#38BDF8]" />}
          contentToCopy={result.title}
        >
          <div className="p-3.5 sm:p-5 bg-[#080A0F] rounded-xl border border-[#1E2638] font-bold text-white text-[15px] sm:text-[18px] select-all break-words leading-snug">
            {result.title}
          </div>
        </ResultCard>

        {/* 2. Descrição */}
        <ResultCard
          id="card-descricao"
          badgeNumber={2}
          title="Descrição"
          subtitle="Texto completo e persuasivo, estruturado estritamente com base nos dados fornecidos"
          icon={<FileText className="w-4 h-4 text-[#818CF8]" />}
          contentToCopy={result.fullDescription}
        >
          <div className="p-3.5 sm:p-5 bg-[#080A0F] rounded-xl border border-[#1E2638] whitespace-pre-line text-[#F5F7FA] leading-relaxed font-normal text-[14px] sm:text-[15px] break-words select-text">
            {result.fullDescription}
          </div>
        </ResultCard>

        {/* 3. Pontos de destaque/benefícios */}
        <ResultCard
          id="card-beneficios"
          badgeNumber={3}
          title="Pontos de destaque / Benefícios"
          subtitle="Apresentados apenas quando sustentados pelas características reais informadas"
          icon={<Star className="w-4 h-4 text-emerald-400" />}
          contentToCopy={
            hasBenefits
              ? result.benefits.map((b) => `• ${b}`).join('\n')
              : 'Benefícios apresentados conforme as características informadas pelo vendedor.'
          }
        >
          {hasBenefits ? (
            <ul className="space-y-2 sm:space-y-2.5">
              {result.benefits.map((benefit, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 sm:gap-3 p-3 bg-[#080A0F] rounded-xl border border-[#1E2638]"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[#F5F7FA] text-[13.5px] sm:text-[14px] font-normal leading-snug break-words select-text">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3.5 bg-[#080A0F] rounded-xl border border-[#1E2638] text-[12.5px] text-[#94A3B8]">
              Nenhum benefício adicional foi inventado além das características descritas.
            </div>
          )}
        </ResultCard>

        {/* 4. Versão curta para WhatsApp / Redes sociais */}
        <ResultCard
          id="card-texto-curto"
          badgeNumber={4}
          title="Versão curta para WhatsApp / Redes sociais"
          subtitle="Formato sintético e direto para Direct do Instagram, WhatsApp, Stories ou mensagens rápidas"
          icon={<Smartphone className="w-4 h-4 text-amber-400" />}
          contentToCopy={result.shortText}
        >
          <div className="p-3.5 sm:p-4 bg-[#080A0F] rounded-xl border border-[#1E2638] whitespace-pre-line text-[#F5F7FA] leading-relaxed text-[13.5px] sm:text-[14px] font-normal break-words select-text">
            {result.shortText}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-[11.5px] text-[#94A3B8] px-1">
            <span>{result.shortText.length} caracteres</span>
            <span className="text-emerald-400 font-medium">
              Pronto para envio imediato
            </span>
          </div>
        </ResultCard>

        {/* 5. CTA (Chamadas para Ação) */}
        <ResultCard
          id="card-ctas"
          badgeNumber={5}
          title="CTA (Chamada para Ação)"
          subtitle="Opções neutras de contato ou fechamento, sem frases inventadas de escassez ou disponibilidade"
          icon={<MessageCircle className="w-4 h-4 text-[#818CF8]" />}
          contentToCopy={cleanSingleCta(result.callToActions?.[0]) || 'Entre em contato para saber mais.'}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {result.callToActions.map((cta, idx) => {
              const cleanCtaText = cleanSingleCta(cta);
              const isCopied = copiedCtaIndex === idx;
              return (
                <div
                  key={idx}
                  className="p-3.5 bg-[#080A0F] rounded-xl border border-[#1E2638] flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-[#38BDF8] border border-blue-500/20 mb-2">
                      Opção {idx + 1}
                    </span>
                    <p className="text-[13px] font-medium text-white break-words leading-snug select-text">
                      {cleanCtaText}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCta(cleanCtaText, idx)}
                    className={`self-end min-h-[34px] px-2.5 py-1 rounded-lg text-[11.5px] font-medium transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 ${
                      isCopied
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#0D111A] text-[#94A3B8] hover:text-white border border-[#1E2638] hover:border-slate-600'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">✓ Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </ResultCard>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 pb-4">
        <button
          type="button"
          onClick={handleCopyAll}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-md"
        >
          {copiedAll ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>✓ Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar anúncio</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-medium text-[#94A3B8] hover:text-white bg-[#0D111A] border border-[#1E2638] hover:border-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Começar novo anúncio</span>
        </button>
      </div>
    </section>
  );
}
