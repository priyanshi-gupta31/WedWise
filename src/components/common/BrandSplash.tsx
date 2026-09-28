import React, { useState, useEffect } from 'react';
import { WedWiseLogo } from './WedWiseLogo';
import { WeddingRingsArt } from './WedWiseIllustrations';

interface BrandSplashProps {
  onFinish?: () => void;
}

export const BrandSplash: React.FC<BrandSplashProps> = ({ onFinish }) => {
  const [stage, setStage] = useState<'revealing' | 'visible' | 'fading' | 'gone'>('revealing');

  useEffect(() => {
    let hasSeen = false;
    try {
      hasSeen = Boolean(typeof window !== 'undefined' && window.sessionStorage?.getItem('wedwise_splash_seen'));
    } catch {
      hasSeen = true;
    }
    if (hasSeen) {
      setStage('gone');
      if (onFinish) onFinish();
      return;
    }

    const t1 = setTimeout(() => setStage('visible'), 200);
    const t2 = setTimeout(() => setStage('fading'), 1800);
    const t3 = setTimeout(() => {
      setStage('gone');
      try {
        window.sessionStorage?.setItem('wedwise_splash_seen', 'true');
      } catch {}
      if (onFinish) onFinish();
    }, 2300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  if (stage === 'gone') return null;

  return (
    <div
      onClick={() => {
        setStage('gone');
        try {
          window.sessionStorage?.setItem('wedwise_splash_seen', 'true');
        } catch {}
        if (onFinish) onFinish();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#641F35] text-[#FFF7ED] transition-opacity duration-500 cursor-pointer select-none ${
        stage === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Decorative Rings & Rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-[#D6B36A] animate-spin-slow" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full border border-[#E86A5B] animate-spin-slow" />
      </div>

      <div className="relative text-center px-6 max-w-md animate-fade-in flex flex-col items-center">
        {/* Interlocking Rings Crest */}
        <div className="mb-6 p-4 rounded-full bg-[#4A1425]/70 border border-[#D6B36A]/40 shadow-wine">
          <WeddingRingsArt className="w-16 h-16" />
        </div>

        {/* Brand Title */}
        <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-widest text-[#FFF7ED] mb-2">
          WEDWISE
        </h1>

        {/* Gold hairline divider with ornamental diamond */}
        <div className="flex items-center gap-3 w-48 my-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D6B36A]" />
          <div className="w-2 h-2 rotate-45 bg-[#D6B36A]" />
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D6B36A]" />
        </div>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-medium tracking-[0.25em] text-[#F6C6B6] uppercase mt-1">
          Plan Smart. Celebrate More.
        </p>

        <p className="text-[10px] text-[#D6B36A]/70 uppercase tracking-widest mt-8 font-sans">
          Tap anywhere to enter
        </p>
      </div>
    </div>
  );
};
