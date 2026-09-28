import React from 'react';
import { BudgetForecastResult, SpendingVelocity } from '../../utils/budgetIntelligence';
import { formatINR } from '../../utils/currency';
import { Calculator, Sparkles, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface BudgetForecastSectionProps {
  forecast: BudgetForecastResult;
  velocity: SpendingVelocity;
  totalBudget: number;
  totalSpent: number;
}

export const BudgetForecastSection: React.FC<BudgetForecastSectionProps> = ({
  forecast,
  velocity,
  totalBudget,
  totalSpent,
}) => {
  return (
    <div className="bg-[#FFFDF9] border border-[#F1E4D6] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-subtle space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F1E4D6]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#E89838] uppercase tracking-[0.2em]">
            <Calculator className="w-3.5 h-3.5" />
            <span>Mathematical Projection</span>
          </div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-[#16162A]">
            Budget Trajectory & Forecast
          </h3>
        </div>

        <span className="text-[11px] font-medium text-[#8C7A8E] bg-[#FFF8F0] px-3 py-1 rounded-full border border-[#F1E4D6] self-start sm:self-auto">
          Deterministic Projection Model
        </span>
      </div>

      {/* Case 1: Insufficient Data */}
      {!forecast.hasEnoughData ? (
        <div className="py-8 px-4 text-center rounded-2xl bg-[#FFF8F0] border border-[#F1E4D6] space-y-2">
          <div className="w-10 h-10 rounded-full bg-white border border-[#F1E4D6] flex items-center justify-center mx-auto text-[#D6B36A] shadow-xs">
            <Info className="w-5 h-5 text-[#8C7A8E]" />
          </div>
          <h4 className="text-sm font-serif font-bold text-[#16162A]">
            Not enough spending history to create a projection
          </h4>
          <p className="text-xs text-[#615163] max-w-md mx-auto font-sans leading-relaxed">
            {forecast.insufficientDataMessage ||
              'Record transactions across at least one week of active planning to calculate statistical velocity. Projections are strictly calculated from verifiable disbursements.'}
          </p>
        </div>
      ) : (
        /* Case 2: Sufficient Historical Data */
        <div className="space-y-4">
          {/* 3-Metric Spread: Pace ──── Future Spend ──── Remaining Buffer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Metric 1: Current Spending Pace */}
            <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#F1E4D6] space-y-1">
              <span className="text-[10px] font-bold text-[#8C7A8E] uppercase tracking-wider block">
                Current Spending Pace
              </span>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#16162A]">
                {formatINR(forecast.weeklyPace)}{' '}
                <span className="text-xs font-sans font-normal text-[#8C7A8E]">/ week</span>
              </div>
              <p className="text-[11px] text-[#615163]">
                Observed over {velocity.daysTracked} days of logging
              </p>
            </div>

            {/* Metric 2: Projected Future Spending */}
            <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#F1E4D6] space-y-1">
              <span className="text-[10px] font-bold text-[#8C7A8E] uppercase tracking-wider block">
                Projected Future Spend
              </span>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#641F35]">
                {formatINR(forecast.projectedFutureSpend)}
              </div>
              <p className="text-[11px] text-[#615163]">
                Across {forecast.weeksUntilWedding} weeks remaining + pending
              </p>
            </div>

            {/* Metric 3: Projected Remaining Buffer */}
            <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#F1E4D6] space-y-1">
              <span className="text-[10px] font-bold text-[#8C7A8E] uppercase tracking-wider block">
                Projected Reserve Buffer
              </span>
              <div
                className={`text-xl sm:text-2xl font-serif font-bold ${
                  forecast.isProjectedOverBudget ? 'text-[#C93B2B]' : 'text-[#2D5A43]'
                }`}
              >
                {forecast.isProjectedOverBudget
                  ? `-${formatINR(Math.abs(forecast.projectedRemainingBuffer))}`
                  : formatINR(forecast.projectedRemainingBuffer)}
              </div>
              <p className="text-[11px] text-[#615163]">
                {forecast.isProjectedOverBudget
                  ? 'Pacing risks exceeding budget limit'
                  : 'Comfortable capital runway'}
              </p>
            </div>
          </div>

          {/* Caveat & Disclaimer Banner */}
          <div className="p-3.5 rounded-xl bg-[#FFFDF0] border border-[#F3E7A9] text-xs text-[#7A5A00] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#D6B36A] flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              {forecast.caveatNote}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
