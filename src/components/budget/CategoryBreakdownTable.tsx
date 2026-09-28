import React from 'react';
import { CategorySpendingSummary } from '../../types/expense';
import { formatINR } from '../../utils/currency';
import { CategoryArtwork } from '../common/WedWiseIllustrations';
import { Edit3 } from 'lucide-react';

interface CategoryBreakdownTableProps {
  summaries: CategorySpendingSummary[];
  onEditCategory: (summary: CategorySpendingSummary) => void;
}

export const CategoryBreakdownTable: React.FC<CategoryBreakdownTableProps> = ({
  summaries,
  onEditCategory,
}) => {
  return (
    <div className="bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-8 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#E86A5B] uppercase tracking-[0.2em] block mb-1">
            Category Breakdown
          </span>
          <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#29202A]">
            Category Ledger & Limits
          </h4>
          <p className="text-xs text-[#615163]">
            Compare planned budget caps against actual family vendor disbursements
          </p>
        </div>
      </div>

      {/* Ledger Table Structure */}
      <div className="space-y-3 sm:space-y-0 sm:divide-y sm:divide-[#F1E4D6]">
        {/* Desktop Table Header */}
        <div className="hidden sm:grid sm:grid-cols-12 text-[10px] font-bold text-[#8C7A8E] uppercase tracking-[0.2em] py-3 px-3">
          <div className="col-span-4">Category</div>
          <div className="col-span-3 text-right">Budget Target</div>
          <div className="col-span-2 text-right">Spent</div>
          <div className="col-span-2 text-right">Remaining</div>
          <div className="col-span-1 text-center">Edit</div>
        </div>

        {summaries.map((item) => {
          const isOverAllocated = item.allocated > 0 && item.spent > item.allocated;
          const remaining = item.allocated > 0 ? item.allocated - item.spent : 0;
          const pct = item.allocated > 0 ? (item.spent / item.allocated) * 100 : 0;

          return (
            <div
              key={item.category.id}
              className="p-4 sm:px-3 sm:py-4 bg-[#FFF7ED] sm:bg-transparent rounded-2xl sm:rounded-none border sm:border-0 border-[#F1E4D6] sm:grid sm:grid-cols-12 sm:items-center text-sm"
            >
              {/* Category Info */}
              <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-[#F1E4D6] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <CategoryArtwork
                      category={item.category.name}
                      size="sm"
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-[#29202A] block leading-snug">
                      {item.category.name}
                    </span>
                    {item.allocated > 0 && (
                      <span className="text-[10px] text-[#E86A5B] font-bold sm:hidden">
                        {pct.toFixed(0)}% of target
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile Edit Button */}
                <button
                  type="button"
                  onClick={() => onEditCategory(item)}
                  className="sm:hidden p-2 rounded-xl text-[#615163] hover:text-[#29202A] hover:bg-[#FFF7ED] transition-colors"
                  title="Edit category target"
                >
                  <Edit3 className="w-4 h-4 text-[#641F35]" />
                </button>
              </div>

              {/* Mobile Sub-grid or Desktop Columns */}
              <div className="grid grid-cols-3 sm:contents gap-2 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t border-[#F1E4D6] sm:border-0 text-xs sm:text-sm">
                {/* Budget Column */}
                <div className="sm:col-span-3 sm:text-right">
                  <span className="text-[9px] text-[#8C7A8E] block sm:hidden uppercase font-bold tracking-wider">Target</span>
                  <span className="font-serif font-medium text-[#29202A]">
                    {item.allocated > 0 ? formatINR(item.allocated) : '₹0'}
                  </span>
                </div>

                {/* Spent Column */}
                <div className="sm:col-span-2 sm:text-right">
                  <span className="text-[9px] text-[#8C7A8E] block sm:hidden uppercase font-bold tracking-wider">Spent</span>
                  <span className="font-serif font-bold text-[#29202A]">
                    {formatINR(item.spent)}
                  </span>
                </div>

                {/* Remaining Column */}
                <div className="sm:col-span-2 sm:text-right">
                  <span className="text-[9px] text-[#8C7A8E] block sm:hidden uppercase font-bold tracking-wider">Remaining</span>
                  <span
                    className={`font-serif font-bold ${
                      isOverAllocated
                        ? 'text-[#641F35]'
                        : item.allocated > 0
                        ? 'text-[#5D6B53]'
                        : 'text-[#8C7A8E]'
                    }`}
                  >
                    {item.allocated > 0
                      ? isOverAllocated
                        ? `-${formatINR(Math.abs(remaining))}`
                        : formatINR(remaining)
                      : '—'}
                  </span>
                </div>

                {/* Desktop Edit Button */}
                <div className="hidden sm:flex sm:col-span-1 justify-center">
                  <button
                    type="button"
                    onClick={() => onEditCategory(item)}
                    className="p-2 rounded-xl text-[#8C7A8E] hover:text-[#641F35] hover:bg-[#FFF7ED] transition-colors"
                    title={`Edit ${item.category.name} limit`}
                  >
                    <Edit3 className="w-4 h-4 text-[#641F35]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
