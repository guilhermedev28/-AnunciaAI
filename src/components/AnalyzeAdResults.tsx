import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
  BarChart2,
  FileQuestion,
  Tag,
  AlertCircle,
  Loader2,
  Wand2,
} from 'lucide-react';
import { AdAnalysisResult } from '../types';
import {
  cleanFormattingArtifacts,
  isValidFieldContent,
  sanitizeImprovedAdText,
  generateFallbackImprovedAd,
} from '../lib/adAnalysis';
import { getAnonymousSessionId } from '../lib/sessionTracker';

interface AnalyzeAdResultsProps {
  result: AdAnalysisResult;
  originalText: string;
  onReset: () => void;
  onReanalyze: () => void;
  isAnalyzing: boolean;
}

export function AnalyzeAdResults({
  result,
  originalText,
  onReset,
  onReanalyze,
  isAnalyzing,
}: AnalyzeAdResultsProps) {
  const [improvedText, setImprovedText] = useState<string | null>(() => {
    if (result.improvedVersion && result.improvedVersion.trim().length > 10) {
      return sanitizeImprovedAdText(result.improvedVersion, originalText);
    }
    return null;
  });
  const [isImproving, setIsImproving] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [copiedImproved, setCopiedImproved] = useState(false);

  const handleImproveAd = async () => {
    if (isImproving) return; // Impede cliques duplicados
    setIsImproving(true);
    setImproveError(null);

    try {
      const response = await fetch('/api/improve-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getAnonymousSessionId(),
        },
        body: JSON.stringify({
          adText: originalText,
          sessionId: getAnonymousSessionId(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Não foi possível melhorar o anúncio no momento.');
      }

      const data = await response.json();
      const sanitized = sanitizeImprovedAdText(data.improvedText || '', originalText);
      setImprovedText(sanitized || generateFallbackImprovedAd(originalText));

      // Scroll suave até a versão melhorada
      setTimeout(() => {
        const el = document.getElementById('secao-versao-melhorada');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error('Erro ao melhorar anúncio:', err);
      // Fallback determinístico seguro preservando dados
      try {
        const fallback = generateFallbackImprovedAd(originalText);
        const fallbackSanitized = sanitizeImprovedAdText(fallback, originalText);
        if (fallbackSanitized && fallbackSanitized.length > 15) {
          setImprovedText(fallbackSanitized);
          return;
        }
      } catch {
        // ignore
      }
      setImproveError(
        err.message || 'Não foi possível melhorar o anúncio no momento. Suas informações originais continuam salvas.'
      );
    } finally {
      setIsImproving(false);
    }
  };

  const handleCopyImproved = async () => {
    if (!improvedText) return;
    try {
      const textToCopy = sanitizeImprovedAdText(improvedText, originalText);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedImproved(true);
      setTimeout(() => setCopiedImproved(false), 2400);
    } catch (err) {
      console.error('Erro ao copiar versão melhorada:', err);
    }
  };

  // Color logic for score
  const getScoreTheme = (score: number) => {
    if (score >= 80) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25',
        progress: 'bg-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      };
    }
    if (score >= 60) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/25',
        progress: 'bg-amber-500',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      };
    }
    return {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/25',
      progress: 'bg-rose-500',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    };
  };

  const theme = getScoreTheme(result.score);

  // Missing fields with 3 priority tiers: Essencial (🔴), Recomendável (🟡), Opcional (🟢)
  const classifiedList = result.classifiedMissingFields || [];

  interface DisplayMissingItem {
    field: string;
    level: 'essencial' | 'recomendavel' | 'opcional';
    reason: string;
  }

  const displayMissingItems: DisplayMissingItem[] =
    classifiedList.length > 0
      ? classifiedList.map((item) => ({
          field: item.field,
          level: item.level,
          reason:
            item.reason ||
            (item.level === 'essencial'
              ? 'Ausência impede o comprador de entender ou avaliar adequadamente o anúncio.'
              : item.level === 'recomendavel'
              ? 'Poderia melhorar a qualidade e conversão, mas a ausência não torna o anúncio ruim.'
              : 'Informação complementar opcional para este item específico.'),
        }))
      : (result.missingFields || []).map((m) => {
          let level: 'essencial' | 'recomendavel' | 'opcional' = 'recomendavel';
          let clean = m;
          if (m.includes('🔴') || m.toLowerCase().includes('essencial')) {
            level = 'essencial';
            clean = m.replace(/^(🔴|⚠️)?\s*(ESSENCIAL:)?\s*/i, '');
          } else if (m.includes('🟡') || m.toLowerCase().includes('recomendável') || m.toLowerCase().includes('recomendavel')) {
            level = 'recomendavel';
            clean = m.replace(/^(🟡|⚠️)?\s*(RECOMENDÁVEL:)?\s*/i, '');
          } else if (m.includes('🟢') || m.toLowerCase().includes('opcional')) {
            level = 'opcional';
            clean = m.replace(/^(🟢|⚠️)?\s*(OPCIONAL:)?\s*/i, '');
          } else {
            clean = m.replace(/^⚠️\s*(Informação não fornecida:)?\s*/i, '');
          }
          const parts = clean.split(' - ');
          return {
            field: parts[0]?.trim() || clean,
            level,
            reason:
              parts[1]?.trim() ||
              (level === 'essencial'
                ? 'Ausência impede o comprador de entender ou avaliar adequadamente o anúncio.'
                : level === 'recomendavel'
                ? 'Poderia melhorar a qualidade e conversão, mas a ausência não torna o anúncio ruim.'
                : 'Informação complementar opcional para este item específico.'),
          };
        });

  const countEssenciais = displayMissingItems.filter((i) => i.level === 'essencial').length;
  const countRecomendaveis = displayMissingItems.filter((i) => i.level === 'recomendavel').length;
  const countOpcionais = displayMissingItems.filter((i) => i.level === 'opcional').length;

  // Detected fields from result (filtered to strictly valid content)
  const detectedFieldsList = (result.detectedFields || []).filter(
    (item) => item && item.field && isValidFieldContent(item.value)
  );
  const poorlyPresentedList = result.poorlyPresentedFields || [];

  return (
    <div id="resultado-analise" className="space-y-4 sm:space-y-6 w-full">
      {/* 1. Nota Geral de 0 a 100 Card */}
      <div className="bg-[#0D111A] rounded-2xl border border-[#1E2638] p-3.5 sm:p-7 shadow-sm w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5 pb-4 sm:pb-6 border-b border-[#1E2638]">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Score badge */}
            <div
              className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl ${theme.bg} ${theme.border} border flex flex-col items-center justify-center shrink-0 shadow-xs`}
            >
              <span className={`text-xl sm:text-3xl font-extrabold ${theme.text} leading-none tracking-tight`}>
                {result.score}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-[#94A3B8] mt-0.5">de 100</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span
                  className={`text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badge}`}
                >
                  {result.scoreLabel || (result.score >= 90 ? 'Excelente' : result.score >= 75 ? 'Bom' : result.score >= 60 ? 'Razoável' : result.score >= 40 ? 'Fraco' : 'Muito Ruim')}
                </span>
                {result.detectedCategory && (
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-medium text-[#38BDF8] bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded-full">
                    <Tag className="w-3 h-3 text-[#38BDF8]" />
                    Categoria: {result.detectedCategory}
                  </span>
                )}
              </div>
              <h2 className="text-[16px] sm:text-[20px] font-bold text-white mt-1.5 tracking-tight break-words">
                Avaliação da qualidade do anúncio
              </h2>
              <p className="text-[12.5px] sm:text-[14px] text-[#94A3B8] mt-1 max-w-2xl leading-relaxed font-normal break-words">
                {result.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onReanalyze}
              disabled={isAnalyzing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] sm:min-h-[40px] rounded-xl text-[13px] font-medium text-[#94A3B8] hover:text-white bg-[#080A0F] border border-[#1E2638] hover:border-slate-600 transition-all disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <RotateCcw className={`w-3.5 h-3.5 shrink-0 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>Reanalisar</span>
            </button>
          </div>
        </div>

        {/* Critérios Avaliados (Breakdown) */}
        {result.criteriaBreakdown && result.criteriaBreakdown.length > 0 && (
          <div className="mt-4 sm:mt-6 w-full">
            <h4 className="text-[11.5px] sm:text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2.5 sm:mb-3 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-[#38BDF8] shrink-0" />
              Detalhamento dos critérios avaliados
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 w-full">
              {result.criteriaBreakdown.map((item, idx) => {
                const itemScore = item.score || 50;
                const itemTheme = getScoreTheme(itemScore);
                return (
                  <div
                    key={idx}
                    className="p-3 sm:p-3.5 rounded-xl border border-[#1E2638] bg-[#080A0F] flex flex-col justify-between gap-1"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[12.5px] sm:text-[13px] font-semibold text-white line-clamp-1">
                          {item.criterion}
                        </span>
                        <span className={`text-[11.5px] sm:text-[12px] font-bold ${itemTheme.text} tabular-nums`}>
                          {itemScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/80 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${itemTheme.progress}`}
                          style={{ width: `${Math.max(5, Math.min(100, itemScore))}%` }}
                        />
                      </div>
                      <p className="text-[11.5px] sm:text-[12px] text-[#94A3B8] leading-snug font-normal">
                        {item.feedback}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 1: Informações Reconhecidas no Anúncio (Presentes) */}
      {detectedFieldsList.length > 0 && (
        <div
          id="secao-informacoes-identificadas"
          className="bg-[#0D111A] rounded-2xl border border-emerald-500/25 p-3.5 sm:p-6 shadow-sm w-full"
        >
          <div className="flex items-start gap-3 pb-3 mb-3 border-b border-[#1E2638]">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[13.5px] sm:text-[15px] font-semibold text-white">
                  Informações identificadas no anúncio
                </h3>
                <span className="text-[10.5px] sm:text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded-full">
                  {detectedFieldsList.length} detectados
                </span>
              </div>
              <p className="text-[11.5px] sm:text-[12px] text-[#94A3B8] mt-0.5 leading-relaxed font-normal">
                O AnunciaAI reconheceu estas informações no anúncio original e <strong>não as considerou ausentes</strong>:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-3 w-full">
            {detectedFieldsList.map((item, idx) => {
              const isMalApresentado = item.status === 'mal_apresentado';
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                    isMalApresentado
                      ? 'bg-amber-500/5 border-amber-500/30 text-amber-200'
                      : 'bg-[#080A0F] border-[#1E2638] text-[#F5F7FA]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-white flex items-center gap-1.5 text-[12px]">
                      {isMalApresentado ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <span className="text-emerald-400 font-semibold">✓</span>
                      )}
                      {item.field}:
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        isMalApresentado
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      }`}
                    >
                      {isMalApresentado ? 'Ajustar' : 'Informado'}
                    </span>
                  </div>
                  {item.value && (
                    <p className="font-normal text-[#F5F7FA] bg-[#0D111A] px-2 py-1 rounded border border-[#1E2638] mt-0.5 break-words text-[11.5px]">
                      "{item.value}"
                    </p>
                  )}
                  {item.details && (
                    <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug font-normal">
                      {item.details}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEÇÃO 2: Informações Não Fornecidas */}
      <div
        id="secao-informacoes-preencher"
        className="bg-[#0D111A] rounded-2xl border border-[#1E2638] p-3.5 sm:p-6 shadow-sm w-full"
      >
        <div className="flex items-start gap-3 pb-3 mb-3 border-b border-[#1E2638]">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#080A0F] border border-[#1E2638] text-[#38BDF8] flex items-center justify-center shrink-0">
            <FileQuestion className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[13.5px] sm:text-[15px] font-semibold text-white">
                O que está faltando no anúncio
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] sm:text-[11px] font-medium">
                {countEssenciais > 0 && (
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>🔴</span> {countEssenciais} {countEssenciais === 1 ? 'essencial' : 'essenciais'}
                  </span>
                )}
                {countRecomendaveis > 0 && (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>🟡</span> {countRecomendaveis} {countRecomendaveis === 1 ? 'recomendável' : 'recomendáveis'}
                  </span>
                )}
                {countOpcionais > 0 && (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>🟢</span> {countOpcionais} {countOpcionais === 1 ? 'opcional' : 'opcionais'}
                  </span>
                )}
                {displayMissingItems.length === 0 && (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                    Todas fornecidas
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11.5px] sm:text-[12px] text-[#94A3B8] mt-0.5 leading-relaxed font-normal">
              Diferenciação por prioridade para <strong>{result.detectedCategory || 'este produto'}</strong>:
            </p>
          </div>
        </div>

        {displayMissingItems.length > 0 ? (
          <div className="space-y-2 sm:space-y-2.5 mt-2 w-full">
            {displayMissingItems.map((item, idx) => {
              const isEssencial = item.level === 'essencial';
              const isRecomendavel = item.level === 'recomendavel';

              const itemCardStyle = isEssencial
                ? 'bg-rose-500/5 border-rose-500/25 text-rose-200'
                : isRecomendavel
                ? 'bg-amber-500/5 border-amber-500/25 text-amber-200'
                : 'bg-emerald-500/5 border-emerald-500/25 text-emerald-200';

              const badgeStyle = isEssencial
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : isRecomendavel
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

              const badgeLabel = isEssencial
                ? '🔴 ESSENCIAL'
                : isRecomendavel
                ? '🟡 RECOMENDÁVEL'
                : '🟢 OPCIONAL';

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors w-full ${itemCardStyle}`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[9.5px] sm:text-[10px] tracking-wide border shrink-0 ${badgeStyle}`}
                    >
                      {badgeLabel}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-white block sm:inline mr-1.5 text-[12.5px] sm:text-[13px] break-words">
                        {item.field}
                      </span>
                      <span className="text-[#94A3B8] text-[11.5px] sm:text-[12px] leading-relaxed font-normal break-words">
                        {item.reason}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/25 text-[12.5px] text-emerald-400 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Nenhuma pendência encontrada! Todas as informações essenciais foram informadas pelo vendedor.</span>
          </div>
        )}

        {/* Itens presentes, mas mal apresentados */}
        {poorlyPresentedList.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-[#1E2638]">
            <h5 className="text-[11.5px] sm:text-[12px] font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Itens presentes que necessitam de ajuste de redação:
            </h5>
            <ul className="space-y-1.5">
              {poorlyPresentedList.map((item, idx) => (
                <li key={idx} className="text-[11.5px] sm:text-[12px] text-amber-300 bg-amber-500/10 border border-amber-500/25 p-2 rounded-lg leading-snug font-normal break-words">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Grid: 3. Pontos Fortes, 4. Problemas, 5. Recomendações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 w-full">
        {/* Pontos Fortes */}
        <div className="bg-[#0D111A] rounded-2xl border border-[#1E2638] p-3.5 sm:p-5 shadow-sm flex flex-col w-full">
          <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-[#1E2638]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13.5px] sm:text-[14px] font-semibold text-white">Pontos Fortes</h3>
              <p className="text-[11px] sm:text-[12px] text-[#94A3B8] font-normal">O que funcionou bem</p>
            </div>
          </div>
          <ul className="space-y-2 sm:space-y-2.5 flex-1">
            {result.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[12.5px] sm:text-[13px] text-[#F5F7FA] leading-snug font-normal break-words">
                <span className="text-emerald-400 font-semibold shrink-0 mt-0.5">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Problemas Encontrados */}
        <div className="bg-[#0D111A] rounded-2xl border border-[#1E2638] p-3.5 sm:p-5 shadow-sm flex flex-col w-full">
          <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-[#1E2638]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13.5px] sm:text-[14px] font-semibold text-white">Pontos a Corrigir</h3>
              <p className="text-[11px] sm:text-[12px] text-[#94A3B8] font-normal">Fatores que reduzem conversão</p>
            </div>
          </div>
          <ul className="space-y-2 sm:space-y-2.5 flex-1">
            {result.issues.map((issue, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[12.5px] sm:text-[13px] text-[#F5F7FA] leading-snug font-normal break-words">
                <span className="text-rose-400 font-semibold shrink-0 mt-0.5">✕</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recomendações Específicas */}
        <div className="bg-[#0D111A] rounded-2xl border border-[#1E2638] p-3.5 sm:p-5 shadow-sm flex flex-col w-full">
          <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-[#1E2638]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 text-[#38BDF8] flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13.5px] sm:text-[14px] font-semibold text-white">Recomendações Práticas</h3>
              <p className="text-[11px] sm:text-[12px] text-[#94A3B8] font-normal">Dicas para aplicar agora</p>
            </div>
          </div>
          <ul className="space-y-2 sm:space-y-2.5 flex-1">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[12.5px] sm:text-[13px] text-[#F5F7FA] leading-snug font-normal break-words">
                <span className="text-[#38BDF8] font-semibold shrink-0 mt-0.5">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Painel de Ação: ✨ Melhorar anúncio */}
      <div className="bg-gradient-to-b from-[#0F172A] to-[#0D111A] rounded-2xl border border-blue-500/40 p-4 sm:p-6 shadow-xl relative overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <span className="text-[10.5px] sm:text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
              Aprimoramento sem invenções
            </span>
            <h3 className="text-[17px] sm:text-[20px] font-bold text-white tracking-tight leading-snug">
              {improvedText ? 'Deseja gerar outra variação melhorada?' : 'Transforme este diagnóstico em um anúncio pronto'}
            </h3>
            <p className="text-[12.5px] sm:text-[13.5px] text-[#94A3B8] leading-relaxed">
              Reescreve o anúncio com clareza, correção e organização profissional, usando exclusivamente as informações do texto original.
            </p>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <button
              id="btn-melhorar-anuncio"
              type="button"
              onClick={handleImproveAd}
              disabled={isImproving}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl font-bold text-[14px] sm:text-[14.5px] text-white bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:via-blue-500 hover:to-indigo-500 active:scale-98 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all duration-150 inline-flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Gerar versão melhorada do anúncio com base exclusiva nas informações originais"
            >
              {isImproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span>Aprimorando anúncio...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white shrink-0" />
                  <span>{improvedText ? '✨ Melhorar novamente' : '✨ Melhorar anúncio'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading state indicator */}
        {isImproving && (
          <div className="mt-4 pt-4 border-t border-[#1E2638] flex items-center gap-3 text-[12.5px] text-[#38BDF8] bg-blue-500/5 p-3 rounded-xl border border-blue-500/20">
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#38BDF8]" />
            <span>Processando texto original, organizando especificações e aplicando regras anti-alucinação...</span>
          </div>
        )}

        {/* Friendly Error Notice */}
        {improveError && (
          <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12.5px] text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{improveError}</span>
            </div>
            <button
              type="button"
              onClick={handleImproveAd}
              disabled={isImproving}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-white rounded-lg text-[12px] font-semibold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/* Seção: Versão melhorada */}
      {improvedText && (
        <div id="secao-versao-melhorada" className="bg-[#0D111A] rounded-2xl border border-blue-500/35 p-3.5 sm:p-7 shadow-xl relative overflow-hidden w-full space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-3.5 border-b border-[#1E2638]">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10.5px] sm:text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
                    Pronto para Vender
                  </span>
                  <span className="text-[10.5px] sm:text-[11px] font-medium text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/25">
                    100% fiel ao original
                  </span>
                  <span className="text-[10.5px] sm:text-[11px] font-medium text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                    Sem placeholders
                  </span>
                </div>
                <h3 className="text-[16px] sm:text-[20px] font-bold text-white mt-1 break-words">
                  Versão melhorada
                </h3>
                <p className="text-[11.5px] sm:text-[13px] text-[#94A3B8] mt-0.5 font-normal break-words">
                  Texto limpo e estruturado para você copiar e colar diretamente no canal de venda.
                </p>
              </div>
            </div>

            {/* Copiar versão melhorada */}
            <button
              id="btn-copiar-versao-melhorada"
              type="button"
              onClick={handleCopyImproved}
              className={`w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13.5px] sm:text-[14px] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm ${
                copiedImproved
                  ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-98'
              }`}
              title="Copiar exclusivamente o texto da versão melhorada"
            >
              {copiedImproved ? (
                <>
                  <Check className="w-4 h-4 shrink-0 text-white" />
                  <span>Versão melhorada copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 shrink-0" />
                  <span>Copiar versão melhorada</span>
                </>
              )}
            </button>
          </div>

          {/* Text of Improved Version */}
          <div className="p-4 sm:p-6 bg-[#080A0F] rounded-xl border border-[#1E2638] whitespace-pre-line text-[#F5F7FA] text-[14px] sm:text-[15px] leading-relaxed font-normal select-all break-words w-full shadow-inner">
            {improvedText}
          </div>
        </div>
      )}

      {/* Comparison View: Original vs Melhorada */}
      <div className="bg-[#0D111A] rounded-2xl border border-[#1E2638] p-3.5 sm:p-5 w-full">
        <details className="group">
          <summary className="cursor-pointer font-medium text-[12.5px] sm:text-[13px] text-[#94A3B8] hover:text-white flex items-center justify-between list-none py-1">
            <span className="flex items-center gap-2">
              <span>Comparar com o anúncio original colado</span>
            </span>
            <span className="text-[#38BDF8] text-xs group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="mt-3 pt-3 border-t border-[#1E2638] text-[12.5px] sm:text-[13px] text-[#94A3B8] whitespace-pre-line bg-[#080A0F] p-3.5 rounded-xl border border-[#1E2638] break-words font-normal leading-relaxed">
            {originalText}
          </div>
        </details>
      </div>

      {/* Action to analyze another */}
      <div className="text-center pt-2 pb-4">
        <button
          type="button"
          onClick={onReset}
          className="min-h-[44px] inline-flex items-center justify-center px-4 text-[13px] font-medium text-[#94A3B8] hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ← Analisar outro anúncio
        </button>
      </div>
    </div>
  );
}
