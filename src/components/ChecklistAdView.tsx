import React, { useState } from 'react';
import {
  ListChecks,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AdChecklistResult } from '../types';
import { getAnonymousSessionId, recordAppEvent } from '../lib/sessionTracker';

const EXAMPLE_CHECKLIST_ADS = [
  {
    label: 'Tênis Nike',
    text: 'Vendo tênis Nike preto por R$180. Está em bom estado. Chama no privado.',
  },
  {
    label: 'Fone Bluetooth',
    text: 'vendo fone bluetooth 120 reais chama pv',
  },
  {
    label: 'Edição TikTok',
    text: 'Faço edição de vídeos para TikTok por R$30. Entrego o vídeo editado.',
  },
];

export function ChecklistAdView() {
  const [adText, setAdText] = useState('');
  const [lastAnalyzedText, setLastAnalyzedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checklistResult, setChecklistResult] = useState<AdChecklistResult | null>(null);

  const handleAnalyze = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();

    const targetText = overrideText !== undefined ? overrideText : adText;

    if (!targetText.trim()) {
      setError('Por favor, cole o texto do anúncio que deseja analisar.');
      return;
    }

    if (targetText.trim().length < 10) {
      setError('O texto do anúncio está muito curto. Cole o texto completo para uma análise precisa.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const eventId = 'chk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

    try {
      const textToSubmit = targetText.trim();
      const response = await fetch('/api/check-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getAnonymousSessionId(),
        },
        body: JSON.stringify({
          adText: textToSubmit,
          sessionId: getAnonymousSessionId(),
          eventId,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('Você atingiu o limite temporário de uso. Aguarde um pouco e tente novamente.');
        }
        throw new Error(errData.error || 'Erro ao processar o checklist. Tente novamente.');
      }

      const data: AdChecklistResult = await response.json();

      if (data && typeof data.completenessScore === 'number') {
        recordAppEvent({
          event: 'ad_checklist_analyzed' as any,
          eventId: data.eventId || eventId,
          sessionId: getAnonymousSessionId(),
          score: data.completenessScore,
        });
      }

      setChecklistResult(data);
      setLastAnalyzedText(textToSubmit);

      // Scroll suave para os resultados
      setTimeout(() => {
        const el = document.getElementById('resultado-checklist');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Erro na análise de checklist:', err);
      setError(
        err.message ||
          'Não foi possível analisar o checklist no momento. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyExample = (text: string) => {
    setAdText(text);
    setError(null);
  };

  const handleReset = () => {
    setChecklistResult(null);
    setAdText('');
    setLastAnalyzedText('');
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 65) return 'text-[#38BDF8] border-blue-500/30 bg-blue-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-400';
    if (score >= 65) return 'from-blue-500 to-cyan-400';
    if (score >= 50) return 'from-amber-500 to-yellow-400';
    return 'from-rose-500 to-orange-400';
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-[#38BDF8] border border-blue-500/20 uppercase tracking-widest mb-3">
          <ListChecks className="w-3.5 h-3.5" />
          <span>Checklist Inteligente</span>
        </div>
        <h2 className="text-[26px] sm:text-[36px] font-extrabold text-white tracking-tight leading-tight">
          Veja o que falta no seu anúncio
        </h2>
        <p className="text-[14px] sm:text-[15px] text-[#94A3B8] mt-2 leading-relaxed">
          Descubra quais informações podem deixar seu anúncio mais completo, sem inventar nada.
        </p>
      </div>

      {/* Main Input Form */}
      <div className="max-w-3xl mx-auto w-full">
        <form
          onSubmit={(e) => handleAnalyze(e)}
          className="bg-[#0D111A] border border-[#1E2638] rounded-2xl p-5 sm:p-7 shadow-xl space-y-5"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="checklist-ad-text" className="text-[13.5px] font-semibold text-slate-200">
                Texto do anúncio
              </label>
              <span className="text-[12px] text-slate-500">
                {adText.length} caracteres
              </span>
            </div>

            <textarea
              id="checklist-ad-text"
              rows={5}
              value={adText}
              onChange={(e) => {
                setAdText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Cole seu anúncio aqui... Ex: Vendo tênis Nike preto por R$180. Está em bom estado. Chama no privado."
              disabled={isAnalyzing}
              className="w-full bg-[#080A0F] border border-[#1E2638] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8] rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-500 outline-none transition-all resize-y leading-relaxed"
            />
          </div>

          {/* Quick Examples */}
          <div>
            <span className="text-[12px] text-slate-400 block mb-2 font-medium">
              Ou teste com um exemplo rápido:
            </span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_CHECKLIST_ADS.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyExample(ex.text)}
                  disabled={isAnalyzing}
                  className="text-[12px] px-3 py-1.5 rounded-lg bg-[#141A26] hover:bg-[#1C2436] text-slate-300 hover:text-white border border-[#1E2638] hover:border-blue-500/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[13px] leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-analisar-checklist"
              type="submit"
              disabled={isAnalyzing || !adText.trim()}
              className="w-full sm:w-auto px-7 py-3 min-h-[46px] rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-[14px] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analisando checklist...</span>
                </>
              ) : (
                <>
                  <ListChecks className="w-4 h-4" />
                  <span>Analisar checklist</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* RESULTS DISPLAY */}
      {checklistResult && (
        <div id="resultado-checklist" className="max-w-4xl mx-auto w-full space-y-6 pt-4">
          {/* Card 1: Score & Overview */}
          <div className="bg-[#0D111A] border border-[#1E2638] rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#1E2638]">
              <div className="space-y-1.5">
                <span className="text-[11.5px] uppercase tracking-wider font-semibold text-slate-400">
                  Diagnóstico de completude
                </span>
                <h3 className="text-[20px] sm:text-[24px] font-bold text-white tracking-tight">
                  Completude do anúncio
                </h3>
                <p className="text-[13.5px] sm:text-[14px] text-slate-300 max-w-xl leading-relaxed">
                  {checklistResult.scoreExplanation}
                </p>
              </div>

              <div className="flex items-baseline gap-1.5 self-start sm:self-center shrink-0">
                <div className={`px-4 py-2 rounded-xl border text-center font-extrabold text-[32px] sm:text-[38px] tabular-nums ${getScoreColor(checklistResult.completenessScore)}`}>
                  {checklistResult.completenessScore}
                  <span className="text-[16px] text-slate-400 font-normal">/100</span>
                </div>
              </div>
            </div>

            {/* Score progress bar */}
            <div className="mt-5 space-y-2">
              <div className="w-full bg-[#141A26] rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getScoreBarColor(checklistResult.completenessScore)} transition-all duration-500`}
                  style={{ width: `${checklistResult.completenessScore}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Produto identificado: <strong className="text-slate-300 font-semibold">{checklistResult.productIdentified}</strong></span>
                {checklistResult.productCategory && (
                  <span>Categoria: <strong className="text-slate-400 font-medium">{checklistResult.productCategory}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Informações já encontradas */}
          <div className="bg-[#0D111A] border border-[#1E2638] rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h4 className="text-[16px] sm:text-[17px] font-bold text-white">
                O que seu anúncio já informa
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {checklistResult.detectedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-[#080A0F] border border-[#1E2638] text-[13px]"
                >
                  <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                  <div>
                    <span className="text-slate-300 font-medium">{item.field}</span>
                    {item.value && (
                      <span className="text-slate-400 ml-1.5 font-normal">
                        : <strong className="text-white font-semibold">{item.value}</strong>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Classificação Inteligente (Essencial, Recomendado, Opcional) */}
          <div className="space-y-4">
            <h4 className="text-[14px] uppercase tracking-wider font-bold text-slate-400 px-1">
              O que pode estar faltando
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 🔴 ESSENCIAL */}
              <div className="bg-[#0D111A] border border-rose-500/20 rounded-2xl p-5 shadow-lg space-y-3.5 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    🔴 Essencial
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {checklistResult.missingItems.essential.length} {checklistResult.missingItems.essential.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <p className="text-[11.5px] text-slate-400 leading-snug">
                  Informações indispensáveis para quem vai comprar este tipo de produto.
                </p>

                <div className="pt-1 flex-1">
                  {checklistResult.missingItems.essential.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12.5px]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Nenhuma informação essencial faltando!</span>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {checklistResult.missingItems.essential.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-[#080A0F] border border-rose-500/20 text-[12.5px] text-slate-200 leading-snug"
                        >
                          <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* 🟡 RECOMENDADO */}
              <div className="bg-[#0D111A] border border-amber-500/20 rounded-2xl p-5 shadow-lg space-y-3.5 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    🟡 Recomendado
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {checklistResult.missingItems.recommended.length} {checklistResult.missingItems.recommended.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <p className="text-[11.5px] text-slate-400 leading-snug">
                  Facilita a decisão, reduz dúvidas e acelera a negociação.
                </p>

                <div className="pt-1 flex-1">
                  {checklistResult.missingItems.recommended.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12.5px]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Nenhum detalhe recomendado pendente.</span>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {checklistResult.missingItems.recommended.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-[#080A0F] border border-amber-500/20 text-[12.5px] text-slate-200 leading-snug"
                        >
                          <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* 🟢 OPCIONAL */}
              <div className="bg-[#0D111A] border border-emerald-500/20 rounded-2xl p-5 shadow-lg space-y-3.5 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    🟢 Opcional
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {checklistResult.missingItems.optional.length} {checklistResult.missingItems.optional.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <p className="text-[11.5px] text-slate-400 leading-snug">
                  Pode agregar valor, mas não é estritamente necessário.
                </p>

                <div className="pt-1 flex-1">
                  {checklistResult.missingItems.optional.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 text-slate-400 text-[12.5px]">
                      <span>Nenhum item opcional pendente.</span>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {checklistResult.missingItems.optional.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 p-2.5 rounded-lg bg-[#080A0F] border border-emerald-500/20 text-[12.5px] text-slate-200 leading-snug"
                        >
                          <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: 💡 Como melhorar */}
          {checklistResult.recommendations.length > 0 && (
            <div className="bg-[#0D111A] border border-blue-500/20 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <h4 className="text-[16px] sm:text-[17px] font-bold text-white">
                  Como melhorar
                </h4>
              </div>

              <div className="space-y-2.5">
                {checklistResult.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-[#080A0F] border border-[#1E2638] text-[13.5px] text-slate-200 leading-relaxed"
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-[#38BDF8] text-[11px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0D111A]/80 border border-[#1E2638]">
            <div className="text-[13px] text-slate-400 text-center sm:text-left">
              Fidelidade total às informações do anúncio • Zero dados inventados
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#182030] hover:bg-[#202B40] text-white border border-[#1E2638] text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Analisar outro anúncio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
