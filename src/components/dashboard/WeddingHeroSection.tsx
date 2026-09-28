import React from 'react';
import { Wedding } from '../../types/database.types';
import { getTimeGreeting, formatReadableDate, getWeddingCountdown } from '../../utils/date';
import { WeddingHeroArt } from '../common/WeddingHeroArt';
import { Sparkles, Calendar, Heart } from 'lucide-react';

interface WeddingHeroSectionProps {
  wedding: Wedding;
  userName: string;
}

/**
 * WeddingHeroSection — Grand Editorial Wedding Sanctuary.
 * Replaces the small SaaS hero card with a commanding, full-bleed visual experience.
 *
 * Structure:
 * 1. WEDWISE & Time greeting (GOOD EVENING, {userFirstName})
 * 2. Grand editorial couple typography ({brideName} & {groomName})
 * 3. Auspicious celebration date
 * 4. Countdown headline ({daysRemaining} DAYS TO CELEBRATE)
 * 5. Large Central Wedding Visual (WeddingHeroArt with mandap arch, couple & garland)
 */
export const WeddingHeroSection: React.FC<WeddingHeroSectionProps> = ({
  wedding,
  userName,
}) => {
  const greeting = getTimeGreeting().toUpperCase();
  const countdown = getWeddingCountdown(wedding.wedding_date);

  return (
    <section className="relative w-full bg-gradient-to-b from-[#161224] via-[#350A16] to-[#1F060D] text-[#FFF7ED] overflow-hidden pt-10 pb-16 px-6 sm:px-10 lg:px-16 select-none border-b border-[#E89838]/25">
      {/* 1. Ambient Celestial Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#E89838]/20 via-[#C93B2B]/12 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-mandala-texture" />

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Masthead: WEDWISE & Personalized Greeting */}
        <div className="flex flex-col items-center mb-3 animate-fade-in">
          <span className="text-[11px] sm:text-xs font-serif font-semibold tracking-[0.35em] text-[#E89838] uppercase block mb-2">
            WEDWISE SANCTUARY
          </span>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2A0812]/80 border border-[#E89838]/35 text-[#F5C86C] text-[10px] sm:text-[11px] font-bold tracking-[0.24em] uppercase shadow-sm">
            <Sparkles className="w-3 h-3 text-[#E89838]" />
            <span>{greeting}{userName ? `, ${userName}` : ''}</span>
          </div>
        </div>

        {/* Grand Editorial Couple Typography */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight text-[#FFF7ED] leading-[1.04] mt-2 mb-3 max-w-4xl">
          {wedding.bride_name} <span className="text-[#E89838] font-light italic font-serif">&</span> {wedding.groom_name}
        </h1>

        {/* Auspicious Date & Countdown Anchor */}
        <div className="flex items-center justify-center gap-3 flex-wrap text-xs sm:text-sm text-[#F6C6B6] font-medium mb-6">
          <div className="flex items-center gap-1.5 bg-[#2A0812]/70 px-3.5 py-1 rounded-full border border-white/10">
            <Calendar className="w-3.5 h-3.5 text-[#E89838]" />
            <span className="tracking-widest uppercase text-white font-sans text-xs">
              {formatReadableDate(wedding.wedding_date)}
            </span>
          </div>

          <span className="text-[#E89838] font-bold">•</span>

          <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-[#F5C86C] font-semibold">
            <Heart className="w-3.5 h-3.5 fill-[#C93B2B] text-[#C93B2B]" />
            <span>
              {countdown.isToday
                ? 'The Auspicious Day is Today'
                : countdown.isPast
                ? `${countdown.days} Days Married`
                : `${countdown.days} Days to Celebrate`}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAJOR CENTRAL WEDDING VISUAL CENTERPIECE                      */}
        {/* ============================================================ */}
        <div className="relative w-full max-w-[340px] sm:max-w-[440px] md:max-w-[520px] lg:max-w-[580px] -mb-10 sm:-mb-14 pointer-events-none">
          <WeddingHeroArt className="w-full h-auto drop-shadow-2xl" />
        </div>
      </div>
    </section>
  );
};
