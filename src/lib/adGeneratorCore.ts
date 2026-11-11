import { AdFormData, GeneratedAdResult } from '../types';

/**
 * Validates basic required fields for ad generation
 */
export function validateAdInput(data: Partial<AdFormData>): { valid: boolean; error?: string } {
  const name = typeof data.productName === 'string' ? data.productName.trim() : '';
  const features = typeof data.features === 'string' ? data.features.trim() : '';

  if (!name || !features) {
    return {
      valid: false,
      error: 'O nome do produto e as características principais são obrigatórios.',
    };
  }

  return { valid: true };
}

/**
 * Extracts and cleans user features from freeform text into individual points
 */
export function extractRawFeatures(features: string): string[] {
  if (!features || typeof features !== 'string') return [];
  return features
    .split(/[,;\n•-]+|\se\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

/**
 * Formats price cleanly or returns empty string if not provided
 */
export function formatPrice(price?: string): string {
  if (!price || typeof price !== 'string') return '';
  const p = price.trim();
  if (!p) return '';
  // Se for apenas número ou já contiver formatação monetária
  if (/^r?\$\s*/i.test(p)) {
    return p.replace(/^r?\$\s*/i, 'R$ ');
  }
  if (/^\d+([.,]\d+)?$/.test(p)) {
    return `R$ ${p}`;
  }
  return p;
}

/**
 * Safe, neutral CTAs without scarcity, stock or urgency assumptions
 */
export const SAFE_NEUTRAL_CTAS = [
  'Entre em contato para saber mais.',
  'Chame no privado para mais informações.',
  'Fale comigo se tiver interesse.',
];

/**
 * Limpa e normaliza uma única Chamada para Ação (CTA).
 * Remove absolutamente "Opção 1", "Opção 2", "Opção 3", prefixos técnicos,
 * marcadores ou emojis de interface da IA.
 */
export function cleanSingleCta(rawCta: string): string {
  if (!rawCta || typeof rawCta !== 'string') return '';
  let cta = rawCta
    .replace(/\b(undefined|null|NaN)\b/gi, '')
    .replace(/\[[^\]]*\]/g, '')
    // Remove "🚀 CTAs:", "CHAMADAS PARA AÇÃO (CTAs):", "Opção 1:", "Opção 2 -", "1. ", "CTA 1:", etc.
    .replace(/^\s*(?:🚀\s*)?(?:chamadas?\s*para\s*a[çc][aã]o(?:\s*\(ctas?\))?|ctas?|op[çc][aã]o|chamada(?:\s*para\s*a[çc][aã]o)?)\s*\d*\s*[:\-–—]?\s*/gi, '')
    .replace(/^\s*(?:op[çc][aã]o|cta|chamada)\s*\d*\s*[:\-–—]?\s*/gi, '')
    .replace(/^\s*\d+[\.\):\-–—]\s*/g, '')
    // Remove qualquer menção interna de opção no final ou no meio
    .replace(/\s*(?:op[çc][aã]o\s*\d+|cta\s*\d+)\s*$/gi, '')
    .replace(/["“”«»']/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Se múltiplas opções tiverem sido aglutinadas em uma linha (ex: "Entre em contato. Opção 2: Chame...")
  if (/op[çc][aã]o\s*\d+/i.test(cta)) {
    cta = cta.split(/op[çc][aã]o\s*\d+/i)[0].trim();
  }

  // Remove pontuação inicial residual
  cta = cta.replace(/^[:\-–—.,]\s*/, '').trim();

  return cta;
}

/**
 * Limpa o título do anúncio para a cópia final
 */
function cleanAdTitle(rawTitle: string): string {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  let title = rawTitle.trim();
  title = title.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '');
  title = title.replace(/^(?:🎯\s*)?(?:t[íi]tulo(?:\s*do\s*an[úu]ncio)?|nome(?:\s*do\s*produto)?)\s*[:\-–—]\s*/i, '');
  title = title.replace(/^["“”«»']|["“”«»']$/g, '');
  title = title.replace(/\[[^\]]*\]/g, '');
  title = title.replace(/\b(undefined|null|NaN)\b/gi, '');
  title = title.replace(/\s{2,}/g, ' ').trim();
  return title;
}

/**
 * Limpa a descrição do anúncio removendo cabeçalhos técnicos de IA
 */
function cleanAdDescription(rawDesc: string): string {
  if (!rawDesc || typeof rawDesc !== 'string') return '';
  let desc = rawDesc.trim();
  desc = desc.replace(/^#+\s*/gm, '');

  // Remove cabeçalhos técnicos como "📝 DESCRIÇÃO:", "DESCRIÇÃO:"
  desc = desc.replace(/^(?:📝\s*)?(?:descri[çc][aã]o(?:\s*completa)?|texto(?:\s*do\s*an[úu]ncio)?|corpo(?:\s*do\s*an[úu]ncio)?)\s*[:\-–—]?\s*/i, '');

  // Se a descrição acidentalmente contiver blocos subsequentes da IA (ex: BENEFÍCIOS:, CTAs:, Opção 1:)
  const splitPatterns = [
    /(?:^|\n)(?:⭐\s*)?(?:benef[íi]cios|destaques|pontos\s*fortes)\s*[:\-–—]?\s*(?:\n|$)/i,
    /(?:^|\n)(?:📱\s*)?(?:texto\s*curto|vers[aã]o\s*curta|resumo)\s*[:\-–—]?\s*(?:\n|$)/i,
    /(?:^|\n)(?:🚀\s*)?(?:chamadas?\s*para\s*a[çc][aã]o(?:\s*\(ctas?\))?|ctas?)\s*[:\-–—]?\s*(?:\n|$)/i,
    /(?:^|\n)\s*op[çc][aã]o\s*\d+\s*[:\-–—]?\s*/i,
  ];

  for (const pat of splitPatterns) {
    const match = desc.match(pat);
    if (match && match.index !== undefined && match.index > 20) {
      desc = desc.substring(0, match.index).trim();
    }
  }

  desc = desc.replace(/\[[^\]]*\]/g, '');
  desc = desc.replace(/\b(undefined|null|NaN)\b/gi, '');
  desc = desc.replace(/[{}\[\]"]/g, (m) => (m === '"' ? '' : ''));
  desc = desc.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
  return desc;
}

/**
 * Limpa e formata a lista de benefícios/destaques
 */
function cleanAdBenefits(rawBenefits: any): string[] {
  const list = Array.isArray(rawBenefits)
    ? rawBenefits
    : typeof rawBenefits === 'string'
    ? rawBenefits.split('\n')
    : [];

  const cleanList: string[] = [];
  for (const item of list) {
    if (!item) continue;
    let text = String(item).trim();
    text = text.replace(/^(?:⭐\s*)?(?:benef[íi]cios?|destaques?|pontos?\s*fortes?)\s*[:\-–—]?\s*/i, '');
    text = text.replace(/^(?:benef[íi]cio|destaque|item|op[çc][aã]o)\s*\d*\s*[:\-–—]?\s*/i, '');
    text = text.replace(/^[•\-\*\d\.\)\s]+/, '').trim();
    text = text.replace(/\[[^\]]*\]/g, '').replace(/\b(undefined|null|NaN)\b/gi, '').trim();

    const lower = text.toLowerCase();
    if (
      text.length > 2 &&
      !lower.includes('poucos diferenciais') &&
      !lower.includes('sem mais diferenciais') &&
      !cleanList.includes(text)
    ) {
      cleanList.push(text);
    }
  }
  return cleanList;
}

/**
 * Limpa o texto curto e verifica se é aplicável
 */
function cleanAdShortText(rawShort: string, cleanDesc: string): string {
  if (!rawShort || typeof rawShort !== 'string') return '';
  let short = rawShort.trim();
  short = short.replace(/^#+\s*/gm, '');
  short = short.replace(/^(?:📱\s*)?(?:texto\s*curto|vers[aã]o\s*curta|resumo|whatsapp|direct|redes\s*sociais)\s*[:\-–—]?\s*/i, '');
  short = short.replace(/\[[^\]]*\]/g, '');
  short = short.replace(/\b(undefined|null|NaN)\b/gi, '');
  short = short.replace(/\s{2,}/g, ' ').trim();

  if (/(?:🚀\s*)?(?:chamadas?\s*para\s*a[çc][aã]o|ctas?)\s*[:\-–—]?/i.test(short)) {
    short = short.split(/(?:🚀\s*)?(?:chamadas?\s*para\s*a[çc][aã]o|ctas?)\s*[:\-–—]?/i)[0].trim();
  }
  if (/\bop[çc][aã]o\s*\d+/i.test(short)) {
    short = short.split(/\bop[çc][aã]o\s*\d+/i)[0].trim();
  }

  // Verifica aplicabilidade: deve ser relevante e diferente da descrição
  if (short.length < 5) return '';
  const normShort = short.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const normDesc = (cleanDesc || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (normShort === normDesc || (normDesc.length > 30 && normDesc.includes(normShort))) {
    return '';
  }

  return short;
}

/**
 * Extrai rigorosamente UMA ÚNICA chamada para ação limpa e neutra.
 */
function extractBestSingleCta(rawCtas: any): string {
  const candidates: string[] = [];

  if (Array.isArray(rawCtas)) {
    for (const c of rawCtas) {
      const cleaned = cleanSingleCta(String(c || ''));
      if (cleaned && cleaned.length >= 6) {
        candidates.push(cleaned);
      }
    }
  } else if (typeof rawCtas === 'string' && rawCtas.trim()) {
    const lines = rawCtas.split(/\n+/);
    for (const l of lines) {
      const cleaned = cleanSingleCta(l);
      if (cleaned && cleaned.length >= 6) {
        candidates.push(cleaned);
      }
    }
  }

  if (candidates.length > 0) {
    return candidates[0];
  }

  return SAFE_NEUTRAL_CTAS[0];
}

/**
 * Constrói o texto final, limpo e pronto para publicação copiado pelo botão "Copiar anúncio".
 *
 * ESTRUTURA OBRIGATÓRIA:
 * [TÍTULO]
 *
 * [DESCRIÇÃO]
 *
 * [DESTAQUES/BENEFÍCIOS] (quando aplicável)
 *
 * [TEXTO CURTO, quando aplicável]
 *
 * [UMA ÚNICA CTA]
 *
 * REGRAS ABSOLUTAS:
 * - NUNCA copia "Opção 1", "Opção 2", "Opção 3".
 * - NUNCA copia "CHAMADAS PARA AÇÃO", "CTAs:" ou nomes de campos técnicos.
 * - NUNCA copia múltiplos CTAs (sempre APENAS UM CTA).
 * - Sem JSON, metadados, undefined, null, NaN ou placeholders.
 * - Preserva características reais sem inventar nada.
 */
export function buildCleanFullAdText(result: GeneratedAdResult | any): string {
  if (!result) return '';

  let title = '';
  let fullDescription = '';
  let benefits: string[] = [];
  let shortText = '';
  let callToActions: string[] = [];

  // Suporte a texto puro bruto com divisões por cabeçalhos (ex: saída não estruturada ou cópia direta)
  if (typeof result === 'string') {
    const raw = result.trim();
    const sections = raw.split(/\n\s*\n/);
    const descIdx = sections.findIndex((s) => /^(?:📝\s*)?descri[çc][aã]o/i.test(s.trim()));
    const benIdx = sections.findIndex((s) => /^(?:⭐\s*)?benef[íi]cios/i.test(s.trim()));
    const shortIdx = sections.findIndex((s) => /^(?:📱\s*)?texto\s*curto/i.test(s.trim()));
    const ctaIdx = sections.findIndex((s) => /^(?:🚀\s*)?(?:ctas?|chamadas?\s*para\s*a[çc][aã]o)/i.test(s.trim()));

    if (descIdx > 0) {
      title = sections.slice(0, descIdx).join(' ');
    } else if (sections.length > 0) {
      title = sections[0];
    }

    if (descIdx !== -1) {
      const end = benIdx !== -1 ? benIdx : shortIdx !== -1 ? shortIdx : ctaIdx !== -1 ? ctaIdx : sections.length;
      fullDescription = sections.slice(descIdx, end).join('\n\n');
    }

    if (benIdx !== -1) {
      const end = shortIdx !== -1 ? shortIdx : ctaIdx !== -1 ? ctaIdx : sections.length;
      benefits = sections.slice(benIdx, end).join('\n').split('\n');
    }

    if (shortIdx !== -1) {
      const end = ctaIdx !== -1 ? ctaIdx : sections.length;
      shortText = sections.slice(shortIdx, end).join('\n\n');
    }

    if (ctaIdx !== -1) {
      callToActions = sections.slice(ctaIdx).join('\n').split('\n');
    }
  } else {
    title = result.title || '';
    fullDescription = result.fullDescription || '';
    benefits = Array.isArray(result.benefits) ? result.benefits : [];
    shortText = result.shortText || '';
    callToActions = Array.isArray(result.callToActions) ? result.callToActions : [];
  }

  // Se a descrição tiver acidentalmente incorporado benefícios ou CTAs da IA
  if (fullDescription && (!benefits || benefits.length === 0) && /benef[íi]cios\s*[:\-–—]?/i.test(fullDescription)) {
    const parts = fullDescription.split(/(?:^|\n)(?:⭐\s*)?benef[íi]cios\s*[:\-–—]?/i);
    fullDescription = parts[0];
    if (parts[1]) {
      benefits = parts[1].split('\n');
    }
  }

  const cleanT = cleanAdTitle(title);
  const cleanD = cleanAdDescription(fullDescription);
  const cleanB = cleanAdBenefits(benefits);
  const cleanS = cleanAdShortText(shortText, cleanD);
  const singleCta = extractBestSingleCta(callToActions);

  const parts: string[] = [];

  // 1. [TÍTULO]
  if (cleanT) {
    parts.push(cleanT);
  }

  // 2. [DESCRIÇÃO]
  if (cleanD) {
    parts.push(cleanD);
  }

  // 3. [DESTAQUES/BENEFÍCIOS]
  if (cleanB.length > 0) {
    parts.push(`⭐ Destaques:\n${cleanB.map((b) => `• ${b}`).join('\n')}`);
  }

  // 4. [TEXTO CURTO, quando aplicável]
  if (cleanS) {
    parts.push(cleanS);
  }

  // 5. [UMA ÚNICA CTA]
  if (singleCta) {
    parts.push(singleCta);
  }

  let finalOutput = parts.join('\n\n').trim();

  // Limpeza final de segurança para garantir ausência total de artefatos de IA
  finalOutput = finalOutput
    .replace(/(?:🚀\s*)?(?:chamadas?\s*para\s*a[çc][aã]o(?:\s*\(ctas?\))?|ctas?)\s*[:\-–—]?\s*/gi, '')
    .replace(/\bop[çc][aã]o\s*\d+\s*[:\-–—]?\s*/gi, '')
    .replace(/\b(undefined|null|NaN)\b/gi, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return finalOutput;
}

/**
 * Generates a structured ad deterministically when Gemini is offline or as resilient base
 */
export function generateFallbackAd(data: AdFormData): GeneratedAdResult {
  const { productName, category, price, targetAudience, features, tone, platform } = data;

  const rawFeaturesList = extractRawFeatures(features);
  const featuresText = rawFeaturesList.length > 0 ? rawFeaturesList.join(', ') : features.trim();
  const formattedPrice = formatPrice(price);
  const isMercadoLivre = platform?.toLowerCase().includes('mercado livre') || false;
  const isWhatsApp = platform?.toLowerCase().includes('whatsapp') || false;
  const isInstagram = platform?.toLowerCase().includes('instagram') || false;

  // 1. Título adaptado à plataforma
  let title = '';
  if (isMercadoLivre) {
    // Mercado Livre: objetivo, identificação direta, SEM preço no título
    const mainFeature = rawFeaturesList[0] || '';
    title = mainFeature && !productName.toLowerCase().includes(mainFeature.toLowerCase())
      ? `${productName.trim()} - ${mainFeature}`
      : productName.trim();
  } else {
    // Outras plataformas
    title = productName.trim();
    if (rawFeaturesList.length > 0 && !title.toLowerCase().includes(rawFeaturesList[0].toLowerCase())) {
      title = `${title} (${rawFeaturesList[0]})`;
    }
  }

  // 2. Descrição completa adaptada ao tom e canal
  const audiencePhrase = targetAudience && targetAudience.trim()
    ? `Indicado para ${targetAudience.trim()}.`
    : '';

  let fullDescription = '';
  if (isWhatsApp) {
    fullDescription = `Olá! Estou com ${productName.trim()} disponível.\n\n` +
      `Principais características:\n${rawFeaturesList.map((f) => `• ${f}`).join('\n')}\n\n` +
      (audiencePhrase ? `${audiencePhrase}\n\n` : '') +
      (formattedPrice ? `Valor: ${formattedPrice}.\n\n` : '') +
      `Se tiver interesse ou quiser tirar dúvidas, me chame aqui!`;
  } else if (isInstagram) {
    fullDescription = `${productName.trim()}!\n\n` +
      `${rawFeaturesList.map((f) => `• ${f}`).join('\n')}\n\n` +
      (audiencePhrase ? `${audiencePhrase}\n\n` : '') +
      (formattedPrice ? `Valor: ${formattedPrice}\n\n` : '') +
      `Para mais informações ou atendimento, envie uma mensagem no direct!`;
  } else {
    fullDescription = `${productName.trim()}.\n\n` +
      (audiencePhrase ? `${audiencePhrase}\n\n` : '') +
      `Características confirmadas pelo vendedor:\n${rawFeaturesList.map((f) => `• ${f}`).join('\n')}` +
      (formattedPrice ? `\n\nPreço: ${formattedPrice}` : '') +
      `\n\nEntre em contato para saber mais detalhes sobre o produto.`;
  }

  // 3. Benefícios: SOMENTE derivados das características reais fornecidas (dinâmico, sem número forçado)
  const benefits: string[] = [];
  for (const feat of rawFeaturesList) {
    if (feat.length > 2) {
      // Capitaliza a primeira letra
      const capitalized = feat.charAt(0).toUpperCase() + feat.slice(1);
      benefits.push(capitalized);
    }
  }

  if (benefits.length === 0 && features.trim().length > 0) {
    benefits.push(features.trim());
  }

  // 4. Texto curto pronto para mensagens rápidas
  let shortText = '';
  if (formattedPrice) {
    shortText = `${productName.trim()} por ${formattedPrice}. ${featuresText}. Fale comigo para mais informações.`;
  } else {
    shortText = `${productName.trim()}. ${featuresText}. Entre em contato para saber mais detalhes.`;
  }

  // 5. CTAs neutras
  const callToActions = [...SAFE_NEUTRAL_CTAS];

  const optionalAdditions = [
    'Tamanhos disponíveis',
    'Cores disponíveis',
    'Opções de frete ou entrega',
    'Formas de pagamento aceitas',
  ];

  return sanitizeGeneratedAd(
    {
      title,
      fullDescription,
      benefits,
      shortText,
      callToActions,
      optionalAdditions,
    },
    data
  );
}

export type AdInputData = Partial<AdFormData> & {
  productName: string;
  features: string;
};

/**
 * Sanitizes generated ad to remove placeholders, invalid values and hallucinations
 */
export function sanitizeGeneratedAd(ad: any, input: AdInputData): GeneratedAdResult {
  const userFeaturesLower = (input.features || '').toLowerCase();
  const productNameLower = (input.productName || '').toLowerCase();
  const allInputText = `${productNameLower} ${userFeaturesLower} ${(input.category || '').toLowerCase()} ${(input.targetAudience || '').toLowerCase()} ${(input.price || '').toLowerCase()}`;

  const userMentioned = (term: string) => allInputText.includes(term.toLowerCase());

  let fullDescription = typeof ad.fullDescription === 'string' ? ad.fullDescription : '';
  let shortText = typeof ad.shortText === 'string' ? ad.shortText : '';
  let title = typeof ad.title === 'string' ? ad.title : '';

  // 1. Remove qualquer colchete ou placeholder como [informe...], [inserir...] ou [...]
  const removeBracketsAndPlaceholders = (text: string) =>
    text
      .replace(/\[\s*(?:informe|preencha|adicione|insira|especifique|coloque|detalhes)?[^\]]*\]/gi, '')
      .replace(/\[[^\]]*\]/g, '') // remove qualquer colchete restante
      .replace(/\b(undefined|null|NaN)\b/gi, '') // remove literais espúrios
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();

  title = removeBracketsAndPlaceholders(title);
  fullDescription = removeBracketsAndPlaceholders(fullDescription);
  shortText = removeBracketsAndPlaceholders(shortText);

  // 2. Se for Mercado Livre, remove estritamente menções a preço do título
  const isMercadoLivre = input.platform?.toLowerCase().includes('mercado livre') || false;
  if (isMercadoLivre) {
    title = title
      .replace(/[-–—]?\s*r?\$[\d.,]+(\s*à\s*vista)?/gi, '')
      .replace(/\bpor\s+r?\$[\d.,]+/gi, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/[-–—:,;]\s*$/, '')
      .trim();
  }

  // 3. Regras de preservação de fatos e proibição de invenções
  const bannedRules: { regex: RegExp; allowed: boolean; replacement?: string }[] = [
    // Respingos NUNCA vira à prova d'água ou impermeável
    {
      regex: /(?<![\p{L}\p{N}])([aà]\s*prova\s*d['e]\s*[aá]gua|imperme[aá]vel)(?![\p{L}\p{N}])/giu,
      allowed: userMentioned("prova d") || userMentioned("imperme"),
      replacement: userMentioned("respingo") ? "resistente a respingos de água" : "",
    },
    // Seminovo / usado NUNCA vira novo ou lacrado
    {
      regex: /\b(produto\s*novo|totalmente\s*novo|100%\s*novo|novo,\s*sem\s*uso|lacrado)\b/gi,
      allowed:
        !userMentioned("seminov") &&
        !userMentioned("usad") &&
        !userMentioned("usei") &&
        (userMentioned("novo") || userMentioned("nova") || userMentioned("lacrad")),
      replacement:
        userMentioned("usei 2x") || userMentioned("usado 2")
          ? "seminovo, usado 2 vezes"
          : userMentioned("em bom estado")
          ? "em bom estado"
          : "seminovo",
    },
    // Em bom estado NUNCA vira impecável
    {
      regex: /\b(impec[aá]vel|perfeito\s*estado)\b/gi,
      allowed: userMentioned("impec") || userMentioned("perfeito"),
      replacement: userMentioned("bom estado") ? "em bom estado" : "",
    },
    // Proibido inventar material
    {
      regex: /\b(couro\s*(ecol[oó]gico|leg[ií]timo|sint[eé]tico)?|sint[eé]tico|lona|nylon)\b/gi,
      allowed: userMentioned("couro") || userMentioned("sintét") || userMentioned("sintet") || userMentioned("lona") || userMentioned("nylon"),
    },
    // Proibido inventar garantia
    {
      regex: /•?\s*(garantia\s*de\s*[\w\s]+|garantia\s*de\s*f[aá]brica|garantia\s*inclusa|com\s*garantia)[^\n.]*/gi,
      allowed: userMentioned("garantia"),
    },
    // Proibido inventar nota fiscal
    {
      regex: /•?\s*(com\s*nota\s*fiscal|acompanha\s*nota\s*fiscal|nota\s*fiscal\s*inclusa|com\s*nf)[^\n.]*/gi,
      allowed: userMentioned("nota fiscal") || userMentioned("com nf"),
    },
    // Proibido inventar medidas ou dimensões
    {
      regex: /•?\s*(dimens[oõ]es|medidas):\s*\d+[^\n.]*/gi,
      allowed: userMentioned("cm") || userMentioned("metro") || userMentioned("medida") || userMentioned("dimens"),
    },
    // Proibido inventar prazo de entrega / envio
    {
      regex: /\b(envio\s*imediato|chega\s*em\s*\d+\s*dias|entrega\s*r[aá]pida|pronta\s*entrega)\b/gi,
      allowed: userMentioned("envio") || userMentioned("entrega") || userMentioned("pronta entrega"),
    },
    // Proibido inventar benefícios não informados de cosméticos
    {
      regex: /\b(anti-idade|anti\s*idade|rejuvenescedor|a[cç][aã]o\s*clareadora|toque\s*seco)\b/gi,
      allowed: userMentioned("anti-idade") || userMentioned("rejuvenesc") || userMentioned("toque seco"),
    },
    // Proibido inventar som de alta qualidade se não informado
    {
      regex: /\b(som\s*de\s*alta\s*qualidade|graves\s*potentes|[aá]udio\s*cristalino|confort[aá]vel\s*por\s*horas|ideal\s*para\s*estudar|perfeito\s*para\s*academia)\b/gi,
      allowed: userMentioned("som") || userMentioned("grave") || userMentioned("estudar") || userMentioned("academia"),
    },
    // Urgência e escassez proibidas
    {
      regex: /[uú]ltimas\s+(unidades|pe[cç]as)|acabe\s+o\s+estoque|estoque\s+limitado|enquanto\s+durar\s+o\s+estoque|garanta\s+o\s+seu\s+antes\s+que\s+acabe|corre\s+que\s+acaba|corra\s+que\s+acaba|[uú]ltima\s+oportunidade|por\s+tempo\s+limitado/gi,
      allowed: userMentioned("estoque") || userMentioned("últimas"),
    },
    {
      regex: /aproveite\s+a\s+promo[cç][aã]o|garanta\s+o\s+seu\s+desconto|promo[cç][aã]o\s+imperd[ií]vel|desconto\s+especial/gi,
      allowed: userMentioned("promo") || userMentioned("desconto"),
    },
    { regex: /especifica[cç][oõ]es\s+informadas:?|informa[cç][oõ]es\s+diretas\s+e\s+confirmadas:?/gi, allowed: false },
  ];

  const cleanText = (text: string) => {
    let result = text;
    for (const rule of bannedRules) {
      if (!rule.allowed) {
        result = result.replace(rule.regex, rule.replacement !== undefined ? rule.replacement : '');
      }
    }
    return result
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/([.,;:])\1+/g, '$1') // remove duplicatas de pontuação ex: ".." -> "."
      .trim();
  };

  title = cleanText(title);
  fullDescription = cleanText(fullDescription);
  shortText = cleanText(shortText);

  // 4. Benefícios: apenas o que é sustentado pelas características fornecidas
  const userFeaturesList = extractRawFeatures(input.features);
  let rawBenefits = Array.isArray(ad.benefits)
    ? ad.benefits.map((b: any) => String(b || '').trim()).filter(Boolean)
    : [];

  const sanitizedBenefits: string[] = [];
  for (const b of rawBenefits) {
    const bLower = b.toLowerCase();
    let hasBanned = false;
    for (const rule of bannedRules) {
      rule.regex.lastIndex = 0;
      if (!rule.allowed && rule.regex.test(b)) {
        hasBanned = true;
        break;
      }
    }

    if (
      bLower.includes('r$') ||
      bLower.startsWith('preço') ||
      bLower.startsWith('preco') ||
      bLower.startsWith('produto:') ||
      bLower.startsWith('marca:') ||
      bLower.includes('whatsapp') ||
      bLower.includes('direct')
    ) {
      hasBanned = true;
    }

    if (!hasBanned && b.length > 2) {
      if (!bLower.includes('poucos diferenciais') && !bLower.includes('sem mais diferenciais')) {
        const cleaned = cleanText(b);
        if (cleaned.length > 2 && !sanitizedBenefits.includes(cleaned)) {
          sanitizedBenefits.push(cleaned);
        }
      }
    }
  }

  // Se nenhum benefício foi aceito, deriva dos dados literais informados
  if (sanitizedBenefits.length === 0) {
    for (const feat of userFeaturesList) {
      const cap = feat.charAt(0).toUpperCase() + feat.slice(1);
      if (!sanitizedBenefits.includes(cap)) {
        sanitizedBenefits.push(cap);
      }
    }
  }

  const finalBenefits = sanitizedBenefits.filter(
    (b) =>
      b &&
      b.trim().length > 0 &&
      !b.toLowerCase().includes('poucos diferenciais') &&
      !b.toLowerCase().includes('sem mais diferenciais')
  );

  // 5. CTAs: estritamente neutras, sem 'Opção X' e sem invenções de escassez/urgência/disponibilidade
  let callToActions: string[] = Array.isArray(ad.callToActions)
    ? ad.callToActions.map((cta: any) => cleanSingleCta(String(cta || ''))).filter(Boolean)
    : [];

  const hasStockInfo = userMentioned('estoque') || userMentioned('unidade') || userMentioned('peça') || userMentioned('peca');
  const hasAvailabilityInfo = userMentioned('disponib') || userMentioned('disponív') || userMentioned('disponiv');

  callToActions = callToActions.filter((cta) => {
    const lower = cta.toLowerCase();

    if (!hasAvailabilityInfo) {
      if (
        lower.includes('disponib') ||
        lower.includes('disponív') ||
        lower.includes('disponiv') ||
        lower.includes('consulte disponibilidade') ||
        lower.includes('verifique a disponibilidade')
      ) {
        return false;
      }
    }

    if (!hasStockInfo) {
      if (
        lower.includes('estoque') ||
        lower.includes('unidade') ||
        lower.includes('última') ||
        lower.includes('ultima') ||
        lower.includes('poucas unidades') ||
        lower.includes('últimas peças')
      ) {
        return false;
      }
    }

    if (
      lower.includes('garanta o seu antes que acabe') ||
      lower.includes('antes que acabe') ||
      lower.includes('corra') ||
      lower.includes('corre') ||
      lower.includes('tempo limitado') ||
      lower.includes('enquanto durar') ||
      lower.includes('promoção') ||
      lower.includes('desconto')
    ) {
      return false;
    }

    return true;
  });

  if (callToActions.length < 3) {
    const merged = [...callToActions];
    for (const safe of SAFE_NEUTRAL_CTAS) {
      if (!merged.includes(safe)) {
        merged.push(safe);
      }
    }
    callToActions = merged.slice(0, 3);
  } else {
    callToActions = callToActions.slice(0, 3);
  }

  // 6. Opcionais
  let optionalAdditions = Array.isArray(ad.optionalAdditions)
    ? ad.optionalAdditions.map((oa: any) => String(oa || '').trim()).filter(Boolean)
    : [];

  if (optionalAdditions.length === 0) {
    optionalAdditions = [
      'Tamanhos disponíveis',
      'Cores disponíveis',
      'Opções de frete ou entrega',
      'Formas de pagamento aceitas',
    ];
  }

  return {
    ...ad,
    title,
    fullDescription,
    benefits: finalBenefits,
    shortText,
    callToActions,
    optionalAdditions,
  };
}
