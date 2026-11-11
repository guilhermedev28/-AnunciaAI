import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ResultCardProps {
  id: string;
  badgeNumber?: number;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  contentToCopy: string;
  children: React.ReactNode;
}

export function ResultCard({
  id,
  badgeNumber,
  title,
  subtitle,
  icon,
  contentToCopy,
  children,
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  return (
    <div
      id={id}
      className="bg-[#0D111A] rounded-2xl border border-[#1E2638] shadow-sm hover:border-[#2A354E] transition-all p-3.5 sm:p-6 flex flex-col justify-between group relative w-full overflow-hidden"
    >
      <div className="w-full">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2.5 pb-3 mb-3 border-b border-[#1E2638] w-full">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#080A0F] text-[#38BDF8] border border-[#1E2638] flex items-center justify-center text-sm shrink-0 mt-0.5">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {badgeNumber && (
                  <span className="text-[10px] sm:text-[11px] font-semibold text-[#38BDF8] bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded leading-none">
                    #{badgeNumber}
                  </span>
                )}
                <h3 className="text-[13.5px] sm:text-[14.5px] font-semibold text-white leading-snug break-words">
                  {title}
                </h3>
              </div>
              {subtitle && (
                <p className="text-[11.5px] sm:text-[12px] text-[#94A3B8] mt-0.5 leading-relaxed break-words">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Discreet Copy Button */}
          <button
            id={`btn-copy-${id}`}
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[34px] text-[11.5px] sm:text-[12px] font-medium rounded-lg transition-all border shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-98 ${
              copied
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-[#080A0F] text-[#94A3B8] hover:text-white border-[#1E2638] hover:border-slate-600'
            }`}
            aria-label={`Copiar ${title}`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-semibold">✓ Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 shrink-0" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>

        {/* Card Content */}
        <div className="text-[#F5F7FA] text-[14px] sm:text-[15px] leading-relaxed w-full min-w-0 select-text">
          {children}
        </div>
      </div>
    </div>
  );
}
