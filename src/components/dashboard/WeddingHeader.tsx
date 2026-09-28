import React from 'react';
import { Wedding } from '../../types/database.types';
import { getTimeGreeting, formatReadableDate } from '../../utils/date';
import { Sparkles, Calendar, Heart } from 'lucide-react';

interface WeddingHeaderProps {
  wedding: Wedding;
  userName: string;
}

export const WeddingHeader: React.FC<WeddingHeaderProps> = ({ wedding, userName }) => {
  const greeting = getTimeGreeting().toUpperCase();

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#E9E1D7]/70">
      <div>
        {/* Sub-heading greeting */}
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[#C9A45C] uppercase mb-1">
          <span>{greeting}, {userName || 'FAMILY'}</span>
          <Sparkles className="w-3.5 h-3.5" />
        </div>

        {/* Wedding Title / Couple Brand */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#262421] tracking-tight leading-tight">
          {wedding.bride_name} & {wedding.groom_name}
        </h2>

        {/* Wedding Date */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#77716A] mt-1">
          <Calendar className="w-3.5 h-3.5 text-[#C9A45C]" />
          <span>{formatReadableDate(wedding.wedding_date)}</span>
          <span>•</span>
          <span className="font-serif italic text-[#C9A45C]">Private Family Wedding</span>
        </div>
      </div>
    </div>
  );
};
