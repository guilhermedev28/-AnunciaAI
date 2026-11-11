import assert from 'node:assert/strict';
import {
  sanitizeImprovedAdText,
  generateFallbackImprovedAd,
} from '../src/lib/adAnalysis';

async function runImprovementTests() {
  console.log('--- Starting "Melhorar Anúncio" & Anti-Hallucination Flow Tests ---');

  // Test 1: Informal Ad Transformation (Reference case from user prompt)
  console.log('Test 1: Informal Ad Transformation');
  const informalInput = 'Vendo camiseta Nike preta por R$79,90. Confortável. Chama no privado.';
  const improvedInformal = generateFallbackImprovedAd(informalInput);

  assert.ok(improvedInformal.includes('Nike'));
  assert.ok(improvedInformal.includes('79,90'));
  assert.ok(improvedInformal.toLowerCase().includes('preta'));
  assert.ok(improvedInformal.includes('Confortável') || improvedInformal.toLowerCase().includes('confortável'));
  assert.ok(improvedInformal.toLowerCase().includes('privado') || improvedInformal.toLowerCase().includes('contato'));

  // ABSOLUTE FORBIDDEN INVENTIONS
  const forbiddenTerms = [
    'algodão', 'algodao', 'tamanho', 'originalidade', 'garantia',
    'qualidade premium', 'entrega', 'frete', 'estoque', 'desconto',
    'nota fiscal', 'últimas unidades', 'impermeável'
  ];
  for (const term of forbiddenTerms) {
    assert.equal(
      improvedInformal.toLowerCase().includes(term),
      false,
      `Forbidden invented term found: "${term}" in output: "${improvedInformal}"`
    );
  }
  assert.equal(/\bnf\b/i.test(improvedInformal), false, 'Forbidden invented NF found');
  console.log('✓ Informal ad improved cleanly without hallucinating materials, size, warranty or shipping');

  // Test 2: Meaning Preservation - Respingos vs Waterproof
  console.log('Test 2: Meaning Preservation - Respingos vs Waterproof');
  const respingosAd = 'Fone bluetooth para corrida, resistente a respingos de suor e chuva leve.';
  const hallucinatedWaterproofOutput = 'Fone Bluetooth Impermeável e 100% à prova d\'água para natação.';
  const sanitizedWaterproof = sanitizeImprovedAdText(hallucinatedWaterproofOutput, respingosAd);

  assert.equal(sanitizedWaterproof.toLowerCase().includes('à prova d\'água'), false);
  assert.equal(sanitizedWaterproof.toLowerCase().includes('impermeável'), false);
  assert.ok(sanitizedWaterproof.toLowerCase().includes('resistente a respingos'));
  console.log('✓ Respingos strictly preserved; fake waterproof claims converted to respingos');

  // Test 3: Meaning Preservation - Used/Seminovo vs New/Sealed & Bom Estado vs Impecável
  console.log('Test 3: Meaning Preservation - Used/Seminovo vs New/Sealed');
  const seminovoAd = 'iPhone 13 128GB azul seminovo, usei 2x, marcas leves de uso, em bom estado.';
  const hallucinatedNewOutput = 'Aparelho iPhone 13 128GB totalmente novo, produto lacrado na caixa e impecável.';
  const sanitizedNew = sanitizeImprovedAdText(hallucinatedNewOutput, seminovoAd);

  assert.equal(sanitizedNew.toLowerCase().includes('totalmente novo'), false);
  assert.equal(sanitizedNew.toLowerCase().includes('lacrado'), false);
  assert.equal(sanitizedNew.toLowerCase().includes('impecável'), false);
  console.log('✓ Used/seminovo strictly preserved; fake new/sealed claims stripped');

  // Test 4: Warranty, NF, Shipping and Stock Stripping when not in original
  console.log('Test 4: Warranty, Invoice, Stock & Shipping Stripping');
  const simpleAd = 'Mesa de madeira maciça de jantar com 6 cadeiras por 1200 reais.';
  const hallucinatedExtras = `Mesa de jantar elegante.
• Com garantia de 1 ano de fábrica
• Acompanha nota fiscal
• Frete grátis para todo o Brasil
• Últimas unidades no estoque, corra que acaba!
• Em promoção imperdível com super desconto.
Entre em contato.`;
  const sanitizedExtras = sanitizeImprovedAdText(hallucinatedExtras, simpleAd);

  assert.equal(sanitizedExtras.toLowerCase().includes('garantia'), false);
  assert.equal(sanitizedExtras.toLowerCase().includes('nota fiscal'), false);
  assert.equal(sanitizedExtras.toLowerCase().includes('frete grátis'), false);
  assert.equal(sanitizedExtras.toLowerCase().includes('últimas unidades'), false);
  assert.equal(sanitizedExtras.toLowerCase().includes('estoque'), false);
  assert.equal(sanitizedExtras.toLowerCase().includes('promoção'), false);
  assert.equal(sanitizedExtras.toLowerCase().includes('desconto'), false);
  console.log('✓ Uninformed warranty, NF, shipping, stock, and promo successfully stripped');

  // Test 5: Sanitization of placeholders, technical garbage and formatting artifacts
  console.log('Test 5: Zero Placeholders and Technical Garbage');
  const dirtyImprovedText = `Tênis de corrida preto [adicione tamanho aqui]
• Material: [informe o material]
• Garantia: -
• Tamanho: 
• Condição: - -
null undefined NaN [object Object]
Preço: R$ 250,00`;
  const cleaned = sanitizeImprovedAdText(dirtyImprovedText, 'Tênis de corrida preto por 250 reais.');

  assert.equal(/\[.*\]/.test(cleaned), false, 'Brackets/placeholders must be removed');
  assert.equal(/\b(undefined|null|NaN)\b/.test(cleaned), false, 'Technical tokens must be removed');
  assert.equal(cleaned.includes('[object Object]'), false);
  assert.equal(cleaned.includes('Material:'), false, 'Empty label Material: must be removed');
  assert.equal(cleaned.includes('Garantia:'), false, 'Empty label Garantia: must be removed');
  assert.equal(cleaned.includes('Tamanho:'), false, 'Empty label Tamanho: must be removed');
  assert.equal(cleaned.includes('- -'), false, 'Double hyphens must be normalized');
  console.log('✓ Placeholders, empty dangling labels, and technical artifacts 100% sanitized');

  // Test 6: Minimal Ad (short input)
  console.log('Test 6: Minimal Ad Transformation');
  const minimalAd = 'Bicicleta aro 29 preta 800 reais';
  const improvedMinimal = generateFallbackImprovedAd(minimalAd);

  assert.ok(improvedMinimal.includes('Bicicleta'));
  assert.ok(improvedMinimal.includes('29'));
  assert.ok(improvedMinimal.includes('800'));
  assert.equal(/\[.*\]/.test(improvedMinimal), false);
  assert.equal(/\b(undefined|null|NaN)\b/.test(improvedMinimal), false);
  console.log('✓ Minimal ad handled properly without crashing or inventing fields');

  // Test 7: Ad without price
  console.log('Test 7: Ad without price');
  const noPriceAd = 'Sofá retrátil 3 lugares cinza chumbo em ótimo estado para retirar no Centro.';
  const improvedNoPrice = generateFallbackImprovedAd(noPriceAd);

  assert.ok(improvedNoPrice.includes('Sofá'));
  assert.ok(improvedNoPrice.includes('3 lugares') || improvedNoPrice.includes('retrátil'));
  assert.ok(improvedNoPrice.includes('Centro'));
  // Should NOT invent a price like "R$ 0,00" or "[informe o preço]"
  assert.equal(/\[.*\]/.test(improvedNoPrice), false);
  assert.equal(improvedNoPrice.includes('R$ 0'), false);
  assert.equal(improvedNoPrice.includes('Preço:'), false);
  console.log('✓ Ad without price handled without fake prices or placeholders');

  // Test 8: Complete structured ad
  console.log('Test 8: Complete Structured Ad');
  const fullAd = `MacBook Air M2 8GB 256GB Cinza Espacial
Seminovo com 4 meses de uso.
Bateria com 98% de saúde.
Acompanha carregador original e cabo.
Valor: R$ 5.900 à vista.
Retirada em mãos no shopping Morumbi.`;
  const improvedFull = generateFallbackImprovedAd(fullAd);

  assert.ok(improvedFull.includes('MacBook'));
  assert.ok(improvedFull.includes('M2'));
  assert.ok(improvedFull.includes('5.900'));
  assert.ok(improvedFull.includes('98%'));
  assert.ok(improvedFull.includes('carregador original'));
  assert.ok(improvedFull.includes('Morumbi'));
  // Should NOT invent warranty of 1 year if not specified
  assert.equal(improvedFull.toLowerCase().includes('garantia de 1 ano'), false);
  console.log('✓ Full ad structured professionally while strictly preserving specs');

  console.log('---------------------------------------------------------');
  console.log('🎉 ALL AD IMPROVEMENT AUTOMATED TESTS PASSED! (8/8)');
}

runImprovementTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
