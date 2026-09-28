import React from 'react';
import { ProgressBar } from '../common/ProgressBar';
import { Sparkles, AlertCircle } from 'lucide-react';

interface BudgetProgressBarCardProps {
  percentage: number;
  totalBudget: number;
}

export const BudgetProgressBarCard: React.FC<BudgetProgressBarCardProps> = ({
  percentage,
  totalBudget,
}) => {
  if (totalBudget <= 0) {
    return (
      <div className="bg-cream-50/90 border border-cream-200/90 rounded-2xl p-5 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-charcoal-600">
          <AlertCircle className="w-4 h-4 text-gold-600" />
          <span>Please set your wedding budget to view utilization progress.</span>
        </div>
      </div>
    );
  }

  let helperMessage = '';
  if (percentage > 100) {
    helperMessage = 'Current expenses exceed planned total budget. Review individual categories.';
  } else if (percentage >= 90) {
    helperMessage = 'Your wedding budget is almost fully allocated. Monitor remaining final balances.';
  } else if (percentage >= 70) {
    helperMessage = 'Approaching final spending tier. Ensure priority items are accounted for.';
  } else {
    helperMessage = '✨ Wedding spending is currently well-paced within targets.';
  }

  return (
    <div className="bg-cream-50/90 border border-cream-200/90 rounded-2xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold-100/80 border border-gold-200 flex items-center justify-center text-gold-700">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-serif font-bold text-charcoal-900">
            Budget Utilization
          </span>
        </div>
        <span className="text-xs font-semibold text-charcoal-700">
          {percentage.toFixed(1)}% used
        </span>
      </div>

      <ProgressBar percentage={percentage} size="md" showText={false} />

      <p className="text-xs text-charcoal-500 mt-3 flex items-center gap-1.5">
        <span>{helperMessage}</span>
      </p>
    </div>
  );
};
