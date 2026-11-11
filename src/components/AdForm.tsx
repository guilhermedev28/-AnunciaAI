import React from 'react';
import {
  Sparkles,
  Briefcase,
  Smile,
  Flame,
  Loader2,
  CheckCircle,
  AlertCircle,
  Check,
  ShieldCheck,
  ShoppingBag,
  Store,
  Instagram,
  MessageCircle,
  Globe,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { AdFormData, ToneType } from '../types';
import { EXAMPLE_PRODUCTS } from '../data/examples';

interface AdFormProps {
  formData: AdFormData;
  onChange: (updates: Partial<AdFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isGenerating: boolean;
  error?: string | null;
  successMessage?: string | null;
}

const PLATFORM_OPTIONS = [
  {
    id: 'Multicanal',
    name: 'Multicanal / Geral',
    desc: 'Adaptável para qualquer canal de venda',
    icon: Globe,
  },
  {
    id: 'Mercado Livre',
    name: 'Mercado Livre',
    desc: 'Título e descrição claros para marketplace',
    icon: ShoppingBag,
  },
  {
    id: 'Shopee',
    name: 'Shopee',
    desc: 'Direto, atrativo e com boa leitura rápida',
    icon: Store,
  },
  {
    id: 'Instagram',
    name: 'Instagram',
    desc: 'Legenda persuasiva pronta para feed ou direct',
    icon: Instagram,
  },
  {
    id: 'WhatsApp',
    name: 'WhatsApp',
    desc: 'Mensagem objetiva para listas e contatos',
    icon: MessageCircle,
  },
  {
    id: 'OLX',
    name: 'OLX',
    desc: 'Texto prático e focado na negociação direta',
    icon: Tag,
  },
];

export function AdForm({
  formData,
  onChange,
  onSubmit,
  isGenerating,
  error,
  successMessage,
}: AdFormProps) {
  const currentPlatform = formData.platform || 'Multicanal';

  const handleToneChange = (tone: ToneType) => {
    onChange({ tone });
  };

  const handlePlatformChange = (platform: string) => {
    onChange({ platform });
  };

  const handleApplyExample = (exampleData: AdFormData) => {
    onChange(exampleData);
  };

  const isFormReady = formData.productName.trim().length > 0 && formData.features.trim().length > 0;

  return (
    <div className="bg-[#0D111A] rounded-2xl border border-[#1E2638] shadow-xl p-4 sm:p-7 md:p-8 relative w-full overflow-hidden">
      {/* Quick Examples Toolbar */}
      <div className="mb-6 pb-4 sm:mb-7 sm:pb-5 border-b border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#38BDF8] shrink-0" />
          <span className="text-[12.5px] sm:text-[13px] font-semibold text-white tracking-wide">
            Preenchimento rápido para testar:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {EXAMPLE_PRODUCTS.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => handleApplyExample(example.data)}
              disabled={isGenerating}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080A0F] hover:bg-[#131824] text-[#94A3B8] hover:text-[#38BDF8] text-[11.5px] sm:text-[12.5px] font-medium border border-[#1E2638] hover:border-blue-500/40 shadow-2xs transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed max-w-full"
              title={`Preencher com dados de: ${example.label}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-[#38BDF8] transition-colors shrink-0" />
              <span className="truncate">{example.label}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full">
          {/* Left Column (7 cols): Passos 1 e 2 */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-7 w-full min-w-0">
            {/* Passo 1: Informar o Produto */}
            <div className="w-full space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/15 text-[#38BDF8] border border-blue-500/30 text-[11.5px] font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h3 className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight">
                    Informar o produto
                  </h3>
                </div>
                <span className="text-[11px] text-[#94A3B8]">Dados básicos</span>
              </div>

              <div className="space-y-3.5 w-full">
                {/* Nome do Produto (Obrigatório) */}
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="productName"
                      className="block text-[13px] sm:text-[13.5px] font-semibold text-white"
                    >
                      Nome do produto
                    </label>
                    <span className="text-[10.5px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded shrink-0">
                      Obrigatório
                    </span>
                  </div>
                  <input
                    id="productName"
                    name="productName"
                    type="text"
                    required
                    value={formData.productName}
                    onChange={(e) => onChange({ productName: e.target.value })}
                    placeholder="Ex: Fone de ouvido Bluetooth Pro Bass"
                    disabled={isGenerating}
                    className="w-full min-h-[46px] h-[46px] sm:h-[48px] px-3.5 sm:px-4 text-[14px] rounded-xl border border-[#1E2638] bg-[#080A0F] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 hover:border-[#2C374E] transition-all min-w-0"
                  />
                  <p className="text-[11.5px] text-[#94A3B8] mt-1">
                    Informe o nome comercial ou modelo exato do item.
                  </p>
                </div>

                {/* Preço e Categoria (Opcionais) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
                  <div className="w-full min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="price"
                        className="block text-[13px] font-semibold text-white"
                      >
                        Preço
                      </label>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-800/60 border border-slate-700/60 px-1.5 py-0.5 rounded">
                        Opcional
                      </span>
                    </div>
                    <input
                      id="price"
                      name="price"
                      type="text"
                      value={formData.price}
                      onChange={(e) => onChange({ price: e.target.value })}
                      placeholder="Ex: R$ 120,00 ou Sob consulta"
                      disabled={isGenerating}
                      className="w-full min-h-[46px] h-[46px] px-3.5 sm:px-4 text-[14px] rounded-xl border border-[#1E2638] bg-[#080A0F] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 hover:border-[#2C374E] transition-all min-w-0"
                    />
                  </div>

                  <div className="w-full min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="category"
                        className="block text-[13px] font-semibold text-white"
                      >
                        Categoria
                      </label>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-800/60 border border-slate-700/60 px-1.5 py-0.5 rounded">
                        Opcional
                      </span>
                    </div>
                    <input
                      id="category"
                      name="category"
                      type="text"
                      value={formData.category}
                      onChange={(e) => onChange({ category: e.target.value })}
                      placeholder="Ex: Eletrônicos, Moda, Decoração..."
                      disabled={isGenerating}
                      className="w-full min-h-[46px] h-[46px] px-3.5 sm:px-4 text-[14px] rounded-xl border border-[#1E2638] bg-[#080A0F] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 hover:border-[#2C374E] transition-all min-w-0"
                    />
                  </div>
                </div>

                {/* Público-alvo (Opcional) */}
                <div className="w-full min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="targetAudience"
                      className="block text-[13px] font-semibold text-white"
                    >
                      Público-alvo
                    </label>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-800/60 border border-slate-700/60 px-1.5 py-0.5 rounded">
                      Opcional
                    </span>
                  </div>
                  <input
                    id="targetAudience"
                    name="targetAudience"
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => onChange({ targetAudience: e.target.value })}
                    placeholder="Ex: Quem pratica esportes, estudantes, profissionais..."
                    disabled={isGenerating}
                    className="w-full min-h-[46px] h-[46px] px-3.5 sm:px-4 text-[14px] rounded-xl border border-[#1E2638] bg-[#080A0F] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 hover:border-[#2C374E] transition-all min-w-0"
                  />
                  <p className="text-[11.5px] text-[#94A3B8] mt-1">
                    Ajuda a calibrar o tom da mensagem sem inventar atributos do produto.
                  </p>
                </div>
              </div>
            </div>

            {/* Passo 2: Características reais */}
            <div className="pt-5 border-t border-[#1E2638] w-full min-w-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/15 text-[#818CF8] border border-indigo-500/30 text-[11.5px] font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight">
                    Características reais
                  </h3>
                </div>
                <span className="text-[10.5px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded shrink-0">
                  Obrigatório
                </span>
              </div>

              {/* Destaque Anti-Alucinação solicitado pelo usuário */}
              <div className="bg-[#080A0F] border border-blue-500/25 rounded-xl p-3 sm:p-3.5 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div className="text-[12px] sm:text-[12.5px] text-slate-300 leading-relaxed">
                  <strong className="text-white font-semibold">Princípio de fidelidade: </strong>
                  Informe apenas características que você realmente conhece sobre o produto. A IA não vai completar informações que não foram fornecidas.
                </div>
              </div>

              <div className="w-full">
                <textarea
                  id="features"
                  name="features"
                  required
                  rows={4}
                  value={formData.features}
                  onChange={(e) => onChange({ features: e.target.value })}
                  placeholder="Ex: Bateria dura até 28 horas com estojo recarregável, Bluetooth 5.3 estável, cor preta fosca, almofadas macias, resistente a respingos e acompanha cabo USB-C para recarga."
                  disabled={isGenerating}
                  className="w-full px-3.5 sm:px-4 py-3 text-[14px] rounded-xl border border-[#1E2638] bg-[#080A0F] text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 hover:border-[#2C374E] transition-all resize-y min-h-[120px] min-w-0 leading-relaxed"
                />
                <p className="text-[11.5px] text-[#94A3B8] mt-1.5 leading-relaxed">
                  Garantia, medidas, peso, materiais e itens inclusos só aparecerão no anúncio se você informá-los aqui.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Passos 3, 4 e 5 */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:border-l lg:border-[#1E2638] lg:pl-7 w-full min-w-0">
            <div className="space-y-6 w-full">
              {/* Passo 3: Escolher o Canal / Formato */}
              <div className="w-full space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11.5px] font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h3 className="text-[14px] font-bold text-white tracking-tight">
                      Canal / Formato
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#94A3B8]">Onde vai publicar</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 w-full">
                  {PLATFORM_OPTIONS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = currentPlatform === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handlePlatformChange(item.id)}
                        disabled={isGenerating}
                        className={`min-h-[44px] p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/15 text-white shadow-xs'
                            : 'border-[#1E2638] bg-[#080A0F] text-[#94A3B8] hover:text-white hover:border-slate-600'
                        }`}
                        title={item.desc}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#38BDF8]' : 'text-slate-400'}`} />
                        <span className="text-[12.5px] font-medium truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Passo 4: Escolher o Estilo */}
              <div className="w-full space-y-2.5 pt-4 border-t border-[#1E2638]/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11.5px] font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    <h3 className="text-[14px] font-bold text-white tracking-tight">
                      Estilo do anúncio
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#94A3B8]">Tom da copy</span>
                </div>

                <div className="space-y-2 w-full">
                  {/* Vendedor */}
                  <button
                    id="tom-vendedor"
                    type="button"
                    onClick={() => handleToneChange('vendedor')}
                    disabled={isGenerating}
                    className={`w-full min-h-[48px] flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.tone === 'vendedor'
                        ? 'border-blue-500 bg-blue-500/10 shadow-xs'
                        : 'border-[#1E2638] bg-[#080A0F] hover:border-slate-600 hover:bg-[#111622]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        formData.tone === 'vendedor'
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#0D111A] text-[#94A3B8] border border-[#1E2638]'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-white">Vendedor</span>
                        {formData.tone === 'vendedor' && (
                          <Check className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                        )}
                      </div>
                      <span className="block text-[11px] text-[#94A3B8] truncate">
                        Direto, focado na oferta e atrativo
                      </span>
                    </div>
                  </button>

                  {/* Profissional */}
                  <button
                    id="tom-profissional"
                    type="button"
                    onClick={() => handleToneChange('profissional')}
                    disabled={isGenerating}
                    className={`w-full min-h-[48px] flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.tone === 'profissional'
                        ? 'border-blue-500 bg-blue-500/10 shadow-xs'
                        : 'border-[#1E2638] bg-[#080A0F] hover:border-slate-600 hover:bg-[#111622]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        formData.tone === 'profissional'
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#0D111A] text-[#94A3B8] border border-[#1E2638]'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-white">Profissional</span>
                        {formData.tone === 'profissional' && (
                          <Check className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                        )}
                      </div>
                      <span className="block text-[11px] text-[#94A3B8] truncate">
                        Formal, institucional e sóbrio
                      </span>
                    </div>
                  </button>

                  {/* Casual */}
                  <button
                    id="tom-casual"
                    type="button"
                    onClick={() => handleToneChange('casual')}
                    disabled={isGenerating}
                    className={`w-full min-h-[48px] flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.tone === 'casual'
                        ? 'border-blue-500 bg-blue-500/10 shadow-xs'
                        : 'border-[#1E2638] bg-[#080A0F] hover:border-slate-600 hover:bg-[#111622]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        formData.tone === 'casual'
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#0D111A] text-[#94A3B8] border border-[#1E2638]'
                      }`}
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-white">Casual</span>
                        {formData.tone === 'casual' && (
                          <Check className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                        )}
                      </div>
                      <span className="block text-[11px] text-[#94A3B8] truncate">
                        Descontraído, próximo e dinâmico
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Passo 5: Ação de Gerar e Notificações */}
            <div className="space-y-3 pt-4 border-t border-[#1E2638]/70 w-full">
              {/* Success feedback */}
              {successMessage && (
                <div
                  id="msg-sucesso-geracao"
                  className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[12.5px] text-emerald-400 font-medium flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Error feedback com botão de tentar novamente mantendo os dados */}
              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[12.5px] text-rose-300 font-medium space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-snug break-words">{error}</span>
                  </div>
                  <div className="text-[11.5px] text-slate-400 pl-6">
                    Seus dados continuam preenchidos. Você pode tentar novamente a qualquer momento.
                  </div>
                </div>
              )}

              {/* Status helper */}
              {!isFormReady && (
                <div className="text-[11.5px] text-[#94A3B8] text-center">
                  Preencha o <strong className="text-white font-medium">nome do produto</strong> e as <strong className="text-white font-medium">características</strong> para gerar.
                </div>
              )}

              {/* Main Submit Button (Passo 5) */}
              <button
                id="btn-gerar-anuncio"
                type="submit"
                disabled={isGenerating || !isFormReady}
                className="w-full min-h-[50px] sm:min-h-[52px] px-4 sm:px-6 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-500 hover:via-blue-500 hover:to-indigo-500 active:scale-98 text-white font-semibold text-[14.5px] sm:text-[15px] rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all duration-150 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white shrink-0" />
                    <span className="truncate">Estruturando anúncio...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#38BDF8] shrink-0" />
                    <span>✦ Gerar anúncio</span>
                  </>
                )}
              </button>

              {/* Loading subtext durante geração */}
              {isGenerating && (
                <p className="text-center text-[12px] text-[#38BDF8] animate-pulse">
                  Organizando as informações reais do produto sem inventar dados...
                </p>
              )}

              {!isGenerating && (
                <p className="text-center text-[11.5px] text-[#94A3B8] leading-relaxed">
                  Passo 6: Você receberá o anúncio estruturado e pronto para copiar.
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
