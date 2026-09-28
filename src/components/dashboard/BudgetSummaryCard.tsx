import React from 'react';
import { formatINR } from '../../utils/currency';
import { Coins, Sparkles } from 'lucide-react';

interface BudgetSummaryCardProps {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentageUsed: number;
}

/**
 * BudgetSummaryCard — Editorial Financial Spread (Cardless).
 *
 * Implements Section 9 & 15:
 * Large numbers, typographic dividers, lines, and segmented progress bars
 * without wrapping everything in generic white card boxes.
 */
export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  totalBudget,
  totalSpent,
  totalRemaining,
  percentageUsed,
}) => {
  const isOverBudget = totalRemaining < 0;
  const spentPct = Math.min(Math.round((totalSpent / (totalBudget || 1)) * 100), 100);
  const remainingPct = Math.max(100 - spentPct, 0);

  return (
    <section className="relative w-full py-12 px-6 sm:px-10 lg:px-16 select-none border-t border-[#F1E4D6]/70">
      <div className="max-w-4xl mx-auto">
        {/* Section Masthead */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-6 border-b border-[#F1E4D6]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-3.5 h-3.5 text-[#E89838]" />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.28em] text-[#E89838] uppercase">
                Financial Ledger
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1B1220] tracking-tight">
              Money
            </h2>
            <p className="text-xs sm:text-sm text-[#615163] font-serif italic mt-0.5">
              Where your family wedding budget is flowing.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#5A1224] bg-[#FAF1F3] px-3.5 py-1 rounded-full border border-[#E8C5CD]">
              {percentageUsed.toFixed(0)}% Allocated
            </span>
          </div>
        </div>

        {/* Editorial Typographic Spread: Spent ─── Remaining ─── Total */}
        <div className="pt-10 pb-8 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 items-baseline">
          {/* Node 1: TOTAL BUDGET */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8C7A8E] block">
              Total Approved Budget
            </span>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1B1220] tracking-tight">
              {formatINR(totalBudget)}
            </div>
            <p className="text-xs text-[#615163] font-sans">
              Planned target capital
            </p>
          </div>

          {/* Node 2: SPENT */}
          <div className="space-y-1 sm:border-l sm:border-[#F1E4D6] sm:pl-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C93B2B] block">
              Spent Advances
            </span>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#5A1224] tracking-tight">
              {formatINR(totalSpent)}
            </div>
            <p className="text-xs text-[#C93B2B] font-medium font-sans">
              {spentPct}% settled with partners
            </p>
          </div>

          {/* Node 3: REMAINING */}
          <div className="space-y-1 sm:border-l sm:border-[#F1E4D6] sm:pl-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#2D5A43] block">
              Remaining Buffer
            </span>
            <div
              className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight ${
                isOverBudget ? 'text-[#C93B2B]' : 'text-[#2D5A43]'
              }`}
            >
              {isOverBudget ? `-${formatINR(Math.abs(totalRemaining))}` : formatINR(totalRemaining)}
            </div>
            <p className="text-xs text-[#615163] font-sans">
              {isOverBudget ? 'Exceeded target allocation' : `${remainingPct}% safe reserve buffer`}
            </p>
          </div>
        </div>

        {/* Segmented Architectural Budget Bar */}
        <div className="pt-6 border-t border-[#F1E4D6]">
          <div className="flex items-center justify-between text-xs text-[#615163] mb-2 font-medium">
            <span>Capital Distribution Bar</span>
            <span className="font-serif font-bold text-[#5A1224]">{spentPct}% Spent · {remainingPct}% Reserve</span>
          </div>

          <div className="w-full bg-[#EADCCF] rounded-full h-3 overflow-hidden flex p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isOverBudget ? 'bg-[#C93B2B]' : 'bg-[#5A1224]'
              }`}
              style={{ width: `${Math.min(spentPct, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#8C7A8E] mt-2 font-sans">
            <span>₹0 Start</span>
            <span className="font-serif italic">Healthy pacing for ceremony milestones</span>
            <span>Target {formatINR(totalBudget)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
