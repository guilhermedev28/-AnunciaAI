import React, { useState } from 'react';
import { KeyRound, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { AnunciaAILogo } from '../brand/AnunciaAILogo';

interface AdminAuthGateProps {
  onSuccess: (token: string) => void;
  onExit: () => void;
}

export function AdminAuthGate({ onSuccess, onExit }: AdminAuthGateProps) {
  const [accessKey, setAccessKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      setErrorMessage('Por favor, informe a chave de acesso do criador.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessKey: accessKey.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Acesso negado. Chave incorreta.');
      }

      if (data.token) {
        sessionStorage.setItem('anunciaai_admin_token', data.token);
        onSuccess(data.token);
      } else {
        throw new Error('Não foi possível obter o token de autorização.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-white flex items-center justify-center p-4 selection:bg-blue-600/30 selection:text-white">
      <div className="max-w-md w-full bg-[#0D111A] border border-[#1E2638] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden">
        {/* Subtle accent header line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="p-1 rounded-2xl bg-[#080A0F] border border-[#1E2638] shadow-sm">
              <AnunciaAILogo size="lg" showText={false} />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Creator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Área administrativa privada do AnunciaAI. Autenticação obrigatória.
          </p>
        </div>

        {errorMessage && (
          <div
            id="admin-auth-error"
            className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm leading-relaxed"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="creator-access-key-input"
              className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2"
            >
              Chave de Acesso do Administrador
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="creator-access-key-input"
                type={showKey ? 'text' : 'password'}
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Insira a chave de autorização"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 bg-[#080A0F] border border-[#1E2638] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={showKey ? 'Ocultar chave' : 'Exibir chave'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              O acesso é validado diretamente pelo servidor backend.
            </p>
          </div>

          <button
            id="btn-admin-login"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Validando autorização...</span>
              </>
            ) : (
              <span>Entrar no Dashboard</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#1E2638] flex items-center justify-center">
          <button
            id="btn-back-to-app"
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao AnunciaAI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
