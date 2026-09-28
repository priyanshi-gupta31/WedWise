import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatINR, parseCurrencyInput } from '../../utils/currency';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';

interface WeddingBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeddingBudgetModal: React.FC<WeddingBudgetModalProps> = ({ isOpen, onClose }) => {
  const { wedding, updateWedding } = useWedding();
  const { showToast } = useToast();
  const [budgetInput, setBudgetInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (wedding) {
      setBudgetInput(String(wedding.total_budget || ''));
    }
  }, [wedding, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBudget = parseCurrencyInput(budgetInput);
    if (isNaN(newBudget) || newBudget <= 0) {
      showToast('Please enter a valid positive budget amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateWedding({ total_budget: newBudget });
      showToast(`Total wedding budget updated to ${formatINR(newBudget)}`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to update wedding budget', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Total Wedding Budget"
      subtitle="Adjust your overall celebration capital target"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold text-[#641F35] tracking-widest uppercase">
              Total Budget (₹)
            </label>
            {budgetInput && !isNaN(Number(budgetInput)) && Number(budgetInput) > 0 && (
              <span className="text-xs font-bold font-serif text-[#641F35]">
                {formatINR(budgetInput)}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A8E] font-serif font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              min="1000"
              step="1000"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="e.g. 2000000"
              className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-[#FFF7ED] border border-[#F1E4D6] rounded-xl focus:outline-none focus:border-[#E86A5B] font-medium text-[#29202A] placeholder-[#8C7A8E] transition-all"
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="flex-1">
            Save Budget
          </Button>
        </div>
      </form>
    </Modal>
  );
};
