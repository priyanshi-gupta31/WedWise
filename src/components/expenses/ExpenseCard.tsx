import React from 'react';
import { Expense } from '../../types/database.types';
import { formatINR } from '../../utils/currency';
import { formatReadableDate } from '../../utils/date';
import { CategoryArtwork } from '../common/WedWiseIllustrations';

interface ExpenseCardProps {
  expense: Expense;
  onClick?: () => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onClick }) => {
  const categoryName = expense.category?.name || 'Wedding Expense';
  const isPaid = expense.payment_status === 'Paid';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-[#FFFDF9] hover:bg-[#FFF8F0] active:bg-[#FDF2E3] border border-[#F1E4D6] hover:border-[#641F35]/40 rounded-2xl transition-all duration-200 cursor-pointer shadow-subtle hover:shadow-card text-left group relative overflow-hidden"
    >
      {/* Decorative vertical seam indicating payment status */}
      <span
        className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r transition-colors ${
          isPaid ? 'bg-[#2D5A43]/50 group-hover:bg-[#2D5A43]' : 'bg-[#C93B2B]/60 group-hover:bg-[#C93B2B]'
        }`}
      />

      <div className="flex items-center gap-3 sm:gap-4 min-w-0 pl-1.5">
        {/* Category Visual Motif */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FFF8F0] border border-[#F1E4D6] flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-white transition-all shadow-subtle">
          <CategoryArtwork category={categoryName} size="sm" />
        </div>

        {/* Receipt Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-bold text-[#C93B2B] uppercase tracking-[0.2em] block truncate">
              {categoryName}
            </span>
          </div>

          <h4 className="text-sm sm:text-base font-medium text-[#16162A] truncate leading-tight mt-0.5 group-hover:text-[#641F35] transition-colors">
            {expense.expense_name}
          </h4>

          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#615163] mt-1 flex-wrap">
            <span>
              By <strong className="font-semibold text-[#16162A]">{expense.paid_by}</strong>
            </span>
            <span className="text-[#D8CAB8]">•</span>
            <span className="font-medium text-[#8C7A8E]">{expense.payment_method}</span>
            <span className="text-[#D8CAB8]">•</span>
            <span className="font-serif italic text-[#8C7A8E]">{formatReadableDate(expense.expense_date)}</span>
          </div>
        </div>
      </div>

      {/* Amount & Status Badge */}
      <div className="text-right flex flex-col items-end flex-shrink-0 ml-2.5">
        <span className="text-base sm:text-lg font-serif font-bold text-[#16162A] tracking-tight group-hover:text-[#641F35] transition-colors">
          {formatINR(expense.amount)}
        </span>
        <div className="mt-1">
          <span
            className={`inline-flex items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isPaid
                ? 'bg-[#EAF3EC] text-[#2D5A43] border-[#A9CEB5]'
                : 'bg-[#FFF0F0] text-[#C93B2B] border-[#F2B8B8]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1 ${
                isPaid ? 'bg-[#2D5A43]' : 'bg-[#C93B2B]'
              }`}
            />
            {expense.payment_status}
          </span>
        </div>
      </div>
    </div>
  );
};
