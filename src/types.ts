export type ToneType = 'profissional' | 'casual' | 'vendedor';

export type AppTab = 'gerar' | 'titulos' | 'analisar' | 'checklist' | 'foto' | 'dashboard';

export interface AdFormData {
  productName: string;
  category: string;
  price: string;
  targetAudience: string;
  features: string;
  tone: ToneType;
  platform?: string;
}

export interface GeneratedAdResult {
  title: string;
  fullDescription: string;
  benefits: string[];
  shortText: string;
  callToActions: string[];
  optionalAdditions?: string[];
  id?: string;
  timestamp?: number;
  eventId?: string;
}

export interface CriterionAnalysis {
  criterion: string;
  score: number; // 0 to 100
  feedback: string;
}

export interface DetectedInfoItem {
  field: string; // Ex: "Produto", "Preço", "Marca", "Condição", "Tamanho", etc.
  status: 'informado' | 'mal_apresentado';
  value?: string; // Ex: "Camiseta", "79 reais", "Nike"
  details?: string; // Observação sobre como foi encontrado ou por que está informal
}

export type MissingInfoLevel = 'essencial' | 'recomendavel' | 'opcional';

export interface MissingInfoItem {
  field: string;
  level: MissingInfoLevel;
  reason?: string;
}

export interface AdAnalysisResult {
  score: number;
  scoreLabel: string;
  summary: string;
  detectedCategory?: string; // Ex: "Vestuário / Roupas", "Eletrônicos / Periféricos"
  detectedFields?: DetectedInfoItem[]; // Informações já presentes identificadas no texto
  missingFields: string[]; // Informações não fornecidas formatadas
  classifiedMissingFields?: MissingInfoItem[]; // Informações classificadas por nível (essencial, recomendável, opcional)
  poorlyPresentedFields?: string[]; // Informações que existem no texto, mas estão mal redigidas ou informais
  criteriaBreakdown: CriterionAnalysis[];
  strengths: string[];
  issues: string[];
  recommendations: string[];
  improvedVersion: string;
  eventId?: string;
}

export interface ImproveAdResult {
  improvedText: string;
  originalText: string;
  eventId?: string;
}

export interface AdminDayStat {
  date: string;
  label: string;
  activeUsers: number;
  adsGenerated: number;
  adsAnalyzed: number;
}

export interface AdminRecentEvent {
  id: string;
  type: 'novo_usuario' | 'anuncio_gerado' | 'anuncio_analisado';
  title: string;
  timestamp: number;
}

export interface AnonymousSessionInfo {
  idHash: string;
  lastSeenSecondsAgo: number;
  status: 'ativo' | 'recente';
}

export interface CreatorDashboardMetrics {
  onlineUsers: number;
  totalUsers: number;
  adsGenerated: number;
  adsAnalyzed: number;
  activeUsersToday: number;
  activeUsersLast7Days: number;
  growthHistory7d: AdminDayStat[];
  growthHistory30d: AdminDayStat[];
  recentActivity: AdminRecentEvent[];
  activeAnonymousSessions: AnonymousSessionInfo[];
  serverStatus: {
    status: 'online' | 'degraded';
    uptimeSeconds: number;
    aiEngine: string;
    metricsStorage: string;
    serverStartedAt: string;
  };
}

export type TitlePlatform =
  | 'Instagram'
  | 'WhatsApp'
  | 'Mercado Livre'
  | 'Shopee'
  | 'TikTok'
  | 'Outro';

export type TitleStyle =
  | 'chamativo'
  | 'profissional'
  | 'direto'
  | 'busca'
  | 'criativo';

export interface TitleFormData {
  productName: string;
  category?: string;
  features: string;
  price?: string;
  platform: TitlePlatform;
  style: TitleStyle;
}

export interface GeneratedTitlesResult {
  titles: string[];
  productName: string;
  platform: TitlePlatform;
  style: TitleStyle;
  eventId?: string;
}

export interface ChecklistDetectedItem {
  field: string;
  value?: string;
}

export interface AdChecklistResult {
  productIdentified: string;
  productCategory?: string;
  completenessScore: number;
  scoreExplanation: string;
  detectedItems: ChecklistDetectedItem[];
  missingItems: {
    essential: string[];
    recommended: string[];
    optional: string[];
  };
  recommendations: string[];
  eventId?: string;
}

export type PhotoQualityRating = 'Boa' | 'Regular' | 'Precisa melhorar';
export type PhotoEnquadramentoRating = 'Bom' | 'Regular' | 'Precisa melhorar';
export type PhotoFundoRating = 'Bom' | 'Regular' | 'Precisa melhorar';

export type PhotoPriorityLevel = 'Alta prioridade' | 'Média prioridade' | 'Baixa prioridade';

export interface PhotoImprovementItem {
  text: string;
  priority: PhotoPriorityLevel;
}

export interface PhotoAnalysisResult {
  score: number; // 0 a 100 ("Nota da foto")
  indicators: {
    qualidade: PhotoQualityRating;
    iluminacao: PhotoQualityRating;
    enquadramento: PhotoEnquadramentoRating;
    visibilidade: PhotoQualityRating;
    fundo: PhotoFundoRating;
  };
  strengths: string[]; // "✓ O que está bom" (1 a 4)
  improvements: PhotoImprovementItem[]; // "⚠️ O que pode melhorar" (1 a 4)
  nextPhotoTips: string[]; // "💡 Para sua próxima foto" (até 3)
  eventId?: string;
}

