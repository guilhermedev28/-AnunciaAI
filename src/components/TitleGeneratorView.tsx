import React, { useState } from 'react';
import {
  Tag,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { TitleFormData, TitlePlatform, TitleStyle, GeneratedTitlesResult } from '../types';
import { getAnonymousSessionId, recordAppEvent } from '../lib/sessionTracker';

const PLATFORMS: { id: TitlePlatform; label: string; icon?: string }[] = [
  { id: 'Instagram', label: 'Instagram' },
  { id: 'WhatsApp', label: 'WhatsApp' },
  { id: 'Mercado Livre', label: 'Mercado Livre' },
  { id: 'Shopee', label: 'Shopee' },
  { id: 'TikTok', label: 'TikTok' },
  { id: 'Outro', label: 'Outro' },
];

const STYLES: { id: TitleStyle; label: string; description: string; emoji: string }[] = [
  {
    id: 'chamativo',
    label: 'Chamativo',
    description: 'Destaque visual e impacto comercial',
    emoji: '🔥',
  },
  {
    id: 'profissional',
    label: 'Profissional',
    description: 'Sério, confiável e bem estruturado',
    emoji: '🎯',
  },
  {
    id: 'direto',
    label: 'Curto e direto',
    description: 'Objetivo, enxuto e sem enrolação',
    emoji: '⚡',
  },
  {
    id: 'busca',
    label: 'Focado em busca',
    description: 'Palavras-chave ideais para marketplace',
    emoji: '🔎',
  },
  {
    id: 'criativo',
    label: 'Criativo',
    description: 'Diferente, envolvente e moderno',
    emoji: '✨',
  },
];

const EXAMPLE_PRODUCTS = [
  {
    name: 'Fone Bluetooth',
    category: 'Eletrônicos',
    features: 'Leve, bateria de longa duração, microfone embutido',
    price: 'R$ 120',
    platform: 'Instagram' as TitlePlatform,
    style: 'chamativo' as TitleStyle,
  },
  {
    name: 'Camiseta Básica Algodão',
    category: 'Moda Masculina',
    features: '100% algodão, gola redonda, cor preta, tamanho M',
    price: 'R$ 59,90',
    platform: 'Mercado Livre' as TitlePlatform,
    style: 'busca' as TitleStyle,
  },
  {
    name: 'Mesa de Cabeceira',
    category: 'Móveis',
    features: 'Madeira maciça, 2 gavetas com corrediças metálicas, cor off-white',
    price: 'R$ 280',
    platform: 'Shopee' as TitlePlatform,
    style: 'profissional' as TitleStyle,
  },
];

const INITIAL_FORM: TitleFormData = {
  productName: '',
  category: '',
  features: '',
  price: '',
  platform: 'Instagram',
  style: 'profissional',
};

export function TitleGeneratorView() {
  const [formData, setFormData] = useState<TitleFormData>(INITIAL_FORM);
  const [lastSubmitted, setLastSubmitted] = useState<TitleFormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedTitlesResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleInputChange = (field: keyof TitleFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleApplyExample = (example: typeof EXAMPLE_PRODUCTS[0]) => {
    setFormData({
      productName: example.name,
      category: example.category,
      features: example.features,
      price: example.price,
      platform: example.platform,
      style: example.style,
    });
    setError(null);
  };

  const handleGenerate = async (e?: React.FormEvent, overrideData?: TitleFormData) => {
    if (e) e.preventDefault();

    const dataToUse = overrideData || formData;

    if (!dataToUse.productName.trim()) {
      setError('Por favor, informe o nome do produto.');
      return;
    }

    if (!dataToUse.features.trim()) {
      setError('Por favor, informe as características reais do produto.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const eventId = 'tit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

    try {
      const response = await fetch('/api/generate-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getAnonymousSessionId(),
        },
        body: JSON.stringify({
          productName: dataToUse.productName.trim(),
          category: dataToUse.category?.trim() || '',
          features: dataToUse.features.trim(),
          price: dataToUse.price?.trim() || '',
          platform: dataToUse.platform,
          style: dataToUse.style,
          sessionId: getAnonymousSessionId(),
          eventId,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('Você atingiu o limite temporário de uso. Aguarde um pouco e tente novamente.');
        }
        throw new Error(errData.error || 'Erro ao gerar títulos. Tente novamente.');
      }

      const data: GeneratedTitlesResult = await response.json();

      // Registro do evento de telemetria após geração com sucesso
      if (data && Array.isArray(data.titles) && data.titles.length > 0) {
        recordAppEvent({
          event: 'ad_generated',
          eventId: data.eventId || eventId,
          sessionId: getAnonymousSessionId(),
          category: dataToUse.category?.trim() || 'Títulos',
        });
      }

      setResult(data);
      setLastSubmitted({ ...dataToUse });

      // Scroll suave para os resultados
      setTimeout(() => {
        const el = document.getElementById('resultado-titulos');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Erro na geração de títulos:', err);
      setError(
        err.message ||
          'Não foi possível gerar os títulos no momento. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySingle = async (title: string, index: number) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex((current) => (current === index ? null : current));
      }, 2200);
    } catch (err) {
      console.error('Erro ao copiar título:', err);
    }
  };

  const handleCopyAll = async () => {
    if (!result?.titles || result.titles.length === 0) return;
    try {
      const formatted = result.titles
        .map((t, idx) => `${idx + 1}. ${t}`)
        .join('\n');
      await navigator.clipboard.writeText(formatted);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2400);
    } catch (err) {
      console.error('Erro ao copiar todos os títulos:', err);
    }
  };

  const handleReset = () => {
    setResult(null);
    setLastSubmitted(null);
    setFormData(INITIAL_FORM);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto pt-1 pb-1">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-2.5">
          <Tag className="w-3.5 h-3.5 text-[#38BDF8]" />
          Gerador de Títulos
        </span>
        <h2 className="text-[24px] sm:text-[34px] md:text-[38px] font-extrabold text-white tracking-tight leading-snug">
          Crie títulos melhores para seu produto
        </h2>
        <p className="text-[13.5px] sm:text-[15.5px] text-[#94A3B8] mt-2 leading-relaxed">
          Escolha um estilo e gere opções de título usando apenas as informações reais do seu produto.
        </p>
      </div>

      {/* Main Input Panel */}
      <div className="bg-[#0D111A] rounded-2xl border border-[#1E2638] p-4 sm:p-7 md:p-8 shadow-xl relative w-full overflow-hidden">
        {/* Quick Example Loaders */}
        <div className="mb-5 pb-4 sm:mb-6 sm:pb-5 border-b border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span className="text-[12.5px] sm:text-[13px] font-semibold text-white tracking-wide">
              Exemplos prontos para testar:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {EXAMPLE_PRODUCTS.map((example) => (
              <button
                key={example.name}
                type="button"
                onClick={() => handleApplyExample(example)}
                disabled={isGenerating}
                className="group inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#080A0F] hover:bg-[#131824] text-[#94A3B8] hover:text-[#38BDF8] text-[11.5px] sm:text-[12.5px] font-medium border border-[#1E2638] hover:border-blue-500/40 shadow-2xs transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Carregar: ${example.name}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-[#38BDF8] transition-colors shrink-0" />
                <span className="truncate">{example.name}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5 sm:space-y-6 w-full">
          {/* Row 1: Nome do Produto e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full">
            <div>
              <label
                htmlFor="input-titulo-produto"
                className="block text-[13.5px] sm:text-[14px] font-semibold text-white mb-1.5"
              >
                1. Nome do produto <span className="text-[#38BDF8]">*</span>
              </label>
              <input
                id="input-titulo-produto"
                type="text"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                disabled={isGenerating}
                placeholder="Ex: Fone Bluetooth, Camiseta Básica, Mesa de Cabeceira..."
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-[14px] rounded-xl border border-[#1E2638] bg-[#080A0F] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 hover:border-[#2C374E] transition-all min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="input-titulo-categoria"
                className="block text-[13.5px] sm:text-[14px] font-semibold text-white mb-1.5"
              >
                2. Categoria <span className="text-[11.5px] text-[#94A3B8] font-normal">(opcional)</span>
              </label>
              <input
                id="input-titulo-categoria"
                type="text"
                value={formData.category || ''}
                onChange={(e) => handleInputChange('category', e.target.value)}
                disabled={isGenerating}
                placeholder="Ex: Eletrônicos, Moda Masculina, Decoração, Esportes..."
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-[14px] rounded-xl border border-[#1E2638] bg-[#080A0F] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 hover:border-[#2C374E] transition-all min-h-[44px]"
              />
            </div>
          </div>

          {/* Row 2: Características do Produto */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="input-titulo-caracteristicas"
                className="block text-[13.5px] sm:text-[14px] font-semibold text-white"
              >
                3. Características do produto <span className="text-[#38BDF8]">*</span>
              </label>
              <span className="text-[11.5px] text-[#94A3B8]">
                Apenas o que o produto realmente tem
              </span>
            </div>
            <textarea
              id="input-titulo-caracteristicas"
              rows={3}
              value={formData.features}
              onChange={(e) => handleInputChange('features', e.target.value)}
              disabled={isGenerating}
              placeholder="Ex: leve, bateria de longa duração, resistente a respingos, acabamento em couro sintético, cor preta..."
              className="w-full px-3.5 sm:px-4 py-3 text-[14px] rounded-xl border border-[#1E2638] bg-[#080A0F] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 hover:border-[#2C374E] transition-all resize-y min-h-[90px]"
            />
          </div>

          {/* Row 3: Preço e Plataforma */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full">
            <div>
              <label
                htmlFor="input-titulo-preco"
                className="block text-[13.5px] sm:text-[14px] font-semibold text-white mb-1.5"
              >
                4. Preço <span className="text-[11.5px] text-[#94A3B8] font-normal">(opcional)</span>
              </label>
              <input
                id="input-titulo-preco"
                type="text"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', e.target.value)}
                disabled={isGenerating}
                placeholder="Ex: R$ 120 ou 59,90 (só aparecerá se fizer sentido)"
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-[14px] rounded-xl border border-[#1E2638] bg-[#080A0F] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 hover:border-[#2C374E] transition-all min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="select-titulo-plataforma"
                className="block text-[13.5px] sm:text-[14px] font-semibold text-white mb-1.5"
              >
                5. Plataforma onde será usado
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                {PLATFORMS.map((plat) => (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => handleInputChange('platform', plat.id)}
                    disabled={isGenerating}
                    className={`px-2.5 py-2 rounded-xl text-[12px] sm:text-[12.5px] font-medium border transition-all text-center cursor-pointer min-h-[40px] truncate ${
                      formData.platform === plat.id
                        ? 'bg-[#182030] text-white border-blue-500/50 shadow-xs'
                        : 'bg-[#080A0F] text-[#94A3B8] border-[#1E2638] hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    {plat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Estilos dos Títulos */}
          <div>
            <label className="block text-[13.5px] sm:text-[14px] font-semibold text-white mb-2">
              6. Escolha o estilo dos títulos
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 w-full">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleInputChange('style', style.id)}
                  disabled={isGenerating}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    formData.style === style.id
                      ? 'bg-[#182030] border-blue-500/60 shadow-sm'
                      : 'bg-[#080A0F] border-[#1E2638] hover:border-slate-600'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5" role="img" aria-label={style.label}>
                    {style.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] sm:text-[13.5px] font-semibold text-white block">
                        {style.label}
                      </span>
                      {formData.style === style.id && (
                        <span className="w-2 h-2 rounded-full bg-[#38BDF8] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11.5px] text-[#94A3B8] mt-0.5 leading-snug">
                      {style.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[13px] text-rose-400 font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 w-full">
            <button
              id="btn-gerar-titulos"
              type="submit"
              disabled={isGenerating || !formData.productName.trim() || !formData.features.trim()}
              className="w-full min-h-[50px] sm:min-h-[52px] px-6 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:via-blue-500 hover:to-indigo-500 active:scale-98 text-white font-semibold text-[14.5px] sm:text-[15px] rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all duration-150 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white shrink-0" />
                  <span>Gerando 10 opções de títulos...</span>
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4 text-[#38BDF8] shrink-0" />
                  <span>✦ Gerar títulos</span>
                </>
              )}
            </button>
            <p className="text-center text-[11.5px] text-[#94A3B8] mt-2 leading-relaxed">
              Gera 10 opções de títulos preservando estritamente os dados reais do produto.
            </p>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && result.titles && result.titles.length > 0 && (
        <div id="resultado-titulos" className="space-y-4 sm:space-y-5 w-full">
          {/* Header of results */}
          <div className="bg-[#0D111A] rounded-2xl border border-[#1E2638] p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                  10 opções geradas
                </span>
                <span className="text-[11px] font-medium text-[#38BDF8] bg-blue-500/10 border border-blue-500/25 px-2.5 py-0.5 rounded-full">
                  {result.platform}
                </span>
                <span className="text-[11px] font-medium text-[#94A3B8] bg-[#080A0F] border border-[#1E2638] px-2.5 py-0.5 rounded-full capitalize">
                  Estilo: {result.style}
                </span>
              </div>
              <h3 className="text-[17px] sm:text-[20px] font-bold text-white mt-1.5 tracking-tight">
                Títulos para: {result.productName}
              </h3>
              <p className="text-[12px] sm:text-[13px] text-[#94A3B8] mt-0.5">
                Clique em "Copiar" na opção que melhor se adequar ao seu anúncio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-medium bg-[#080A0F] hover:bg-[#131824] text-[#94A3B8] hover:text-white border border-[#1E2638] hover:border-slate-600 transition-all cursor-pointer min-h-[40px]"
                title="Copiar todas as 10 opções"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400">Todas copiadas!</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                    <span>Copiar todas</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleGenerate(undefined, lastSubmitted || formData)}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-sm transition-all cursor-pointer min-h-[40px] disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 shrink-0 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Gerar novamente</span>
              </button>
            </div>
          </div>

          {/* List of 10 Title Cards */}
          <div className="grid grid-cols-1 gap-3 w-full">
            {result.titles.map((title, idx) => {
              const isCopied = copiedIndex === idx;
              return (
                <div
                  key={idx}
                  className={`bg-[#0D111A] rounded-xl border p-3.5 sm:p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    isCopied
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-[#1E2638] hover:border-blue-500/40'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#080A0F] border border-[#1E2638] text-[12px] sm:text-[13px] font-mono font-bold text-slate-400 flex items-center justify-center shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className="text-[14px] sm:text-[15px] font-medium text-white select-all break-words leading-snug">
                      {title}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopySingle(title, idx)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold transition-all duration-150 cursor-pointer min-h-[38px] shrink-0 self-end sm:self-center ${
                      isCopied
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#080A0F] hover:bg-[#131824] text-[#94A3B8] hover:text-white border border-[#1E2638] hover:border-blue-500/40'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Reset Action */}
          <div className="text-center pt-2 pb-2">
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] inline-flex items-center justify-center px-4 text-[13px] font-medium text-[#94A3B8] hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              ← Testar outro produto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
