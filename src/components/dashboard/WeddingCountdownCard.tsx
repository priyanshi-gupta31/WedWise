import React from 'react';
import { getWeddingCountdown, formatReadableDate } from '../../utils/date';

interface WeddingCountdownCardProps {
  weddingDate: string;
}

export const WeddingCountdownCard: React.FC<WeddingCountdownCardProps> = ({ weddingDate }) => {
  const countdown = getWeddingCountdown(weddingDate);

  return (
    <div className="bg-white border border-[#E9E1D7] rounded-2xl p-5 shadow-subtle flex flex-col justify-between relative overflow-hidden h-full">
      {/* Soft decorative accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#FAF5EA] rounded-full blur-2xl pointer-events-none -mr-6 -mt-6" />

      {/* Header label */}
      <div className="flex items-center justify-between relative z-10 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#77716A] uppercase tracking-wider">
          <span role="img" aria-label="ring">💍</span>
          <span>Wedding Countdown</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF5EA] text-[#8E6F30] font-medium border border-[#E7D3A3]/70">
          Celebration
        </span>
      </div>

      {/* Main Countdown Display */}
      <div className="relative z-10 my-1">
        {countdown.isToday ? (
          <div className="py-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#C9A45C]">
              Today is the Day! 💍
            </span>
            <p className="text-xs text-[#77716A] mt-1">Celebrate every moment of joy.</p>
          </div>
        ) : countdown.isPast ? (
          <div className="py-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#262421]">
              {countdown.days}
            </span>
            <span className="text-xs uppercase text-[#C9A45C] font-semibold tracking-wider ml-2">
              Days Married ❤️
            </span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-serif font-bold text-[#262421] tracking-tight">
              {countdown.days}
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[#C9A45C] uppercase tracking-wider leading-none">
                Days
              </span>
              <span className="text-[10px] text-[#77716A] font-medium uppercase tracking-wider leading-none mt-0.5">
                To Go
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer date */}
      <div className="relative z-10 pt-3 border-t border-[#F2ECE4] text-xs text-[#77716A] flex items-center justify-between">
        <span>Wedding Date</span>
        <span className="font-semibold text-[#262421]">
          {formatReadableDate(weddingDate)}
        </span>
      </div>
    </div>
  );
};
