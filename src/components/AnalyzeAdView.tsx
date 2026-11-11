import React, { useState, useEffect } from 'react';
import {
  SearchCheck,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { AdAnalysisResult } from '../types';
import { EXAMPLE_ADS_TO_ANALYZE } from '../data/examples';
import { AnalyzeAdResults } from './AnalyzeAdResults';
import { getAnonymousSessionId, recordAppEvent } from '../lib/sessionTracker';
import { cleanFormattingArtifacts } from '../lib/adAnalysis';

interface AnalyzeAdViewProps {
  initialText?: string;
}

export function AnalyzeAdView({ initialText }: AnalyzeAdViewProps = {}) {
  const [adText, setAdText] = useState(initialText || '');
  const [lastAnalyzedText, setLastAnalyzedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AdAnalysisResult | null>(null);

  useEffect(() => {
    if (initialText && initialText.trim()) {
      setAdText(initialText.trim());
      setError(null);
      setSuccessNotice('Texto do anúncio carregado! Clique em "✦ Analisar anúncio" para começar o diagnóstico.');
    }
  }, [initialText]);

  const handleAnalyze = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();

    const targetText = overrideText !== undefined ? overrideText : adText;

    if (!targetText.trim()) {
      setError('Por favor, cole o texto do anúncio que deseja analisar.');
      return;
    }

    if (targetText.trim().length < 15) {
      setError('O texto do anúncio está muito curto. Cole o texto completo para uma análise precisa.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuccessNotice(null);

    const eventId = 'ana_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

    try {
      const textToSubmit = targetText.trim();
      const response = await fetch('/api/analyze-ad', {
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
        throw new Error(errData.error || 'Erro ao analisar o anúncio. Tente novamente.');
      }

      const data: AdAnalysisResult = await response.json();

      // Registro do evento APENAS após sucesso confirmado e com dados válidos
      if (data && typeof data.score === 'number' && data.summary) {
        recordAppEvent({
          event: 'ad_analyzed',
          eventId: data.eventId || eventId,
          sessionId: getAnonymousSessionId(),
          score: data.score,
          scoreLabel: data.scoreLabel,
        });
      }

      if (data && typeof data.improvedVersion === 'string') {
        data.improvedVersion = cleanFormattingArtifacts(data.improvedVersion);
      }
      setAnalysisResult(data);
      setLastAnalyzedText(textToSubmit);
      setAdText('');
      setSuccessNotice('Análise concluída! Você já pode analisar outro anúncio.');

      setTimeout(() => {
        const el = document.getElementById('resultado-analise');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Erro na análise:', err);
      setError(
        err.message ||
          'Não foi possível analisar o anúncio no momento. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyExample = (text: string) => {
    setAdText(text);
    setError(null);
    setSuccessNotice(null);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setLastAnalyzedText('');
    setAdText('');
    setSuccessNotice(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      {/* Workspace Diagnostic Header */}
      <div className="text-center max-w-2xl mx-auto pt-1 pb-1">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2.5">
          <SearchCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
          Diagnóstico Profissional de Anúncio
        </span>
        <h2 className="text-[24px] sm:text-[34px] md:text-[38px] font-extrabold text-white tracking-tight leading-snug">
          Avalie e aprimore qualquer anúncio.
        </h2>
        <p className="text-[13.5px] sm:text-[15.5px] text-[#94A3B8] mt-2 leading-relaxed">
          Cole o texto que você já utiliza e receba pontuação de 0 a 100, identificação de pontos cegos e a versão melhorada para publicar.
        </p>
      </div>

      {/* Main Analysis Input Panel */}
      <div className="bg-[#0D111A] rounded-2xl border border-[#1E2638] p-4 sm:p-7 md:p-8 shadow-xl relative w-full overflow-hidden">
        {/* Quick Example Loaders */}
        <div className="mb-5 pb-4 sm:mb-6 sm:pb-5 border-b border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span className="text-[12.5px] sm:text-[13px] font-semibold text-white tracking-wide">
              Exemplos de teste rápido:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {EXAMPLE_ADS_TO_ANALYZE.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => handleApplyExample(example.text)}
                disabled={isAnalyzing}
                className="group inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#080A0F] hover:bg-[#131824] text-[#94A3B8] hover:text-[#38BDF8] text-[11.5px] sm:text-[12.5px] font-medium border border-[#1E2638] hover:border-blue-500/40 shadow-2xs transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed max-w-full"
                title={`Carregar exemplo: ${example.label}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-[#38BDF8] transition-colors shrink-0" />
                <span className="truncate">{example.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-5 sm:space-y-6 w-full">
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="input-ad-text"
                className="block text-[13.5px] sm:text-[14px] font-semibold text-white leading-tight"
              >
                Texto do anúncio para avaliar
              </label>
              <span className="text-[11.5px] text-[#94A3B8] tabular-nums">
                {adText.length} caracteres
              </span>
            </div>

            <textarea
              id="input-ad-text"
              rows={6}
              value={adText}
              onChange={(e) => {
                setAdText(e.target.value);
                if (error) setError(null);
                if (successNotice) setSuccessNotice(null);
              }}
              disabled={isAnalyzing}
              placeholder="Cole aqui o texto do anúncio que você já usa ou deseja testar (título, descrição, detalhes, preço, etc)..."
              className="w-full px-3.5 sm:px-4 py-3 text-[14px] rounded-xl border border-[#1E2638] bg-[#080A0F] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 hover:border-[#2C374E] transition-all resize-y min-h-[130px] min-w-0"
            />
          </div>

          {/* Diagnostic Criteria Evaluated */}
          <div className="bg-[#080A0F] border border-[#1E2638] rounded-xl p-3.5 sm:p-5 text-[12px] sm:text-[12.5px] text-[#94A3B8] w-full">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-[#38BDF8] shrink-0" />
              <span className="font-semibold text-white text-[12.5px] sm:text-[13px]">
                Critérios avaliados na pontuação de 0 a 100:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 w-full">
              <div className="flex items-center gap-2 text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0" />
                <span>Atratividade do título</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0" />
                <span>Clareza da descrição</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0" />
                <span>Benefícios claros</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0" />
                <span>Poder de convencimento</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0" />
                <span>Chamada para ação (CTA)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0" />
                <span>Informações faltantes</span>
              </div>
            </div>
          </div>

          {successNotice && !error && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[12.5px] text-emerald-400 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[12.5px] text-rose-400 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action CTA */}
          <div className="pt-1 w-full">
            <button
              id="btn-analisar-anuncio"
              type="submit"
              disabled={isAnalyzing || !adText.trim()}
              className="w-full min-h-[50px] sm:min-h-[52px] px-6 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:via-blue-500 hover:to-indigo-500 active:scale-98 text-white font-semibold text-[14.5px] sm:text-[15px] rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all duration-150 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white shrink-0" />
                  <span className="truncate sm:overflow-visible">Analisando anúncio com inteligência artificial...</span>
                </>
              ) : (
                <>
                  <SearchCheck className="w-4 h-4 text-[#38BDF8] shrink-0" />
                  <span>✦ Analisar anúncio</span>
                </>
              )}
            </button>
            <p className="text-center text-[11.5px] text-[#94A3B8] mt-2 leading-relaxed">
              Receba nota de 0 a 100, pontos fortes, o que está faltando e a versão melhorada.
            </p>
          </div>
        </form>
      </div>

      {/* Results View */}
      {analysisResult && (
        <AnalyzeAdResults
          result={analysisResult}
          originalText={lastAnalyzedText || adText}
          onReset={handleReset}
          onReanalyze={() => handleAnalyze(undefined, lastAnalyzedText)}
          isAnalyzing={isAnalyzing}
        />
      )}
    </div>
  );
}
