import assert from 'node:assert/strict';
import {
  validateAdInput,
  generateFallbackAd,
  sanitizeGeneratedAd,
  buildCleanFullAdText,
  cleanSingleCta,
} from '../src/lib/adGeneratorCore';
import {
  generateFallbackTitles,
  sanitizeAndValidateTitles,
} from '../src/lib/titleGenerator';

async function runTests() {
  console.log('--- Starting Ad Generator & Anti-Hallucination Core Tests ---');

  // Test 1: validateAdInput
  console.log('Test 1: Input Validation');
  assert.equal(validateAdInput({ productName: '', features: 'Bluetooth' }).valid, false);
  assert.equal(validateAdInput({ productName: 'Fone', features: '' }).valid, false);
  assert.equal(validateAdInput({ productName: '   ', features: '  ' }).valid, false);
  
  const validCheck = validateAdInput({
    productName: 'Fone de Ouvido Pro',
    features: 'Bateria de 28h, Bluetooth 5.3, preto fosco',
  });
  assert.equal(validCheck.valid, true);
  console.log('✓ Input validation works as expected');

  // Test 2: generateFallbackAd
  console.log('Test 2: Fallback Ad Generation (Zero Hallucination)');
  const fallback = generateFallbackAd({
    productName: 'Fone Bluetooth Pro',
    category: 'Eletrônicos',
    price: '199,90',
    targetAudience: 'estudantes',
    features: 'bateria 20h, bluetooth 5.3, preto, almofadas macias',
    tone: 'vendedor',
  });

  assert.ok(fallback.title.includes('Fone Bluetooth Pro'));
  assert.ok(fallback.fullDescription.includes('R$ 199,90'));
  assert.ok(fallback.shortText.includes('R$ 199,90'));
  assert.ok(fallback.fullDescription.includes('bateria 20h'));
  assert.ok(fallback.benefits.length > 0);
  assert.ok(fallback.callToActions.length >= 3);
  assert.ok(fallback.optionalAdditions.length > 0);
  // Zero brackets allowed
  assert.equal(/\[.*\]/.test(fallback.fullDescription), false);
  assert.equal(/\[.*\]/.test(fallback.title), false);
  console.log('✓ Fallback ad generated cleanly without hallucinated fields or brackets');

  // Test 3: Anti-Hallucination Sanitization - Respingos vs À prova d'água
  console.log('Test 3: Anti-Hallucination - Respingos vs Waterproof');
  const sanitizedWaterproof = sanitizeGeneratedAd(
    {
      title: 'Fone À Prova D\'Água e Impermeável',
      fullDescription: 'Totalmente impermeável e à prova d água.',
      benefits: ['À prova d\'água', 'Bluetooth 5.3'],
      shortText: 'Fone impermeável.',
      callToActions: ['Compre já'],
      optionalAdditions: [],
    },
    {
      productName: 'Fone Esportivo',
      features: 'resistente a respingos, bluetooth 5.3',
    }
  );

  assert.equal(sanitizedWaterproof.title.toLowerCase().includes('à prova d\'água'), false);
  assert.equal(sanitizedWaterproof.title.toLowerCase().includes('impermeável'), false);
  assert.equal(sanitizedWaterproof.benefits.some((b: string) => b.toLowerCase().includes('à prova d\'água')), false);
  console.log('✓ Respingos strictly preserved; fake waterproof claims removed');

  // Test 4: Anti-Hallucination Sanitization - Usado/Seminovo vs Novo/Lacrado
  console.log('Test 4: Anti-Hallucination - Used/Seminovo vs New/Sealed');
  const sanitizedUsed = sanitizeGeneratedAd(
    {
      title: 'Celular Produto Novo e Lacrado',
      fullDescription: 'Aparelho totalmente novo e lacrado na caixa.',
      benefits: ['Produto novo', 'Tela OLED'],
      shortText: 'Novo e lacrado.',
      callToActions: ['Fale comigo'],
      optionalAdditions: [],
    },
    {
      productName: 'Celular X',
      features: 'seminovo, usei 2x, tela oled',
    }
  );

  assert.equal(sanitizedUsed.title.toLowerCase().includes('lacrado'), false);
  assert.equal(sanitizedUsed.title.toLowerCase().includes('totalmente novo'), false);
  assert.equal(sanitizedUsed.benefits.some((b: string) => b.toLowerCase().includes('produto novo')), false);
  console.log('✓ Used/seminovo strictly preserved; fake new/sealed claims stripped');

  // Test 5: Anti-Hallucination Sanitization - Warranty & Invoices stripped if not provided
  console.log('Test 5: Anti-Hallucination - Warranty and Invoice Stripping');
  const sanitizedWarranty = sanitizeGeneratedAd(
    {
      title: 'Bolsa Preta Elegante',
      fullDescription: 'Bolsa preta em couro legítimo com garantia de 1 ano e nota fiscal inclusa. Envio imediato.',
      benefits: ['Garantia de fábrica', 'Couro legítimo', 'Nota fiscal inclusa'],
      shortText: 'Compre com garantia de fábrica.',
      callToActions: ['Consulte disponibilidade no estoque', 'Últimas unidades corra que acaba', 'Fale comigo se tiver interesse.'],
      optionalAdditions: [],
    },
    {
      productName: 'Bolsa Preta',
      features: 'alça transversal, fechamento magnético',
    }
  );

  assert.equal(sanitizedWarranty.fullDescription.toLowerCase().includes('garantia'), false);
  assert.equal(sanitizedWarranty.fullDescription.toLowerCase().includes('nota fiscal'), false);
  assert.equal(sanitizedWarranty.fullDescription.toLowerCase().includes('couro'), false);
  assert.equal(sanitizedWarranty.fullDescription.toLowerCase().includes('envio imediato'), false);
  // CTAs shouldn't mention unprovided stock or urgency
  for (const cta of sanitizedWarranty.callToActions) {
    assert.equal(cta.toLowerCase().includes('últimas unidades'), false);
    assert.equal(cta.toLowerCase().includes('consulte disponibilidade'), false);
  }
  console.log('✓ Uninformed warranty, NF, material, shipping, urgency and fake stock removed');

  // Test 6: buildCleanFullAdText (Ready-to-paste text without UI labels)
  console.log('Test 6: buildCleanFullAdText Copyable Output');
  const fullText = buildCleanFullAdText(fallback);
  assert.ok(fullText.includes(fallback.title));
  assert.ok(fullText.includes(fallback.callToActions[0]));
  // Must NOT include bracket placeholders
  assert.equal(/\[.*\]/.test(fullText), false);
  // Must NOT include internal UI labels like "TÍTULO DO ANÚNCIO"
  assert.equal(fullText.includes('📢 TÍTULO'), false);
  assert.equal(fullText.includes('📝 DESCRIÇÃO'), false);
  console.log('✓ buildCleanFullAdText creates clean, ready-to-paste ad copy without UI labels or placeholders');

  // Test 7: Mercado Livre Title Generator - Zero Price in Titles Guarantee
  console.log('Test 7: Mercado Livre Title Generator - Zero Price Guarantee');
  const mlInput = {
    productName: 'Fone de Ouvido Bluetooth',
    category: 'Eletrônicos',
    features: 'leve, bateria de longa duração',
    price: 'R$ 149,90',
    platform: 'Mercado Livre' as const,
    style: 'profissional' as const,
  };

  // 7a: Fallback Generator must never produce price for Mercado Livre
  const mlFallbackTitles = generateFallbackTitles(mlInput);
  assert.ok(mlFallbackTitles.length > 0, 'Must generate titles for Mercado Livre');
  for (const title of mlFallbackTitles) {
    assert.equal(/R\$/i.test(title), false, `Fallback title for Mercado Livre must NOT contain "R$": "${title}"`);
    assert.equal(/149/i.test(title), false, `Fallback title for Mercado Livre must NOT contain price digits: "${title}"`);
    assert.equal(/\breais\b/i.test(title), false, `Fallback title for Mercado Livre must NOT contain "reais": "${title}"`);
    assert.equal(/\bpor\s+R?\$?\d+/i.test(title), false, `Fallback title for Mercado Livre must NOT contain price expressions: "${title}"`);
    assert.ok(title.toLowerCase().includes('fone'), 'Title must preserve product name');
  }
  console.log('✓ generateFallbackTitles guarantees 0 price in Mercado Livre titles');

  // 7b: sanitizeAndValidateTitles must strip and reject price for Mercado Livre
  const rawAiTitlesWithPrice = [
    'Fone de Ouvido Bluetooth Leve com Bateria de Longa Duração - R$ 149,90',
    'Fone de Ouvido Bluetooth com Bateria de Longa Duração por R$ 149,90',
    'Fone de Ouvido Bluetooth Leve por 149 reais',
    'Fone de Ouvido Bluetooth Leve - 149,90',
    'Fone de Ouvido Bluetooth Leve com Bateria de Longa Duração',
    'Fone de Ouvido Bluetooth Leve',
    'Fone de Ouvido Bluetooth com Bateria de Longa Duração',
  ];

  const sanitizedMlTitles = sanitizeAndValidateTitles(rawAiTitlesWithPrice, mlInput);
  assert.ok(sanitizedMlTitles.length > 0, 'Must have sanitized valid titles');
  for (const title of sanitizedMlTitles) {
    assert.equal(/R\$/i.test(title), false, `Sanitized Mercado Livre title must NOT contain "R$": "${title}"`);
    assert.equal(/149/i.test(title), false, `Sanitized Mercado Livre title must NOT contain price values: "${title}"`);
    assert.equal(/\breais\b/i.test(title), false, `Sanitized Mercado Livre title must NOT contain "reais": "${title}"`);
    assert.equal(/\bpor\s+R?\$?\d+/i.test(title), false, `Sanitized Mercado Livre title must NOT contain price expressions: "${title}"`);
    // Verify features are preserved
    assert.ok(
      title.toLowerCase().includes('leve') || title.toLowerCase().includes('bateria') || title.toLowerCase().includes('fone'),
      'Must preserve real user features'
    );
  }
  console.log('✓ sanitizeAndValidateTitles strictly removes and forbids price in Mercado Livre titles');

  // 7c: Contrast check - non-Mercado Livre platforms CAN include price when informed
  const instagramInput = {
    ...mlInput,
    platform: 'Instagram' as const,
  };
  const instagramFallbackTitles = generateFallbackTitles(instagramInput);
  const hasPriceInInstagram = instagramFallbackTitles.some((t) => t.includes('149,90') || t.includes('R$'));
  assert.ok(hasPriceInInstagram, 'Other platforms like Instagram can include price variations when provided');
  console.log('✓ Price allowed on other platforms when appropriate, but strictly forbidden on Mercado Livre');

  // Test 8: "Copiar anúncio" - Texto Final, Limpo e Pronto para Publicação (Single CTA, No Opção 1/2/3, No AI residue)
  console.log('Test 8: Copiar Anúncio - Clean Final Ready-to-Publish Text');

  // 8a: Input matching the user prompt's exact case study
  const structuredAiAd = {
    title: '🎯 Fone Bluetooth para Gamers',
    fullDescription: '📝 DESCRIÇÃO:\nFone Bluetooth voltado para o público gamer. O dispositivo conta com bateria de 24 horas de duração e foi projetado para ser confortável durante o uso. O valor do produto é R$ 120,00.',
    benefits: [
      'Conexão Bluetooth',
      'Bateria com 24 horas de duração',
      'Design confortável',
    ],
    shortText: '📱 TEXTO CURTO:\nFone Bluetooth para gamers, confortável e com 24 horas de bateria. Valor: R$ 120,00.',
    callToActions: [
      'Opção 1: Entre em contato para saber mais.',
      'Opção 2: Chame no privado para mais informações.',
      'Opção 3: Fale comigo se tiver interesse.',
    ],
  };

  const cleanCopiedAd = buildCleanFullAdText(structuredAiAd);

  // 1. Contenha APENAS UMA chamada para ação
  assert.ok(cleanCopiedAd.includes('Entre em contato para saber mais.'), 'Must include the single primary CTA');
  assert.equal(cleanCopiedAd.includes('Chame no privado'), false, 'Must NOT contain secondary CTA');
  assert.equal(cleanCopiedAd.includes('Fale comigo se tiver interesse'), false, 'Must NOT contain tertiary CTA');

  // 2. Não contenha "Opção 1", "Opção 2", "Opção 3"
  assert.equal(/op[çc][aã]o\s*1/i.test(cleanCopiedAd), false, 'Must NOT contain "Opção 1"');
  assert.equal(/op[çc][aã]o\s*2/i.test(cleanCopiedAd), false, 'Must NOT contain "Opção 2"');
  assert.equal(/op[çc][aã]o\s*3/i.test(cleanCopiedAd), false, 'Must NOT contain "Opção 3"');

  // 3. Não contenha "CHAMADAS PARA AÇÃO" ou "CTAs"
  assert.equal(/chamadas?\s*para\s*a[çc][aã]o/i.test(cleanCopiedAd), false, 'Must NOT contain "CHAMADAS PARA AÇÃO"');
  assert.equal(/\bctas?\b/i.test(cleanCopiedAd), false, 'Must NOT contain "CTAs"');

  // 4. Não contenha rótulos técnicos de interface ("DESCRIÇÃO:", "BENEFÍCIOS:", "TEXTO CURTO:")
  assert.equal(/descri[çc][aã]o\s*:/i.test(cleanCopiedAd), false, 'Must NOT contain "DESCRIÇÃO:"');
  assert.equal(/benef[íi]cios\s*:/i.test(cleanCopiedAd), false, 'Must NOT contain "BENEFÍCIOS:"');
  assert.equal(/texto\s*curto\s*:/i.test(cleanCopiedAd), false, 'Must NOT contain "TEXTO CURTO:"');

  // 5. Estrutura correta de destaques
  assert.ok(cleanCopiedAd.includes('⭐ Destaques:'), 'Must format benefits cleanly as "⭐ Destaques:"');
  assert.ok(cleanCopiedAd.includes('• Conexão Bluetooth'), 'Must contain bulleted benefit 1');
  assert.ok(cleanCopiedAd.includes('• Bateria com 24 horas de duração'), 'Must contain bulleted benefit 2');
  assert.ok(cleanCopiedAd.includes('• Design confortável'), 'Must contain bulleted benefit 3');

  // 6. Não contenha JSON ou metadados
  assert.equal(cleanCopiedAd.includes('{"'), false, 'Must NOT contain JSON');
  assert.equal(cleanCopiedAd.includes('callToActions'), false, 'Must NOT contain code property names');

  // 7. Não contenha undefined, null ou NaN
  assert.equal(/\b(undefined|null|NaN)\b/i.test(cleanCopiedAd), false, 'Must NOT contain undefined/null/NaN');

  // 8. Não contenha placeholders
  assert.equal(/\[.*\]/.test(cleanCopiedAd), false, 'Must NOT contain brackets or placeholders');

  // 9. Preservar as características reais fornecidas
  assert.ok(cleanCopiedAd.includes('Bluetooth'), 'Must preserve "Bluetooth"');
  assert.ok(cleanCopiedAd.includes('24 horas'), 'Must preserve "24 horas"');
  assert.ok(cleanCopiedAd.includes('R$ 120,00'), 'Must preserve "R$ 120,00"');

  // 10. Respeitar regras anti-invenção
  assert.equal(cleanCopiedAd.toLowerCase().includes('garantia'), false, 'Must NOT invent warranty');
  assert.equal(cleanCopiedAd.toLowerCase().includes('nota fiscal'), false, 'Must NOT invent invoice');
  assert.equal(cleanCopiedAd.toLowerCase().includes('últimas unidades'), false, 'Must NOT invent urgency/stock');

  // 8b: Testing raw string parse with headers (AI unformatted string output)
  const rawAiTextExample = `🎯 Fone Bluetooth para Gamers

📝 DESCRIÇÃO:
Fone Bluetooth voltado para o público gamer. O dispositivo conta com bateria de 24 horas de duração e foi projetado para ser confortável durante o uso. O valor do produto é R$ 120,00.

⭐ BENEFÍCIOS:

Conexão Bluetooth
Bateria com 24 horas de duração
Design confortável

📱 TEXTO CURTO:
Fone Bluetooth para gamers, confortável e com 24 horas de bateria. Valor: R$ 120,00.

🚀 CTAs:
Opção 1: Entre em contato para saber mais.
Opção 2: Chame no privado para mais informações.
Opção 3: Fale comigo se tiver interesse.`;

  const parsedFromRaw = buildCleanFullAdText(rawAiTextExample);
  assert.ok(parsedFromRaw.includes('🎯 Fone Bluetooth para Gamers'));
  assert.ok(parsedFromRaw.includes('⭐ Destaques:'));
  assert.ok(parsedFromRaw.includes('• Conexão Bluetooth'));
  assert.ok(parsedFromRaw.includes('Entre em contato para saber mais.'));
  assert.equal(/op[çc][aã]o\s*\d+/i.test(parsedFromRaw), false);
  assert.equal(/ctas?/i.test(parsedFromRaw), false);
  assert.equal(parsedFromRaw.includes('Chame no privado'), false);

  // 8c: cleanSingleCta helper function
  assert.equal(cleanSingleCta('Opção 1: Entre em contato para saber mais.'), 'Entre em contato para saber mais.');
  assert.equal(cleanSingleCta('Opção 2 - Chame no privado.'), 'Chame no privado.');
  assert.equal(cleanSingleCta('1. Fale comigo se tiver interesse.'), 'Fale comigo se tiver interesse.');
  assert.equal(cleanSingleCta('🚀 CTA 3: Mande uma mensagem.'), 'Mande uma mensagem.');

  console.log('✓ Copiar Anúncio produces pristine ready-to-publish ad copy with a single CTA and zero AI residue');

  console.log('---------------------------------------------------------');
  console.log('🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY! (8/8)');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
