import React, { useState, useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
import { formatINR } from '../utils/currency';
import { CategoryBudgetModal } from '../components/budget/CategoryBudgetModal';
import { WeddingBudgetModal } from '../components/budget/WeddingBudgetModal';
import { SpendingTimelineChart } from '../components/budget/SpendingTimelineChart';
import { PendingPaymentsSection } from '../components/budget/PendingPaymentsSection';
import { BudgetForecastSection } from '../components/budget/BudgetForecastSection';
import { ExpenseDetailsModal } from '../components/expenses/ExpenseDetailsModal';
import { ExpenseFormModal } from '../components/expenses/ExpenseFormModal';
import { WeddingSeal } from '../components/common/WeddingSeal';
import { CategoryArtwork } from '../components/common/WedWiseIllustrations';
import { CategorySpendingSummary } from '../types/expense';
import { Expense } from '../types/database.types';
import {
  Sparkles,
  Edit2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  ShieldCheck,
  ChevronRight,
  Info,
  SlidersHorizontal,
  Flame,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const BudgetPage: React.FC = () => {
  const {
    wedding,
    expenses,
    categories,
    totalBudget,
    totalSpent,
    totalRemaining,
    totalAllocated,
    unallocatedBudget,
    isOverAllocated,
    overAllocatedAmount,
    categorySummaries,
    spendingVelocity,
    pendingIntelligence,
    budgetForecast,
    budgetHealthResult,
    budgetInsights,
  } = useWedding();

  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<CategorySpendingSummary | null>(null);
  const [showEditTotalBudget, setShowEditTotalBudget] = useState(false);
  const [selectedExpenseForDetails, setSelectedExpenseForDetails] = useState<Expense | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'allocated' | 'unallocated'>('all');

  // Mathematical invariant check
  // Allocated + Unallocated = Total Budget
  const invariantHolds = Math.abs(totalAllocated + unallocatedBudget - totalBudget) < 0.01;

  // Largest Outlay Category (Requirement #9)
  const largestOutlay = useMemo(() => {
    if (categorySummaries.length === 0 || totalSpent <= 0) return null;
    const sorted = [...categorySummaries].sort((a, b) => b.spent - a.spent);
    const top = sorted[0];
    if (!top || top.spent <= 0) return null;
    return {
      category: top.category,
      spent: top.spent,
      allocated: top.allocated,
      percentage: Math.round((top.spent / totalSpent) * 100),
    };
  }, [categorySummaries, totalSpent]);

  // Major spending categories for horizontal comparison bars (Requirement #8)
  const sortedCategories = useMemo(() => {
    return [...categorySummaries].sort((a, b) => b.spent - a.spent);
  }, [categorySummaries]);

  const maxCategorySpend = useMemo(() => {
    if (sortedCategories.length === 0) return 1;
    return Math.max(...sortedCategories.map((c) => c.spent), 1);
  }, [sortedCategories]);

  // Filtered categories for ledger
  const displayedLedgerCategories = useMemo(() => {
    if (categoryFilter === 'allocated') {
      return sortedCategories.filter((c) => c.allocated > 0);
    }
    if (categoryFilter === 'unallocated') {
      return sortedCategories.filter((c) => c.allocated === 0);
    }
    return sortedCategories;
  }, [sortedCategories, categoryFilter]);

  const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const allocatedPercent = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;

  return (
    <div className="w-full animate-fade-in text-[#16162A] space-y-10 pb-24 max-w-5xl mx-auto px-4 sm:px-6">
      {/* ========================================================================= */}
      {/* 1. BUDGET INTELLIGENCE HERO (CARDLESS EDITORIAL WEDDING WORLD) */}
      {/* ========================================================================= */}
      <section className="relative pt-2 sm:pt-4">
        {/* Eyebrow & Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#F1E4D6]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#E89838] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-bold text-[#641F35] uppercase tracking-[0.25em]">
                Budget Intelligence & Risk Oversight
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#16162A] tracking-tight">
              WHERE IS YOUR BUDGET GOING?
            </h1>
            <p className="text-xs sm:text-sm text-[#615163] font-serif italic mt-1">
              "Deterministic financial intelligence: allocations, spending velocity, and future capital requirements."
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowEditTotalBudget(true)}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#F1E4D6] hover:border-[#641F35] text-xs font-semibold text-[#16162A] transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#E89838]" />
            <span>Adjust Total Budget</span>
          </button>
        </div>

        {/* 5-Metric Cardless Spread: TOTAL | ALLOCATED | SPENT | REMAINING | UNALLOCATED */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 py-6 sm:py-8 border-b border-[#F1E4D6]">
          {/* Node 1: TOTAL BUDGET */}
          <div className="space-y-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C7A8E] block">
              TOTAL BUDGET
            </span>
            <div className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-[#16162A] tracking-tight">
              {formatINR(totalBudget)}
            </div>
            <p className="text-[11px] text-[#8C7A8E]">Approved ceiling</p>
          </div>

          {/* Node 2: ALLOCATED */}
          <div className="space-y-1 border-l border-[#F1E4D6] pl-4 sm:pl-5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#641F35] block">
              ALLOCATED
            </span>
            <div className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-[#641F35] tracking-tight">
              {formatINR(totalAllocated)}
            </div>
            <p className="text-[11px] text-[#615163]">
              {allocatedPercent.toFixed(0)}% across targets
            </p>
          </div>

          {/* Node 3: SPENT */}
          <div className="space-y-1 md:border-l md:border-[#F1E4D6] md:pl-5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#C93B2B] block">
              SPENT
            </span>
            <div className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-[#C93B2B] tracking-tight">
              {formatINR(totalSpent)}
            </div>
            <p className="text-[11px] text-[#615163]">
              {spentPercent.toFixed(1)}% disbursed
            </p>
          </div>

          {/* Node 4: REMAINING (Buffer) */}
          <div className="space-y-1 border-l border-[#F1E4D6] pl-4 sm:pl-5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#2D5A43] block">
              REMAINING
            </span>
            <div
              className={`text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight ${
                totalRemaining < 0 ? 'text-[#C93B2B]' : 'text-[#2D5A43]'
              }`}
            >
              {totalRemaining < 0
                ? `-${formatINR(Math.abs(totalRemaining))}`
                : formatINR(totalRemaining)}
            </div>
            <p className="text-[11px] text-[#615163]">Available reserve</p>
          </div>

          {/* Node 5: UNALLOCATED MONEY (Requirement #5) */}
          <div className="col-span-2 md:col-span-1 space-y-1 md:border-l md:border-[#F1E4D6] md:pl-5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#E89838] block">
              UNALLOCATED
            </span>
            <div
              className={`text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight ${
                isOverAllocated ? 'text-[#C93B2B]' : 'text-[#E89838]'
              }`}
            >
              {isOverAllocated
                ? `-${formatINR(overAllocatedAmount)}`
                : formatINR(unallocatedBudget)}
            </div>
            <p className="text-[11px] text-[#8C7A8E]">
              {isOverAllocated ? 'Over-allocated' : 'Free planning reserve'}
            </p>
          </div>
        </div>

        {/* Over-allocation Alert Banner (Requirement #1 & #5) */}
        {isOverAllocated && (
          <div className="mt-4 p-4 rounded-2xl bg-[#FFF0F0] border border-[#F2B8B8] flex items-start gap-3 text-xs leading-relaxed animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-[#C93B2B] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="text-[#C93B2B] font-serif text-sm block">
                Category Allocations Exceed Celebration Budget
              </strong>
              <span>
                Total category targets (<strong>{formatINR(totalAllocated)}</strong>) exceed the approved budget ceiling (<strong>{formatINR(totalBudget)}</strong>) by{' '}
                <strong className="text-[#C93B2B]">{formatINR(overAllocatedAmount)}</strong>. Category targets should be rebalanced so unallocated capital remains ≥ ₹0.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const firstOver = categorySummaries.find((c) => c.allocated > 0);
                if (firstOver) setSelectedCategoryForEdit(firstOver);
              }}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#F2B8B8] text-xs font-semibold text-[#C93B2B] hover:bg-[#FFE5E5] transition-colors flex-shrink-0"
            >
              Rebalance
            </button>
          </div>
        )}

        {/* Visual Segmented Progress Track */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-xs text-[#615163] mb-2 font-medium">
            <span>Capital Distribution Architecture</span>
            <span className="font-serif font-bold text-[#16162A]">
              {allocatedPercent.toFixed(0)}% Allocated · {spentPercent.toFixed(1)}% Disbursed
            </span>
          </div>

          {/* Segmented Bar */}
          <div className="w-full bg-[#EADCCF] rounded-full h-3.5 overflow-hidden flex p-0.5">
            {/* Disbursed Spent */}
            <div
              className="h-full bg-[#641F35] rounded-l-full transition-all duration-700"
              style={{ width: `${Math.min(spentPercent, 100)}%` }}
              title={`Disbursed: ${formatINR(totalSpent)}`}
            />
            {/* Committed / Allocated but unspent */}
            {allocatedPercent > spentPercent && (
              <div
                className="h-full bg-[#E89838] transition-all duration-700"
                style={{
                  width: `${Math.min(allocatedPercent - spentPercent, 100 - spentPercent)}%`,
                }}
                title={`Allocated Unspent: ${formatINR(totalAllocated - totalSpent)}`}
              />
            )}
          </div>

          <div className="flex justify-between text-[10px] text-[#8C7A8E] mt-1.5 font-sans">
            <span>₹0 Start</span>
            <span className="font-serif italic text-[#641F35]">
              Invariant: Allocated ({formatINR(totalAllocated)}) + Unallocated ({formatINR(unallocatedBudget)}) = {formatINR(totalBudget)}
            </span>
            <span>Target {formatINR(totalBudget)}</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. OVERALL BUDGET HEALTH SEAL (Requirement #14) */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div
          className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all ${budgetHealthResult.badgeBg} ${budgetHealthResult.badgeBorder}`}
        >
          <div className="flex items-start sm:items-center gap-4">
            <WeddingSeal
              size="sm"
              variant={
                budgetHealthResult.status === 'OVER BUDGET' || budgetHealthResult.status === 'CRITICAL'
                  ? 'sindoor'
                  : budgetHealthResult.status === 'WATCH'
                  ? 'marigold'
                  : 'burgundy'
              }
              days={
                budgetHealthResult.status === 'OVER BUDGET'
                  ? '!'
                  : budgetHealthResult.status === 'CRITICAL'
                  ? '⚠️'
                  : '✓'
              }
              showRays={false}
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C7A8E]">
                  System Assessment
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-white ${budgetHealthResult.badgeText}`}
                >
                  {budgetHealthResult.status}
                </span>
              </div>
              <h3 className={`text-lg sm:text-xl font-serif font-bold ${budgetHealthResult.badgeText}`}>
                {budgetHealthResult.label}
              </h3>
              <ul className="text-xs text-[#615163] space-y-0.5 list-disc list-inside">
                {budgetHealthResult.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-right self-stretch sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-black/10">
            <span className="text-[10px] uppercase tracking-wider text-[#8C7A8E] block">
              Reserve Runway
            </span>
            <span className="text-xl font-serif font-bold text-[#16162A] block">
              {formatINR(totalRemaining)}
            </span>
            <span className="text-[11px] text-[#615163]">
              {(100 - spentPercent).toFixed(1)}% uncommitted
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LARGEST OUTLAY & VELOCITY SUMMARY (Requirement #9 & #6) */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Largest Outlay Callout */}
        {largestOutlay ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border border-[#F1E4D6] shadow-subtle flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF8F0] border border-[#F1E4D6] flex items-center justify-center flex-shrink-0 shadow-xs">
              <CategoryArtwork category={largestOutlay.category.name} size="md" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-[#C93B2B] uppercase tracking-[0.2em] block">
                LARGEST OUTLAY
              </span>
              <h4 className="text-base sm:text-lg font-serif font-bold text-[#16162A] truncate">
                {largestOutlay.category.name}
              </h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-serif font-bold text-[#641F35]">
                  {formatINR(largestOutlay.spent)}
                </span>
                <span className="text-xs font-semibold text-[#8C7A8E]">
                  ({largestOutlay.percentage}% of all expenses)
                </span>
              </div>
              <p className="text-[11px] text-[#615163] mt-1 font-sans">
                {largestOutlay.allocated > 0
                  ? `Allocated cap: ${formatINR(largestOutlay.allocated)} (${Math.round((largestOutlay.spent / largestOutlay.allocated) * 100)}% consumed)`
                  : 'No category budget limit defined yet.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border border-[#F1E4D6] shadow-subtle flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF8F0] border border-[#F1E4D6] flex items-center justify-center text-[#8C7A8E]">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#8C7A8E] uppercase tracking-wider block">
                Largest Outlay
              </span>
              <p className="text-xs text-[#615163] mt-0.5">
                Record your first vendor advances to identify dominant category outlays.
              </p>
            </div>
          </div>
        )}

        {/* Spending Velocity Summary Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border border-[#F1E4D6] shadow-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#E89838] uppercase tracking-[0.2em] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#E89838]" />
              <span>SPENDING VELOCITY</span>
            </span>
            <span className="text-[11px] text-[#8C7A8E]">
              {spendingVelocity.daysTracked} days tracked
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#16162A]">
              {formatINR(spendingVelocity.avgPerWeek)}
            </span>
            <span className="text-xs font-sans text-[#8C7A8E]">/ average week</span>
          </div>

          {spendingVelocity.avgPerMonth && (
            <p className="text-xs text-[#615163]">
              Monthly cadence: <strong className="text-[#16162A] font-semibold">{formatINR(spendingVelocity.avgPerMonth)}</strong> / month
            </p>
          )}

          <p className="text-[11px] text-[#8C7A8E] font-sans pt-1 border-t border-[#F1E4D6]/70 leading-relaxed">
            {spendingVelocity.formulaExplanation}
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CATEGORY COMPARISON (HORIZONTAL ARCHITECTURAL BARS - Requirement #8) */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1E4D6]">
          <div>
            <span className="text-[10px] font-bold text-[#641F35] uppercase tracking-[0.2em] block">
              Discipline Comparison
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#16162A]">
              Major Spending Categories
            </h3>
          </div>
          <span className="text-xs text-[#8C7A8E]">
            Ranked by actual disbursed funds
          </span>
        </div>

        {/* Horizontal Visual Bars */}
        <div className="space-y-3">
          {sortedCategories.slice(0, 6).map((item) => {
            const barWidth = Math.max(6, Math.round((item.spent / maxCategorySpend) * 100));
            const pctOfTotal = totalSpent > 0 ? Math.round((item.spent / totalSpent) * 100) : 0;

            return (
              <div
                key={item.category.id}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FFFDF9] border border-[#F1E4D6] hover:border-[#641F35]/40 transition-all space-y-2 group shadow-xs"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#FFF8F0] border border-[#F1E4D6] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <CategoryArtwork category={item.category.name} size="sm" />
                    </div>
                    <span className="font-semibold text-[#16162A] truncate">
                      {item.category.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-serif font-bold text-[#16162A] text-sm sm:text-base">
                      {formatINR(item.spent)}
                    </span>
                    <span className="text-[11px] text-[#8C7A8E] w-12 text-right">
                      {pctOfTotal}% of total
                    </span>
                  </div>
                </div>

                {/* Horizontal Architectural Bar */}
                <div className="w-full bg-[#EADCCF] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#641F35] to-[#E89838] transition-all duration-700"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SPENDING TIMELINE CHART (Requirement #7) */}
      {/* ========================================================================= */}
      <section>
        <SpendingTimelineChart expenses={expenses} />
      </section>

      {/* ========================================================================= */}
      {/* 6. PENDING PAYMENT INTELLIGENCE (Requirement #10 & #11) */}
      {/* ========================================================================= */}
      <section>
        <PendingPaymentsSection
          pendingAnalysis={pendingIntelligence}
          onSelectExpense={(exp) => setSelectedExpenseForDetails(exp)}
        />
      </section>

      {/* ========================================================================= */}
      {/* 7. TRANSPARENT BUDGET FORECAST (Requirement #12) */}
      {/* ========================================================================= */}
      <section>
        <BudgetForecastSection
          forecast={budgetForecast}
          velocity={spendingVelocity}
          totalBudget={totalBudget}
          totalSpent={totalSpent}
        />
      </section>

      {/* ========================================================================= */}
      {/* 8. DETERMINISTIC BUDGET INSIGHTS (Requirement #13) */}
      {/* ========================================================================= */}
      {budgetInsights.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F1E4D6]">
            <Sparkles className="w-4 h-4 text-[#E89838]" />
            <h3 className="text-lg font-serif font-bold text-[#16162A]">
              Deterministic Financial Observations
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {budgetInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-3.5 rounded-xl sm:rounded-2xl bg-[#FFFDF9] border border-[#F1E4D6] space-y-1 shadow-xs"
              >
                <span className="text-[10px] font-bold text-[#641F35] uppercase tracking-wider block">
                  {insight.title}
                </span>
                <p className="text-xs text-[#615163] leading-relaxed font-sans">
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 9. CATEGORY ALLOCATION LEDGER & TARGET EDITOR (Requirement #2, #3, #4) */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-4 border-t border-[#F1E4D6]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F1E4D6]">
          <div>
            <span className="text-[10px] font-bold text-[#641F35] uppercase tracking-[0.2em] block">
              Allocation Master Table
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#16162A]">
              Category Targets & Thresholds
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#FFF8F0] p-1 rounded-xl border border-[#F1E4D6] self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                categoryFilter === 'all'
                  ? 'bg-[#641F35] text-[#FFF8F0]'
                  : 'text-[#615163] hover:text-[#16162A]'
              }`}
            >
              All ({categories.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('allocated')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                categoryFilter === 'allocated'
                  ? 'bg-[#641F35] text-[#FFF8F0]'
                  : 'text-[#615163] hover:text-[#16162A]'
              }`}
            >
              Target Set
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('unallocated')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                categoryFilter === 'unallocated'
                  ? 'bg-[#641F35] text-[#FFF8F0]'
                  : 'text-[#615163] hover:text-[#16162A]'
              }`}
            >
              Uncapped
            </button>
          </div>
        </div>

        {/* Cardless Category Rows */}
        <div className="space-y-2.5">
          {displayedLedgerCategories.map((item) => {
            const hasAllocated = item.allocated > 0;
            const remaining = hasAllocated ? item.allocated - item.spent : 0;
            const isOver = hasAllocated && item.spent > item.allocated;
            const pct = hasAllocated ? (item.spent / item.allocated) * 100 : 0;

            let statusBadge = (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF3EC] text-[#2D5A43] border border-[#A9CEB5]">
                Healthy
              </span>
            );
            if (isOver) {
              statusBadge = (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF0F0] text-[#C93B2B] border border-[#F2B8B8]">
                  Over Budget
                </span>
              );
            } else if (pct >= 85) {
              statusBadge = (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF0F0] text-[#C93B2B] border border-[#F2B8B8]">
                  Critical
                </span>
              );
            } else if (pct >= 70) {
              statusBadge = (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF5EB] text-[#964B00] border border-[#F5D0A9]">
                  Watch
                </span>
              );
            }

            return (
              <div
                key={item.category.id}
                className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FFFDF9] border border-[#F1E4D6] hover:border-[#641F35]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs group"
              >
                {/* Category Icon & Identity */}
                <div className="flex items-center gap-3 min-w-0 sm:w-1/3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF8F0] border border-[#F1E4D6] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <CategoryArtwork category={item.category.name} size="sm" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[#16162A] truncate">
                        {item.category.name}
                      </h4>
                      {hasAllocated && statusBadge}
                    </div>
                    <span className="text-[11px] text-[#8C7A8E]">
                      {item.expenseCount} receipt{item.expenseCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                {/* Financial Figures: Allocated | Spent | Remaining | % */}
                <div className="grid grid-cols-3 sm:flex sm:items-center sm:justify-end gap-3 sm:gap-6 text-xs sm:text-sm flex-1">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#8C7A8E] block sm:hidden">
                      Target
                    </span>
                    <span className="font-serif font-medium text-[#16162A] block sm:text-right">
                      {hasAllocated ? formatINR(item.allocated) : '—'}
                    </span>
                    <span className="text-[10px] text-[#8C7A8E] hidden sm:block sm:text-right">Target</span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#8C7A8E] block sm:hidden">
                      Spent
                    </span>
                    <span className="font-serif font-bold text-[#641F35] block sm:text-right">
                      {formatINR(item.spent)}
                    </span>
                    <span className="text-[10px] text-[#8C7A8E] hidden sm:block sm:text-right">
                      {hasAllocated ? `${pct.toFixed(0)}% used` : 'Disbursed'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#8C7A8E] block sm:hidden">
                      Remaining
                    </span>
                    <span
                      className={`font-serif font-bold block sm:text-right ${
                        isOver
                          ? 'text-[#C93B2B]'
                          : hasAllocated
                          ? 'text-[#2D5A43]'
                          : 'text-[#8C7A8E]'
                      }`}
                    >
                      {hasAllocated
                        ? isOver
                          ? `-${formatINR(Math.abs(remaining))}`
                          : formatINR(remaining)
                        : '—'}
                    </span>
                    <span className="text-[10px] text-[#8C7A8E] hidden sm:block sm:text-right">
                      {isOver ? 'Over Limit' : 'Available'}
                    </span>
                  </div>
                </div>

                {/* One-tap Set Target Action Button */}
                <div className="flex justify-end sm:flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1E4D6]">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryForEdit(item)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#F1E4D6] hover:border-[#641F35] text-xs font-semibold text-[#641F35] flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <Edit2 className="w-3 h-3 text-[#E89838]" />
                    <span>{hasAllocated ? 'Edit Target' : 'Set Target'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. MODALS */}
      {/* ========================================================================= */}

      {/* Category Budget Allocation Editor Modal */}
      {selectedCategoryForEdit && (
        <CategoryBudgetModal
          isOpen={Boolean(selectedCategoryForEdit)}
          onClose={() => setSelectedCategoryForEdit(null)}
          summary={selectedCategoryForEdit}
        />
      )}

      {/* Total Wedding Budget Adjustment Modal */}
      {showEditTotalBudget && (
        <WeddingBudgetModal
          isOpen={true}
          onClose={() => setShowEditTotalBudget(false)}
        />
      )}

      {/* Expense Details Modal */}
      <ExpenseDetailsModal
        isOpen={Boolean(selectedExpenseForDetails)}
        onClose={() => setSelectedExpenseForDetails(null)}
        expense={selectedExpenseForDetails}
        onEdit={(expense) => {
          setSelectedExpenseForDetails(null);
          setExpenseToEdit(expense);
          setIsAddExpenseOpen(true);
        }}
      />

      {/* Expense Form Modal (for editing an expense from Details) */}
      <ExpenseFormModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
};
