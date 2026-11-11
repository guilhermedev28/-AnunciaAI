import React, { useState } from 'react';

interface AnunciaAILogoProps {
  variant?: 'full' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showText?: boolean;
}

export function AnunciaAILogo({
  variant = 'full',
  size = 'md',
  className = '',
  showText = true,
}: AnunciaAILogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  // Proportional dimensional mappings
  const dimensions = {
    xs: { iconSize: 'w-6 h-6', textSize: 'text-sm', badgeSize: 'w-6 h-6' },
    sm: { iconSize: 'w-7 h-7 sm:w-8 sm:h-8', textSize: 'text-[15px] sm:text-[16px]', badgeSize: 'w-7 h-7 sm:w-8 sm:h-8' },
    md: { iconSize: 'w-8 h-8 sm:w-9 sm:h-9', textSize: 'text-[17px] sm:text-[18px]', badgeSize: 'w-8 h-8 sm:w-9 sm:h-9' },
    lg: { iconSize: 'w-10 h-10 sm:w-11 sm:h-11', textSize: 'text-xl sm:text-2xl', badgeSize: 'w-10 h-10 sm:w-11 sm:h-11' },
    hero: { iconSize: 'w-12 h-12 sm:w-14 sm:h-14', textSize: 'text-2xl sm:text-3xl', badgeSize: 'w-12 h-12 sm:w-14 sm:h-14' },
  }[size];

  // If rendering only the icon mark symbol
  if (variant === 'icon' || !showText) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden shadow-sm shadow-blue-500/10 shrink-0 select-none ${dimensions.badgeSize} ${className}`}
      >
        {!imgFailed ? (
          <img
            src="/anunciaai-icon.jpg"
            alt="AnunciaAI Icon"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <VectorIcon />
        )}
      </div>
    );
  }

  // Full logo (Icon + Wordmark)
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Symbol Badge */}
      <div
        className={`relative rounded-xl overflow-hidden shrink-0 shadow-sm shadow-blue-500/15 border border-[#242B38]/60 bg-[#080A0F] ${dimensions.iconSize}`}
      >
        {!imgFailed ? (
          <img
            src="/anunciaai-icon.jpg"
            alt="AnunciaAI"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <VectorIcon />
        )}
      </div>

      {/* Official Wordmark */}
      <div className="flex items-baseline tracking-tight font-extrabold leading-none">
        <span className={`text-[#F5F7FA] font-bold ${dimensions.textSize}`}>
          Anuncia
        </span>
        <span
          className={`bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC] bg-clip-text text-transparent font-extrabold ml-[0.5px] ${dimensions.textSize}`}
        >
          AI
        </span>
      </div>
    </div>
  );
}

// Crisp Vector fallback of the exact 3D A-logo with planetary arc & sparkle
function VectorIcon() {
  return (
    <svg viewBox="0 0 128 128" className="w-full h-full p-0.5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vBlue" x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="vPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
        <linearGradient id="vOrbit" x1="0%" y1="40%" x2="100%" y2="60%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
        <linearGradient id="vStar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E879F9" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>

      {/* Sparkle Star */}
      <path d="M 94 14 Q 94 24 84 24 Q 94 24 94 34 Q 94 24 104 24 Q 94 24 94 14 Z" fill="url(#vStar)" />

      {/* Right Leg */}
      <path d="M 56 16 L 82 84 C 83 86.5 81.5 89 78.5 89 L 66 89 C 63.5 89 61.5 87 60.5 84 L 52 62 L 40 32 Z" fill="url(#vPurple)" />

      {/* Left Leg */}
      <path d="M 56 16 L 31 84 C 30 86.5 28 89 25 89 L 12 89 C 9 89 8 86.5 9 84 L 38 16 C 41 10 52 10 56 16 Z" fill="url(#vBlue)" />

      {/* 3D Orbit Swoop */}
      <path d="M 14 62 C 28 50 54 42 82 53 C 86 54.5 85 60 79 61 C 55 64 30 73 14 69 C 11 68 11 63.5 14 62 Z" fill="url(#vOrbit)" />
    </svg>
  );
}
