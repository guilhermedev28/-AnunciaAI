import type { TitleFormData, TitleStyle } from '../types';

/**
 * Normaliza e limpa um item de característica fornecido pelo usuário.
 */
function extractFeatureItems(featuresText: string): string[] {
  if (!featuresText) return [];
  const rawParts = featuresText
    .split(/[,;\n•\/]/)
    .map((p) => p.trim().replace(/^[-•*]\s*/, ''))
    .filter((p) => p.length > 1);

  if (rawParts.length === 0 && featuresText.trim()) {
    return [featuresText.trim()];
  }
  return rawParts;
}

/**
 * Capitaliza adequadamente as palavras de uma característica mantendo preposições minúsculas.
 */
function capitalizeWords(text: string): string {
  if (!text) return '';
  const lowercaseExceptions = new Set(['de', 'da', 'do', 'das', 'dos', 'em', 'com', 'para', 'e', 'ou', 'na', 'no', 'por']);
  return text
    .trim()
    .split(/\s+/)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && lowercaseExceptions.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Remove aspas, numerações iniciais, asteriscos, prefixos vazios e traços residuais.
 */
function cleanTitleString(title: string): string {
  if (!title) return '';
  let cleaned = String(title).trim();

  // Remove markdown quotes, prefixos tipo "1.", "Opção 1:", etc.
  cleaned = cleaned.replace(/^(\d+[\.\-\)]\s*|opção\s*\d+[:\-]?\s*|\*+\s*|•\s*)/i, '');
  cleaned = cleaned.replace(/^["'“”«»]+|["'“”«»]+$/g, '');

  // Remove prefixos vazios proibidos
  cleaned = cleaned.replace(
    /^(confira|destaque|opção de|opcao de|para você|para voce|conheça|conheca|apresentamos)[\:\-]?\s*/i,
    ''
  );

  // Remove colchetes residuais
  cleaned = cleaned.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();

  // Remove pontuação solta no início e no fim
  cleaned = cleaned.replace(/^[-\|\:\,]\s*/, '').trim();
  cleaned = cleaned.replace(/[-\|\:\,]\s*$/, '').trim();

  return cleaned;
}

/**
 * Classificação gramatical da característica.
 */
interface ParsedFeature {
  original: string;
  formatted: string;
  isAdjective: boolean;
  isNounPhrase: boolean;
  isSize: boolean;
  isMaterial: boolean;
}

const ADJECTIVE_WORDS = new Set([
  'leve',
  'leves',
  'pesado',
  'pesada',
  'preto',
  'preta',
  'pretos',
  'pretas',
  'azul',
  'azuis',
  'vermelho',
  'vermelha',
  'vermelhos',
  'vermelhas',
  'branco',
  'branca',
  'brancos',
  'brancas',
  'amarelo',
  'amarela',
  'verde',
  'verdes',
  'cinza',
  'cinzas',
  'marrom',
  'rosa',
  'roxo',
  'roxa',
  'dourado',
  'dourada',
  'prata',
  'prateado',
  'prateada',
  'escuro',
  'escura',
  'claro',
  'clara',
  'bege',
  'básico',
  'básica',
  'básicos',
  'básicas',
  'liso',
  'lisa',
  'estampado',
  'estampada',
  'redondo',
  'redonda',
  'quadrado',
  'quadrada',
  'feminino',
  'feminina',
  'masculino',
  'masculina',
  'infantil',
  'unissex',
  'respirável',
  'antiderrapante',
  'dobrável',
  'ajustável',
  'ajustavel',
  'invisível',
  'flexível',
  'reforçado',
  'reforçada',
  'acolchoado',
  'acolchoada',
  'impermeável',
  'fino',
  'fina',
  'slim',
  'novo',
  'nova',
  'seminovo',
  'seminova',
  'usado',
  'usada',
]);

function parseFeature(raw: string): ParsedFeature {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  // Verifica se é tamanho / medidas
  const isSize =
    lower.startsWith('tamanho') ||
    lower.startsWith('tam ') ||
    lower.includes('tamanho médio') ||
    lower.includes('tamanho medio') ||
    lower.includes('tamanho pequeno') ||
    lower.includes('tamanho grande') ||
    lower.includes('tamanho único') ||
    lower.includes('tamanho unico') ||
    lower === 'médio' ||
    lower === 'medio' ||
    lower === 'pequeno' ||
    lower === 'grande';

  // Verifica se é material / tecido
  const isMaterial =
    lower.includes('algodão') ||
    lower.includes('algodao') ||
    lower.includes('couro') ||
    lower.includes('aço') ||
    lower.includes('inox') ||
    lower.includes('poliéster') ||
    lower.includes('nylon') ||
    lower.includes('jeans') ||
    lower.includes('viscose') ||
    lower.includes('linho');

  // Verifica se é adjetivo direto (palavra única que funciona como adjetivo)
  const words = lower.split(/\s+/);
  const isAdjective = words.length === 1 && ADJECTIVE_WORDS.has(words[0]);

  // Se não é adjetivo, nem tamanho, nem material puro, trata como locução substantiva
  const isNounPhrase = !isAdjective && !isSize && !isMaterial;

  return {
    original: trimmed,
    formatted: capitalizeWords(trimmed),
    isAdjective,
    isNounPhrase,
    isSize,
    isMaterial,
  };
}

/**
 * Expressão regular para detectar construções gramaticalmente erradas como "com leve", "com preta", "com azul", etc.
 */
const INVALID_COM_ADJ_REGEX =
  /\bcom\s+(leve|leves|preto|preta|pretos|pretas|azul|azuis|vermelho|vermelha|branco|branca|amarelo|amarela|verde|cinza|marrom|rosa|roxo|roxa|dourado|dourada|novo|nova|seminovo|seminova|usado|usada|redondo|redonda)\b/i;

/**
 * Normaliza título para verificação rigorosa de duplicatas semânticas
 */
function normalizeForDeduplication(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\:\-\|\(\)\,\.\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitiza e valida os títulos gerados pela IA ou motor de segurança,
 * aplicando as 10 regras mais rigorosas solicitadas.
 */
export function sanitizeAndValidateTitles(rawTitles: any[], input: TitleFormData): string[] {
  // Apenas nome do produto, características e preço formam a verdade do usuário. Categoria NÃO é tratada como característica.
  const userInputCombined = `${input.productName} ${input.features} ${input.price || ''}`;
  const normalizedInputText = userInputCombined
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const userMentioned = (word: string) => {
    const normalizedWord = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalizedInputText.includes(normalizedWord);
  };

  // Regra 3: Categoria NÃO é uma característica. Se Categoria = "Eletrônicos", nunca colocar "Eletrônicos" no título.
  const categoryRaw = input.category ? input.category.trim() : '';
  const categoryNormalized = categoryRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const categoryAllowedInTitle =
    categoryNormalized.length > 2 &&
    (input.productName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(categoryNormalized) ||
      input.features.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(categoryNormalized));

  // Regra 1: Preservação de sujeito. Se usuário disse "leve", é "Fone Bluetooth Leve", NUNCA "Design Leve", "Modelo Leve", etc.
  const hasDesign = userMentioned('design');
  const hasModelo = userMentioned('modelo');
  const hasEstrutura = userMentioned('estrutura');
  const hasConstrucao = userMentioned('construcao');
  const hasVersao = userMentioned('versao');
  const hasAcabamento = userMentioned('acabamento');

  // Regras 2 e 4: Proibição de adjetivos genéricos não informados
  const prohibitedAdjectiveChecks = [
    { term: 'pratico', regex: /\bpr[áa]tic[oa]s?\b|\bpraticidade\b/i },
    { term: 'moderno', regex: /\bmodern[oa]s?\b|\bmodernidade\b/i },
    { term: 'premium', regex: /\bpremium\b/i },
    { term: 'elegante', regex: /\belegantes?\b|\beleg[âa]ncia\b/i },
    { term: 'potente', regex: /\bpotentes?\b|\bpot[êe]ncia\b/i },
    { term: 'confortavel', regex: /\bconfort[áa]ve(l|is)\b|\bconforto\b/i },
    { term: 'resistente', regex: /\bresistentes?\b|\bresist[êe]ncia\b/i },
    { term: 'versatil', regex: /\bvers[áa]te(l|is)\b|\bversatilidade\b/i },
    { term: 'eficiente', regex: /\beficientes?\b|\befici[êe]ncia\b/i },
    { term: 'alta qualidade', regex: /\b(de\s+)?(alta|excelente|[óo]tima|m[áa]xima|superior)\s+qualidade\b/i },
    { term: 'excelente', regex: /\bexcelentes?\b/i },
    { term: 'incrivel', regex: /\bincr[íi]ve(l|is)\b/i },
    { term: 'sofisticado', regex: /\bsofisticad[oa]s?\b|\bsofistica[çc][ãa]o\b/i },
    { term: 'inovador', regex: /\binovador(a|es|as)?\b|\binova[çc][ãa]o\b/i },
    { term: 'portatil', regex: /\bport[áa]te(l|is)\b/i },
    { term: 'compacto', regex: /\bcompact[oa]s?\b/i },
    { term: 'facil de transportar', regex: /\bf[áa]cil\s+de\s+transportar\b/i },
    { term: 'alta capacidade', regex: /\balta\s+capacidade\b/i },
    { term: 'alta performance', regex: /\balta\s+performance\b/i },
    { term: 'alta definicao', regex: /\balta\s+defini[çc][ãa]o\b|\bhi-fi\b/i },
    { term: 'duradouro', regex: /\bduradour[oa]s?\b|\bdurabilidade\b/i },
    { term: 'top de linha', regex: /\btop\s+de\s+linha\b|\bde\s+ponta\b/i },
    { term: 'perfeito', regex: /\bperfeit[oa]s?\b/i },
    { term: 'ideal', regex: /\bideal\b/i },
    { term: 'exclusivo', regex: /\bexclusiv[oa]s?\b/i },
    { term: 'som potente', regex: /\bsom\s+potente\b|\b[áa]udio\s+potente\b/i },
  ];

  // Regra 5: Proibição de contexto e frases clichês não informadas
  const prohibitedContextChecks = [
    { term: 'dia a dia', regex: /\b(para\s+o|no|pro)\s+seu\s+dia\s+a\s+dia\b|\b(para\s+o|no|pro)\s+dia\s+a\s+dia\b|\bdia\s+a\s+dia\b/i },
    { term: 'rotina', regex: /\b(para\s+(sua|a)|na)\s+rotina\b/i },
    { term: 'para voce', regex: /\bpra?\s+voc[êe]\b/i },
    { term: 'para quem busca', regex: /\bpra?\s+quem\s+busca\b/i },
    { term: 'ideal para', regex: /\bideal\s+para\b/i },
    { term: 'perfeito para', regex: /\bperfeit[oa]\s+para\b/i },
    { term: 'feito para', regex: /\bfeit[oa]\s+para\b/i },
    { term: 'pensado para', regex: /\bpensad[oa]\s+para\b/i },
    { term: 'desenvolvido para', regex: /\bdesenvolvid[oa]\s+para\b/i },
    { term: 'uso diario', regex: /\buso\s+di[áa]rio\b|\buso\s+cont[íi]nuo\b|\buso\s+prolongado\b/i },
  ];

  // Regras de especificações falsas e urgência
  const hasWarranty = userMentioned('garantia');
  const hasInvoice = userMentioned('nota fiscal') || userMentioned('nf-e') || userMentioned('danfe');
  const hasAuthentic = userMentioned('original') || userMentioned('autentic');
  const hasFreeShipping = userMentioned('frete gratis') || userMentioned('envio gratis');
  const hasStockOrUrgency =
    userMentioned('estoque') ||
    userMentioned('ultim') ||
    userMentioned('corra') ||
    userMentioned('so hoje');
  const hasWaterproof = userMentioned('a prova d') || userMentioned('impermeavel');
  const hasSplashOnly = userMentioned('respingo');
  const hasUsedOrSemi = userMentioned('seminovo') || userMentioned('semi novo') || userMentioned('usado');
  const hasPrice = !!(input.price && input.price.trim());
  const hasBluetoothVersion = userMentioned('bluetooth 5.') || userMentioned('versao 5.');
  const hasHoursBattery = /\b\d+\s*h(oras)?\b/i.test(normalizedInputText);

  const safeList: string[] = [];
  const seenSemanticKeys = new Set<string>();

  const list = Array.isArray(rawTitles) ? rawTitles : [];

  for (const item of list) {
    let title = cleanTitleString(item);
    if (!title || title.length < 5) continue;

    // Regra gramatical: Rejeitar ou corrigir "com leve", "com preta"
    if (INVALID_COM_ADJ_REGEX.test(title)) {
      title = title.replace(/\bcom\s+(leve|preto|preta|azul|vermelho|vermelha|branco|branca|novo|nova|usado|usada)\b/gi, '$1');
      if (INVALID_COM_ADJ_REGEX.test(title)) {
        continue;
      }
    }

    // Regra 3: Se categoria não foi informada pelo usuário no produto/características, remover qualquer menção artificial
    if (categoryNormalized && !categoryAllowedInTitle) {
      const catRegex = new RegExp(`\\b${categoryRaw}\\b`, 'gi');
      if (catRegex.test(title)) {
        title = title.replace(catRegex, '').replace(/\s+/g, ' ').trim();
      }
      // Se ainda contiver a categoria normalizada, rejeita
      const testNormalized = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (testNormalized.includes(categoryNormalized)) {
        continue;
      }
    }

    // Regra 1: Preservação de sujeito e significado - Proibir "Design Leve", "Modelo Leve", "Estrutura Leve", etc.
    if (!hasDesign && /\bdesign\s+[a-záàâãéèêíïóôõöúç]+\b/i.test(title)) {
      continue;
    }
    if (!hasModelo && /\bmodelo\s+[a-záàâãéèêíïóôõöúç]+\b/i.test(title)) {
      continue;
    }
    if (!hasEstrutura && /\bestrutura\s+[a-záàâãéèêíïóôõöúç]+\b/i.test(title)) {
      continue;
    }
    if (!hasConstrucao && /\bconstru[çc][ãa]o\s+[a-záàâãéèêíïóôõöúç]+\b/i.test(title)) {
      continue;
    }
    if (!hasVersao && /\bvers[ãa]o\s+[a-záàâãéèêíïóôõöúç]+\b/i.test(title)) {
      continue;
    }
    if (!hasAcabamento && /\bacabamento\s+[a-záàâãéèêíïóôõöúç]+\b/i.test(title)) {
      continue;
    }

    // Regras 2 e 4: Proibição de adjetivos genéricos não informados
    let hasForbiddenAdjective = false;
    for (const check of prohibitedAdjectiveChecks) {
      if (!userMentioned(check.term) && check.regex.test(title)) {
        hasForbiddenAdjective = true;
        break;
      }
    }
    if (hasForbiddenAdjective) continue;

    // Regra 5: Proibição de contexto e frases clichês não informadas
    let hasForbiddenContext = false;
    for (const check of prohibitedContextChecks) {
      if (!userMentioned(check.term) && check.regex.test(title)) {
        hasForbiddenContext = true;
        break;
      }
    }
    if (hasForbiddenContext) continue;

    // Regra 9: Proibição de alegações falsas e especificações inventadas
    if (!hasBluetoothVersion && /\bbluetooth\s+5\.\d\b/i.test(title)) {
      title = title.replace(/\bbluetooth\s+5\.\d\b/gi, 'Bluetooth').trim();
    }
    if (!hasHoursBattery && /\b\d+\s*h(oras)?(\s+de\s+bateria)?\b/i.test(title)) {
      continue;
    }
    if (!hasWarranty && /\bgarantia\b/i.test(title)) {
      continue;
    }
    if (!hasInvoice && /\b(nota\s+fiscal|com\s+nf)\b/i.test(title)) {
      continue;
    }
    if (!hasAuthentic && /\b(100%\s*)?(original|aut[êe]ntic[oa])\b/i.test(title)) {
      continue;
    }
    if (!hasFreeShipping && /\bfrete\s+gr[áa]tis\b/i.test(title)) {
      continue;
    }
    if (!hasStockOrUrgency && /\b([úu]ltimas\s+unidades|[úu]ltima\s+chance|corra|s[óo]\s+hoje|estoque\s+limitado)\b/i.test(title)) {
      continue;
    }

    // Regra específica para Mercado Livre: NUNCA colocar preço no título
    const isMercadoLivre = input.platform === 'Mercado Livre';
    if (isMercadoLivre) {
      // 1. Remove sufixos de preço (ex: " - R$ 120", " - 120,00", " | R$ 120")
      title = title.replace(/\s*[-–—|]\s*(?:por|a|apenas|s[óo]|de)?\s*R?\$?\s*[\d.,]+(?:\s*reais)?\b/gi, '');
      // 2. Remove expressões conectivas de preço (ex: "por R$ 120", "por apenas R$ 59,90", "a partir de R$ 50", "valor R$ 100", "preço R$ 80")
      title = title.replace(/\s*\b(?:por|apenas|s[óo]|pre[çc]o|valor|a\s+partir\s+de)\s+R?\$?\s*[\d.,]+(?:\s*reais)?\b/gi, '');
      // 3. Remove "R$ xxx" ou "xxx reais"
      title = title.replace(/\s*R\$\s*[\d.,]+\b/gi, '');
      title = title.replace(/\s*\b\d+(?:[\.,]\d+)?\s*reais\b/gi, '');

      // 4. Se o usuário informou um preço específico (ex: "59,90" ou "120"), remover menções a esse valor no título
      if (input.price && input.price.trim()) {
        const rawNum = input.price.replace(/[^\d.,]/g, '').trim();
        if (rawNum.length > 0) {
          const escapedNum = rawNum.replace(/\./g, '\\.');
          const isPartOfFeaturesOrName =
            (input.productName + ' ' + input.features).toLowerCase().includes(rawNum.toLowerCase());
          if (!isPartOfFeaturesOrName) {
            title = title.replace(new RegExp(`(?:[-–—|]|\\bpor\\b|\\bde\\b|\\ba\\b)?\\s*R?\\$?\\s*${escapedNum}(?:\\s*reais)?`, 'gi'), '');
          }
        }
      }

      title = cleanTitleString(title);

      // 5. Validação rigorosa: Se ainda houver qualquer menção de R$, reais ou preço, descarta o título
      const containsPriceRemnant =
        /\bR\$\b|R\$\s*[\d.,]+|\b\d+(?:[\.,]\d+)?\s*reais\b|\b(?:por|pre[çc]o|valor)\s+R?\$?\s*[\d.,]+/i.test(title);
      if (containsPriceRemnant) {
        continue;
      }
      if (input.price && input.price.trim()) {
        const rawNum = input.price.replace(/[^\d.,]/g, '').trim();
        const isPartOfFeaturesOrName =
          (input.productName + ' ' + input.features).toLowerCase().includes(rawNum.toLowerCase());
        if (rawNum.length >= 2 && !isPartOfFeaturesOrName && title.includes(rawNum)) {
          continue;
        }
      }
    } else {
      if (!hasPrice && /R\$\s*\d+/i.test(title)) {
        continue;
      }
    }

    // Preservação de significado: respingos NUNCA vira à prova d'água
    if (hasSplashOnly && !hasWaterproof && /\b([àa]\s+prova\s+d['’]?[áa]gua|imperme[áa]vel)\b/i.test(title)) {
      continue;
    }

    // Preservação de significado: seminovo/usado NUNCA vira novo
    if (hasUsedOrSemi && /\b(novo|sem\s+uso|zero\s+km|lacrado)\b/i.test(title)) {
      continue;
    }

    // Limpeza final de pontuação órfã
    title = cleanTitleString(title);
    title = title.replace(/\s+/g, ' ').trim();

    if (title && title.length >= 5) {
      const semanticKey = normalizeForDeduplication(title);
      // Regra 6: Diversidade real. Se a frase for idêntica (mesmo com pontuação diferente), descarta duplicata.
      if (!seenSemanticKeys.has(semanticKey)) {
        seenSemanticKeys.add(semanticKey);
        safeList.push(title);
      }
    }
  }

  // Se a lista tiver menos de 10 títulos seguros, complementa usando o gerador estruturado
  if (safeList.length < 10) {
    const fallbackOptions = generateFallbackTitles(input);
    for (const fb of fallbackOptions) {
      const semanticKey = normalizeForDeduplication(fb);
      if (!seenSemanticKeys.has(semanticKey) && !INVALID_COM_ADJ_REGEX.test(fb)) {
        seenSemanticKeys.add(semanticKey);
        safeList.push(fb);
      }
      if (safeList.length >= 10) break;
    }
  }

  // Regra 7: Qualidade > Quantidade. Retorna até 10 opções válidas e verdadeiras.
  return safeList.slice(0, 10);
}

/**
 * Gerador de títulos gramaticalmente estruturado, 100% fiel aos dados informados.
 * Prioriza qualidade, gramática natural e zero invenção de adjetivos, contextos ou especificações.
 */
export function generateFallbackTitles(input: TitleFormData): string[] {
  const prod = capitalizeWords(input.productName.trim());
  const rawFeatures = extractFeatureItems(input.features);
  const parsed = rawFeatures.map(parseFeature);

  const adjectives = parsed.filter((p) => p.isAdjective);
  const nounPhrases = parsed.filter((p) => p.isNounPhrase);
  const sizes = parsed.filter((p) => p.isSize);
  const materials = parsed.filter((p) => p.isMaterial);

  const isMercadoLivre = input.platform === 'Mercado Livre';
  // Mercado Livre NUNCA pode ter preço no título
  const price = !isMercadoLivre && input.price && input.price.trim() ? input.price.trim() : '';

  const adj1 = adjectives[0]?.formatted;
  const adj2 = adjectives[1]?.formatted;
  const noun1 = nounPhrases[0]?.formatted;
  const noun2 = nounPhrases[1]?.formatted;
  const size1 = sizes[0]?.formatted;
  const mat1 = materials[0]?.formatted;

  const results: string[] = [];
  const seenSemantic = new Set<string>();

  const add = (t: string) => {
    const cleaned = cleanTitleString(t);
    if (!cleaned || cleaned.length < 5) return;
    if (INVALID_COM_ADJ_REGEX.test(cleaned)) return;

    const key = normalizeForDeduplication(cleaned);
    if (!seenSemantic.has(key)) {
      seenSemantic.add(key);
      results.push(cleaned);
    }
  };

  // =========================================================================
  // CASO 1: Adjetivo + Locução Nominal (ex: Fone Bluetooth + leve, bateria de longa duração)
  // =========================================================================
  if (adj1 && noun1) {
    // 1. Principal combinação completa (Nome + Adjetivo + com Locução)
    add(`${prod} ${adj1} com ${noun1}`);

    // 2. Foco na locução
    add(`${prod} com ${noun1}`);

    // 3. Foco no adjetivo
    add(`${prod} ${adj1}`);

    // 4. Conjunção 'e com'
    add(`${prod} ${adj1} e com ${noun1}`);

    // 5. Locução destacada com adjetivo delimitado por traço
    add(`${prod} com ${noun1} - ${adj1}`);

    // 6. Ordem invertida natural
    add(`${prod} com ${noun1} e ${adj1}`);

    // 7. Hífen com adjetivo e locução
    add(`${prod} - ${adj1} com ${noun1}`);

    // 8. Hífen direto
    add(`${prod} - ${noun1}`);
    add(`${prod} - ${adj1}`);

    // Variações com Preço (apenas quando permitido e informado pelo usuário)
    if (price) {
      add(`${prod} ${adj1} com ${noun1} - ${price}`);
      add(`${prod} com ${noun1} por ${price}`);
      add(`${prod} ${adj1} por ${price}`);
      add(`${prod} por ${price}`);
    } else {
      add(`${prod}`);
    }
  }

  // =========================================================================
  // CASO 2: Adjetivo + Locução + Tamanho (ex: Bolsa feminina + preta, alça ajustável, tamanho médio)
  // =========================================================================
  else if (adj1 && noun1 && size1) {
    add(`${prod} ${adj1} com ${noun1} - ${size1}`);
    add(`${prod} ${adj1} com ${noun1}`);
    add(`${prod} ${adj1} de ${size1}`);
    add(`${prod} com ${noun1} de ${size1}`);
    add(`${prod} ${adj1} - ${size1}`);
    add(`${prod} com ${noun1} - ${size1}`);
    add(`${prod} ${adj1} com ${noun1} e ${size1}`);
    add(`${prod} com ${noun1}`);
    add(`${prod} ${adj1}`);
    add(`${prod} de ${size1}`);

    if (price) {
      add(`${prod} ${adj1} com ${noun1} por ${price}`);
      add(`${prod} ${adj1} por ${price}`);
    } else {
      add(`${prod}`);
    }
  }

  // =========================================================================
  // CASO 3: Material + Locução (ex: Camiseta Básica + 100% algodão, gola redonda)
  // =========================================================================
  else if (mat1 && noun1) {
    add(`${prod} em ${mat1} com ${noun1}`);
    add(`${prod} com ${noun1} em ${mat1}`);
    add(`${prod} em ${mat1}`);
    add(`${prod} com ${noun1}`);
    add(`${prod} - ${mat1} com ${noun1}`);
    add(`${prod} com ${noun1} - ${mat1}`);
    add(`${prod} de ${mat1} com ${noun1}`);
    add(`${prod} com ${noun1} de ${mat1}`);
    add(`${prod} - ${noun1}`);

    if (price) {
      add(`${prod} em ${mat1} com ${noun1} por ${price}`);
      add(`${prod} em ${mat1} por ${price}`);
      add(`${prod} com ${noun1} por ${price}`);
      add(`${prod} por ${price}`);
    } else {
      add(`${prod}`);
    }
  }

  // =========================================================================
  // CASO 4: Dois Adjetivos (ex: Camiseta + preta, básica)
  // =========================================================================
  else if (adj1 && adj2) {
    add(`${prod} ${adj1} e ${adj2}`);
    add(`${prod} ${adj2} e ${adj1}`);
    add(`${prod} ${adj1}`);
    add(`${prod} ${adj2}`);
    add(`${prod} - ${adj1} e ${adj2}`);
    add(`${prod} ${adj1} - ${adj2}`);
    add(`${prod} ${adj2} - ${adj1}`);
    add(`${prod} - ${adj1}`);
    add(`${prod} - ${adj2}`);

    if (price) {
      add(`${prod} ${adj1} e ${adj2} por ${price}`);
      add(`${prod} ${adj1} por ${price}`);
      add(`${prod} ${adj2} por ${price}`);
      add(`${prod} por ${price}`);
    } else {
      add(`${prod}`);
    }
  }

  // =========================================================================
  // CASO 5: Duas Locuções Nominais (ex: Fone + bateria de longa duração, microfone embutido)
  // =========================================================================
  else if (noun1 && noun2) {
    add(`${prod} com ${noun1} e ${noun2}`);
    add(`${prod} com ${noun2} e ${noun1}`);
    add(`${prod} com ${noun1}`);
    add(`${prod} com ${noun2}`);
    add(`${prod} - ${noun1} e ${noun2}`);
    add(`${prod} com ${noun1} - ${noun2}`);
    add(`${prod} com ${noun2} - ${noun1}`);
    add(`${prod} - ${noun1}`);
    add(`${prod} - ${noun2}`);

    if (price) {
      add(`${prod} com ${noun1} e ${noun2} por ${price}`);
      add(`${prod} com ${noun1} por ${price}`);
      add(`${prod} com ${noun2} por ${price}`);
      add(`${prod} por ${price}`);
    } else {
      add(`${prod}`);
    }
  }

  // =========================================================================
  // CASO 6: Apenas 1 Locução Nominal (ex: Fone + bateria de longa duração)
  // =========================================================================
  else if (noun1) {
    add(`${prod} com ${noun1}`);
    add(`${prod} - ${noun1}`);
    for (const f of rawFeatures) {
      const feat = capitalizeWords(f);
      if (feat && feat !== noun1) {
        add(`${prod} com ${noun1} - ${feat}`);
        add(`${prod} com ${feat}`);
      }
    }

    if (price) {
      add(`${prod} com ${noun1} por ${price}`);
      add(`${prod} com ${noun1} - ${price}`);
      add(`${prod} por ${price}`);
    }
    add(`${prod}`);
  }

  // =========================================================================
  // CASO 7: Apenas 1 Adjetivo (ex: Fone Bluetooth + leve)
  // =========================================================================
  else if (adj1) {
    add(`${prod} ${adj1}`);
    add(`${prod} - ${adj1}`);
    for (const f of rawFeatures) {
      const feat = capitalizeWords(f);
      if (feat && feat !== adj1) {
        add(`${prod} ${adj1} - ${feat}`);
        add(`${prod} com ${feat}`);
      }
    }

    if (price) {
      add(`${prod} ${adj1} por ${price}`);
      add(`${prod} ${adj1} - ${price}`);
      add(`${prod} por ${price}`);
    }
    add(`${prod}`);
  }

  // =========================================================================
  // CASO GERAL: Quaisquer outras características fornecidas
  // =========================================================================
  else {
    for (const f of rawFeatures) {
      const featName = capitalizeWords(f);
      if (featName) {
        add(`${prod} com ${featName}`);
        add(`${prod} - ${featName}`);
      }
    }
    if (rawFeatures.length >= 2) {
      const f1 = capitalizeWords(rawFeatures[0]);
      const f2 = capitalizeWords(rawFeatures[1]);
      if (f1 && f2) {
        add(`${prod} com ${f1} e ${f2}`);
      }
    }
    if (price) {
      add(`${prod} por ${price}`);
    }
    add(`${prod}`);
  }

  // Regra 7: Qualidade > Quantidade. Retorna até 10 títulos 100% verdadeiros e sem preenchimento artificial.
  return results.slice(0, 10);
}
