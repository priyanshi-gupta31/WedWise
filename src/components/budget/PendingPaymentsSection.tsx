import React, { useState } from 'react';
import { Expense } from '../../types/database.types';
import { PendingPaymentsAnalysis } from '../../utils/budgetIntelligence';
import { formatINR } from '../../utils/currency';
import { formatReadableDate } from '../../utils/date';
import { CategoryArtwork } from '../common/WedWiseIllustrations';
import { Clock, AlertCircle, CheckCircle2, User, Calendar, Tag } from 'lucide-react';

interface PendingPaymentsSectionProps {
  pendingAnalysis: PendingPaymentsAnalysis;
  onSelectExpense?: (expense: Expense) => void;
}

export const PendingPaymentsSection: React.FC<PendingPaymentsSectionProps> = ({
  pendingAnalysis,
  onSelectExpense,
}) => {
  const [activeGroup, setActiveGroup] = useState<'all' | 'dueSoon' | 'upcoming' | 'settlement'>('all');

  const {
    pendingExpenses,
    totalPending,
    dueSoon,
    upcoming,
    pendingSettlement,
    pendingByCategory,
    pendingByPayer,
  } = pendingAnalysis;

  if (totalPending === 0) {
    return (
      <div className="bg-[#FFFDF9] border border-[#F1E4D6] rounded-2xl sm:rounded-3xl p-6 text-center space-y-2 shadow-subtle">
        <div className="w-10 h-10 rounded-full bg-[#EAF3EC] text-[#2D5A43] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="text-base font-serif font-bold text-[#16162A]">
          All Ceremony Advances Settled
        </h4>
        <p className="text-xs text-[#615163] max-w-sm mx-auto font-sans">
          There are zero pending vendor milestones awaiting settlement. Any advance or deposit marked as Pending will automatically populate this section.
        </p>
      </div>
    );
  }

  const displayedList =
    activeGroup === 'dueSoon'
      ? dueSoon
      : activeGroup === 'upcoming'
      ? upcoming
      : activeGroup === 'settlement'
      ? pendingSettlement
      : pendingExpenses;

  return (
    <div className="bg-[#FFFDF9] border border-[#F1E4D6] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-subtle space-y-6">
      {/* 1. Header & Total Cash Requirements */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#F1E4D6]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#C93B2B] uppercase tracking-[0.2em] mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Cash Requirement Planning</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#16162A]">
            Pending Milestone Payments
          </h3>
          <p className="text-xs text-[#615163] font-sans mt-0.5">
            Advance deposits and vendor settlements awaiting family payment execution
          </p>
        </div>

        {/* Total Pending Figure */}
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A8E] block">
            Total Pending Outlay
          </span>
          <span className="text-2xl sm:text-3xl font-serif font-bold text-[#C93B2B] tracking-tight block">
            {formatINR(totalPending)}
          </span>
          <span className="text-[11px] text-[#615163]">
            Across {pendingExpenses.length} unconfirmed milestone{pendingExpenses.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* 2. Upcoming Cash Requirements: By Payer & By Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Pending By Family Payer */}
        <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#F1E4D6] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#641F35] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#E89838]" />
              <span>Pending By Family Payer</span>
            </span>
            <span className="text-[10px] text-[#8C7A8E] font-medium">Responsibility</span>
          </div>

          <div className="space-y-1.5">
            {pendingByPayer.map((item) => (
              <div
                key={item.payer}
                className="flex items-center justify-between text-xs py-1 border-b border-[#F1E4D6]/60 last:border-none"
              >
                <span className="font-semibold text-[#16162A] truncate">
                  {item.payer}{' '}
                  <span className="text-[10px] text-[#8C7A8E] font-normal">
                    ({item.count} payment{item.count === 1 ? '' : 's'})
                  </span>
                </span>
                <span className="font-serif font-bold text-[#641F35]">
                  {formatINR(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending By Ceremony Category */}
        <div className="p-3.5 rounded-2xl bg-[#FFF8F0] border border-[#F1E4D6] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#641F35] uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#E89838]" />
              <span>Pending By Discipline</span>
            </span>
            <span className="text-[10px] text-[#8C7A8E] font-medium">Category</span>
          </div>

          <div className="space-y-1.5">
            {pendingByCategory.slice(0, 4).map((item) => (
              <div
                key={item.categoryName}
                className="flex items-center justify-between text-xs py-1 border-b border-[#F1E4D6]/60 last:border-none"
              >
                <span className="font-semibold text-[#16162A] truncate">
                  {item.categoryName}{' '}
                  <span className="text-[10px] text-[#8C7A8E] font-normal">
                    ({item.count})
                  </span>
                </span>
                <span className="font-serif font-bold text-[#C93B2B]">
                  {formatINR(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Group Filter Pills (Due Soon / Upcoming / Settlement) */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveGroup('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex-shrink-0 ${
              activeGroup === 'all'
                ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35]'
                : 'bg-[#FFF8F0] text-[#615163] border-[#E8DFD5]'
            }`}
          >
            All Pending ({pendingExpenses.length})
          </button>
          {dueSoon.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveGroup('dueSoon')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 flex-shrink-0 ${
                activeGroup === 'dueSoon'
                  ? 'bg-[#C93B2B] text-white border-[#C93B2B]'
                  : 'bg-[#FFF0F0] text-[#C93B2B] border-[#F2B8B8]'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Due Soon ({dueSoon.length})</span>
            </button>
          )}
          {upcoming.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveGroup('upcoming')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex-shrink-0 ${
                activeGroup === 'upcoming'
                  ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35]'
                  : 'bg-[#FFF8F0] text-[#615163] border-[#E8DFD5]'
              }`}
            >
              Upcoming ({upcoming.length})
            </button>
          )}
          {pendingSettlement.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveGroup('settlement')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex-shrink-0 ${
                activeGroup === 'settlement'
                  ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35]'
                  : 'bg-[#FFF8F0] text-[#615163] border-[#E8DFD5]'
              }`}
            >
              Pending Settlement ({pendingSettlement.length})
            </button>
          )}
        </div>

        {/* 4. Pending Expense Rows */}
        <div className="space-y-2">
          {displayedList.map((expense) => {
            const hasDueDate = Boolean(expense.expense_date);
            return (
              <div
                key={expense.id}
                onClick={() => onSelectExpense?.(expense)}
                role="button"
                tabIndex={0}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white hover:bg-[#FFF8F0] border border-[#F1E4D6] hover:border-[#641F35]/40 transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF8F0] border border-[#F1E4D6] flex items-center justify-center flex-shrink-0">
                    <CategoryArtwork category={expense.category?.name || ''} size="sm" />
                  </div>

                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm font-semibold text-[#16162A] truncate group-hover:text-[#641F35] transition-colors">
                      {expense.expense_name}
                    </h5>

                    <div className="flex items-center gap-2 text-[11px] text-[#615163] mt-0.5 flex-wrap">
                      <span>
                        Payer: <strong className="font-semibold text-[#16162A]">{expense.paid_by}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-[#8C7A8E]">{expense.category?.name || 'General'}</span>
                      {hasDueDate ? (
                        <>
                          <span>•</span>
                          <span className="font-serif italic text-[#C93B2B] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatReadableDate(expense.expense_date)}</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="text-[#8C7A8E] italic">No due date</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Status */}
                <div className="text-right flex-shrink-0">
                  <span className="text-sm sm:text-base font-serif font-bold text-[#C93B2B] block">
                    {formatINR(expense.amount)}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF0F0] text-[#C93B2B] border border-[#F2B8B8] inline-block mt-0.5">
                    Pending
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
