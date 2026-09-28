import { Expense, ExpenseCategory } from '../types/database.types';
import { CategorySpendingSummary } from '../types/expense';
import { formatINR } from './currency';

export interface BudgetThresholdConfig {
  watchPercent: number; // default: 70
  criticalPercent: number; // default: 85
  overBudgetPercent: number; // default: 100
}

export const DEFAULT_BUDGET_THRESHOLDS: BudgetThresholdConfig = {
  watchPercent: 70,
  criticalPercent: 85,
  overBudgetPercent: 100,
};

export type BudgetHealthState = 'HEALTHY' | 'WATCH' | 'CRITICAL' | 'OVER BUDGET';

export interface BudgetHealthResult {
  status: BudgetHealthState;
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  reasons: string[];
}

/**
 * Deterministic category status evaluation based on configurable thresholds
 */
export function getCategoryBudgetStatus(
  spent: number,
  allocated: number,
  config: BudgetThresholdConfig = DEFAULT_BUDGET_THRESHOLDS
): {
  status: 'healthy' | 'watch' | 'critical' | 'over_budget';
  percentage: number;
  label: string;
  color: string;
} {
  if (allocated <= 0) {
    return {
      status: 'healthy',
      percentage: 0,
      label: 'Uncapped',
      color: '#8C7A8E',
    };
  }

  const percentage = (spent / allocated) * 100;

  if (percentage > config.overBudgetPercent) {
    return {
      status: 'over_budget',
      percentage,
      label: `Over Budget (${percentage.toFixed(0)}%)`,
      color: '#C93B2B',
    };
  }
  if (percentage >= config.criticalPercent) {
    return {
      status: 'critical',
      percentage,
      label: `Critical (${percentage.toFixed(0)}%)`,
      color: '#C93B2B',
    };
  }
  if (percentage >= config.watchPercent) {
    return {
      status: 'watch',
      percentage,
      label: `Watch (${percentage.toFixed(0)}%)`,
      color: '#E89838',
    };
  }

  return {
    status: 'healthy',
    percentage,
    label: `Healthy (${percentage.toFixed(0)}%)`,
    color: '#2D5A43',
  };
}

/**
 * Calculates overall budget health based on documented financial criteria
 */
export function getBudgetHealthState(params: {
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  totalPending: number;
  categorySummaries: CategorySpendingSummary[];
  config?: BudgetThresholdConfig;
}): BudgetHealthResult {
  const {
    totalBudget,
    totalAllocated,
    totalSpent,
    totalPending,
    categorySummaries,
    config = DEFAULT_BUDGET_THRESHOLDS,
  } = params;

  const reasons: string[] = [];

  if (totalBudget <= 0) {
    return {
      status: 'HEALTHY',
      label: 'Budget Not Configured',
      badgeBg: 'bg-[#FFF8F0]',
      badgeBorder: 'border-[#F1E4D6]',
      badgeText: 'text-[#8C7A8E]',
      reasons: ['Set an approved wedding budget to activate health tracking.'],
    };
  }

  const spentPercentage = (totalSpent / totalBudget) * 100;
  const committedPercentage = ((totalSpent + totalPending) / totalBudget) * 100;
  const overAllocatedAmount = totalAllocated - totalBudget;
  const overBudgetAmount = totalSpent - totalBudget;

  const overBudgetCategories = categorySummaries.filter(
    (c) => c.allocated > 0 && c.spent > c.allocated
  );
  const criticalCategories = categorySummaries.filter(
    (c) =>
      c.allocated > 0 &&
      c.spent <= c.allocated &&
      (c.spent / c.allocated) * 100 >= config.criticalPercent
  );

  // 1. OVER BUDGET
  if (totalSpent > totalBudget) {
    reasons.push(
      `Disbursements have exceeded the total wedding budget by ${formatINR(overBudgetAmount)} (${spentPercentage.toFixed(1)}% spent).`
    );
    if (overBudgetCategories.length > 0) {
      reasons.push(
        `${overBudgetCategories.length} categor${overBudgetCategories.length === 1 ? 'y' : 'ies'} exceeded target allocations (${overBudgetCategories.map((c) => c.category.name).join(', ')}).`
      );
    }
    return {
      status: 'OVER BUDGET',
      label: 'Budget Ceiling Crossed',
      badgeBg: 'bg-[#FFF0F0]',
      badgeBorder: 'border-[#F2B8B8]',
      badgeText: 'text-[#C93B2B]',
      reasons,
    };
  }

  // 2. CRITICAL
  if (spentPercentage >= config.criticalPercent || totalAllocated > totalBudget) {
    if (totalAllocated > totalBudget) {
      reasons.push(
        `Category target limits (₹${formatINR(totalAllocated)}) exceed total budget by ${formatINR(overAllocatedAmount)}. Rebalancing targets required.`
      );
    }
    if (spentPercentage >= config.criticalPercent) {
      reasons.push(
        `Direct spending is in the critical band (${spentPercentage.toFixed(1)}% consumed). Only ${formatINR(totalBudget - totalSpent)} uncommitted.`
      );
    }
    if (criticalCategories.length > 0) {
      reasons.push(
        `${criticalCategories.length} categor${criticalCategories.length === 1 ? 'y' : 'ies'} are in the 85–100% threshold.`
      );
    }
    return {
      status: 'CRITICAL',
      label: 'Critical Threshold Alert',
      badgeBg: 'bg-[#FFF0F0]',
      badgeBorder: 'border-[#F2B8B8]',
      badgeText: 'text-[#C93B2B]',
      reasons,
    };
  }

  // 3. WATCH
  if (spentPercentage >= config.watchPercent || committedPercentage >= config.criticalPercent) {
    if (spentPercentage >= config.watchPercent) {
      reasons.push(
        `Spending pace has reached ${spentPercentage.toFixed(1)}% of total budget.`
      );
    }
    if (committedPercentage >= config.criticalPercent) {
      reasons.push(
        `Total commitments (disbursed + ${formatINR(totalPending)} pending) account for ${committedPercentage.toFixed(1)}% of budget.`
      );
    }
    return {
      status: 'WATCH',
      label: 'Budget Watch Level',
      badgeBg: 'bg-[#FFF5EB]',
      badgeBorder: 'border-[#F5D0A9]',
      badgeText: 'text-[#964B00]',
      reasons,
    };
  }

  // 4. HEALTHY
  reasons.push(
    `Disbursements are in balanced control at ${spentPercentage.toFixed(1)}% of budget with ${formatINR(totalBudget - totalSpent)} uncommitted reserve.`
  );
  if (totalAllocated <= totalBudget) {
    reasons.push(
      `All category allocations fit within total ceiling (${formatINR(totalBudget - totalAllocated)} unallocated for buffer).`
    );
  }

  return {
    status: 'HEALTHY',
    label: 'Balanced Financial Health',
    badgeBg: 'bg-[#EAF3EC]',
    badgeBorder: 'border-[#A9CEB5]',
    badgeText: 'text-[#2D5A43]',
    reasons,
  };
}

export interface SpendingVelocity {
  totalSpent: number;
  daysTracked: number;
  weeksTracked: number;
  avgPerWeek: number;
  avgPerMonth: number | null;
  hasEnoughData: boolean;
  formulaExplanation: string;
}

/**
 * Transparent calculation of spending velocity from recorded transactions
 */
export function calculateSpendingVelocity(expenses: Expense[]): SpendingVelocity {
  const paidExpenses = expenses.filter((e) => e.payment_status === 'Paid');
  const totalSpent = paidExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (paidExpenses.length === 0) {
    return {
      totalSpent: 0,
      daysTracked: 0,
      weeksTracked: 0,
      avgPerWeek: 0,
      avgPerMonth: null,
      hasEnoughData: false,
      formulaExplanation: 'No paid expenses recorded yet.',
    };
  }

  // Determine span from earliest expense to now
  const dates = paidExpenses.map((e) => new Date(e.expense_date).getTime());
  const minDate = Math.min(...dates);
  const now = new Date().getTime();
  const daySpanMs = Math.max(now - minDate, 1000 * 60 * 60 * 24);
  const daysTracked = Math.max(1, Math.ceil(daySpanMs / (1000 * 60 * 60 * 24)));
  const weeksTracked = Math.max(1, daysTracked / 7);

  const avgPerWeek = Math.round(totalSpent / weeksTracked);
  const avgPerMonth =
    daysTracked >= 21 ? Math.round(totalSpent / (daysTracked / 30.44)) : null;

  // We require at least 2 distinct transactions and at least 5 days of history for reliable velocity
  const hasEnoughData = paidExpenses.length >= 2 && daysTracked >= 5;

  const formulaExplanation = hasEnoughData
    ? `${formatINR(totalSpent)} disbursed across ${daysTracked} days (${weeksTracked.toFixed(1)} weeks) = ${formatINR(avgPerWeek)} / week`
    : `Tracking initial payments (${paidExpenses.length} record${paidExpenses.length === 1 ? '' : 's'} across ${daysTracked} day${daysTracked === 1 ? '' : 's'}). Velocity stabilizes with more transactions.`;

  return {
    totalSpent,
    daysTracked,
    weeksTracked,
    avgPerWeek,
    avgPerMonth,
    hasEnoughData,
    formulaExplanation,
  };
}

export interface TimelineDataPoint {
  date: string;
  label: string;
  amount: number;
  cumulative: number;
  count: number;
}

/**
 * Groups actual spending into timeline points for range selection
 */
export function calculateSpendingTimeline(
  expenses: Expense[],
  range: '7d' | '30d' | '90d' | 'all'
): TimelineDataPoint[] {
  const paid = expenses
    .filter((e) => e.payment_status === 'Paid')
    .sort((a, b) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime());

  if (paid.length === 0) return [];

  const now = new Date();
  let daysLimit = 365;
  if (range === '7d') daysLimit = 7;
  if (range === '30d') daysLimit = 30;
  if (range === '90d') daysLimit = 90;

  const cutoffTime =
    range === 'all'
      ? 0
      : now.getTime() - daysLimit * 24 * 60 * 60 * 1000;

  const filtered = paid.filter((e) => new Date(e.expense_date).getTime() >= cutoffTime);
  if (filtered.length === 0) return [];

  // Map by date string YYYY-MM-DD
  const dateMap = new Map<string, { amount: number; count: number }>();

  filtered.forEach((e) => {
    const key = e.expense_date.split('T')[0];
    const existing = dateMap.get(key) || { amount: 0, count: 0 };
    dateMap.set(key, {
      amount: existing.amount + Number(e.amount),
      count: existing.count + 1,
    });
  });

  const sortedDates = Array.from(dateMap.keys()).sort();
  let runningCumulative = 0;

  return sortedDates.map((d) => {
    const entry = dateMap.get(d)!;
    runningCumulative += entry.amount;
    const dateObj = new Date(d);
    const label = dateObj.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });

    return {
      date: d,
      label,
      amount: entry.amount,
      cumulative: runningCumulative,
      count: entry.count,
    };
  });
}

export interface PendingPaymentsAnalysis {
  pendingExpenses: Expense[];
  totalPending: number;
  dueSoon: Expense[];
  upcoming: Expense[];
  pendingSettlement: Expense[];
  pendingByCategory: Array<{
    categoryName: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  pendingByPayer: Array<{
    payer: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
}

/**
 * Analyzes pending commitments and groups them by urgency and payer
 */
export function analyzePendingPayments(
  expenses: Expense[],
  categories: ExpenseCategory[]
): PendingPaymentsAnalysis {
  const pending = expenses.filter((e) => e.payment_status === 'Pending');
  const totalPending = pending.reduce((sum, e) => sum + Number(e.amount), 0);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nextWeekMs = now.getTime() + 7 * 24 * 60 * 60 * 1000;
  const nextWeekStr = new Date(nextWeekMs).toISOString().split('T')[0];

  const dueSoon: Expense[] = [];
  const upcoming: Expense[] = [];
  const pendingSettlement: Expense[] = [];

  pending.forEach((e) => {
    const d = e.expense_date ? e.expense_date.split('T')[0] : '';
    if (!d) {
      pendingSettlement.push(e);
    } else if (d >= todayStr && d <= nextWeekStr) {
      dueSoon.push(e);
    } else if (d > nextWeekStr) {
      upcoming.push(e);
    } else {
      // Past date or immediate settlement needed
      pendingSettlement.push(e);
    }
  });

  // Group by category
  const catMap = new Map<string, { amount: number; count: number }>();
  pending.forEach((e) => {
    const catName =
      e.category?.name ||
      categories.find((c) => c.id === e.category_id)?.name ||
      'Uncategorized';
    const curr = catMap.get(catName) || { amount: 0, count: 0 };
    catMap.set(catName, {
      amount: curr.amount + Number(e.amount),
      count: curr.count + 1,
    });
  });

  const pendingByCategory = Array.from(catMap.entries())
    .map(([categoryName, data]) => ({
      categoryName,
      amount: data.amount,
      count: data.count,
      percentage: totalPending > 0 ? Math.round((data.amount / totalPending) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Group by payer
  const payerMap = new Map<string, { amount: number; count: number }>();
  pending.forEach((e) => {
    const payer = e.paid_by || 'Family';
    const curr = payerMap.get(payer) || { amount: 0, count: 0 };
    payerMap.set(payer, {
      amount: curr.amount + Number(e.amount),
      count: curr.count + 1,
    });
  });

  const pendingByPayer = Array.from(payerMap.entries())
    .map(([payer, data]) => ({
      payer,
      amount: data.amount,
      count: data.count,
      percentage: totalPending > 0 ? Math.round((data.amount / totalPending) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    pendingExpenses: pending,
    totalPending,
    dueSoon,
    upcoming,
    pendingSettlement,
    pendingByCategory,
    pendingByPayer,
  };
}

export interface BudgetForecastResult {
  hasEnoughData: boolean;
  insufficientDataMessage?: string;
  weeksUntilWedding: number;
  daysUntilWedding: number;
  weeklyPace: number;
  projectedFutureSpend: number;
  projectedTotalSpend: number;
  projectedRemainingBuffer: number;
  isProjectedOverBudget: boolean;
  caveatNote: string;
}

/**
 * Computes a transparent, mathematical forecast using actual velocity
 */
export function calculateBudgetForecast(params: {
  weddingDate?: string;
  totalBudget: number;
  totalSpent: number;
  totalPending: number;
  velocity: SpendingVelocity;
}): BudgetForecastResult {
  const { weddingDate, totalBudget, totalSpent, totalPending, velocity } = params;

  if (!weddingDate) {
    return {
      hasEnoughData: false,
      insufficientDataMessage:
        'Set your wedding date in celebration settings to calculate time-to-event forecast projections.',
      weeksUntilWedding: 0,
      daysUntilWedding: 0,
      weeklyPace: 0,
      projectedFutureSpend: 0,
      projectedTotalSpend: 0,
      projectedRemainingBuffer: 0,
      isProjectedOverBudget: false,
      caveatNote: '',
    };
  }

  const now = new Date().getTime();
  const targetDate = new Date(weddingDate).getTime();
  const diffMs = targetDate - now;

  const daysUntilWedding = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const weeksUntilWedding = Math.max(0, Math.ceil(daysUntilWedding / 7));

  // Requirement: Do not invent values when there is insufficient historical data
  if (!velocity.hasEnoughData || velocity.totalSpent <= 0) {
    return {
      hasEnoughData: false,
      insufficientDataMessage:
        'Not enough spending history to create a projection. Record expenses across at least one week of active planning to calculate velocity trends.',
      weeksUntilWedding,
      daysUntilWedding,
      weeklyPace: 0,
      projectedFutureSpend: 0,
      projectedTotalSpend: 0,
      projectedRemainingBuffer: 0,
      isProjectedOverBudget: false,
      caveatNote: '',
    };
  }

  // Transparent calculation:
  // Projected future spend = weekly velocity * weeks until wedding + known pending commitments
  const projectedFutureSpend =
    Math.round(velocity.avgPerWeek * weeksUntilWedding) + totalPending;
  const projectedTotalSpend = totalSpent + projectedFutureSpend;
  const projectedRemainingBuffer = totalBudget - projectedTotalSpend;
  const isProjectedOverBudget = projectedRemainingBuffer < 0;

  const caveatNote = `* Mathematical projection based on an average velocity of ${formatINR(velocity.avgPerWeek)}/week across ${weeksUntilWedding} remaining weeks plus ${formatINR(totalPending)} in confirmed pending milestones. Projections are informational estimates, not guaranteed outcomes.`;

  return {
    hasEnoughData: true,
    weeksUntilWedding,
    daysUntilWedding,
    weeklyPace: velocity.avgPerWeek,
    projectedFutureSpend,
    projectedTotalSpend,
    projectedRemainingBuffer,
    isProjectedOverBudget,
    caveatNote,
  };
}

export interface BudgetIntelligenceInsight {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
}

/**
 * Generates deterministic rule-based observations traceable to actual stored data
 */
export function generateBudgetIntelligenceInsights(params: {
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  unallocatedBudget: number;
  categorySummaries: CategorySpendingSummary[];
  pendingAnalysis: PendingPaymentsAnalysis;
  velocity: SpendingVelocity;
}): BudgetIntelligenceInsight[] {
  const {
    totalBudget,
    totalAllocated,
    totalSpent,
    unallocatedBudget,
    categorySummaries,
    pendingAnalysis,
    velocity,
  } = params;

  const insights: BudgetIntelligenceInsight[] = [];

  // 1. Unallocated budget observation
  if (totalBudget > 0) {
    if (unallocatedBudget > 0) {
      insights.push({
        id: 'insight-unallocated',
        type: 'info',
        title: 'Unallocated Capital Reserve',
        message: `You have ${formatINR(unallocatedBudget)} of unallocated budget remaining to distribute across categories or retain as emergency buffer.`,
      });
    } else if (unallocatedBudget < 0) {
      insights.push({
        id: 'insight-overallocated',
        type: 'critical',
        title: 'Category Target Over-Allocation',
        message: `Total category targets (${formatINR(totalAllocated)}) exceed your overall wedding budget by ${formatINR(Math.abs(unallocatedBudget))}. Rebalancing is recommended.`,
      });
    }
  }

  // 2. Largest spending category observation
  const sortedBySpent = [...categorySummaries].sort((a, b) => b.spent - a.spent);
  const topSpent = sortedBySpent[0];
  if (topSpent && topSpent.spent > 0 && totalSpent > 0) {
    const pct = Math.round((topSpent.spent / totalSpent) * 100);
    insights.push({
      id: 'insight-largest-category',
      type: 'info',
      title: `Largest Outlay: ${topSpent.category.name}`,
      message: `${topSpent.category.name} is currently your largest spending category at ${formatINR(topSpent.spent)} (${pct}% of all paid funds).`,
    });
  }

  // 3. Category threshold warnings
  categorySummaries.forEach((c) => {
    if (c.allocated > 0) {
      const pct = (c.spent / c.allocated) * 100;
      if (pct > 100) {
        insights.push({
          id: `insight-cat-over-${c.category.id}`,
          type: 'critical',
          title: `${c.category.name} Over Allocated Cap`,
          message: `${c.category.name} spending (${formatINR(c.spent)}) has crossed its ${formatINR(c.allocated)} target by ${formatINR(c.spent - c.allocated)}.`,
        });
      } else if (pct >= 85) {
        insights.push({
          id: `insight-cat-near-${c.category.id}`,
          type: 'warning',
          title: `${c.category.name} Near Limit`,
          message: `${c.category.name} has consumed ${pct.toFixed(0)}% of its target allocation with only ${formatINR(c.remaining)} remaining.`,
        });
      }
    }
  });

  // 4. Pending payments note
  if (pendingAnalysis.totalPending > 0) {
    insights.push({
      id: 'insight-pending',
      type: pendingAnalysis.dueSoon.length > 0 ? 'warning' : 'info',
      title: `${pendingAnalysis.pendingExpenses.length} Pending Payment${pendingAnalysis.pendingExpenses.length === 1 ? '' : 's'}`,
      message: `${formatINR(pendingAnalysis.totalPending)} remains pending settlement${pendingAnalysis.dueSoon.length > 0 ? ` (${formatINR(pendingAnalysis.dueSoon.reduce((s, e) => s + Number(e.amount), 0))} due in the next 7 days)` : ''}.`,
    });
  }

  // 5. Velocity observation
  if (velocity.hasEnoughData) {
    insights.push({
      id: 'insight-velocity',
      type: 'info',
      title: 'Current Spending Pace',
      message: `Average spending velocity is currently ${formatINR(velocity.avgPerWeek)}/week based on transactions across ${velocity.daysTracked} days.`,
    });
  }

  return insights;
}
