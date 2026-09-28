import React, { useState, useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
import { ExpenseCard } from '../components/expenses/ExpenseCard';
import { ExpenseFilterDrawer } from '../components/expenses/ExpenseFilterDrawer';
import { CategoryBudgetModal } from '../components/budget/CategoryBudgetModal';
import { WeddingBudgetModal } from '../components/budget/WeddingBudgetModal';
import { WeddingSeal } from '../components/common/WeddingSeal';
import { CategoryArtwork } from '../components/common/WedWiseIllustrations';
import { Expense } from '../types/database.types';
import { CategorySpendingSummary } from '../types/expense';
import { formatINR } from '../utils/currency';
import { getBudgetHealth, getLargestSpendingCategory } from '../utils/insights';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  TrendingUp,
  Receipt,
  SlidersHorizontal,
} from 'lucide-react';

interface ExpensesPageProps {
  onSelectExpense: (expense: Expense) => void;
  onOpenAddExpense: () => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  onSelectExpense,
  onOpenAddExpense,
}) => {
  const {
    expenses,
    categories,
    totalBudget,
    totalSpent,
    totalRemaining,
    pendingExpensesTotal,
    pendingExpensesCount,
    categorySummaries,
    insights,
  } = useWedding();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedMethod, setSelectedMethod] = useState<string>('All');
  const [selectedPaidBy, setSelectedPaidBy] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Drawer & Modal state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [categoryForBudgetEdit, setCategoryForBudgetEdit] = useState<CategorySpendingSummary | null>(null);
  const [showEditTotalBudget, setShowEditTotalBudget] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Distinct paid_by family members
  const paidByList = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.paid_by) set.add(e.paid_by);
    });
    return Array.from(set);
  }, [expenses]);

  // Budget Health Thresholds
  const { status: healthStatus, percentage: spentPercent, label: healthLabel } = useMemo(() => {
    return getBudgetHealth(totalBudget, totalSpent);
  }, [totalBudget, totalSpent]);

  // Largest spending category
  const largestCategory = useMemo(() => {
    return getLargestSpendingCategory(categorySummaries, totalSpent);
  }, [categorySummaries, totalSpent]);

  // Filter and sort logic
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.expense_name.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q) ||
          e.category?.name.toLowerCase().includes(q) ||
          e.paid_by.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter((e) => e.category_id === selectedCategory);
    }

    if (selectedStatus !== 'All') {
      result = result.filter((e) => e.payment_status === selectedStatus);
    }

    if (selectedMethod !== 'All') {
      result = result.filter((e) => e.payment_method === selectedMethod);
    }

    if (selectedPaidBy !== 'All') {
      result = result.filter((e) => e.paid_by === selectedPaidBy);
    }

    if (startDate) {
      result = result.filter((e) => e.expense_date >= startDate);
    }

    if (endDate) {
      result = result.filter((e) => e.expense_date <= endDate);
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime();
      }
      if (sortBy === 'highest') {
        return Number(b.amount) - Number(a.amount);
      }
      if (sortBy === 'lowest') {
        return Number(a.amount) - Number(b.amount);
      }
      return 0;
    });

    return result;
  }, [
    expenses,
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedMethod,
    selectedPaidBy,
    startDate,
    endDate,
    sortBy,
  ]);

  const activeFiltersCount = useMemo(() => {
    return [
      selectedCategory !== 'All',
      selectedStatus !== 'All',
      selectedMethod !== 'All',
      selectedPaidBy !== 'All',
      Boolean(startDate),
      Boolean(endDate),
    ].filter(Boolean).length;
  }, [selectedCategory, selectedStatus, selectedMethod, selectedPaidBy, startDate, endDate]);

  const clearAllFilters = () => {
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedMethod('All');
    setSelectedPaidBy('All');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setSortBy('newest');
  };

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [filteredExpenses]);

  // Categories to display (top 6 or all)
  const displayedCategories = useMemo(() => {
    if (showAllCategories) return categorySummaries;
    return categorySummaries.slice(0, 6);
  }, [categorySummaries, showAllCategories]);

  const isOverBudget = totalRemaining < 0;

  return (
    <div className="w-full animate-fade-in text-[#16162A] space-y-8 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
      {/* ========================================================================= */}
      {/* 1. MONEY HERO (CARDLESS EDITORIAL WEDDING TREASURY) */}
      {/* ========================================================================= */}
      <section className="relative pt-2 sm:pt-4">
        {/* Eyebrow and Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#F1E4D6]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#E89838] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-bold text-[#C93B2B] uppercase tracking-[0.25em]">
                Ceremony Treasury & Cash Flow
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#16162A] tracking-tight">
              YOUR WEDDING MONEY
            </h1>
            <p className="text-xs sm:text-sm text-[#615163] font-serif italic mt-1">
              "Every vendor advance, ceremony deposit, and family payment accounted for in seconds."
            </p>
          </div>

          {/* Primary Quick Record CTA */}
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="px-5 py-3 rounded-2xl bg-[#641F35] hover:bg-[#52172A] active:scale-[0.99] text-[#FFF8F0] text-xs font-semibold uppercase tracking-wider shadow-wine flex items-center justify-center gap-2 transition-all self-stretch sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5] text-[#E89838]" />
            <span>Record Expense</span>
          </button>
        </div>

        {/* Cardless 4-Metric Grid with Hairline Dividers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-6 sm:py-8 border-b border-[#F1E4D6]">
          {/* 1. TOTAL BUDGET */}
          <div className="space-y-1 pr-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C7A8E]">
                TOTAL BUDGET
              </span>
              <button
                type="button"
                onClick={() => setShowEditTotalBudget(true)}
                className="text-[10px] text-[#641F35] hover:text-[#C93B2B] font-semibold flex items-center gap-0.5"
                title="Adjust Total Budget"
              >
                <Edit2 className="w-3 h-3" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#16162A] tracking-tight">
              {formatINR(totalBudget)}
            </div>
            <p className="text-[11px] text-[#8C7A8E]">Celebration target</p>
          </div>

          {/* 2. SPENT */}
          <div className="space-y-1 sm:border-l sm:border-[#F1E4D6] sm:pl-5 pr-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#641F35]">
              SPENT
            </span>
            <div className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#641F35] tracking-tight">
              {formatINR(totalSpent)}
            </div>
            <p className="text-[11px] text-[#615163]">
              {spentPercent.toFixed(1)}% disbursed
            </p>
          </div>

          {/* 3. REMAINING */}
          <div className="space-y-1 md:border-l md:border-[#F1E4D6] md:pl-5 pr-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#2D5A43]">
              REMAINING
            </span>
            <div
              className={`text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-tight ${
                isOverBudget ? 'text-[#C93B2B]' : 'text-[#2D5A43]'
              }`}
            >
              {isOverBudget ? `-${formatINR(Math.abs(totalRemaining))}` : formatINR(totalRemaining)}
            </div>
            <p className="text-[11px] text-[#615163]">
              {isOverBudget ? 'Over target ceiling' : 'Available buffer'}
            </p>
          </div>

          {/* 4. PENDING */}
          <div className="space-y-1 sm:border-l sm:border-[#F1E4D6] sm:pl-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#C93B2B]">
                PENDING
              </span>
              {pendingExpensesCount > 0 && (
                <span className="text-[10px] font-bold bg-[#FFF0F0] text-[#C93B2B] px-1.5 py-0.2 rounded-full border border-[#F2B8B8]">
                  {pendingExpensesCount} due
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#C93B2B] tracking-tight">
              {formatINR(pendingExpensesTotal)}
            </div>
            <p className="text-[11px] text-[#8C7A8E]">Awaiting settlement</p>
          </div>
        </div>

        {/* Visual Consumption Progress Bar with Threshold Markers (70%, 85%, 100%) */}
        <div className="pt-4 pb-2">
          <div className="flex items-center justify-between text-xs text-[#615163] mb-2 font-medium">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#E89838]" />
              <span>Spending Velocity</span>
            </span>
            <span className="font-serif font-bold text-[#16162A]">
              {spentPercent.toFixed(1)}% Consumed · {healthLabel}
            </span>
          </div>

          {/* Progress Track */}
          <div className="relative w-full bg-[#EADCCF] rounded-full h-3 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                healthStatus === 'over_budget'
                  ? 'bg-[#C93B2B]'
                  : healthStatus === 'critical'
                  ? 'bg-[#C93B2B]'
                  : healthStatus === 'watch'
                  ? 'bg-[#E89838]'
                  : 'bg-[#2D5A43]'
              }`}
              style={{ width: `${Math.min(spentPercent, 100)}%` }}
            />
          </div>

          {/* Scale Legend Markers */}
          <div className="relative flex justify-between text-[10px] text-[#8C7A8E] mt-1.5">
            <span>₹0 (0%)</span>
            <span className="hidden sm:inline">70% Watch</span>
            <span className="hidden sm:inline">85% Critical</span>
            <span>Budget {formatINR(totalBudget)}</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DETERMINISTIC SPENDING INSIGHTS & THRESHOLD WARNINGS */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        {/* Main Threshold Advisory Banner */}
        {healthStatus === 'over_budget' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF0F0] border border-[#F2B8B8] flex items-start gap-3.5 animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-[#C93B2B] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#C93B2B]">
                Budget Ceiling Exceeded
              </h3>
              <p className="text-xs text-[#52172A] mt-0.5 leading-relaxed">
                Total spending exceeds target by {formatINR(Math.abs(totalRemaining))} ({spentPercent.toFixed(1)}% of budget). Review upcoming vendor balances or increase celebration target.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowEditTotalBudget(true)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#F2B8B8] text-xs font-semibold text-[#C93B2B] hover:bg-[#FFE5E5] transition-colors flex-shrink-0"
            >
              Adjust Limit
            </button>
          </div>
        )}

        {healthStatus === 'critical' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF5EB] border border-[#F5D0A9] flex items-start gap-3.5 animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-[#E89838] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#964B00]">
                Critical Spending Level (85%–100%)
              </h3>
              <p className="text-xs text-[#615163] mt-0.5 leading-relaxed">
                {spentPercent.toFixed(1)}% of your wedding money is committed. Only {formatINR(totalRemaining)} remains for final settlements and unexpected ceremonial expenses.
              </p>
            </div>
          </div>
        )}

        {healthStatus === 'watch' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF0] border border-[#F3E7A9] flex items-start gap-3.5 animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-[#D6B36A] text-[#16162A] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm font-serif font-bold">
              70%
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#7A5A00]">
                Budget Watch Level (70%–85%)
              </h3>
              <p className="text-xs text-[#615163] mt-0.5 leading-relaxed">
                Spending has entered the pacing checkpoint. You retain a {formatINR(totalRemaining)} reserve. Ensure all major vendor deposits are locked before extras.
              </p>
            </div>
          </div>
        )}

        {healthStatus === 'healthy' && totalSpent > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#EAF3EC] border border-[#A9CEB5] flex items-start gap-3.5 animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-[#2D5A43] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#2D5A43]">
                Healthy Budget Buffer
              </h3>
              <p className="text-xs text-[#3D5A47] mt-0.5 leading-relaxed">
                Wedding finances are in graceful control. You retain a {(100 - spentPercent).toFixed(1)}% financial buffer ({formatINR(totalRemaining)} uncommitted).
              </p>
            </div>
          </div>
        )}

        {/* Secondary Snapshot Pills: Largest Outlay & Pending Payments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {largestCategory && (
            <div className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#F1E4D6] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF8F0] border border-[#F1E4D6] flex items-center justify-center flex-shrink-0">
                <CategoryArtwork category={largestCategory.categoryName} size="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-[#8C7A8E] uppercase tracking-wider block">
                  Largest Outlay Share
                </span>
                <span className="text-xs font-semibold text-[#16162A] block truncate">
                  {largestCategory.categoryName}:{' '}
                  <strong className="font-serif font-bold text-[#641F35]">
                    {formatINR(largestCategory.spent)}
                  </strong>{' '}
                  ({largestCategory.percentage}%)
                </span>
              </div>
            </div>
          )}

          {pendingExpensesCount > 0 ? (
            <div className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#F1E4D6] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF0F0] border border-[#F2B8B8] flex items-center justify-center flex-shrink-0 text-[#C93B2B]">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-[#C93B2B] uppercase tracking-wider block">
                  Pending Milestones
                </span>
                <span className="text-xs font-semibold text-[#16162A] block truncate">
                  {pendingExpensesCount} unconfirmed payment{pendingExpensesCount > 1 ? 's' : ''}:{' '}
                  <strong className="font-serif font-bold text-[#C93B2B]">
                    {formatINR(pendingExpensesTotal)}
                  </strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#F1E4D6] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EAF3EC] border border-[#A9CEB5] flex items-center justify-center flex-shrink-0 text-[#2D5A43]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-[#2D5A43] uppercase tracking-wider block">
                  Payment Status
                </span>
                <span className="text-xs font-semibold text-[#16162A] block">
                  All logged receipts are fully settled
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CATEGORY BUDGET ALLOCATIONS (CARDLESS CONSUMPTION PACING) */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1E4D6]">
          <div>
            <span className="text-[10px] font-bold text-[#E89838] uppercase tracking-[0.2em] block">
              Ceremony Disciplines
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#16162A]">
              Category Allocations & Limits
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="text-xs text-[#641F35] hover:text-[#C93B2B] font-semibold flex items-center gap-1 transition-colors"
          >
            <span>{showAllCategories ? 'Show Top Categories' : `View All (${categorySummaries.length})`}</span>
          </button>
        </div>

        {/* Category Allocation Rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {displayedCategories.map((catSummary) => {
            const hasAllocated = catSummary.allocated > 0;
            const pct = hasAllocated ? (catSummary.spent / catSummary.allocated) * 100 : 0;
            const isCatOver = hasAllocated && catSummary.spent > catSummary.allocated;
            const isCatCritical = hasAllocated && pct >= 85 && !isCatOver;

            return (
              <div
                key={catSummary.category.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFDF9] border border-[#F1E4D6] hover:border-[#641F35]/40 transition-all flex flex-col justify-between shadow-subtle group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#FFF8F0] border border-[#F1E4D6] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <CategoryArtwork category={catSummary.category.name} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#16162A] truncate">
                        {catSummary.category.name}
                      </h4>
                      <span className="text-[11px] text-[#8C7A8E]">
                        {catSummary.expenseCount} receipt{catSummary.expenseCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {/* Edit Target Button */}
                  <button
                    type="button"
                    onClick={() => setCategoryForBudgetEdit(catSummary)}
                    className="text-[11px] font-semibold text-[#641F35] hover:text-[#C93B2B] p-1 rounded-lg hover:bg-[#FFF8F0] transition-colors flex items-center gap-1 flex-shrink-0"
                    title={`Adjust target for ${catSummary.category.name}`}
                  >
                    <Edit2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Set Target</span>
                  </button>
                </div>

                {/* Spent vs Target metrics */}
                <div className="mt-3">
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="font-serif font-bold text-[#16162A]">
                      {formatINR(catSummary.spent)}
                    </span>
                    <span className="text-[11px] text-[#8C7A8E]">
                      {hasAllocated ? `of ${formatINR(catSummary.allocated)}` : 'No target set'}
                    </span>
                  </div>

                  {/* Mini Consumption Progress Bar */}
                  <div className="w-full bg-[#EADCCF] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCatOver
                          ? 'bg-[#C93B2B]'
                          : isCatCritical
                          ? 'bg-[#E89838]'
                          : 'bg-[#2D5A43]'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between text-[10px] mt-1 text-[#8C7A8E]">
                    <span>
                      {hasAllocated
                        ? `${pct.toFixed(0)}% used`
                        : 'Tap Set Target to allocate'}
                    </span>
                    {isCatOver && (
                      <span className="text-[#C93B2B] font-bold">
                        +{formatINR(catSummary.spent - catSummary.allocated)} over
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. REAL-TIME SEARCH & FILTER BAR WITH MOBILE DRAWER TRIGGER */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#C93B2B] uppercase tracking-[0.2em] block">
              Ledger Search
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#16162A]">
              Wedding Receipts & Payments
            </h2>
          </div>

          <span className="text-xs text-[#615163] font-medium hidden sm:inline">
            Showing {filteredExpenses.length} of {expenses.length} records
          </span>
        </div>

        {/* Search Input, Filter Button, and Sort Controls */}
        <div className="bg-[#FFFDF9] border border-[#F1E4D6] rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 shadow-subtle">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor, item, notes, or payer..."
              className="w-full pl-9 pr-7 py-2 text-xs sm:text-sm bg-transparent border-none rounded-xl focus:outline-none text-[#16162A] placeholder-[#8C7A8E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C7A8E] hover:text-[#16162A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Drawer Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${
              activeFiltersCount > 0
                ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35] shadow-wine'
                : 'bg-[#FFF8F0] text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A] hover:text-[#16162A]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#C93B2B] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort Selector */}
          <div className="relative flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="appearance-none bg-[#FFF8F0] text-[#16162A] border border-[#E8DFD5] rounded-xl px-2.5 py-2 pr-7 text-xs font-semibold focus:outline-none focus:border-[#641F35] cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest</option>
              <option value="lowest">Lowest</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-[#8C7A8E] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Active Filter Chips bar (if any filters are active) */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
            <span className="text-[11px] text-[#8C7A8E]">Active Filters:</span>
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-[#FFF8F0] border border-[#F1E4D6] px-2 py-0.5 rounded-full text-xs font-medium text-[#16162A]">
                <span>Category: {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}</span>
                <button type="button" onClick={() => setSelectedCategory('All')}>
                  <X className="w-3 h-3 text-[#8C7A8E] hover:text-[#C93B2B]" />
                </button>
              </span>
            )}
            {selectedStatus !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-[#FFF8F0] border border-[#F1E4D6] px-2 py-0.5 rounded-full text-xs font-medium text-[#16162A]">
                <span>Status: {selectedStatus}</span>
                <button type="button" onClick={() => setSelectedStatus('All')}>
                  <X className="w-3 h-3 text-[#8C7A8E] hover:text-[#C93B2B]" />
                </button>
              </span>
            )}
            {selectedPaidBy !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-[#FFF8F0] border border-[#F1E4D6] px-2 py-0.5 rounded-full text-xs font-medium text-[#16162A]">
                <span>Payer: {selectedPaidBy}</span>
                <button type="button" onClick={() => setSelectedPaidBy('All')}>
                  <X className="w-3 h-3 text-[#8C7A8E] hover:text-[#C93B2B]" />
                </button>
              </span>
            )}
            {selectedMethod !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-[#FFF8F0] border border-[#F1E4D6] px-2 py-0.5 rounded-full text-xs font-medium text-[#16162A]">
                <span>Method: {selectedMethod}</span>
                <button type="button" onClick={() => setSelectedMethod('All')}>
                  <X className="w-3 h-3 text-[#8C7A8E] hover:text-[#C93B2B]" />
                </button>
              </span>
            )}
            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 bg-[#FFF8F0] border border-[#F1E4D6] px-2 py-0.5 rounded-full text-xs font-medium text-[#16162A]">
                <span>Date range</span>
                <button type="button" onClick={() => { setStartDate(''); setEndDate(''); }}>
                  <X className="w-3 h-3 text-[#8C7A8E] hover:text-[#C93B2B]" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-[#C93B2B] hover:text-[#641F35] font-semibold underline underline-offset-2 ml-1"
            >
              Reset All
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. CHRONOLOGICAL RECEIPT FEED */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        {/* Total sum summary for current view */}
        <div className="flex items-center justify-between text-xs text-[#615163] px-1">
          <span>
            {filteredExpenses.length} receipt{filteredExpenses.length === 1 ? '' : 's'} recorded
          </span>
          {filteredExpenses.length > 0 && (
            <span>
              Total Filtered Outlay:{' '}
              <strong className="text-[#641F35] font-serif font-bold text-sm">
                {formatINR(filteredTotal)}
              </strong>
            </span>
          )}
        </div>

        {/* List of Receipt Rows or Branded Empty State */}
        {filteredExpenses.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-[#FFFDF9] border border-[#F1E4D6] text-center flex flex-col items-center justify-center space-y-4 shadow-subtle animate-fade-in">
            {/* Wedding Seal Illustration */}
            <div className="relative">
              <WeddingSeal size="md" variant="burgundy" days="✨" showRays={true} />
            </div>

            <div className="max-w-md space-y-1">
              <span className="text-[10px] font-bold text-[#C93B2B] uppercase tracking-[0.25em] block">
                YOUR FIRST RECEIPT
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#16162A]">
                {searchQuery || activeFiltersCount > 0
                  ? 'No matching expenses found'
                  : 'Start Your Ceremony Ledger'}
              </h3>
              <p className="text-xs sm:text-sm text-[#615163] leading-relaxed">
                {searchQuery || activeFiltersCount > 0
                  ? 'Try modifying your search keywords or resetting the active filter criteria.'
                  : 'No wedding expenses logged yet. Tap below to record your venue deposit, clothing advance, or photographer booking in seconds.'}
              </p>
            </div>

            <button
              type="button"
              onClick={searchQuery || activeFiltersCount > 0 ? clearAllFilters : onOpenAddExpense}
              className="px-6 py-3 rounded-xl bg-[#641F35] hover:bg-[#52172A] text-[#FFF8F0] text-xs font-semibold uppercase tracking-wider shadow-wine flex items-center gap-2 transition-all cursor-pointer"
            >
              {searchQuery || activeFiltersCount > 0 ? (
                <span>Reset Active Filters</span>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5] text-[#E89838]" />
                  <span>Record First Expense</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onClick={() => onSelectExpense(expense)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. MODALS & DRAWERS */}
      {/* ========================================================================= */}

      {/* Slide-Up Mobile Filter Drawer */}
      <ExpenseFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        categories={categories}
        paidByList={paidByList}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
        selectedPaidBy={selectedPaidBy}
        onSelectPaidBy={setSelectedPaidBy}
        startDate={startDate}
        onSelectStartDate={setStartDate}
        endDate={endDate}
        onSelectEndDate={setEndDate}
        onClearAll={clearAllFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Category Budget Adjustment Modal */}
      {categoryForBudgetEdit && (
        <CategoryBudgetModal
          isOpen={Boolean(categoryForBudgetEdit)}
          onClose={() => setCategoryForBudgetEdit(null)}
          summary={categoryForBudgetEdit}
        />
      )}

      {/* Total Wedding Budget Adjustment Modal */}
      {showEditTotalBudget && (
        <WeddingBudgetModal
          isOpen={true}
          onClose={() => setShowEditTotalBudget(false)}
        />
      )}
    </div>
  );
};
