import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import {
  Camera,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  RotateCcw,
  Sun,
  Crop,
  Eye,
  Layers,
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { PhotoAnalysisResult, PhotoImprovementItem } from '../types';
import { getAnonymousSessionId, recordAppEvent } from '../lib/sessionTracker';

// Helper para verificar se um arquivo é uma imagem válida
function isImageFile(file: unknown): file is File {
  if (!file || typeof file !== 'object') return false;
  const f = file as File;
  if (typeof f.size !== 'number' || f.size <= 0) return false;
  if (f.type && f.type.toLowerCase().startsWith('image/')) return true;
  if (typeof f.name === 'string' && /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(f.name)) return true;
  return false;
}

// Helper para determinar o MIME type correto da imagem
function resolveImageMimeType(file: File): string {
  if (file.type && file.type.toLowerCase().startsWith('image/')) {
    return file.type.toLowerCase();
  }
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  if (name.endsWith('.bmp')) return 'image/bmp';
  return 'image/jpeg';
}

// Helper para converter o arquivo File real em base64 puro (sem prefixo data:image/...)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        if (base64Data && base64Data.trim()) {
          resolve(base64Data.trim());
        } else {
          reject(new Error('Falha ao processar os dados da imagem.'));
        }
      } else {
        reject(new Error('Falha ao processar os dados da imagem.'));
      }
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Não foi possível ler o arquivo da imagem.'));
    };
    reader.readAsDataURL(file);
  });
}

const MAX_PHOTO_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB

export function AnalyzePhotoView() {
  // 1. Armazena o objeto File REAL da imagem tanto em state quanto em ref para blindagem
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const selectedFileRef = useRef<File | null>(null);

  // 2. Armazena a URL exclusiva para pré-visualização no navegador
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpeza de memória da URL de pré-visualização ao desmontar ou trocar
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (file: File) => {
    // 1. Validação estrita do arquivo real
    if (!isImageFile(file)) {
      setError('Envie uma imagem válida para realizar a análise.');
      return;
    }

    // 2. Limite amigável de tamanho de arquivo (30MB)
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setError('Essa imagem é muito grande. Escolha uma imagem menor.');
      return;
    }

    setError(null);
    selectedFileRef.current = file;
    setSelectedFile(file);

    // 3. Gera a prévia visual usando URL.createObjectURL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleAnalyzePhoto = async () => {
    const targetFile = selectedFile || selectedFileRef.current;

    // Validação rigorosa do arquivo REAL armazenado
    if (!targetFile || !isImageFile(targetFile)) {
      setError('Envie uma imagem válida para realizar a análise.');
      return;
    }

    if (targetFile.size > MAX_PHOTO_SIZE_BYTES) {
      setError('Essa imagem é muito grande. Escolha uma imagem menor.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const eventId = 'pho_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

    try {
      // Converte o objeto File REAL armazenado para base64 puro
      const base64Data = await fileToBase64(targetFile);
      const mimeType = resolveImageMimeType(targetFile);

      const response = await fetch('/api/analyze-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getAnonymousSessionId(),
        },
        body: JSON.stringify({
          image: base64Data,
          imageBase64: base64Data, // Envia ambos para garantir compatibilidade máxima
          mimeType,
          fileName: targetFile.name,
          sessionId: getAnonymousSessionId(),
          eventId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 429) {
          throw new Error('Você atingiu o limite temporário de uso. Aguarde um pouco e tente novamente.');
        } else if (response.status === 400) {
          throw new Error(errorData?.error || 'Envie uma imagem válida para realizar a análise.');
        } else if (response.status === 413) {
          throw new Error('Essa imagem é muito grande. Escolha uma imagem menor.');
        } else if (response.status === 422) {
          throw new Error('Não conseguimos analisar essa imagem. Tente enviar outra foto.');
        } else {
          throw new Error(errorData?.error || 'Não foi possível analisar a foto agora. Tente novamente.');
        }
      }

      const data: PhotoAnalysisResult = await response.json();

      if (data && typeof data.score === 'number') {
        recordAppEvent({
          event: 'ad_checklist_analyzed' as any,
          eventId: data.eventId || eventId,
          sessionId: getAnonymousSessionId(),
          score: data.score,
        });
      }

      setAnalysisResult(data);

      setTimeout(() => {
        const el = document.getElementById('resultado-analise-foto');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Erro ao analisar foto:', err);
      setError(err.message || 'Não foi possível analisar a foto agora. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    selectedFileRef.current = null;
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getIndicatorBadge = (rating: string) => {
    switch (rating) {
      case 'Boa':
      case 'Bom':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
          label: rating,
        };
      case 'Regular':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
          label: rating,
        };
      case 'Precisa melhorar':
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
          label: rating,
        };
    }
  };

  const getPriorityBadge = (priority: PhotoImprovementItem['priority']) => {
    switch (priority) {
      case 'Alta prioridade':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Alta prioridade
          </span>
        );
      case 'Média prioridade':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Média prioridade
          </span>
        );
      case 'Baixa prioridade':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Baixa prioridade
          </span>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 70) return 'text-[#38BDF8] border-blue-500/40 bg-blue-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-4xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = '';
        }}
        onChange={handleInputChange}
        disabled={isAnalyzing}
      />

      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-semibold text-[#38BDF8] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
          <Camera className="w-3.5 h-3.5" />
          Análise visual
        </span>
        <h2 className="text-[24px] sm:text-[34px] font-extrabold text-white tracking-tight mt-2.5 leading-snug">
          📸 Analisar foto do produto
        </h2>
        <p className="text-[14px] sm:text-[15px] text-[#94A3B8] mt-1.5 leading-relaxed">
          Descubra se sua foto está pronta para anunciar e veja o que pode melhorar.
        </p>
      </div>

      {/* Upload Box or Image Preview Card */}
      <div className="bg-[#0D111A] border border-[#1E2638] rounded-2xl p-4 sm:p-7 shadow-xl">
        {!previewUrl ? (
          /* Area grande de upload de imagem */
          <div
            id="photo-upload-dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleTriggerFileInput}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[260px] ${
              isDragging
                ? 'border-[#38BDF8] bg-blue-500/10 scale-[0.99]'
                : 'border-[#1E2638] hover:border-[#38BDF8]/60 bg-[#07090E]/60 hover:bg-[#07090E]'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#38BDF8] mb-4 shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-[17px] sm:text-[19px] font-bold text-white mb-1.5">
              Envie uma foto do seu produto
            </h3>
            <p className="text-[13px] sm:text-[14px] text-[#94A3B8] max-w-md mx-auto mb-5 leading-relaxed">
              Analise iluminação, enquadramento, visibilidade e qualidade da imagem.
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerFileInput();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#182030] hover:bg-[#20293D] text-white border border-blue-500/30 text-[13.5px] font-semibold transition-all shadow-sm cursor-pointer active:scale-98"
            >
              <Camera className="w-4 h-4 text-[#38BDF8]" />
              <span>📷 Escolher foto</span>
            </button>

            <p className="text-[11.5px] text-slate-500 mt-4">
              Arraste e solte ou toque para selecionar (JPG, PNG ou WEBP)
            </p>
          </div>
        ) : (
          /* Previsualização da foto selecionada */
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#38BDF8]" />
                <span className="text-[13px] font-semibold text-white">
                  Pré-visualização da foto
                </span>
                {selectedFile && (
                  <span className="text-[11.5px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                    ({selectedFile.name})
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleTriggerFileInput}
                disabled={isAnalyzing}
                className="text-[12px] font-medium text-[#38BDF8] hover:text-[#7dd3fc] hover:underline cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                Trocar foto
              </button>
            </div>

            {/* Container da Imagem */}
            <div className="relative rounded-xl overflow-hidden bg-black/50 border border-[#1E2638] flex items-center justify-center min-h-[220px] max-h-[460px] p-2">
              <img
                src={previewUrl}
                alt="Foto do produto selecionada"
                className="max-h-[420px] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            {/* Botão de Análise */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="btn-analisar-foto"
                type="button"
                onClick={handleAnalyzePhoto}
                disabled={isAnalyzing}
                className="w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2 py-3 px-7 rounded-xl text-[14.5px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 shadow-lg shadow-blue-600/25 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-98"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analisando sua foto...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-200" />
                    <span>Analisar foto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isAnalyzing}
                className="w-full sm:w-auto py-3 px-5 rounded-xl text-[13.5px] font-semibold text-[#94A3B8] hover:text-white bg-[#141B2B] hover:bg-[#1A2338] border border-[#1E2638] transition-all cursor-pointer disabled:opacity-50"
              >
                Limpar
              </button>
            </div>

            {/* Loading Feedback Visual */}
            {isAnalyzing && (
              <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center space-y-1 animate-pulse">
                <p className="text-[13.5px] font-bold text-white flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
                  Analisando sua foto...
                </p>
                <p className="text-[12px] text-[#94A3B8]">
                  Avaliando qualidade, iluminação, enquadramento e apresentação.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mensagem de Erro Amigável */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}
      </div>

      {/* CARD DE RESULTADOS DA ANÁLISE */}
      {analysisResult && (
        <div
          id="resultado-analise-foto"
          className="bg-[#0D111A] border border-[#1E2638] rounded-2xl p-4 sm:p-7 shadow-2xl space-y-6 animate-fadeIn"
        >
          {/* Header do Card de Resultado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2638] pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Diagnóstico visual
                </span>
              </div>
              <h3 className="text-[20px] sm:text-[22px] font-extrabold text-white">
                Resultado da análise
              </h3>
            </div>

            {/* Score Display (Nota da Foto) */}
            <div className="flex items-center gap-3 self-start sm:self-auto bg-[#07090E] px-4 py-2.5 rounded-xl border border-[#1E2638]">
              <div className="text-left">
                <span className="text-[11px] font-semibold text-[#94A3B8] block uppercase tracking-wider">
                  ⭐ Nota da foto
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Apresentação para anúncio
                </span>
              </div>
              <div
                className={`text-[24px] sm:text-[28px] font-black px-3 py-0.5 rounded-lg border tabular-nums ${getScoreColor(
                  analysisResult.score
                )}`}
              >
                {analysisResult.score}
                <span className="text-[14px] font-normal text-[#94A3B8] ml-0.5">/100</span>
              </div>
            </div>
          </div>

          {/* Grid de Indicadores Visuais */}
          <div>
            <h4 className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3">
              Indicadores de apresentação
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Qualidade */}
              <div className="bg-[#07090E] border border-[#1E2638] p-3 rounded-xl flex flex-col justify-between min-h-[82px]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11.5px] font-medium">
                  <Camera className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>📷 Qualidade</span>
                </div>
                {(() => {
                  const b = getIndicatorBadge(analysisResult.indicators.qualidade);
                  return (
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11.5px] font-semibold border ${b.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                      <span className="truncate">{b.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Iluminação */}
              <div className="bg-[#07090E] border border-[#1E2638] p-3 rounded-xl flex flex-col justify-between min-h-[82px]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11.5px] font-medium">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>💡 Iluminação</span>
                </div>
                {(() => {
                  const b = getIndicatorBadge(analysisResult.indicators.iluminacao);
                  return (
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11.5px] font-semibold border ${b.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                      <span className="truncate">{b.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Enquadramento */}
              <div className="bg-[#07090E] border border-[#1E2638] p-3 rounded-xl flex flex-col justify-between min-h-[82px]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11.5px] font-medium">
                  <Crop className="w-3.5 h-3.5 text-blue-400" />
                  <span>🎯 Enquadramento</span>
                </div>
                {(() => {
                  const b = getIndicatorBadge(analysisResult.indicators.enquadramento);
                  return (
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11.5px] font-semibold border ${b.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                      <span className="truncate">{b.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Visibilidade */}
              <div className="bg-[#07090E] border border-[#1E2638] p-3 rounded-xl flex flex-col justify-between min-h-[82px]">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11.5px] font-medium">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>👀 Visibilidade</span>
                </div>
                {(() => {
                  const b = getIndicatorBadge(analysisResult.indicators.visibilidade);
                  return (
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11.5px] font-semibold border ${b.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                      <span className="truncate">{b.label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Fundo */}
              <div className="bg-[#07090E] border border-[#1E2638] p-3 rounded-xl flex flex-col justify-between min-h-[82px] col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11.5px] font-medium">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>🧹 Fundo</span>
                </div>
                {(() => {
                  const b = getIndicatorBadge(analysisResult.indicators.fundo);
                  return (
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11.5px] font-semibold border ${b.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                      <span className="truncate">{b.label}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Duas colunas: O que está bom & O que pode melhorar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Seção: ✓ O que está bom */}
            <div className="bg-[#07090E] border border-[#1E2638] rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <h4 className="text-[14px] font-bold text-white">
                  ✓ O que está bom
                </h4>
              </div>

              {analysisResult.strengths && analysisResult.strengths.length > 0 ? (
                <ul className="space-y-2.5">
                  {analysisResult.strengths.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-[13px] text-[#CBD5E1] leading-relaxed"
                    >
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12.5px] text-slate-500 italic">
                  Nenhum ponto de destaque imediato identificado.
                </p>
              )}
            </div>

            {/* Seção: ⚠️ O que pode melhorar */}
            <div className="bg-[#07090E] border border-[#1E2638] rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <h4 className="text-[14px] font-bold text-white">
                  ⚠️ O que pode melhorar
                </h4>
              </div>

              {analysisResult.improvements && analysisResult.improvements.length > 0 ? (
                <ul className="space-y-3">
                  {analysisResult.improvements.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex flex-col gap-1 text-[13px] text-[#CBD5E1] leading-relaxed pb-2 border-b border-[#1E2638]/60 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-white">{item.text}</span>
                        {getPriorityBadge(item.priority)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12.5px] text-slate-500 italic">
                  A imagem apresenta boa conformidade visual para anúncios.
                </p>
              )}
            </div>
          </div>

          {/* Seção: 💡 Para sua próxima foto */}
          {analysisResult.nextPhotoTips && analysisResult.nextPhotoTips.length > 0 && (
            <div className="bg-gradient-to-r from-blue-950/30 to-indigo-950/20 border border-blue-500/25 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#38BDF8] shrink-0" />
                <h4 className="text-[14px] font-bold text-white">
                  💡 Para sua próxima foto
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {analysisResult.nextPhotoTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0D111A]/80 border border-[#1E2638] rounded-lg p-3 text-[12.5px] text-[#CBD5E1] leading-relaxed"
                  >
                    <span className="font-bold text-[#38BDF8] block mb-1">
                      {idx + 1}. Dica prática
                    </span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rodapé do Resultado com Botão "Analisar outra foto" */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1E2638]">
            <p className="text-[11.5px] text-slate-500 text-center sm:text-left">
              Avaliação estritamente visual para anúncios • Não avalia originalidade nem funcionamento
            </p>

            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13.5px] font-semibold text-white bg-[#182030] hover:bg-[#20293D] border border-blue-500/30 transition-all shadow-sm cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-4 h-4 text-[#38BDF8]" />
              <span>🔄 Analisar outra foto</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
