import {
  PhotoAnalysisResult,
  PhotoImprovementItem,
  PhotoQualityRating,
  PhotoEnquadramentoRating,
  PhotoFundoRating,
  PhotoPriorityLevel,
} from '../types';

/**
 * Palavras e expressões proibidas que afirmam autenticidade, funcionamento interno,
 * defeitos não visíveis ou especificações técnicas inventadas.
 */
const BANNED_PATTERNS = [
  /\b(é|produto)\s+original\b/i,
  /\b(é|produto)\s+falso\b/i,
  /\b(é|produto)\s+réplica\b/i,
  /\b(100%|totalmente)\s+autêntico\b/i,
  /\bautenticidade\s+garantida\b/i,
  /\bautenticidade\s+confirmada\b/i,
  /\bconfirmar\s+autenticidade\b/i,
  /\bfuncionando\s+perfeitamente\b/i,
  /\bsem\s+defeitos\s+internos\b/i,
  /\bgarantia\s+de\s+fábrica\b/i,
  /\bproduto\s+está\s+danificado\b/i,
  /\bo\s+produto\s+é\s+escuro\b/i,
  /\bestá\s+em\s+perfeito\s+estado\b/i,
  /\beventua(is|l)\s+(sujeira|mancha|risco|defeito|dano)s?\b/i,
  /\bpossíve(is|l)\s+(sujeira|mancha|risco|defeito|dano)s?\b/i,
  /\btalvez\s+esteja\s+(danificado|sujo|riscado|com\s+defeito)\b/i,
  /\blimpe\s+(a\s+superfície\s+para\s+remover\s+)?(eventuais|possíveis)?\s*sujeiras?\b/i,
  /\bremover\s+(eventuais|possíveis)?\s*sujeiras?\b/i,
];

function sanitizeString(text: string): string {
  let cleaned = text.trim();

  // Substituições corretivas para manter a observação estritamente visual, neutra e sem especulação
  cleaned = cleaned
    .replace(/\bO produto é original\b/gi, 'A marca aparece grafada no item')
    .replace(/\bO produto está em perfeito estado\b/gi, 'O produto parece estar em bom estado visual')
    .replace(/\bO produto é escuro\b/gi, 'A iluminação da foto está escura')
    .replace(/\bO produto está danificado\b/gi, 'Há reflexos ou sombras que dificultam visualizar alguns detalhes')
    .replace(/\beventuais\s+sujeiras\b/gi, 'textura da superfície')
    .replace(/\bpossíveis\s+manchas\b/gi, 'variações de iluminação')
    .replace(/\btalvez\s+esteja\s+danificado\b/gi, 'alguns detalhes estão sob sombra')
    .replace(/limpe\s+(a\s+superfície\s+para\s+remover\s+)?(eventuais|possíveis)?\s*sujeiras?/gi, 'utilize um fundo com acabamento liso e uniforme');

  return cleaned;
}

function isDisallowedText(text: string): boolean {
  return BANNED_PATTERNS.some((pattern) => pattern.test(text));
}

function normalizeQualityRating(val: any): PhotoQualityRating {
  const str = String(val || '').toLowerCase();
  if (str.includes('boa') || str.includes('bom') || str.includes('ótima') || str.includes('otima') || str.includes('excelente')) {
    return 'Boa';
  }
  if (str.includes('precisa') || str.includes('ruim') || str.includes('fraca') || str.includes('melhorar')) {
    return 'Precisa melhorar';
  }
  return 'Regular';
}

function normalizeEnquadramentoRating(val: any): PhotoEnquadramentoRating {
  const str = String(val || '').toLowerCase();
  if (str.includes('bom') || str.includes('boa') || str.includes('ótimo') || str.includes('otimo') || str.includes('excelente')) {
    return 'Bom';
  }
  if (str.includes('precisa') || str.includes('ruim') || str.includes('cortado') || str.includes('melhorar')) {
    return 'Precisa melhorar';
  }
  return 'Regular';
}

function normalizeFundoRating(val: any): PhotoFundoRating {
  const str = String(val || '').toLowerCase();
  if (str.includes('bom') || str.includes('boa') || str.includes('limpo') || str.includes('ótimo') || str.includes('otimo')) {
    return 'Bom';
  }
  if (str.includes('precisa') || str.includes('ruim') || str.includes('poluído') || str.includes('poluido') || str.includes('melhorar')) {
    return 'Precisa melhorar';
  }
  return 'Regular';
}

function normalizePriority(val: any): PhotoPriorityLevel {
  const str = String(val || '').toLowerCase();
  if (str.includes('alta') || str.includes('urgente') || str.includes('alto')) {
    return 'Alta prioridade';
  }
  if (str.includes('baixa') || str.includes('baixo') || str.includes('leve')) {
    return 'Baixa prioridade';
  }
  return 'Média prioridade';
}

export function sanitizeAndValidatePhotoAnalysis(
  raw: any,
  eventId?: string
): PhotoAnalysisResult {
  // 1. Validar e calibrar a Nota da Foto (0 a 100)
  let score = typeof raw?.score === 'number' ? Math.round(raw.score) : 75;
  if (isNaN(score)) score = 75;
  score = Math.max(10, Math.min(98, score));

  // 2. Indicadores visuais
  const indicators = {
    qualidade: normalizeQualityRating(raw?.indicators?.qualidade),
    iluminacao: normalizeQualityRating(raw?.indicators?.iluminacao),
    enquadramento: normalizeEnquadramentoRating(raw?.indicators?.enquadramento),
    visibilidade: normalizeQualityRating(raw?.indicators?.visibilidade),
    fundo: normalizeFundoRating(raw?.indicators?.fundo),
  };

  // 3. Pontos positivos observados (1 a 4)
  let strengths: string[] = [];
  if (Array.isArray(raw?.strengths)) {
    strengths = raw.strengths
      .map((s: any) => sanitizeString(String(s || '')))
      .filter((s: string) => s.length > 5 && !isDisallowedText(s))
      .slice(0, 4);
  }

  if (strengths.length === 0) {
    if (indicators.enquadramento === 'Bom') {
      strengths.push('O produto está bem centralizado no quadro.');
    }
    if (indicators.visibilidade === 'Boa') {
      strengths.push('O item está visível e distinguível na imagem.');
    }
    if (strengths.length === 0) {
      strengths.push('A imagem permite visualizar o formato geral do item.');
    }
  }

  // 4. O que pode melhorar (1 a 4 com prioridade)
  let improvements: PhotoImprovementItem[] = [];
  if (Array.isArray(raw?.improvements)) {
    improvements = raw.improvements
      .map((item: any) => {
        const text = sanitizeString(
          typeof item === 'string' ? item : String(item?.text || '')
        );
        const priority = normalizePriority(item?.priority);
        return { text, priority };
      })
      .filter((item: PhotoImprovementItem) => item.text.length > 5 && !isDisallowedText(item.text))
      .slice(0, 4);
  }

  // Se nenhuma melhoria veio, apenas sugerir se houver indicador com problema real
  const hasCriticalFlaw =
    indicators.iluminacao === 'Precisa melhorar' ||
    indicators.fundo === 'Precisa melhorar' ||
    indicators.enquadramento === 'Precisa melhorar' ||
    indicators.qualidade === 'Precisa melhorar' ||
    indicators.visibilidade === 'Precisa melhorar';

  if (improvements.length === 0 && hasCriticalFlaw) {
    if (indicators.iluminacao === 'Precisa melhorar') {
      improvements.push({
        text: 'Ajuste a iluminação para clarear sombras fortes ou reduzir reflexos diretos.',
        priority: 'Alta prioridade',
      });
    } else if (indicators.fundo === 'Precisa melhorar') {
      improvements.push({
        text: 'Utilize um fundo mais uniforme e sem distrações visuais ao redor.',
        priority: 'Alta prioridade',
      });
    } else if (indicators.enquadramento === 'Precisa melhorar') {
      improvements.push({
        text: 'Centralize o item e ajuste o enquadramento para mostrar o produto por inteiro sem cortes.',
        priority: 'Alta prioridade',
      });
    }
  }

  // 5. Para sua próxima foto (máximo 3)
  let nextPhotoTips: string[] = [];
  const rawTips = Array.isArray(raw?.nextPhotoTips) ? raw.nextPhotoTips : (Array.isArray(raw?.nextSteps) ? raw.nextSteps : []);
  if (Array.isArray(rawTips)) {
    nextPhotoTips = rawTips
      .map((t: any) => sanitizeString(String(t || '')))
      .filter((t: string) => t.length > 5 && !isDisallowedText(t))
      .slice(0, 3);
  }

  if (nextPhotoTips.length === 0) {
    if (indicators.iluminacao !== 'Boa') {
      nextPhotoTips.push('Fotografe próximo a uma janela com luz natural indireta.');
    }
    if (indicators.fundo !== 'Bom') {
      nextPhotoTips.push('Posicione o item sobre uma superfície limpa ou parede lisa.');
    }
    if (indicators.enquadramento !== 'Bom') {
      nextPhotoTips.push('Deixe o produto ocupar a maior parte do enquadramento sem cortar bordas.');
    }
    if (nextPhotoTips.length === 0) {
      nextPhotoTips.push('Mantenha o enquadramento estável e a iluminação equilibrada.');
    }
  }

  return {
    score,
    indicators,
    strengths,
    improvements,
    nextPhotoTips: nextPhotoTips.slice(0, 3),
    eventId,
  };
}

/**
 * Fallback determinístico caso o serviço de IA esteja temporariamente instável.
 */
export function generateFallbackPhotoAnalysis(eventId?: string): PhotoAnalysisResult {
  return {
    score: 78,
    indicators: {
      qualidade: 'Boa',
      iluminacao: 'Regular',
      enquadramento: 'Bom',
      visibilidade: 'Boa',
      fundo: 'Regular',
    },
    strengths: [
      'O produto está em posição centralizada na foto.',
      'O item aparece sem cortes aparentes nas extremidades.',
      'A resolução permite distinguir as formas principais do objeto.',
    ],
    improvements: [
      {
        text: 'Ajuste a posição da luz para suavizar reflexos brilhantes ou sombras sobre a superfície.',
        priority: 'Média prioridade',
      },
      {
        text: 'Utilize um fundo mais uniforme e remova itens secundários ao redor.',
        priority: 'Baixa prioridade',
      },
    ],
    nextPhotoTips: [
      'Apoie o produto sobre uma superfície plana e evite segurá-lo com as mãos.',
      'Fotografe com luz natural indireta para evitar reflexos duros em embalagens ou caixas.',
      'Mantenha o enquadramento estável para valorizar a apresentação do item.',
    ],
    eventId,
  };
}
