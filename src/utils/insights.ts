import { CategorySpendingSummary } from '../types/expense';
import { formatINR } from './currency';

export interface SpendingInsight {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
}

export type BudgetHealthStatus = 'healthy' | 'watch' | 'critical' | 'over_budget';

/**
 * Returns overall budget health status based on deterministic thresholds:
 * - Healthy: < 70%
 * - Watch: 70% – 85%
 * - Critical: 85% – 100%
 * - Over budget: > 100%
 */
export function getBudgetHealth(totalBudget: number, totalSpent: number): {
  status: BudgetHealthStatus;
  percentage: number;
  label: string;
} {
  if (totalBudget <= 0) {
    return { status: 'healthy', percentage: 0, label: 'Not Set' };
  }
  const percentage = (totalSpent / totalBudget) * 100;
  if (percentage > 100) {
    return { status: 'over_budget', percentage, label: 'Over Budget' };
  }
  if (percentage >= 85) {
    return { status: 'critical', percentage, label: 'Critical (85–100%)' };
  }
  if (percentage >= 70) {
    return { status: 'watch', percentage, label: 'Watch (70–85%)' };
  }
  return { status: 'healthy', percentage, label: 'Healthy (<70%)' };
}

/**
 * Identifies the largest spending category and its proportion of total spent
 */
export function getLargestSpendingCategory(
  categorySummaries: CategorySpendingSummary[],
  totalSpent: number
): { categoryName: string; spent: number; percentage: number } | null {
  if (totalSpent <= 0 || categorySummaries.length === 0) return null;
  const sorted = [...categorySummaries].sort((a, b) => b.spent - a.spent);
  const top = sorted[0];
  if (!top || top.spent <= 0) return null;
  return {
    categoryName: top.category.name,
    spent: top.spent,
    percentage: Math.round((top.spent / totalSpent) * 100),
  };
}

/**
 * Computes deterministic rule-based insights from current financial figures
 */
export function generateSpendingInsights(params: {
  totalBudget: number;
  totalSpent: number;
  categorySummaries: CategorySpendingSummary[];
  pendingExpensesTotal: number;
  pendingExpensesCount: number;
}): SpendingInsight[] {
  const { totalBudget, totalSpent, categorySummaries, pendingExpensesTotal, pendingExpensesCount } = params;
  const insights: SpendingInsight[] = [];

  if (totalBudget <= 0) {
    insights.push({
      id: 'no-budget',
      type: 'info',
      title: 'Define Total Budget',
      message: 'Set target allocations across your ceremonies to unlock instant family spending velocity.',
    });
    return insights;
  }

  const { status, percentage } = getBudgetHealth(totalBudget, totalSpent);

  // 1. Overall threshold insights
  if (status === 'over_budget') {
    const overage = totalSpent - totalBudget;
    insights.push({
      id: 'overall-over',
      type: 'critical',
      title: 'Budget Exceeded',
      message: `Total expenditures have crossed the target ceiling by ${formatINR(overage)} (${percentage.toFixed(1)}% spent). Review unallocated costs or adjust target limits.`,
    });
  } else if (status === 'critical') {
    insights.push({
      id: 'overall-critical',
      type: 'critical',
      title: 'Critical Spending Zone',
      message: `You have consumed ${percentage.toFixed(1)}% of your wedding budget. Maintain close oversight over upcoming final settlements.`,
    });
  } else if (status === 'watch') {
    insights.push({
      id: 'overall-watch',
      type: 'warning',
      title: 'Budget Watch Level',
      message: `Budget consumption is at ${percentage.toFixed(1)}%. Track remaining ceremony milestones to prevent last-minute cost escalations.`,
    });
  } else if (totalSpent > 0 && status === 'healthy') {
    insights.push({
      id: 'overall-healthy',
      type: 'success',
      title: 'Healthy Budget Buffer',
      message: `Graceful financial control: you still retain a ${(100 - percentage).toFixed(1)}% financial buffer (${formatINR(totalBudget - totalSpent)} uncommitted).`,
    });
  }

  // 2. Largest spending category insight
  const largest = getLargestSpendingCategory(categorySummaries, totalSpent);
  if (largest && largest.percentage >= 20) {
    insights.push({
      id: 'largest-spending-category',
      type: 'info',
      title: `Largest Outlay: ${largest.categoryName}`,
      message: `${largest.categoryName} represents the single largest share of wedding expenses at ${formatINR(largest.spent)} (${largest.percentage}% of all paid funds).`,
    });
  }

  // 3. Category specific overages or near-limits
  categorySummaries.forEach((cat) => {
    if (cat.allocated > 0) {
      const catPercent = (cat.spent / cat.allocated) * 100;
      if (catPercent > 100) {
        insights.push({
          id: `cat-over-${cat.category.id}`,
          type: 'warning',
          title: `${cat.category.name} Over Target`,
          message: `${cat.category.name} exceeds allocated allowance by ${formatINR(cat.spent - cat.allocated)} (${catPercent.toFixed(0)}% consumed).`,
        });
      } else if (catPercent >= 85) {
        insights.push({
          id: `cat-near-${cat.category.id}`,
          type: 'warning',
          title: `${cat.category.name} Near Limit`,
          message: `${cat.category.name} has utilized ${catPercent.toFixed(0)}% of its target allocation.`,
        });
      }
    }
  });

  // 4. Pending payment milestones
  if (pendingExpensesCount > 0) {
    insights.push({
      id: 'pending-payments',
      type: pendingExpensesTotal > (totalBudget * 0.15) ? 'warning' : 'info',
      title: `${pendingExpensesCount} Pending Milestone${pendingExpensesCount > 1 ? 's' : ''}`,
      message: `Awaiting settlement: ${formatINR(pendingExpensesTotal)} across ${pendingExpensesCount} vendor milestone${pendingExpensesCount > 1 ? 's' : ''}.`,
    });
  }

  // 5. Fallback for empty state
  if (totalSpent === 0 && insights.length === 0) {
    insights.push({
      id: 'no-expenses-yet',
      type: 'info',
      title: 'Ready for Quick Recording',
      message: 'Tap Record Expense to log your first vendor advance, outfit deposit, or ceremony purchase in seconds.',
    });
  }

  return insights;
}
