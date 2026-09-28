import React from 'react';
import { Expense } from '../../types/database.types';
import { ExpenseCard } from '../expenses/ExpenseCard';
import { EmptyState } from '../common/EmptyState';
import { ArrowRight } from 'lucide-react';

interface RecentExpensesProps {
  expenses: Expense[];
  onViewAll: () => void;
  onSelectExpense: (expense: Expense) => void;
  onAddExpense: () => void;
}

export const RecentExpenses: React.FC<RecentExpensesProps> = ({
  expenses,
  onViewAll,
  onSelectExpense,
  onAddExpense,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#E86A5B] uppercase tracking-[0.25em] block mb-0.5">
            Wedding Receipts
          </span>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#29202A]">
            Recent Expenses
          </h3>
        </div>

        {expenses.length > 0 && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-[#641F35] hover:text-[#E86A5B] flex items-center gap-1 transition-colors group"
          >
            <span>Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          title="Your wedding story starts here"
          description="Record your first vendor advance or ceremony expense to begin tracking your celebration."
          actionText="+ Record First Expense"
          onAction={onAddExpense}
        />
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onClick={() => onSelectExpense(expense)}
            />
          ))}

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onViewAll}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white border border-[#F1E4D6] hover:border-[#641F35] text-xs font-semibold text-[#29202A] shadow-subtle hover:shadow-card transition-all"
            >
              View Full Wedding Expense Ledger →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
