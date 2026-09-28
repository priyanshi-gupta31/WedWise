import {
  Vendor,
  VendorPayment,
  VendorCategory,
  VendorAttentionState,
  VendorPaymentStatus,
  VendorMetricsSummary,
} from '../types/vendor';
import { ExpenseCategory } from '../types/database.types';
import { VENDOR_CATEGORIES } from '../constants/vendorConstants';

/**
 * Derives a vendor's immediate action/attention state based on dates and contract state
 */
export function calculateVendorAttentionState(vendor: Vendor): VendorAttentionState {
  if (vendor.status === 'Cancelled') {
    return 'All Clear';
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const nowMs = new Date(todayStr).getTime();

  // 1. Check Payment Due (Highest Financial Priority)
  if (vendor.remaining_amount > 0 && vendor.payment_due_date) {
    const dueMs = new Date(vendor.payment_due_date).getTime();
    const diffDays = Math.ceil((dueMs - nowMs) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return 'Payment Due';
    }
  }

  // 2. Check Follow-Up Milestone
  if (vendor.next_follow_up_date) {
    const followMs = new Date(vendor.next_follow_up_date).getTime();
    const diffDays = Math.ceil((followMs - nowMs) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) {
      return 'Follow Up';
    }
  }

  // 3. Check Contract Pending
  if (
    vendor.status === 'Shortlisted' ||
    vendor.status === 'Contacted' ||
    vendor.status === 'Negotiating'
  ) {
    return 'Contract Pending';
  }

  if (vendor.contract_due_date) {
    const contractMs = new Date(vendor.contract_due_date).getTime();
    const diffDays = Math.ceil((contractMs - nowMs) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7 && vendor.status !== 'Confirmed' && vendor.status !== 'Completed') {
      return 'Contract Pending';
    }
  }

  return 'All Clear';
}

/**
 * Derives current payment progress status for filtering
 */
export function getDerivedPaymentStatus(vendor: Vendor): VendorPaymentStatus {
  if (!vendor.agreed_amount || vendor.agreed_amount <= 0) {
    return 'No Contract Amount';
  }
  if (vendor.paid_amount >= vendor.agreed_amount) {
    return 'Fully Paid';
  }
  if (vendor.paid_amount > 0) {
    return 'Partially Paid';
  }
  return 'Unpaid';
}

/**
 * Calculates high-level summary metrics for the Vendor Book hero and home widget
 */
export function calculateVendorMetrics(
  vendors: Vendor[],
  payments: VendorPayment[]
): VendorMetricsSummary {
  const activeVendors = vendors.filter((v) => v.status !== 'Cancelled');
  
  const totalContractedValue = activeVendors.reduce(
    (sum, v) => sum + (Number(v.agreed_amount) || 0),
    0
  );

  // Total paid directly from payment transactions
  const totalPaidValue = payments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  const totalOutstandingValue = Math.max(0, totalContractedValue - totalPaidValue);

  let confirmedCount = 0;
  let followUpCount = 0;
  let contractPendingCount = 0;
  let paymentDueCount = 0;
  let paymentsDueSoonCount = 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const nowMs = new Date(todayStr).getTime();

  vendors.forEach((v) => {
    if (v.status === 'Confirmed' || v.status === 'In Progress' || v.status === 'Completed') {
      confirmedCount++;
    }

    const state = calculateVendorAttentionState(v);
    if (state === 'Follow Up') followUpCount++;
    if (state === 'Contract Pending') contractPendingCount++;
    if (state === 'Payment Due') paymentDueCount++;

    if (v.remaining_amount > 0 && v.payment_due_date) {
      const dueMs = new Date(v.payment_due_date).getTime();
      const diffDays = Math.ceil((dueMs - nowMs) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 7) {
        paymentsDueSoonCount++;
      }
    }
  });

  return {
    totalVendors: vendors.length,
    confirmedVendors: confirmedCount,
    followUpCount,
    contractPendingCount,
    paymentDueCount,
    totalContractedValue,
    totalPaidValue,
    totalOutstandingValue,
    paymentsDueSoonCount,
  };
}

/**
 * Maps a Vendor Category to an existing Expense Category ID in the active wedding
 */
export function mapVendorCategoryToExpenseCategoryId(
  vendorCat: VendorCategory,
  categories: ExpenseCategory[]
): string | null {
  if (!categories || categories.length === 0) return null;

  const config = VENDOR_CATEGORIES.find((c) => c.name === vendorCat);
  const targetName = (config ? config.defaultExpenseCategoryName : vendorCat).toLowerCase();

  // 1. Direct exact match
  const exact = categories.find((c) => c.name.toLowerCase() === targetName);
  if (exact) return exact.id;

  // 2. Partial substring match
  const partial = categories.find(
    (c) =>
      c.name.toLowerCase().includes(targetName) ||
      targetName.includes(c.name.toLowerCase())
  );
  if (partial) return partial.id;

  // 3. Fallback to Miscellaneous or first available
  const misc = categories.find((c) => c.name.toLowerCase().includes('misc'));
  return misc ? misc.id : categories[0].id;
}

/**
 * Validates vendor financial invariant
 */
export function verifyVendorInvariants(
  agreedAmount: number,
  payments: VendorPayment[]
): { totalPaid: number; remaining: number } {
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remaining = Math.max(0, (Number(agreedAmount) || 0) - totalPaid);
  return { totalPaid, remaining };
}
