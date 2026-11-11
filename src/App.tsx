import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { BenefitsSection } from './components/BenefitsSection';
import { AdForm } from './components/AdForm';
import { AdResults } from './components/AdResults';
import { AnalyzeAdView } from './components/AnalyzeAdView';
import { TitleGeneratorView } from './components/TitleGeneratorView';
import { ChecklistAdView } from './components/ChecklistAdView';
import { AnalyzePhotoView } from './components/AnalyzePhotoView';
import { AdminAuthGate } from './components/creator/AdminAuthGate';
import { CreatorDashboard } from './components/creator/CreatorDashboard';
import { Footer } from './components/Footer';
import { AdFormData, GeneratedAdResult, AppTab } from './types';
import { getAnonymousSessionId, initSessionHeartbeat, recordAppEvent } from './lib/sessionTracker';

const INITIAL_FORM: AdFormData = {
  productName: '',
  category: '',
  price: '',
  targetAudience: '',
  features: '',
  tone: 'vendedor',
  platform: 'Multicanal',
};

const STORAGE_KEY_COUNT = 'anunciaai_generated_count';
const ADMIN_TOKEN_KEY = 'anunciaai_admin_token';
const ADMIN_AUTH_FLAG = 'anunciaai_admin_authorized';

function checkIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  return (
    path.startsWith('/creator') ||
    path.startsWith('/admin') ||
    search.includes('creator') ||
    search.includes('admin') ||
    hash.includes('creator') ||
    hash.includes('admin')
  );
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminRoute);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  // Track if current user is identified/authenticated as administrator
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      const hasToken = !!(sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY));
      const hasFlag = localStorage.getItem(ADMIN_AUTH_FLAG) === 'true';
      return hasToken || hasFlag;
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<AppTab>('gerar');
  const [formData, setFormData] = useState<AdFormData>(INITIAL_FORM);
  const [displayedFormData, setDisplayedFormData] = useState<AdFormData | null>(null);
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedAdResult | null>(null);
  const [adTextForAnalysis, setAdTextForAnalysis] = useState<string>('');
  const [dotClicks, setDotClicks] = useState(0);

  const handleSendToAnalyze = (textToAnalyze: string) => {
    setAdTextForAnalysis(textToAnalyze);
    setActiveTab('analisar');
    setTimeout(() => {
      const el = document.getElementById('gerador');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  // Validate admin token on mount or change
  useEffect(() => {
    const token = adminToken || (() => {
      try {
        return sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY);
      } catch {
        return null;
      }
    })();

    if (token) {
      fetch('/api/admin/metrics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            setIsAdminAuthenticated(true);
            if (!adminToken) setAdminToken(token);
          } else if (res.status === 401) {
            setAdminToken(null);
            try {
              sessionStorage.removeItem(ADMIN_TOKEN_KEY);
              localStorage.removeItem(ADMIN_TOKEN_KEY);
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {
          // offline or network error
        });
    }
  }, [adminToken]);

  const handleDotClick = () => {
    setDotClicks((prev) => {
      const next = prev + 1;
      if (next >= 4) {
        setIsAdminRoute(true);
        try {
          window.history.pushState({}, '', '/creator');
        } catch {
          // ignore
        }
        return 0;
      }
      return next;
    });
  };

  // Initialize anonymous session heartbeat
  useEffect(() => {
    const stopHeartbeat = initSessionHeartbeat();
    return () => {
      stopHeartbeat();
    };
  }, []);

  // Listen to popstate and hashchange for URL navigation
  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminRoute(checkIsAdminRoute());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Creator shortcut listener: Alt + C or Ctrl + Shift + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isAltC = e.altKey && (e.key === 'c' || e.key === 'C');
      const isCtrlShiftA = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A');
      if (isAltC || isCtrlShiftA) {
        e.preventDefault();
        setIsAdminRoute(true);
        try {
          window.history.pushState({}, '', '/creator');
        } catch {
          // restricted
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize counter from localStorage on mount
  useEffect(() => {
    try {
      const savedCount = localStorage.getItem(STORAGE_KEY_COUNT);
      if (savedCount) {
        const parsed = parseInt(savedCount, 10);
        if (!isNaN(parsed)) {
          setGenerationCount(parsed);
        }
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, []);

  const handleAdminAuthSuccess = (token: string) => {
    try {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_AUTH_FLAG, 'true');
    } catch {
      // restricted
    }
    setAdminToken(token);
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = useCallback(async () => {
    if (adminToken) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }).catch(() => {});
    }
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_AUTH_FLAG);
    } catch {
      // restricted
    }
    setAdminToken(null);
    setIsAdminAuthenticated(false);
    setIsAdminRoute(false);
    setActiveTab('gerar');
    try {
      window.history.pushState({}, '', '/');
    } catch {
      // restricted
    }
  }, [adminToken]);

  const handleBackToPublicApp = () => {
    setIsAdminRoute(false);
    setActiveTab('gerar');
    try {
      window.history.pushState({}, '', '/');
    } catch {
      // restricted
    }
  };

  const handleSelectTab = (tab: AppTab) => {
    if (tab === 'dashboard') {
      setIsAdminRoute(true);
      setActiveTab('dashboard');
      try {
        window.history.pushState({}, '', '/creator');
      } catch {
        // restricted
      }
    } else {
      setIsAdminRoute(false);
      setActiveTab(tab);
      try {
        window.history.pushState({}, '', '/');
      } catch {
        // restricted
      }
    }
  };

  const scrollToGenerator = () => {
    setActiveTab('gerar');
    setTimeout(() => {
      const el = document.getElementById('gerador');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const scrollToHowItWorks = () => {
    setTimeout(() => {
      const el = document.getElementById('como-funciona');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // If visiting the private admin route
  if (isAdminRoute) {
    if (adminToken) {
      return (
        <CreatorDashboard
          token={adminToken}
          onLogout={handleAdminLogout}
          onBackToApp={handleBackToPublicApp}
        />
      );
    }
    return (
      <AdminAuthGate
        onSuccess={handleAdminAuthSuccess}
        onExit={handleBackToPublicApp}
      />
    );
  }

  const handleFormChange = (updates: Partial<AdFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.productName.trim()) {
      setError('Por favor, informe o nome do produto.');
      return;
    }
    if (!formData.features.trim()) {
      setError('Por favor, descreva as principais características do produto.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    const eventId = 'gen_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);

    try {
      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getAnonymousSessionId(),
        },
        body: JSON.stringify({
          ...formData,
          sessionId: getAnonymousSessionId(),
          eventId,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('Você atingiu o limite temporário de uso. Aguarde um pouco e tente novamente.');
        }
        throw new Error(errData.error || 'Erro ao gerar anúncio. Tente novamente.');
      }

      const data: GeneratedAdResult = await response.json();

      // Registro do evento APENAS após sucesso confirmado e com conteúdo válido
      if (data && data.title && data.fullDescription) {
        recordAppEvent({
          event: 'ad_generated',
          eventId: data.eventId || eventId,
          sessionId: getAnonymousSessionId(),
          category: formData.category || 'Geral',
        });
      }

      setResult(data);
      setDisplayedFormData({ ...formData });

      setSuccessMessage('Anúncio gerado com sucesso! Veja o resultado organizado abaixo.');

      // Increment persistent counter
      setGenerationCount((prev) => {
        const newCount = prev + 1;
        try {
          localStorage.setItem(STORAGE_KEY_COUNT, newCount.toString());
        } catch {
          // Ignore write failure
        }
        return newCount;
      });

      // Smooth scroll to results
      setTimeout(() => {
        const resultsEl = document.getElementById('anuncio-resultados');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Erro na requisição:', err);
      setError(
        err.message ||
          'Não foi possível gerar o anúncio no momento. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!displayedFormData) return;
    setIsGenerating(true);
    setError(null);
    const eventId = 'gen_regen_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    try {
      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getAnonymousSessionId(),
        },
        body: JSON.stringify({
          ...displayedFormData,
          sessionId: getAnonymousSessionId(),
          eventId,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('Você atingiu o limite temporário de uso. Aguarde um pouco e tente novamente.');
        }
        throw new Error(errData.error || 'Erro ao regerar anúncio. Tente novamente.');
      }

      const data: GeneratedAdResult = await response.json();

      if (data && data.title && data.fullDescription) {
        recordAppEvent({
          event: 'ad_generated',
          eventId: data.eventId || eventId,
          sessionId: getAnonymousSessionId(),
          category: displayedFormData?.category || 'Geral',
        });
      }

      setResult(data);
    } catch (err: any) {
      console.error('Erro na regeração:', err);
      setError(err.message || 'Não foi possível regerar o anúncio.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setDisplayedFormData(null);
    setSuccessMessage(null);
    setFormData(INITIAL_FORM);
    const el = document.getElementById('gerador');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F5F7FA] flex flex-col selection:bg-blue-600/30 selection:text-white">
      <Header
        generationCount={generationCount}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      <main className="flex-1 w-full overflow-x-hidden">
        {/* Render Primary Hero Section when in 'gerar' tab */}
        {activeTab === 'gerar' && (
          <HeroSection
            onCtaClick={scrollToGenerator}
            onHowItWorksClick={scrollToHowItWorks}
            onSelectTab={handleSelectTab}
            activeTab={activeTab}
          />
        )}

        {/* Generator / Analyzer Workspace Section */}
        <section
          id="gerador"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12"
        >
          {/* Quick Context / Return Bar for non-home tools */}
          {activeTab !== 'gerar' && (
            <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between border-b border-[#1E2638] pb-3 text-[12.5px]">
              <button
                type="button"
                onClick={() => handleSelectTab('gerar')}
                className="inline-flex items-center gap-1.5 font-medium text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                <span>← Voltar para Criar anúncio</span>
              </button>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-slate-500">Ambiente:</span>
                <span className="text-[#38BDF8] font-semibold">
                  {activeTab === 'titulos' && 'Gerador de Títulos'}
                  {activeTab === 'analisar' && 'Diagnóstico de Anúncio'}
                  {activeTab === 'checklist' && 'Checklist do Anúncio'}
                  {activeTab === 'foto' && 'Análise de Foto'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'gerar' && (
            <div className="space-y-6 sm:space-y-10">
              {/* Section Transition Header */}
              <div className="text-center max-w-2xl mx-auto">
                <span className="text-[11px] uppercase tracking-widest font-semibold text-[#38BDF8] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  Gerador inteligente
                </span>
                <h2 className="text-[24px] sm:text-[36px] font-extrabold text-white tracking-tight mt-2.5 leading-snug">
                  Crie seu anúncio
                </h2>
                <p className="text-[14px] sm:text-[15px] text-[#94A3B8] mt-1.5 leading-relaxed">
                  Conte sobre seu produto. A IA cuida do resto.
                </p>
              </div>

              {/* Large Workspace Form (approx 1100px - 1200px) */}
              <div className="max-w-6xl mx-auto w-full">
                <AdForm
                  formData={formData}
                  onChange={handleFormChange}
                  onSubmit={handleGenerate}
                  isGenerating={isGenerating}
                  error={error}
                  successMessage={successMessage}
                />
              </div>

              {/* Workspace Results when generated */}
              {result && (
                <div className="max-w-6xl mx-auto w-full pt-4">
                  <AdResults
                    result={result}
                    formData={displayedFormData || INITIAL_FORM}
                    onReset={handleReset}
                    onRegenerate={handleRegenerate}
                    onAnalyzeAd={handleSendToAnalyze}
                    isGenerating={isGenerating}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'titulos' && (
            <div className="max-w-6xl mx-auto w-full">
              <TitleGeneratorView />
            </div>
          )}

          {activeTab === 'analisar' && (
            <div className="max-w-6xl mx-auto w-full">
              <AnalyzeAdView initialText={adTextForAnalysis} />
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="max-w-6xl mx-auto w-full">
              <ChecklistAdView />
            </div>
          )}

          {activeTab === 'foto' && (
            <div className="max-w-6xl mx-auto w-full">
              <AnalyzePhotoView />
            </div>
          )}
        </section>

        {/* Section 5: Como funciona */}
        <HowItWorksSection />

        {/* Section 6: Benefícios */}
        <BenefitsSection />
      </main>

      {/* Modern Brazilian SaaS Footer */}
      <Footer onSelectTab={handleSelectTab} onDotClick={handleDotClick} />
    </div>
  );
}
