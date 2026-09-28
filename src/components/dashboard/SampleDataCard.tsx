import React from 'react';
import { WeddingRingsArt } from '../common/WedWiseIllustrations';
import { Sparkles, RefreshCw, ArrowRight } from 'lucide-react';

interface SampleDataCardProps {
  hasExpenses: boolean;
  onLoadSample: () => void;
  onClearSample: () => void;
}

export const SampleDataCard: React.FC<SampleDataCardProps> = ({
  hasExpenses,
  onLoadSample,
  onClearSample,
}) => {
  return (
    <div className="bg-white border border-[#F1E4D6] rounded-3xl p-5 sm:p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] border border-[#F1E4D6] flex items-center justify-center flex-shrink-0">
          <WeddingRingsArt className="w-8 h-8" />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-[#E86A5B] uppercase tracking-[0.2em]">
              Curious how WedWise works?
            </span>
          </div>

          <h4 className="text-base sm:text-lg font-serif font-bold text-[#29202A]">
            Step into a sample wedding.
          </h4>

          <div className="flex items-center gap-2 text-xs text-[#615163] mt-1 flex-wrap font-sans">
            <strong className="text-[#641F35] font-serif font-bold text-sm">Rani & Arjun</strong>
            <span>•</span>
            <span>₹8,00,000 budget</span>
            <span>•</span>
            <span>6 expenses</span>
            <span>•</span>
            <span>12 tasks</span>
            <span>•</span>
            <span>84 guests</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {!hasExpenses ? (
          <button
            type="button"
            onClick={onLoadSample}
            className="px-5 py-2.5 rounded-xl bg-[#641F35] hover:bg-[#52172A] text-[#FFF7ED] text-xs font-semibold uppercase tracking-wider shadow-wine flex items-center gap-2 transition-all"
          >
            <span>Explore Sample Wedding</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D6B36A]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onClearSample}
            className="text-xs text-[#8C7A8E] hover:text-[#641F35] font-semibold transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-[#FAF1F3]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Records</span>
          </button>
        )}
      </div>
    </div>
  );
};
