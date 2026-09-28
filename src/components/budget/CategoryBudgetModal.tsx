import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CategorySpendingSummary } from '../../types/expense';
import { formatINR, parseCurrencyInput } from '../../utils/currency';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { CategoryArtwork } from '../common/WedWiseIllustrations';

interface CategoryBudgetModalProps {
  summary: CategorySpendingSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryBudgetModal: React.FC<CategoryBudgetModalProps> = ({
  summary,
  isOpen,
  onClose,
}) => {
  const { totalBudget, totalAllocated, updateCategoryBudget } = useWedding();
  const { showToast } = useToast();
  const [limitInput, setLimitInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (summary && isOpen) {
      setLimitInput(String(summary.allocated || ''));
    }
  }, [summary, isOpen]);

  if (!summary) return null;

  const currentCatAllocated = summary.allocated || 0;
  const newCatAllocated = parseCurrencyInput(limitInput) || 0;
  const delta = newCatAllocated - currentCatAllocated;
  const projectedTotalAllocated = Math.max(0, totalAllocated + delta);
  const projectedUnallocated = totalBudget - projectedTotalAllocated;
  const isOverAllocated = projectedTotalAllocated > totalBudget && totalBudget > 0;
  const overAllocatedAmount = Math.max(0, projectedTotalAllocated - totalBudget);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLimit = parseCurrencyInput(limitInput);
    if (isNaN(newLimit) || newLimit < 0) {
      showToast('Please enter a valid positive target limit.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCategoryBudget(summary.category.id, newLimit);
      showToast(
        `${summary.category.name} target updated to ${formatINR(newLimit)}! 💍`,
        'success'
      );
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to update category target. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Set ${summary.category.name} Target`}
      subtitle="Adjust discipline allocation & assess wedding capital impact"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Identity Header */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#F1E4D6]">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#F1E4D6] flex items-center justify-center flex-shrink-0 shadow-subtle">
            <CategoryArtwork category={summary.category.name} size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-[#16162A] truncate">
              {summary.category.name}
            </h4>
            <p className="text-xs text-[#615163]">
              Currently disbursed: <strong className="text-[#16162A] font-serif font-bold">{formatINR(summary.spent)}</strong> ({summary.expenseCount} receipts)
            </p>
          </div>
        </div>

        {/* Input: Target Budget with Live Preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold text-[#641F35] tracking-widest uppercase">
              New Allocation Target (₹) <span className="text-[#C93B2B]">*</span>
            </label>
            {limitInput && !isNaN(Number(limitInput)) && Number(limitInput) > 0 && (
              <span className="text-xs font-bold font-serif text-[#641F35] bg-[#FFF2E0] px-2.5 py-0.5 rounded-full border border-[#E89838]/30">
                {formatINR(limitInput)}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A8E] font-serif font-bold text-base">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="1000"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              placeholder="e.g. 350000"
              className="w-full pl-8 pr-3.5 py-2.5 text-base font-serif font-bold bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl focus:outline-none focus:border-[#641F35] text-[#16162A] placeholder-[#8C7A8E] transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Real-time Allocation Impact Spread */}
        <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#F1E4D6] space-y-2 text-xs">
          <span className="text-[10px] font-bold text-[#8C7A8E] uppercase tracking-wider block">
            Capital Impact Summary
          </span>

          <div className="divide-y divide-[#F1E4D6] text-xs">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#615163]">Current Category Target</span>
              <span className="font-serif font-semibold text-[#16162A]">
                {formatINR(currentCatAllocated)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#615163]">New Category Target</span>
              <span className="font-serif font-bold text-[#641F35]">
                {formatINR(newCatAllocated)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#615163]">Resulting Total Allocated</span>
              <span className="font-serif font-semibold text-[#16162A]">
                {formatINR(projectedTotalAllocated)} of {formatINR(totalBudget)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#615163]">Resulting Unallocated Reserve</span>
              <span
                className={`font-serif font-bold ${
                  isOverAllocated ? 'text-[#C93B2B]' : 'text-[#2D5A43]'
                }`}
              >
                {isOverAllocated
                  ? `-${formatINR(overAllocatedAmount)} (Deficit)`
                  : formatINR(projectedUnallocated)}
              </span>
            </div>
          </div>
        </div>

        {/* Over-allocation Warning Banner */}
        {isOverAllocated && (
          <div className="p-3.5 rounded-xl bg-[#FFF0F0] border border-[#F2B8B8] flex items-start gap-2.5 animate-fade-in text-xs">
            <AlertTriangle className="w-4 h-4 text-[#C93B2B] flex-shrink-0 mt-0.5" />
            <div className="text-[#52172A] leading-relaxed">
              <strong className="text-[#C93B2B] block mb-0.5">Over-Allocation Warning</strong>
              Saving this will cause total ceremony targets ({formatINR(projectedTotalAllocated)}) to exceed your overall wedding budget ({formatINR(totalBudget)}) by {formatINR(overAllocatedAmount)}.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-xs">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="flex-1 text-xs"
          >
            {isOverAllocated ? 'Confirm & Override' : 'Save Allocation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
