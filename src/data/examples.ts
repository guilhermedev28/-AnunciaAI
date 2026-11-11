import { AdFormData } from '../types';

export const EXAMPLE_PRODUCTS: { label: string; data: AdFormData }[] = [
  {
    label: 'Fone Bluetooth',
    data: {
      productName: 'Fone de Ouvido Bluetooth Pro Bass',
      category: 'Eletrônicos & Acessórios',
      price: 'R$ 119,90',
      targetAudience: 'Jovens, estudantes e quem pratica esportes ou treina na academia',
      features: 'Bateria de 28h com estojo recarregável, Bluetooth 5.3 estável, cancelamento de ruído passivo, resistente a respingos e microfone integrado para chamadas nítidas',
      tone: 'vendedor',
      platform: 'Multicanal',
    },
  },
  {
    label: 'Bolsa feminina',
    data: {
      productName: 'Bolsa Feminina Transversal em Couro Legítimo',
      category: 'Moda & Acessórios',
      price: 'R$ 159,90',
      targetAudience: 'Mulheres elegantes que buscam praticidade para o dia a dia e trabalho',
      features: 'Couro nobre legítimo com acabamento premium, alça ajustável reforçada, divisórias internas com zíper de alta durabilidade e forro impermeável acetinado',
      tone: 'profissional',
      platform: 'Instagram',
    },
  },
  {
    label: 'Camiseta',
    data: {
      productName: 'Camiseta Básica Premium Algodão Peruano',
      category: 'Moda & Vestuário',
      price: 'R$ 89,00',
      targetAudience: 'Homens e mulheres que buscam conforto, durabilidade e estilo minimalista',
      features: '100% algodão nobre peruano penteado, gola anti-deformação, toque ultra macio, não desbota na lavagem e caimento impecável',
      tone: 'casual',
      platform: 'Mercado Livre',
    },
  },
];

export const EXAMPLE_ADS_TO_ANALYZE: { label: string; text: string }[] = [
  {
    label: 'Exemplo: Camiseta Nike (Incompleto)',
    text: `Camiseta Nike, R$79,90, público jovem.`,
  },
  {
    label: 'Exemplo: Relógio Smartwatch',
    text: `Vendo relógio smartwatch novo na caixa.
Tem várias funções, mede passos e batimentos.
Preço bom. Interessados mandar mensagem inbox.`,
  },
  {
    label: 'Exemplo: Vestido Canelado',
    text: `Vestido canelado feminino diversas cores disponíveis.
Tamanho único veste do 36 ao 42.
Tecido de qualidade e não fica transparente.
Valor: R$ 59,90 cada. Entregamos no metrô ou via correios com frete rápido.
Chamar no WhatsApp para ver as fotos.`,
  },
];
