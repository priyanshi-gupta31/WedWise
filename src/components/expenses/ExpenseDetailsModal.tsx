import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Expense } from '../../types/database.types';
import { formatINR } from '../../utils/currency';
import { formatReadableDate } from '../../utils/date';
import { CategoryArtwork } from '../common/WedWiseIllustrations';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import { Edit2, Trash2 } from 'lucide-react';

interface ExpenseDetailsModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  expense,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { deleteExpense } = useWedding();
  const { showToast } = useToast();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!expense) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpense(expense.id);
      showToast('Wedding receipt deleted from ledger.', 'info');
      setShowConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Couldn't delete expense. Please try again.", 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isPaid = expense.payment_status === 'Paid';

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Wedding Receipt"
        subtitle="Ceremony transaction record & ledger entry"
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Main Receipt Container with warm paper surface */}
          <div className="bg-[#FFFDF9] border border-[#F1E4D6] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-subtle relative overflow-hidden">
            {/* Top Category Tracking Label & Icon */}
            <div className="text-center pb-2 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF8F0] border border-[#F1E4D6] flex items-center justify-center mb-2 shadow-subtle">
                <CategoryArtwork category={expense.category?.name || ''} size="md" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#C93B2B] uppercase tracking-[0.25em] block mb-1">
                {expense.category?.name || 'WEDDING PAYMENT'}
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#16162A] tracking-tight">
                {expense.expense_name}
              </h3>
            </div>

            {/* Financial Amount */}
            <div className="text-center my-3 py-3 border-y border-dashed border-[#E8DFD5]">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-[#641F35] tracking-tight">
                {formatINR(expense.amount)}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                    isPaid
                      ? 'bg-[#EAF3EC] text-[#2D5A43] border-[#A9CEB5]'
                      : 'bg-[#FFF0F0] text-[#C93B2B] border-[#F2B8B8]'
                  }`}
                >
                  {expense.payment_status}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FFF8F0] text-[#16162A] border border-[#F1E4D6]">
                  {expense.payment_method}
                </span>
              </div>
            </div>

            {/* Receipt Metadata Rows */}
            <div className="divide-y divide-[#F8F1EA] text-xs sm:text-sm pt-1">
              <div className="flex items-center justify-between py-2">
                <span className="text-[#615163]">Paid By</span>
                <span className="font-semibold text-[#16162A]">{expense.paid_by}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-[#615163]">Payment Date</span>
                <span className="font-serif italic text-[#16162A]">
                  {formatReadableDate(expense.expense_date)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-[#615163]">Logged On</span>
                <span className="text-[#8C7A8E] text-xs">
                  {formatReadableDate(expense.created_at)}
                </span>
              </div>
            </div>

            {/* Notes Section */}
            {expense.notes && (
              <div className="mt-3 pt-3 border-t border-dashed border-[#E8DFD5]">
                <span className="text-[10px] font-bold text-[#8C7A8E] uppercase tracking-wider block mb-1">
                  Wedding Notes
                </span>
                <p className="text-xs text-[#16162A] bg-[#FFF8F0] p-3 rounded-xl border border-[#F1E4D6] leading-relaxed whitespace-pre-line font-sans">
                  {expense.notes}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(expense);
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#F1E4D6] hover:border-[#641F35] text-xs font-semibold text-[#16162A] flex items-center justify-center gap-1.5 shadow-subtle transition-all"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#E89838]" />
              <span>Edit Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="flex-1 py-2.5 rounded-xl bg-[#FFF0F0] border border-[#F2B8B8] hover:bg-[#FFE5E5] text-xs font-semibold text-[#C93B2B] flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Receipt"
        message="Are you sure you want to delete this wedding receipt? This will adjust your ceremony totals and budget balances."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
};
