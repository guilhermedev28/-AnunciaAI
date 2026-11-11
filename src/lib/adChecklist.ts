import { AdChecklistResult, ChecklistDetectedItem } from '../types';

/**
 * Normaliza o texto para buscas seguras sem acentos e em minúsculas
 */
function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Reconhece informações presentes no texto do anúncio de forma contextual e flexível
 */
export function extractDetectedInfo(adText: string): {
  detectedItems: ChecklistDetectedItem[];
  category: string;
  productIdentified: string;
} {
  const rawText = (adText || '').trim();
  const lower = rawText.toLowerCase();
  const norm = normalize(rawText);

  const detected: ChecklistDetectedItem[] = [];

  // 1. Identificação do Produto e Categoria
  let category = 'Geral';
  let productIdentified = 'Produto';

  if (/\b(tenis|sapato|sandalia|bota|chinelo|calcado)\b/i.test(norm)) {
    category = 'Calçados';
    const match = rawText.match(/\b(tênis|tenis|sapato|sandália|sandalia|bota|chinelo|calçado|calcado)\b/i);
    productIdentified = match ? match[0] : 'Calçado';
  } else if (/\b(edicao\s+de\s+video|edito\s+video|designer|criacao\s+de\s+site|consultoria|manutencao|aula|servico|freelancer)\b/i.test(norm) || /\b(edito|faco\s+edicao)\b/i.test(norm)) {
    category = 'Serviços';
    productIdentified = 'Serviço de Edição de Vídeo';
    if (norm.includes('tiktok')) {
      productIdentified = 'Edição de vídeos para TikTok';
    }
  } else if (/\b(fone|headset|earbud|airpod|headphone)\b/i.test(norm)) {
    category = 'Áudio / Eletrônicos';
    const isBt = /\b(bluetooth|bt|sem\s+fio)\b/i.test(norm);
    productIdentified = isBt ? 'Fone Bluetooth' : 'Fone de Ouvido';
  } else if (/\b(iphone|samsung|galaxy|xiaomi|motorola|smartphone|celular)\b/i.test(norm)) {
    category = 'Smartphones / Celulares';
    const match = rawText.match(/\b(iphone\s*\d+(\s*pro\s*max|\s*pro|\s*plus)?|galaxy\s*[a-z0-9]+|xiaomi\s*[a-z0-9]+|smartphone|celular)\b/i);
    productIdentified = match ? match[0] : 'Smartphone';
  } else if (/\b(camiseta|camisa|vestido|calca|bermuda|moletom|jaqueta|saia|cropped|short|roupa|casaco)\b/i.test(norm)) {
    category = 'Vestuário / Moda';
    const match = rawText.match(/\b(camiseta|camisa|vestido|calça|calca|bermuda|moletom|jaqueta|saia|cropped|short|casaco)\b/i);
    productIdentified = match ? match[0] : 'Peça de Roupa';
  } else if (/\b(sofa|mesa|cadeira|estante|armario|cama|colchao|rack|comoda|movel)\b/i.test(norm)) {
    category = 'Móveis';
    const match = rawText.match(/\b(mesa(\s+de\s+escrit[oó]rio|\s+de\s+jantar|\s+gamer)?|sofá|sofa|cadeira|estante|armário|armario|cama|colchão|colchao|rack|cômoda|comoda)\b/i);
    productIdentified = match ? match[0] : 'Móvel';
  } else if (/\b(notebook|computador|pc|monitor|mouse|teclado|tablet|ipad|videogame|ps5|ps4|xbox)\b/i.test(norm)) {
    category = 'Informática / Games';
    const match = rawText.match(/\b(notebook|computador|pc|monitor|mouse|teclado|tablet|ipad|videogame|ps5|ps4|xbox)\b/i);
    productIdentified = match ? match[0] : 'Item de Informática';
  } else if (/\b(carro|moto|veiculo|automovel)\b/i.test(norm)) {
    category = 'Veículos';
    productIdentified = 'Veículo';
  }

  // Se tem marca logo após o produto ou no texto, complementa o nome do produto identificado
  const brandMatch = rawText.match(/\b(Nike|Adidas|Puma|Apple|Samsung|Xiaomi|Motorola|Sony|LG|Logitech|Razer|Dell|Asus|Vans|Converse|Mizuno|Olympikus|Zara|Shein)\b/i);
  if (brandMatch && !productIdentified.toLowerCase().includes(brandMatch[0].toLowerCase())) {
    productIdentified = `${productIdentified} ${brandMatch[0]}`;
  }

  detected.push({
    field: 'Produto identificado',
    value: productIdentified,
  });

  // 2. Marca / Modelo
  if (brandMatch) {
    detected.push({
      field: 'Marca',
      value: brandMatch[0],
    });
  }

  const modelMatch = rawText.match(/\b(iPhone\s*\d+(\s*Pro\s*Max|\s*Pro|\s*Plus)?|Galaxy\s*[A-Za-z0-9]+|Air\s*Force\s*\d*|Air\s*Max\s*\d*)\b/i);
  if (modelMatch) {
    detected.push({
      field: 'Modelo',
      value: modelMatch[0],
    });
  }

  // 3. Preço
  const priceMatch = rawText.match(/R\$\s*\d+([.,]\d+)?|\b\d+\s*reais\b|\bpor\s+\d+\b/i);
  if (priceMatch) {
    let priceVal = priceMatch[0];
    if (/^\d+\s*reais$/i.test(priceVal)) {
      const num = priceVal.replace(/\D/g, '');
      priceVal = `R$ ${num}`;
    } else if (/^por\s+\d+$/i.test(priceVal)) {
      const num = priceVal.replace(/\D/g, '');
      priceVal = `R$ ${num}`;
    }
    detected.push({
      field: 'Preço',
      value: priceVal,
    });
  }

  // 4. Cor
  const colorMatch = rawText.match(/\b(preto|preta|pretos|pretas|azul|azuis|vermelho|vermelha|branco|branca|amarelo|amarela|verde|cinza|marrom|rosa|roxo|roxa|dourado|dourada|prata|prateado|bege)\b/i);
  if (colorMatch) {
    detected.push({
      field: 'Cor',
      value: colorMatch[0].toLowerCase(),
    });
  }

  // 5. Estado de conservação / Condição (inclui termos informais)
  let estadoVal: string | null = null;
  if (/\b(em\s+bom\s+estado|bom\s+estado)\b/i.test(norm)) {
    estadoVal = 'bom estado';
  } else if (/\b(bem\s+conservado|conservad[oa])\b/i.test(norm)) {
    estadoVal = 'bem conservado';
  } else if (/\b(seminov[oa]|semi\s*novo)\b/i.test(norm)) {
    estadoVal = 'seminovo';
  } else if (/\b(usad[oa]\s+poucas\s+vezes|pouco\s+usad[oa]|usad[oa]\s+\d+\s*x|usei\s+\d+\s*x)\b/i.test(norm)) {
    estadoVal = 'pouco usado';
  } else if (/\b(novo|na\s+caixa|lacrad[oa]|sem\s+uso|nunca\s+usad[oa])\b/i.test(norm)) {
    estadoVal = 'novo / sem uso';
  } else if (/\b(praticamente\s+nov[oa])\b/i.test(norm)) {
    estadoVal = 'praticamente novo';
  } else if (/\b(usad[oa]|com\s+marcas\s+de\s+uso)\b/i.test(norm)) {
    estadoVal = 'usado';
  }

  if (estadoVal) {
    detected.push({
      field: 'Estado de conservação',
      value: estadoVal,
    });
  }

  // 6. Funcionamento
  if (/\b(funcionando perfeitamente|funciona perfeitamente|100% funcionando|perfeito estado de funcionamento|tudo funcionando)\b/i.test(norm)) {
    detected.push({
      field: 'Funcionamento',
      value: 'funcionando perfeitamente',
    });
  }

  // 7. Capacidade de armazenamento (para celulares / tablets / notebooks)
  const storageMatch = rawText.match(/\b\d+\s*(gb|tb)\b/i);
  if (storageMatch) {
    detected.push({
      field: 'Capacidade de armazenamento',
      value: storageMatch[0].toUpperCase(),
    });
  }

  // 8. Tamanho / Medidas (se presente)
  const sizeMatch = rawText.match(/\b(tamanho|tam\.?|n[uú]mero|num\.?)\s*(\d+|[pp|p|m|g|gg|xg]+)\b/i) || rawText.match(/\b(tam\s+[a-z0-9]+)\b/i);
  if (sizeMatch) {
    detected.push({
      field: 'Tamanho / Medida',
      value: sizeMatch[0],
    });
  }

  // 9. Características específicas
  if (/\b(leve|leves)\b/i.test(norm)) {
    detected.push({
      field: 'Característica',
      value: 'leve',
    });
  }
  if (/\b(bateria\s+de\s+longa\s+duracao|longa\s+duracao|bateria\s+boa)\b/i.test(norm)) {
    detected.push({
      field: 'Bateria',
      value: 'longa duração',
    });
  }
  if (/\b(entrego\s+o\s+video\s+editado|video\s+editado|entregue\s+editado)\b/i.test(norm)) {
    detected.push({
      field: 'Escopo do serviço',
      value: 'entrega do vídeo editado',
    });
  }
  if (/\b(sem\s+fio|bluetooth|bt)\b/i.test(norm) && category !== 'Áudio / Eletrônicos') {
    detected.push({
      field: 'Conectividade',
      value: 'Bluetooth / sem fio',
    });
  }

  // 10. Contato / Canal de Venda
  if (/\b(whatsapp|whats|zap)\b/i.test(norm)) {
    detected.push({
      field: 'Forma de contato',
      value: 'WhatsApp',
    });
  } else if (/\b(chama\s+(no\s+)?(privado|pv|direct)|falar\s+no\s+(privado|pv)|inbox)\b/i.test(norm)) {
    detected.push({
      field: 'Forma de contato',
      value: 'chamar no privado',
    });
  }

  return {
    detectedItems: detected,
    category,
    productIdentified,
  };
}

/**
 * Função auxiliar para garantir recomendações estritamente neutras e objetivas
 */
export function neutralizeRecommendation(text: string): string {
  let cleaned = (text || '').trim();

  // Remove afirmações não comprovadas
  cleaned = cleaned.replace(/\b(pois|porque|já que)\s+é\s+a\s+principal\s+dúvida(\s+para\s+este\s+tipo\s+de\s+produto)?/gi, 'para esclarecer essa informação');
  cleaned = cleaned.replace(/\bé\s+a\s+principal\s+dúvida\b/gi, 'é uma informação importante');
  cleaned = cleaned.replace(/\bo\s+que\s+mais\s+vende\b/gi, 'facilita a negociação');
  cleaned = cleaned.replace(/\bo\s+que\s+mais\s+atrai\s+compradores\b/gi, 'esclarece a oferta');
  cleaned = cleaned.replace(/\baumenta\s+as\s+vendas\b/gi, 'facilita a decisão');
  cleaned = cleaned.replace(/\batrair\s+mais\s+compradores\b/gi, 'esclarecer as dúvidas do comprador');
  cleaned = cleaned.replace(/\bevita\s+desconfiança\b/gi, 'esclarece as condições do item');

  return cleaned;
}

/**
 * Gera um checklist inteligente e contextual de forma determinística
 */
export function generateFallbackChecklist(adText: string): AdChecklistResult {
  const rawText = (adText || '').trim();
  const norm = normalize(rawText);

  const { detectedItems, category, productIdentified } = extractDetectedInfo(rawText);

  const hasDetected = (fieldName: string) =>
    detectedItems.some((d) => d.field.toLowerCase().includes(fieldName.toLowerCase()));

  const essential: string[] = [];
  const recommended: string[] = [];
  const optional: string[] = [];
  const recommendations: string[] = [];

  // =========================================================================
  // CLASSIFICAÇÃO CONTEXTUAL POR TIPO DE PRODUTO
  // =========================================================================

  // 1. Contato geral (se não houver nenhuma menção a contato, é essencial)
  if (!hasDetected('contato')) {
    essential.push('Forma de contato (ex: WhatsApp, direct ou mensagem privada)');
    recommendations.push('Adicione uma forma de contato para que os interessados possam falar diretamente com você.');
  }

  if (category === 'Calçados') {
    // Para calçado: tamanho é essencial!
    if (!hasDetected('Tamanho')) {
      essential.push('Tamanho / Numeração do calçado (ex: 39, 40, 41)');
      recommendations.push('Informe o tamanho do calçado para que o comprador saiba se a numeração é adequada para ele.');
    }
    if (!hasDetected('Estado')) {
      essential.push('Estado de conservação (novo ou usado)');
      recommendations.push('Informar se o calçado é novo ou usado esclarece a condição do produto.');
    }
    if (!hasDetected('Preço')) {
      essential.push('Preço');
    }

    // Modelo específico (recomendado quando não identificado, NUNCA essencial)
    if (!hasDetected('Modelo') && !rawText.toLowerCase().includes('revolution') && !rawText.toLowerCase().includes('air force')) {
      recommended.push('Modelo específico do calçado (se houver)');
    }
    if (!hasDetected('Cor')) {
      recommended.push('Cor do calçado');
    }

    // Opcional
    optional.push('Se possui a caixa ou embalagem original');
    optional.push('Fotos de diferentes ângulos do calçado');

  } else if (category === 'Smartphones / Celulares') {
    // Celular
    if (!hasDetected('armazenamento') && !norm.includes('gb')) {
      essential.push('Capacidade de armazenamento (ex: 64GB, 128GB, 256GB)');
      recommendations.push('Informe a capacidade de armazenamento interno (GB) para que o comprador saiba o espaço disponível.');
    }
    if (!hasDetected('Estado')) {
      essential.push('Estado de conservação da tela e carcaça');
      recommendations.push('Descreva a conservação da tela e laterais para detalhar a condição do aparelho.');
    }
    if (!hasDetected('Preço')) {
      essential.push('Preço');
    }

    // Modelo (se não estiver identificado, recomendado, NUNCA essencial)
    if (!hasDetected('Modelo') && !productIdentified.match(/\d+/)) {
      recommended.push('Modelo exato do smartphone');
    }

    // Recomendado
    if (!norm.includes('bateria')) {
      recommended.push('Saúde ou condição da bateria');
      if (recommendations.length < 3) {
        recommendations.push('Se desejar, informe a saúde da bateria para fornecer mais detalhes sobre o uso do aparelho.');
      }
    }
    recommended.push('Acessórios inclusos (carregador, cabo ou capinha)');
    if (recommendations.length < 3) {
      recommendations.push('Mencione se acompanha cabo, carregador ou capinha para esclarecer o que vai junto com o aparelho.');
    }
    if (!hasDetected('Cor')) {
      recommended.push('Cor do aparelho');
    }

    // Opcional
    optional.push('Se possui nota fiscal ou caixa original');

  } else if (category === 'Serviços') {
    // Serviços
    essential.push('Prazo de entrega ou duração/formato do vídeo');
    recommendations.push('Informe o prazo de entrega ou a duração do vídeo para alinhar as expectativas com o cliente.');

    if (!hasDetected('Preço')) {
      essential.push('Preço do serviço');
    }

    // Recomendado
    recommended.push('O que o cliente precisa enviar (arquivos brutos, roteiro ou referências)');
    if (recommendations.length < 3) {
      recommendations.push('Esclareça quais arquivos brutos o cliente precisa enviar para iniciar a edição.');
    }

    // Opcional
    optional.push('Exemplos de edições anteriores ou portfólio');
    optional.push('Política de revisões ou ajustes inclusos');

  } else if (category === 'Móveis') {
    // Móveis
    if (!hasDetected('Estado')) {
      essential.push('Estado de conservação do móvel');
      recommendations.push('Descreva o estado do móvel informando se há marcas de uso ou avarias.');
    }
    if (!hasDetected('Preço')) {
      essential.push('Preço');
    }

    // Para móveis, medidas e condições de retirada são contextualmente relevantes
    recommended.push('Medidas aproximadas (largura, profundidade e altura)');
    recommendations.push('Informe as dimensões aproximadas (largura, profundidade e altura) para que o comprador saiba se o móvel cabe no espaço disponível.');

    recommended.push('Condições de retirada ou transporte (se precisa desmontar)');
    if (recommendations.length < 3) {
      recommendations.push('Informe as condições de retirada ou se o móvel precisa ser desmontado para transporte.');
    }

    if (!hasDetected('Cor')) {
      recommended.push('Cor ou acabamento do móvel');
    }

    // Opcional
    optional.push('Material do móvel (ex: MDF, madeira maciça, metal)');

  } else if (category === 'Áudio / Eletrônicos') {
    // Fones / Eletrônicos
    if (!hasDetected('Estado')) {
      essential.push('Estado de conservação (novo, seminovo ou usado)');
      recommendations.push('Informar se o fone é novo ou usado ajuda o comprador a entender a condição do item.');
    }
    if (!hasDetected('Preço')) {
      essential.push('Preço do produto');
      recommendations.push('Informar o valor permite que o comprador saiba o preço diretamente no anúncio.');
    }

    // Recomendado
    recommended.push('Se acompanha cabo carregador ou estojo de recarga');
    if (!hasDetected('Cor')) {
      recommended.push('Cor do produto');
    }
    if (recommendations.length < 3) {
      recommendations.push('Mencionar se acompanha cabo ou estojo de carregamento esclarece o que está incluso no pacote.');
    }

    // Opcional
    optional.push('Marca ou modelo exato (se houver)');

  } else if (category === 'Vestuário / Moda') {
    // Roupa
    if (!hasDetected('Tamanho')) {
      essential.push('Tamanho da peça (ex: P, M, G, GG ou numeração)');
      recommendations.push('Informe o tamanho da roupa para que o comprador saiba se veste o número desejado.');
    }
    if (!hasDetected('Estado')) {
      essential.push('Estado de conservação (novo ou usado)');
    }
    if (!hasDetected('Preço')) {
      essential.push('Preço');
    }

    // Recomendado
    if (!hasDetected('Cor')) {
      recommended.push('Cor da peça');
    }
    recommended.push('Tecido ou material principal (ex: algodão, jeans, linho)');

    // Opcional
    optional.push('Medidas aproximadas da peça');

  } else {
    // Geral
    if (!hasDetected('Estado')) {
      essential.push('Estado de conservação (novo ou usado)');
      recommendations.push('Mencione se o item é novo ou usado para esclarecer a condição.');
    }
    if (!hasDetected('Preço')) {
      essential.push('Preço');
    }

    if (!hasDetected('Cor')) {
      recommended.push('Cor do produto');
    }
    optional.push('Motivo da venda');
  }

  // REGRAS CONTEXTUAIS ESPECIAIS:
  // 1. Pagamento: SÓ incluir se o contexto mencionar pagamento ou se for negociação claramente dependente
  const mentionsPayment = /\b(pagamento|pagar|parcelo|parcela|parcelado|cartao|pix|dinheiro|troca)\b/i.test(norm);
  if (mentionsPayment) {
    recommended.push('Formas de pagamento e parcelamento aceitas');
  }

  // 2. Entrega/Retirada: SÓ incluir se o contexto mencionar entrega/retirada ou se já foi adicionado para categoria onde é relevante (como Móveis)
  const mentionsDelivery = /\b(entrega|entregar|envio|enviar|retirada|retirar|frete|correios|em maos|em mãos)\b/i.test(norm);
  if (mentionsDelivery && !recommended.some((r) => r.toLowerCase().includes('retirada') || r.toLowerCase().includes('entrega'))) {
    recommended.push('Detalhes sobre local de entrega ou retirada');
  }

  // =========================================================================
  // CÁLCULO DINÂMICO DA PONTUAÇÃO DE COMPLETUDE (0 a 100)
  // Sem scores fixos por produto! Baseado puramente na presença/ausência de itens essenciais e recomendados.
  // =========================================================================
  let score = 100;

  // Itens essenciais ausentes têm o maior peso (~18 pontos cada)
  score -= essential.length * 18;

  // Itens recomendados ausentes têm peso moderado (~4 pontos cada)
  score -= recommended.length * 4;

  // Itens opcionais ausentes têm peso mínimo (~1 ponto cada)
  score -= optional.length * 1;

  // Anúncios que possuem TODAS as informações essenciais e já têm dados sólidos não devem ser penalizados por serem concisos
  if (essential.length === 0 && detectedItems.length >= 4) {
    // Garante que anúncio com todas as essenciais fique em nível alto (90+)
    score = Math.max(90, score);
  }

  // Limites
  if (score > 98) score = 98;
  if (score < 20) score = 20;

  // Explicação curta da pontuação
  let scoreExplanation = '';
  if (score >= 90) {
    scoreExplanation = 'O anúncio está altamente completo, reunindo as informações fundamentais para a decisão de compra.';
  } else if (score >= 75) {
    scoreExplanation = 'O anúncio apresenta a maior parte das informações necessárias, restando poucos detalhes para esclarecer.';
  } else if (score >= 55) {
    scoreExplanation = 'O anúncio apresenta dados básicos, mas faltam informações essenciais para esclarecer a proposta.';
  } else {
    scoreExplanation = 'O anúncio contém poucas informações sobre o que está sendo oferecido.';
  }

  return {
    productIdentified,
    productCategory: category,
    completenessScore: score,
    scoreExplanation,
    detectedItems,
    missingItems: {
      essential: essential.slice(0, 4),
      recommended: recommended.slice(0, 4),
      optional: optional.slice(0, 3),
    },
    recommendations: recommendations.map(neutralizeRecommendation).slice(0, 3),
  };
}

/**
 * Higieniza e valida o checklist gerado pela IA ou motor de contingência
 */
export function sanitizeAndValidateChecklist(raw: any, adText: string): AdChecklistResult {
  const fallback = generateFallbackChecklist(adText);
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const rawTextLower = (adText || '').toLowerCase();
  const rawTextNorm = normalize(adText);

  // 1. Produto identificado
  let productIdentified = typeof raw.productIdentified === 'string' && raw.productIdentified.trim().length > 2
    ? raw.productIdentified.trim()
    : fallback.productIdentified;

  // 2. Itens detectados
  let detectedItems: ChecklistDetectedItem[] = [];
  if (Array.isArray(raw.detectedItems) && raw.detectedItems.length > 0) {
    for (const item of raw.detectedItems) {
      if (item && typeof item.field === 'string') {
        detectedItems.push({
          field: item.field.trim(),
          value: typeof item.value === 'string' ? item.value.trim() : undefined,
        });
      }
    }
  }
  if (detectedItems.length === 0) {
    detectedItems = fallback.detectedItems;
  }

  // 3. Missing items (essencial, recomendado, opcional) com validação rígida
  const essential: string[] = [];
  const recommended: string[] = [];
  const optional: string[] = [];

  const rawMissing = raw.missingItems || {};

  // Função para checar se algo foi marcado como ausente mas já está no anúncio
  const isAlreadyInAd = (textToCheck: string): boolean => {
    const normCheck = normalize(textToCheck);
    if (normCheck.includes('preco') || normCheck.includes('valor')) {
      return /\b(r\$\s*\d+|\d+\s*reais)\b/i.test(rawTextLower);
    }
    if (normCheck.includes('estado') || normCheck.includes('condicao')) {
      return /\b(bom estado|bem conservado|seminov|usad|nov[oa]|praticamente nov)\b/i.test(rawTextNorm);
    }
    if (normCheck.includes('cor')) {
      return /\b(preto|preta|azul|branco|branca|vermelho|vermelha|cinza|amarelo)\b/i.test(rawTextNorm);
    }
    if (normCheck.includes('marca')) {
      return /\b(nike|adidas|apple|samsung|motorola|xiaomi)\b/i.test(rawTextNorm);
    }
    if (normCheck.includes('armazenamento') || normCheck.includes('memoria')) {
      return /\b\d+\s*(gb|tb)\b/i.test(rawTextNorm);
    }
    if (normCheck.includes('modelo') && (rawTextNorm.includes('iphone 13') || rawTextNorm.includes('galaxy') || rawTextNorm.includes('air force'))) {
      return true;
    }
    if (normCheck.includes('contato') && /\b(whatsapp|whats|zap|privado|pv|direct)\b/i.test(rawTextNorm)) {
      return true;
    }
    return false;
  };

  // REGRAS DE REFINAMENTO:
  // 1. Pagamento: NÃO sugerir a menos que o contexto do anúncio torne isso claramente relevante
  const mentionsPaymentContext = /\b(pagamento|pagar|parcelo|parcela|parcelado|cartao|pix|dinheiro|troca)\b/i.test(rawTextNorm);
  const isPaymentItem = (str: string) => /\b(pagamento|parcelamento|cartao|pix)\b/i.test(normalize(str));

  // 2. Entrega/Retirada: NÃO sugerir automaticamente a menos que o contexto mencione ou seja móvel/veículo
  const mentionsDeliveryContext = /\b(entrega|entregar|envio|enviar|retirada|retirar|frete|correios|em maos|em mãos)\b/i.test(rawTextNorm) ||
    /\b(sofa|mesa|cadeira|estante|armario|cama|movel)\b/i.test(rawTextNorm);
  const isDeliveryItem = (str: string) => /\b(entrega|retirada|frete|envio)\b/i.test(normalize(str));

  // 3. Modelo: NUNCA essencial automaticamente (mover para recomendado)
  const isModelItem = (str: string) => /\b(modelo\s+especifico|modelo\s+exato|modelo)\b/i.test(normalize(str));

  // 4. Fotos: NUNCA essencial por padrão (mover para recomendado ou opcional)
  const isPhotoItem = (str: string) => /\b(foto|fotos|imagem|imagens)\b/i.test(normalize(str));

  if (Array.isArray(rawMissing.essential)) {
    for (const item of rawMissing.essential) {
      if (typeof item === 'string' && item.trim()) {
        const clean = item.trim();
        if (isAlreadyInAd(clean)) continue;
        if (isPaymentItem(clean) && !mentionsPaymentContext) continue;
        if (isDeliveryItem(clean) && !mentionsDeliveryContext) continue;

        if (isModelItem(clean)) {
          // Modelo não é essencial automaticamente -> mover para recomendado
          if (!isAlreadyInAd(clean) && !recommended.includes(clean)) {
            recommended.push(clean);
          }
          continue;
        }

        if (isPhotoItem(clean)) {
          // Fotos não são essenciais por padrão -> mover para recomendado ou opcional
          if (!optional.includes(clean)) {
            optional.push(clean);
          }
          continue;
        }

        essential.push(clean);
      }
    }
  }

  if (Array.isArray(rawMissing.recommended)) {
    for (const item of rawMissing.recommended) {
      if (typeof item === 'string' && item.trim()) {
        const clean = item.trim();
        if (isAlreadyInAd(clean)) continue;
        if (isPaymentItem(clean) && !mentionsPaymentContext) continue;
        if (isDeliveryItem(clean) && !mentionsDeliveryContext) continue;

        if (isPhotoItem(clean)) {
          if (!optional.includes(clean)) {
            optional.push(clean);
          }
          continue;
        }

        recommended.push(clean);
      }
    }
  }

  if (Array.isArray(rawMissing.optional)) {
    for (const item of rawMissing.optional) {
      if (typeof item === 'string' && item.trim()) {
        const clean = item.trim();
        if (isAlreadyInAd(clean)) continue;
        if (isPaymentItem(clean) && !mentionsPaymentContext) continue;
        optional.push(clean);
      }
    }
  }

  // Recomendações (máximo 3, neutralizadas)
  const recommendations: string[] = [];
  if (Array.isArray(raw.recommendations)) {
    for (const rec of raw.recommendations) {
      if (typeof rec === 'string' && rec.trim() && recommendations.length < 3) {
        const neutralized = neutralizeRecommendation(rec.trim());
        // Não incluir recomendação de pagamento ou entrega se não foi autorizado pelo contexto
        if (isPaymentItem(neutralized) && !mentionsPaymentContext) continue;
        if (isDeliveryItem(neutralized) && !mentionsDeliveryContext) continue;
        recommendations.push(neutralized);
      }
    }
  }

  // 4. Pontuação de completude dinâmica baseada em itens essenciais e recomendados reais
  let completenessScore = typeof raw.completenessScore === 'number'
    ? Math.min(100, Math.max(20, Math.round(raw.completenessScore)))
    : fallback.completenessScore;

  // Se o anúncio tiver TODAS as informações essenciais e informações detected sólidas,
  // não permitir penalização desproporcional para anúncios curtos como iPhone 13
  if (essential.length === 0 && detectedItems.length >= 4) {
    completenessScore = Math.max(90, completenessScore);
  } else if (essential.length === 1 && completenessScore > 85) {
    completenessScore = 78;
  } else if (essential.length >= 2 && completenessScore > 70) {
    completenessScore = 60;
  }

  let scoreExplanation = typeof raw.scoreExplanation === 'string' && raw.scoreExplanation.trim().length > 10
    ? neutralizeRecommendation(raw.scoreExplanation.trim())
    : fallback.scoreExplanation;

  return {
    productIdentified,
    productCategory: typeof raw.productCategory === 'string' ? raw.productCategory : fallback.productCategory,
    completenessScore,
    scoreExplanation,
    detectedItems: detectedItems.length > 0 ? detectedItems : fallback.detectedItems,
    missingItems: {
      essential: essential.slice(0, 4),
      recommended: recommended.slice(0, 4),
      optional: optional.slice(0, 3),
    },
    recommendations: recommendations.length > 0 ? recommendations.slice(0, 3) : fallback.recommendations,
  };
}
