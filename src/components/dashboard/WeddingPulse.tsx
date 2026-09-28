import React from 'react';
import { formatINR } from '../../utils/currency';
import { getWeddingCountdown } from '../../utils/date';
import { WeddingSeal } from '../common/WeddingSeal';
import { Coins, Users, CheckSquare, Sparkles } from 'lucide-react';

interface WeddingPulseProps {
  totalBudget: number;
  totalSpent: number;
  percentageUsed: number;
  weddingDate: string;
  onNavigateTab?: (tab: string) => void;
}

/**
 * WeddingPulse — Radial Wedding Pulse & Rangoli Seal Centerpiece.
 *
 * NOT A CARD.
 * A freestanding circular Rangoli Wedding Seal with {daysRemaining} DAYS TO CELEBRATE
 * surrounded by contextual data placed via radial balance and editorial typography.
 */
export const WeddingPulse: React.FC<WeddingPulseProps> = ({
  totalBudget,
  totalSpent,
  percentageUsed,
  weddingDate,
  onNavigateTab,
}) => {
  const countdown = getWeddingCountdown(weddingDate);
  const remainingBudget = Math.max(totalBudget - totalSpent, 0);

  return (
    <section className="relative w-full py-12 sm:py-16 px-6 sm:px-10 overflow-hidden select-none">
      {/* Background Radial Ambient Halos */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#E89838]/8 via-[#C93B2B]/6 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
        {/* Section Masthead */}
        <div className="flex items-center gap-2 mb-8 text-center">
          <span className="w-8 h-px bg-gradient-to-r from-transparent to-[#E89838]" />
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#5A1224] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
            <span>Wedding Pulse</span>
          </span>
          <span className="w-8 h-px bg-gradient-to-l from-transparent to-[#E89838]" />
        </div>

        {/* ============================================================ */}
        {/* RADIAL EDITORIAL COMPOSITION (Center Seal + Orbiting Metrics) */}
        {/* ============================================================ */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Metrics: Capital / Money */}
          <div className="md:col-span-4 flex flex-col items-center md:items-end text-center md:text-right space-y-4 order-2 md:order-1">
            <div
              onClick={() => onNavigateTab && onNavigateTab('expenses')}
              className="cursor-pointer group transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8C7A8E] block">
                Total Budget
              </span>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1220] tracking-tight group-hover:text-[#5A1224] transition-colors block mt-0.5">
                {formatINR(totalBudget)}
              </span>
              <span className="text-xs text-[#615163] block">
                Approved Target Capital
              </span>
            </div>

            <div className="w-24 h-px bg-[#F1E4D6] hidden md:block" />

            <div
              onClick={() => onNavigateTab && onNavigateTab('expenses')}
              className="cursor-pointer group transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#C93B2B] block">
                Spent Advances
              </span>
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#5A1224] tracking-tight block mt-0.5">
                {formatINR(totalSpent)}
              </span>
              <span className="text-xs text-[#8C7A8E] block">
                {percentageUsed.toFixed(0)}% Paced · {formatINR(remainingBudget)} Buffer
              </span>
            </div>
          </div>

          {/* Centerpiece: The Large 3D Rangoli Wedding Seal */}
          <div className="md:col-span-4 flex flex-col items-center justify-center order-1 md:order-2">
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
              {/* Outer Dashed Rangoli Burst Ring */}
              <div className="absolute inset-0 rounded-full border border-[#E89838]/40 border-dashed animate-pulse-subtle pointer-events-none" />

              {/* Surrounding Progress Arc */}
              <svg className="w-full h-full -rotate-90 absolute inset-0 pointer-events-none" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="55"
                  className="stroke-[#FAF1F3]"
                  strokeWidth="3.5"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="55"
                  stroke="#5A1224"
                  strokeWidth="3.5"
                  strokeDasharray={2 * Math.PI * 55}
                  strokeDashoffset={2 * Math.PI * 55 - (Math.min(percentageUsed, 100) / 100) * (2 * Math.PI * 55)}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Signature Scaled Wedding Seal */}
              <div className="relative transform hover:scale-105 transition-transform duration-300">
                <WeddingSeal
                  size="xl"
                  variant="burgundy"
                  days={countdown.isPast ? '💍' : countdown.days}
                  showRays={true}
                  className="shadow-seal-3d scale-90 sm:scale-100"
                />
              </div>
            </div>

            <div className="mt-3 text-center">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#5A1224] block">
                {countdown.isPast ? 'Happily Ever After' : `${countdown.days} DAYS TO CELEBRATE`}
              </span>
              <span className="text-[11px] text-[#8C7A8E] font-serif italic block mt-0.5">
                Central Wedding State
              </span>
            </div>
          </div>

          {/* Right Metrics: People & Tasks */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left space-y-4 order-3">
            <div
              onClick={() => onNavigateTab && onNavigateTab('people')}
              className="cursor-pointer group transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8C7A8E] block">
                Guest Sanctuary
              </span>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1220] tracking-tight group-hover:text-[#5A1224] transition-colors block mt-0.5">
                186 Guests
              </span>
              <span className="text-xs text-[#2D5A43] font-semibold block">
                162 Confirmed RSVP (87%)
              </span>
            </div>

            <div className="w-24 h-px bg-[#F1E4D6] hidden md:block" />

            <div
              onClick={() => onNavigateTab && onNavigateTab('wedding')}
              className="cursor-pointer group transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#E89838] block">
                Milestone Tasks
              </span>
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#1B1220] tracking-tight block mt-0.5">
                14 Ritual Tasks
              </span>
              <span className="text-xs text-[#C93B2B] font-semibold block">
                3 Action Items Due Today
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
