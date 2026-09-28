import React from 'react';
import { ProgressBar } from '../common/ProgressBar';
import { formatINR } from '../../utils/currency';
import { SpendingInsight } from '../../utils/insights';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetUtilizationSectionProps {
  totalBudget: number;
  totalSpent: number;
  percentageUsed: number;
  insights: SpendingInsight[];
}

export const BudgetUtilizationSection: React.FC<BudgetUtilizationSectionProps> = ({
  totalBudget,
  totalSpent,
  percentageUsed,
  insights,
}) => {
  // Top primary insight or calm contextual guidance
  const primaryInsight = insights.find(i => i.type === 'critical' || i.type === 'warning') || insights[0];

  let contextualMessage = '✨ Your wedding spending is currently well within your planned budget.';
  if (percentageUsed > 100) {
    contextualMessage = '⚠️ Total spending has exceeded the planned budget. Review individual category limits.';
  } else if (percentageUsed >= 90) {
    contextualMessage = 'Your wedding budget is almost fully allocated. Monitor remaining vendor payments.';
  } else if (percentageUsed >= 70) {
    contextualMessage = 'Spending is pacing towards the final allocation tier. Review remaining milestones.';
  }

  return (
    <div className="bg-white border border-[#E9E1D7] rounded-2xl p-5 sm:p-6 shadow-subtle space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#262421]">
            Budget Utilized
          </h3>
          <p className="text-xs text-[#77716A]">
            {formatINR(totalSpent)} spent of {formatINR(totalBudget)}
          </p>
        </div>
        <span className="text-sm font-serif font-bold text-[#262421]">
          {percentageUsed.toFixed(1)}%
        </span>
      </div>

      {/* Thin elegant progress bar */}
      <div>
        <ProgressBar percentage={percentageUsed} size="sm" showText={false} />
      </div>

      {/* Contextual message and rule-based spending insight */}
      <div className="pt-2 border-t border-[#F2ECE4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2 text-[#476850] bg-[#EDF2EE]/70 px-3 py-2 rounded-xl border border-[#D0DED3]/70 flex-1">
          <Sparkles className="w-3.5 h-3.5 text-[#5B8266] flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-snug">
            {primaryInsight?.message || contextualMessage}
          </span>
        </div>

        {primaryInsight && primaryInsight.title && (
          <span className="text-[11px] text-[#77716A] italic hidden lg:inline flex-shrink-0">
            Based on current family records
          </span>
        )}
      </div>
    </div>
  );
};
