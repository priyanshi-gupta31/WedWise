import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Expense, ExpenseCategory, Wedding, WeddingEvent, WeddingTask } from '../types/database.types';
import { CategorySpendingSummary, ExpenseFormData } from '../types/expense';
import { WeddingSetupFormData } from '../types/wedding';
import { EventFormData, EventSpendingSummary } from '../types/event';
import { TaskFormData, GroupedTasks } from '../types/task';
import {
  Guest,
  GuestAccommodation,
  GuestTransport,
  GuestFormData,
  AccommodationFormData,
  TransportFormData,
  GuestMetricsSummary,
  GroupSummary,
  SideSummary,
  EventGuestStats,
} from '../types/guest';
import { weddingService } from '../services/weddingService';
import { expenseService } from '../services/expenseService';
import { categoryService } from '../services/categoryService';
import { eventService } from '../services/eventService';
import { taskService } from '../services/taskService';
import { guestService } from '../services/guestService';
import { accommodationService } from '../services/accommodationService';
import { transportService } from '../services/transportService';
import { vendorService } from '../services/vendorService';
import { localStore } from '../services/localStore';
import { generateSpendingInsights, SpendingInsight } from '../utils/insights';
import { getEventCountdown, groupTasksChronologically } from '../utils/timelineUtils';
import {
  calculateGuestMetrics,
  calculateGroupSummaries,
  calculateSideSummaries,
  getEventGuestStats,
} from '../utils/guestUtils';
import {
  SpendingVelocity,
  calculateSpendingVelocity,
  PendingPaymentsAnalysis,
  analyzePendingPayments,
  BudgetForecastResult,
  calculateBudgetForecast,
  BudgetHealthResult,
  getBudgetHealthState,
  BudgetIntelligenceInsight,
  generateBudgetIntelligenceInsights,
} from '../utils/budgetIntelligence';
import {
  Vendor,
  VendorPayment,
  VendorDocument,
  VendorFormData,
  VendorPaymentFormData,
  VendorDocumentFormData,
  VendorMetricsSummary,
} from '../types/vendor';
import { calculateVendorMetrics } from '../utils/vendorUtils';
import {
  WeddingMember,
  WeddingInvitation,
  WeddingActivity,
  WeddingRole,
  InviteMemberFormData,
  PermissionCapability,
} from '../types/collaboration';
import { memberService } from '../services/memberService';
import { activityService } from '../services/activityService';
import { memoryService } from '../services/memoryService';
import { WeddingMemory, CreateMemoryFormData, MemoryMedia } from '../types/memories';
import { checkPermission } from '../utils/permissions';

interface WeddingContextType {
  wedding: Wedding | null;
  categories: ExpenseCategory[];
  expenses: Expense[];
  events: WeddingEvent[];
  tasks: WeddingTask[];
  guests: Guest[];
  accommodations: GuestAccommodation[];
  transports: GuestTransport[];
  vendors: Vendor[];
  vendorPayments: VendorPayment[];
  vendorDocuments: VendorDocument[];
  vendorMetrics: VendorMetricsSummary;
  nextEvent: WeddingEvent | null;
  daysUntilNextEvent: number | null;
  todayTasks: WeddingTask[];
  groupedTasks: GroupedTasks;
  guestMetrics: GuestMetricsSummary;
  groupSummaries: GroupSummary[];
  sideSummaries: SideSummary[];
  isLoading: boolean;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  totalAllocated: number;
  unallocatedBudget: number;
  isOverAllocated: boolean;
  overAllocatedAmount: number;
  budgetPercentageUsed: number;
  recentExpenses: Expense[];
  categorySummaries: CategorySpendingSummary[];
  insights: SpendingInsight[];
  pendingExpensesTotal: number;
  pendingExpensesCount: number;
  spendingVelocity: SpendingVelocity;
  pendingIntelligence: PendingPaymentsAnalysis;
  budgetForecast: BudgetForecastResult;
  budgetHealthResult: BudgetHealthResult;
  budgetInsights: BudgetIntelligenceInsight[];
  
  // Event & Guest helpers
  getEventSpending: (eventId: string) => EventSpendingSummary | null;
  getEventGuestStats: (eventId: string) => EventGuestStats;

  // Actions
  createWedding: (data: WeddingSetupFormData) => Promise<Wedding>;
  updateWedding: (updates: Partial<Wedding>) => Promise<void>;
  addExpense: (data: ExpenseFormData) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<ExpenseFormData>) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
  updateCategoryBudget: (categoryId: string, limit: number) => Promise<void>;
  
  // Event Actions
  addEvent: (data: EventFormData) => Promise<WeddingEvent>;
  updateEvent: (id: string, data: Partial<EventFormData>) => Promise<WeddingEvent | null>;
  deleteEvent: (id: string) => Promise<boolean>;

  // Task Actions
  addTask: (data: TaskFormData) => Promise<WeddingTask>;
  updateTask: (id: string, data: Partial<TaskFormData>) => Promise<WeddingTask | null>;
  toggleTask: (id: string) => Promise<WeddingTask | null>;
  deleteTask: (id: string) => Promise<boolean>;

  // Guest Actions
  addGuest: (data: GuestFormData) => Promise<Guest>;
  updateGuest: (id: string, data: Partial<GuestFormData>) => Promise<Guest | null>;
  deleteGuest: (id: string) => Promise<boolean>;

  // Accommodation Actions
  addAccommodation: (data: AccommodationFormData) => Promise<GuestAccommodation>;
  updateAccommodation: (id: string, data: Partial<AccommodationFormData>) => Promise<GuestAccommodation | null>;
  deleteAccommodation: (id: string) => Promise<boolean>;

  // Transport Actions
  addTransport: (data: TransportFormData) => Promise<GuestTransport>;
  updateTransport: (id: string, data: Partial<TransportFormData>) => Promise<GuestTransport | null>;
  deleteTransport: (id: string) => Promise<boolean>;

  // Vendor Actions
  addVendor: (data: VendorFormData) => Promise<Vendor>;
  updateVendor: (id: string, data: Partial<VendorFormData>) => Promise<Vendor | null>;
  deleteVendor: (id: string, preserveExpenses?: boolean) => Promise<boolean>;

  // Vendor Payment Actions (1-to-1 Idempotent with Expense)
  addVendorPayment: (vendorId: string, data: VendorPaymentFormData) => Promise<{ payment: VendorPayment; expense: Expense }>;
  updateVendorPayment: (paymentId: string, data: Partial<VendorPaymentFormData>) => Promise<{ payment: VendorPayment; expense: Expense } | null>;
  deleteVendorPayment: (paymentId: string) => Promise<boolean>;

  // Vendor Document Actions
  addVendorDocument: (vendorId: string, data: VendorDocumentFormData) => Promise<VendorDocument>;
  deleteVendorDocument: (documentId: string) => Promise<boolean>;

  // Collaboration & Permissions
  members: WeddingMember[];
  invitations: WeddingInvitation[];
  activities: WeddingActivity[];
  currentMember: WeddingMember | null;
  userRole: WeddingRole;
  can: (capability: PermissionCapability) => boolean;

  // Member Actions
  inviteMember: (data: InviteMemberFormData) => Promise<WeddingInvitation>;
  updateMemberRole: (memberId: string, newRole: WeddingRole) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  transferOwnership: (targetMemberId: string) => Promise<boolean>;
  acceptInvitation: (token: string) => Promise<boolean>;
  resendInvitation: (invitationId: string) => Promise<{ success: boolean; inviteUrl?: string; emailSent?: boolean }>;
  revokeInvitation: (invitationId: string) => Promise<boolean>;
  loadWeddingData: () => Promise<void>;
  logActivity: (activity: Omit<WeddingActivity, 'id' | 'created_at' | 'wedding_id' | 'actor_user_id' | 'actor_name' | 'actor_role'>) => Promise<WeddingActivity>;

  // Memory Actions (Phase 9 & 9.5)
  memories: WeddingMemory[];
  addMemory: (data: CreateMemoryFormData) => Promise<WeddingMemory>;
  updateMemory: (id: string, data: Partial<CreateMemoryFormData>) => Promise<WeddingMemory | null>;
  deleteMemory: (id: string) => Promise<boolean>;
  refreshMemories: () => Promise<void>;
  uploadMemoryMedia: (
    memoryId: string,
    file: File,
    options?: { sortOrder?: number; onProgress?: (status: string) => void }
  ) => Promise<MemoryMedia>;
  deleteMemoryMedia: (mediaId: string) => Promise<boolean>;

  loadSampleData: () => Promise<void>;
  clearSampleData: () => Promise<void>;
  refresh: () => Promise<void>;
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

export const WeddingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [tasks, setTasks] = useState<WeddingTask[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [accommodations, setAccommodations] = useState<GuestAccommodation[]>([]);
  const [transports, setTransports] = useState<GuestTransport[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>([]);
  const [vendorDocuments, setVendorDocuments] = useState<VendorDocument[]>([]);
  const [members, setMembers] = useState<WeddingMember[]>([]);
  const [invitations, setInvitations] = useState<WeddingInvitation[]>([]);
  const [activities, setActivities] = useState<WeddingActivity[]>([]);
  const [memories, setMemories] = useState<WeddingMemory[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadWeddingData = useCallback(async () => {
    if (!user) {
      setWedding(null);
      setCategories([]);
      setExpenses([]);
      setEvents([]);
      setTasks([]);
      setGuests([]);
      setAccommodations([]);
      setTransports([]);
      setVendors([]);
      setVendorPayments([]);
      setVendorDocuments([]);
      setMembers([]);
      setInvitations([]);
      setActivities([]);
      setMemories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const activeWedding = await weddingService.getActiveWedding(user.id);
      if (activeWedding) {
        setWedding(activeWedding);
        const [cats, exps, evts, tsks, gsts, accs, trps, vnds, vpms, vdocs, mems, invs, acts, memrs] = await Promise.all([
          categoryService.getCategories(activeWedding.id),
          expenseService.getExpenses(activeWedding.id),
          eventService.getEvents(activeWedding.id),
          taskService.getTasks(activeWedding.id),
          guestService.getGuests(activeWedding.id),
          accommodationService.getAccommodations(activeWedding.id),
          transportService.getTransports(activeWedding.id),
          vendorService.getVendors(activeWedding.id),
          vendorService.getVendorPayments(undefined, activeWedding.id),
          vendorService.getVendorDocuments(undefined, activeWedding.id),
          memberService.getMembers(activeWedding.id),
          memberService.getInvitations(activeWedding.id),
          activityService.getActivities(activeWedding.id, 50),
          memoryService.getMemories(activeWedding.id).catch((err) => {
            console.warn('Failed to load memories:', err);
            return [] as WeddingMemory[];
          }),
        ]);
        setCategories(cats);
        setExpenses(exps);
        setEvents(evts);
        setTasks(tsks);
        setGuests(gsts);
        setAccommodations(accs);
        setTransports(trps);
        setVendors(vnds);
        setVendorPayments(vpms);
        setVendorDocuments(vdocs);
        setMembers(mems);
        setInvitations(invs);
        setActivities(acts);
        setMemories(memrs);

        // Cache active wedding workspace locally for offline deterministic assistant resilience
        localStore.cacheActiveWedding(activeWedding, mems, cats, exps);
      } else {
        setWedding(null);
        setCategories([]);
        setExpenses([]);
        setEvents([]);
        setTasks([]);
        setGuests([]);
        setAccommodations([]);
        setTransports([]);
        setVendors([]);
        setVendorPayments([]);
        setVendorDocuments([]);
        setMembers([]);
        setInvitations([]);
        setActivities([]);
        setMemories([]);
      }
    } catch (err) {
      console.error('Failed to load wedding data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWeddingData();
  }, [loadWeddingData]);

  // Current Workspace Member & Role Resolution
  const currentMember = useMemo(() => {
    if (!user || !members.length) return null;
    return members.find((m) => m.user_id === user.id && m.status === 'Accepted') || null;
  }, [user, members]);

  const userRole: WeddingRole = useMemo(() => {
    if (currentMember) return currentMember.role;
    if (wedding && user && wedding.owner_id === user.id) return 'OWNER';
    return 'VIEWER';
  }, [currentMember, wedding, user]);

  const can = useCallback((capability: PermissionCapability): boolean => {
    return checkPermission(userRole, capability);
  }, [userRole]);

  // Centralized Dynamic Activity Logger
  const logActivity = useCallback(
    async (
      activity: Omit<WeddingActivity, 'id' | 'created_at' | 'wedding_id' | 'actor_user_id' | 'actor_name' | 'actor_role'>
    ): Promise<WeddingActivity> => {
      if (!wedding) throw new Error('No active wedding');
      const actorName = profile?.full_name || currentMember?.display_name || 'Family Member';
      const actorId = user?.id || 'system';
      const newAct = await activityService.logActivity({
        ...activity,
        wedding_id: wedding.id,
        actor_user_id: actorId,
        actor_name: actorName,
        actor_role: userRole,
      });
      setActivities((prev) => [newAct, ...prev]);
      return newAct;
    },
    [wedding, profile, currentMember, user, userRole]
  );

  // Dynamic Financial Calculations
  const totalBudget = useMemo(() => {
    return Number(wedding?.total_budget) || 0;
  }, [wedding]);

  const totalSpent = useMemo(() => {
    return expenses
      .filter((e) => e.payment_status === 'Paid')
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const totalRemaining = useMemo(() => {
    return totalBudget - totalSpent;
  }, [totalBudget, totalSpent]);

  const totalAllocated = useMemo(() => {
    return categories.reduce((sum, c) => sum + (Number(c.budget_limit) || 0), 0);
  }, [categories]);

  const unallocatedBudget = useMemo(() => {
    return totalBudget - totalAllocated;
  }, [totalBudget, totalAllocated]);

  const isOverAllocated = useMemo(() => {
    return totalAllocated > totalBudget;
  }, [totalAllocated, totalBudget]);

  const overAllocatedAmount = useMemo(() => {
    return Math.max(0, totalAllocated - totalBudget);
  }, [totalAllocated, totalBudget]);

  const budgetPercentageUsed = useMemo(() => {
    if (totalBudget <= 0) return 0;
    return (totalSpent / totalBudget) * 100;
  }, [totalBudget, totalSpent]);

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
      .slice(0, 5);
  }, [expenses]);

  const categorySummaries = useMemo(() => {
    return expenseService.calculateCategorySummaries(categories, expenses);
  }, [categories, expenses]);

  const pendingExpenses = useMemo(() => {
    return expenses.filter((e) => e.payment_status === 'Pending');
  }, [expenses]);

  const pendingExpensesTotal = useMemo(() => {
    return pendingExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [pendingExpenses]);

  const spendingVelocity = useMemo(() => {
    return calculateSpendingVelocity(expenses);
  }, [expenses]);

  const pendingIntelligence = useMemo(() => {
    return analyzePendingPayments(expenses, categories);
  }, [expenses, categories]);

  const budgetForecast = useMemo(() => {
    return calculateBudgetForecast({
      weddingDate: wedding?.wedding_date,
      totalBudget,
      totalSpent,
      totalPending: pendingExpensesTotal,
      velocity: spendingVelocity,
    });
  }, [wedding?.wedding_date, totalBudget, totalSpent, pendingExpensesTotal, spendingVelocity]);

  const budgetHealthResult = useMemo(() => {
    return getBudgetHealthState({
      totalBudget,
      totalAllocated,
      totalSpent,
      totalPending: pendingExpensesTotal,
      categorySummaries,
    });
  }, [totalBudget, totalAllocated, totalSpent, pendingExpensesTotal, categorySummaries]);

  const budgetInsights = useMemo(() => {
    return generateBudgetIntelligenceInsights({
      totalBudget,
      totalAllocated,
      totalSpent,
      unallocatedBudget,
      categorySummaries,
      pendingAnalysis: pendingIntelligence,
      velocity: spendingVelocity,
    });
  }, [
    totalBudget,
    totalAllocated,
    totalSpent,
    unallocatedBudget,
    categorySummaries,
    pendingIntelligence,
    spendingVelocity,
  ]);

  const insights = useMemo(() => {
    return generateSpendingInsights({
      totalBudget,
      totalSpent,
      categorySummaries,
      pendingExpensesTotal,
      pendingExpensesCount: pendingExpenses.length,
    });
  }, [totalBudget, totalSpent, categorySummaries, pendingExpensesTotal, pendingExpenses.length]);

  // Next upcoming event & countdown
  const { nextEvent, daysUntilNextEvent } = useMemo(() => {
    if (!events.length) return { nextEvent: null, daysUntilNextEvent: null };
    const todayStr = new Date().toISOString().split('T')[0];
    const sorted = [...events].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
    
    // Find closest event whose date >= today
    const upcoming = sorted.find((e) => e.date >= todayStr);
    if (upcoming) {
      const countdown = getEventCountdown(upcoming.date);
      return { nextEvent: upcoming, daysUntilNextEvent: countdown.daysRemaining };
    }
    // If all events are in the past, show the most recent completed event
    const lastEvent = sorted[sorted.length - 1];
    const countdown = getEventCountdown(lastEvent.date);
    return { nextEvent: lastEvent, daysUntilNextEvent: countdown.daysRemaining };
  }, [events]);

  // Today's pending tasks (due today, or overdue)
  const todayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.filter((t) => t.status !== 'Completed' && t.due_date && t.due_date <= todayStr);
  }, [tasks]);

  // Chronologically grouped tasks
  const groupedTasks = useMemo(() => {
    return groupTasksChronologically(tasks);
  }, [tasks]);

  // Event spending helper
  const getEventSpending = useCallback((eventId: string): EventSpendingSummary | null => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return null;
    const evExpenses = expenses.filter((e) => e.event_id === eventId);
    const spent = evExpenses
      .filter((e) => e.payment_status === 'Paid')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const pending = evExpenses
      .filter((e) => e.payment_status === 'Pending')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const allocated = Number(ev.budget_allocation) || 0;
    const remaining = allocated - spent;
    const percentageUsed = allocated > 0 ? (spent / allocated) * 100 : 0;
    return {
      event: ev,
      allocated,
      spent,
      pending,
      remaining,
      percentageUsed,
      expenseCount: evExpenses.length,
    };
  }, [events, expenses]);

  // Dynamic Guest Metrics & Breakdowns
  const guestMetrics = useMemo(() => {
    return calculateGuestMetrics(guests);
  }, [guests]);

  const groupSummaries = useMemo(() => {
    return calculateGroupSummaries(guests);
  }, [guests]);

  const sideSummaries = useMemo(() => {
    return calculateSideSummaries(guests);
  }, [guests]);

  const vendorMetrics = useMemo(() => {
    return calculateVendorMetrics(vendors, vendorPayments);
  }, [vendors, vendorPayments]);

  const getEventGuestStatsCallback = useCallback(
    (eventId: string): EventGuestStats => {
      return getEventGuestStats(guests, eventId);
    },
    [guests]
  );

  // Actions
  const createWedding = async (data: WeddingSetupFormData): Promise<Wedding> => {
    if (!user) throw new Error('User must be logged in to create a wedding');
    const result = await weddingService.createWedding(user.id, data);
    setWedding(result.wedding);
    setCategories(result.categories);
    setExpenses([]);
    setEvents([]);
    setTasks([]);
    setGuests([]);
    setAccommodations([]);
    setTransports([]);
    setVendors([]);
    setVendorPayments([]);
    setVendorDocuments([]);
    setInvitations([]);
    setActivities([]);
    // Reload freshly created wedding data to synchronize member roster and workspace
    await loadWeddingData();
    return result.wedding;
  };

  const updateWedding = async (updates: Partial<Wedding>): Promise<void> => {
    if (!wedding) return;
    const updated = await weddingService.updateWedding(wedding.id, updates);
    if (updated) {
      setWedding(updated);
    }
  };

  const addExpense = async (data: ExpenseFormData): Promise<Expense> => {
    if (!wedding || !user) throw new Error('No active wedding or user');
    if (!can('CREATE_EXPENSE')) {
      throw new Error('You do not have permission to record expenses in this workspace.');
    }
    const newExpense = await expenseService.addExpense(wedding.id, user.id, data);
    
    // Refresh list
    setExpenses((prev) => [newExpense, ...prev]);

    // Log Activity
    logActivity({
      action: 'created',
      entity_type: 'expense',
      entity_id: newExpense.id,
      entity_title: newExpense.expense_name,
      metadata: {
        amount: newExpense.amount,
        details: `Recorded ₹${newExpense.amount.toLocaleString('en-IN')} expense (${newExpense.paid_by})`,
      },
    }).catch(console.warn);

    return newExpense;
  };

  const updateExpense = async (id: string, data: Partial<ExpenseFormData>): Promise<Expense | null> => {
    if (!can('EDIT_EXPENSE')) {
      throw new Error('You do not have permission to edit expenses.');
    }
    const updated = await expenseService.updateExpense(id, data);
    if (updated) {
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      logActivity({
        action: 'updated',
        entity_type: 'expense',
        entity_id: id,
        entity_title: updated.expense_name,
        metadata: {
          amount: updated.amount,
          details: `Updated to ₹${updated.amount.toLocaleString('en-IN')}`,
        },
      }).catch(console.warn);
    }
    return updated;
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    if (!can('DELETE_EXPENSE')) {
      throw new Error('You do not have permission to delete financial records.');
    }
    const target = expenses.find((e) => e.id === id);
    const success = await expenseService.deleteExpense(id);
    if (success) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      logActivity({
        action: 'deleted',
        entity_type: 'expense',
        entity_id: id,
        entity_title: target?.expense_name || 'Expense Entry',
        metadata: { details: 'Expense record deleted' },
      }).catch(console.warn);
    }
    return success;
  };

  const updateCategoryBudget = async (categoryId: string, limit: number): Promise<void> => {
    const updated = await categoryService.updateCategoryBudget(categoryId, limit);
    if (updated) {
      setCategories((prev) => prev.map((c) => (c.id === categoryId ? updated : c)));
    }
  };

  // Event Actions
  const addEvent = async (data: EventFormData): Promise<WeddingEvent> => {
    if (!wedding) throw new Error('No active wedding');
    const newEvent = await eventService.addEvent(wedding.id, data);
    setEvents((prev) => [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date)));
    return newEvent;
  };

  const updateEvent = async (id: string, data: Partial<EventFormData>): Promise<WeddingEvent | null> => {
    const updated = await eventService.updateEvent(id, data);
    if (updated) {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? updated : e)).sort((a, b) => a.date.localeCompare(b.date))
      );
      setExpenses((prev) =>
        prev.map((exp) => (exp.event_id === id ? { ...exp, event: updated } : exp))
      );
    }
    return updated;
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    const success = await eventService.deleteEvent(id);
    if (success) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setExpenses((prev) =>
        prev.map((exp) => (exp.event_id === id ? { ...exp, event_id: null, event: undefined } : exp))
      );
      setTasks((prev) =>
        prev.map((t) => (t.event_id === id ? { ...t, event_id: null, event: undefined } : t))
      );
    }
    return success;
  };

  // Task Actions
  const addTask = async (data: TaskFormData): Promise<WeddingTask> => {
    if (!wedding) throw new Error('No active wedding');
    const newTask = await taskService.addTask(wedding.id, data);
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = async (id: string, data: Partial<TaskFormData>): Promise<WeddingTask | null> => {
    const updated = await taskService.updateTask(id, data);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  };

  const toggleTask = async (id: string): Promise<WeddingTask | null> => {
    const current = tasks.find((t) => t.id === id);
    const updated = await taskService.toggleTask(id, current?.status);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    const success = await taskService.deleteTask(id);
    if (success) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
    return success;
  };

  // Guest Actions
  const addGuest = async (data: GuestFormData): Promise<Guest> => {
    if (!wedding) throw new Error('No active wedding');
    const newGuest = await guestService.addGuest(wedding.id, data);
    setGuests((prev) => [newGuest, ...prev]);
    return newGuest;
  };

  const updateGuest = async (id: string, data: Partial<GuestFormData>): Promise<Guest | null> => {
    const updated = await guestService.updateGuest(id, data);
    if (updated) {
      setGuests((prev) => prev.map((g) => (g.id === id ? updated : g)));
      setAccommodations((prev) =>
        prev.map((a) => (a.guest_id === id ? { ...a, guest: updated } : a))
      );
      setTransports((prev) =>
        prev.map((t) => (t.guest_id === id ? { ...t, guest: updated } : t))
      );
    }
    return updated;
  };

  const deleteGuest = async (id: string): Promise<boolean> => {
    const success = await guestService.deleteGuest(id);
    if (success) {
      setGuests((prev) => prev.filter((g) => g.id !== id));
      setAccommodations((prev) => prev.filter((a) => a.guest_id !== id));
      setTransports((prev) => prev.filter((t) => t.guest_id !== id));
    }
    return success;
  };

  // Accommodation Actions
  const addAccommodation = async (data: AccommodationFormData): Promise<GuestAccommodation> => {
    if (!wedding) throw new Error('No active wedding');
    const newAcc = await accommodationService.addAccommodation(wedding.id, data);
    setAccommodations((prev) => [newAcc, ...prev]);
    return newAcc;
  };

  const updateAccommodation = async (
    id: string,
    data: Partial<AccommodationFormData>
  ): Promise<GuestAccommodation | null> => {
    const updated = await accommodationService.updateAccommodation(id, data);
    if (updated) {
      setAccommodations((prev) => prev.map((a) => (a.id === id ? updated : a)));
    }
    return updated;
  };

  const deleteAccommodation = async (id: string): Promise<boolean> => {
    const success = await accommodationService.deleteAccommodation(id);
    if (success) {
      setAccommodations((prev) => prev.filter((a) => a.id !== id));
    }
    return success;
  };

  // Transport Actions
  const addTransport = async (data: TransportFormData): Promise<GuestTransport> => {
    if (!wedding) throw new Error('No active wedding');
    const newTrp = await transportService.addTransport(wedding.id, data);
    setTransports((prev) => [newTrp, ...prev]);
    return newTrp;
  };

  const updateTransport = async (
    id: string,
    data: Partial<TransportFormData>
  ): Promise<GuestTransport | null> => {
    const updated = await transportService.updateTransport(id, data);
    if (updated) {
      setTransports((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  };

  const deleteTransport = async (id: string): Promise<boolean> => {
    const success = await transportService.deleteTransport(id);
    if (success) {
      setTransports((prev) => prev.filter((t) => t.id !== id));
    }
    return success;
  };

  // Vendor Actions
  const addVendor = async (data: VendorFormData): Promise<Vendor> => {
    if (!wedding) throw new Error('No active wedding');
    const newVendor = await vendorService.addVendor(wedding.id, data);
    setVendors((prev) => [newVendor, ...prev]);
    if (Number(data.advance_amount) > 0) {
      const updatedExpenses = await expenseService.getExpenses(wedding.id);
      setExpenses(updatedExpenses);
      const updatedPayments = await vendorService.getVendorPayments(undefined, wedding.id);
      setVendorPayments(updatedPayments);
    }
    return newVendor;
  };

  const updateVendor = async (
    id: string,
    data: Partial<VendorFormData>
  ): Promise<Vendor | null> => {
    const updated = await vendorService.updateVendor(id, data);
    if (updated) {
      setVendors((prev) => prev.map((v) => (v.id === id ? updated : v)));
    }
    return updated;
  };

  const deleteVendor = async (
    id: string,
    preserveExpenses: boolean = true
  ): Promise<boolean> => {
    const success = await vendorService.deleteVendor(id, preserveExpenses);
    if (success) {
      setVendors((prev) => prev.filter((v) => v.id !== id));
      setVendorPayments((prev) => prev.filter((p) => p.vendor_id !== id));
      setVendorDocuments((prev) => prev.filter((d) => d.vendor_id !== id));
      if (!preserveExpenses) {
        setExpenses((prev) => prev.filter((e) => e.vendor_id !== id));
      } else {
        setExpenses((prev) =>
          prev.map((e) => (e.vendor_id === id ? { ...e, vendor_id: null } : e))
        );
      }
    }
    return success;
  };

  // Vendor Payment Actions (1-to-1 Idempotent with Expense)
  const addVendorPayment = async (
    vendorId: string,
    data: VendorPaymentFormData
  ): Promise<{ payment: VendorPayment; expense: Expense }> => {
    if (!wedding) throw new Error('No active wedding');
    const { payment, expense } = await vendorService.addVendorPayment(wedding.id, vendorId, data);
    setVendorPayments((prev) => [payment, ...prev]);
    setExpenses((prev) => [expense, ...prev]);
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id === vendorId) {
          const newPaid = (Number(v.paid_amount) || 0) + Number(payment.amount);
          return {
            ...v,
            paid_amount: newPaid,
            remaining_amount: Math.max(0, (Number(v.agreed_amount) || 0) - newPaid),
          };
        }
        return v;
      })
    );
    return { payment, expense };
  };

  const updateVendorPayment = async (
    paymentId: string,
    data: Partial<VendorPaymentFormData>
  ): Promise<{ payment: VendorPayment; expense: Expense } | null> => {
    const result = await vendorService.updateVendorPayment(paymentId, data);
    if (result) {
      setVendorPayments((prev) => prev.map((p) => (p.id === paymentId ? result.payment : p)));
      setExpenses((prev) =>
        prev.map((e) => (e.vendor_payment_id === paymentId ? result.expense : e))
      );
      setVendors((prev) =>
        prev.map((v) => {
          if (v.id === result.payment.vendor_id) {
            const related = vendorPayments
              .map((p) => (p.id === paymentId ? result.payment : p))
              .filter((p) => p.vendor_id === v.id);
            const newPaid = related.reduce((s, p) => s + (Number(p.amount) || 0), 0);
            return {
              ...v,
              paid_amount: newPaid,
              remaining_amount: Math.max(0, (Number(v.agreed_amount) || 0) - newPaid),
            };
          }
          return v;
        })
      );
    }
    return result;
  };

  const deleteVendorPayment = async (paymentId: string): Promise<boolean> => {
    const removedPayment = vendorPayments.find((p) => p.id === paymentId);
    const result = await vendorService.deleteVendorPayment(paymentId);
    if (result.success) {
      setVendorPayments((prev) => prev.filter((p) => p.id !== paymentId));
      if (result.deletedExpenseId) {
        setExpenses((prev) =>
          prev.filter((e) => e.id !== result.deletedExpenseId && e.vendor_payment_id !== paymentId)
        );
      } else {
        setExpenses((prev) => prev.filter((e) => e.vendor_payment_id !== paymentId));
      }
      if (removedPayment) {
        setVendors((prev) =>
          prev.map((v) => {
            if (v.id === removedPayment.vendor_id) {
              const remainingPayments = vendorPayments.filter(
                (p) => p.id !== paymentId && p.vendor_id === v.id
              );
              const newPaid = remainingPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
              return {
                ...v,
                paid_amount: newPaid,
                remaining_amount: Math.max(0, (Number(v.agreed_amount) || 0) - newPaid),
              };
            }
            return v;
          })
        );
      }
    }
    return result.success;
  };

  // Vendor Document Actions
  const addVendorDocument = async (
    vendorId: string,
    data: VendorDocumentFormData
  ): Promise<VendorDocument> => {
    if (!wedding) throw new Error('No active wedding');
    const doc = await vendorService.addVendorDocument(wedding.id, vendorId, data);
    setVendorDocuments((prev) => [doc, ...prev]);
    return doc;
  };

  const deleteVendorDocument = async (documentId: string): Promise<boolean> => {
    const success = await vendorService.deleteVendorDocument(documentId);
    if (success) {
      setVendorDocuments((prev) => prev.filter((d) => d.id !== documentId));
    }
    return success;
  };

  // Member Actions
  const inviteMember = async (data: InviteMemberFormData): Promise<WeddingInvitation> => {
    if (!wedding) throw new Error('No active wedding');
    if (!user) throw new Error('Not authenticated');
    if (!can('INVITE_MEMBERS')) {
      throw new Error('You do not have permission to invite family members.');
    }

    const { invitation, error } = await memberService.createInvitation(
      wedding.id,
      user.id,
      profile?.full_name || 'Wedding Host',
      userRole,
      data
    );

    if (error || !invitation) {
      throw new Error(error || 'Failed to send invitation');
    }

    setInvitations((prev) => [invitation, ...prev]);
    return invitation;
  };

  const updateMemberRole = async (memberId: string, newRole: WeddingRole): Promise<boolean> => {
    if (!wedding) throw new Error('No active wedding');
    if (!can('CHANGE_MEMBER_ROLE')) {
      throw new Error('Only the Wedding Owner can change member roles.');
    }

    const result = await memberService.updateMemberRole(wedding.id, memberId, newRole, user?.id);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update member role');
    }

    if (result.member) {
      setMembers((prev) => prev.map((m) => (m.id === memberId ? result.member! : m)));
    }
    return true;
  };

  const removeMember = async (memberId: string): Promise<boolean> => {
    if (!wedding) throw new Error('No active wedding');
    if (!can('REMOVE_MEMBER')) {
      throw new Error('You do not have permission to remove members.');
    }

    const result = await memberService.removeMember(wedding.id, memberId, user?.id);
    if (!result.success) {
      throw new Error(result.error || 'Failed to remove member');
    }

    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    return true;
  };

  const transferOwnership = async (targetMemberId: string): Promise<boolean> => {
    if (!wedding) throw new Error('No active wedding');
    if (!user || userRole !== 'OWNER') {
      throw new Error('Only the current Wedding Owner can transfer ownership.');
    }

    const result = await memberService.transferOwnership(wedding.id, targetMemberId, user.id);
    if (!result.success) {
      throw new Error(result.error || 'Failed to transfer ownership');
    }

    await loadWeddingData();
    return true;
  };

  const acceptInvitation = async (token: string): Promise<boolean> => {
    if (!user) throw new Error('Must be signed in to accept an invitation');
    const result = await memberService.acceptInvitation(
      token,
      user.id,
      user.email || '',
      profile?.full_name || 'Family Member'
    );
    if (!result.success) {
      throw new Error(result.error || 'Failed to accept invitation');
    }

    await loadWeddingData();
    return true;
  };

  const resendInvitation = async (
    invitationId: string
  ): Promise<{ success: boolean; inviteUrl?: string; emailSent?: boolean }> => {
    if (!wedding) throw new Error('No active wedding');
    if (!user) throw new Error('Not authenticated');
    if (!can('INVITE_MEMBERS')) {
      throw new Error('You do not have permission to resend invitations.');
    }
    const inv = invitations.find((i) => i.id === invitationId);
    if (!inv) throw new Error('Invitation not found.');

    const result = await memberService.resendInvitation(
      wedding.id,
      inv.id,
      inv.email,
      inv.role,
      inv.display_name,
      inv.relationship_title
    );

    if (!result.success || !result.invitation) {
      throw new Error(result.error || 'Failed to resend invitation');
    }

    setInvitations((prev) => [result.invitation!, ...prev.filter((i) => i.id !== invitationId)]);
    return { success: true, inviteUrl: result.inviteUrl, emailSent: result.emailSent };
  };

  const revokeInvitation = async (invitationId: string): Promise<boolean> => {
    if (!can('INVITE_MEMBERS')) {
      throw new Error('You do not have permission to revoke invitations.');
    }

    const result = await memberService.revokeInvitation(invitationId, user?.id);
    if (!result.success) {
      throw new Error(result.error || 'Failed to revoke invitation');
    }

    setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    return true;
  };

  const loadSampleData = async () => {
    if (!user) return;
    setIsLoading(true);
    await weddingService.loadSampleWedding(user.id);
    await loadWeddingData();
  };

  const clearSampleData = async () => {
    localStore.clearAllData();
    await loadWeddingData();
  };

  // Phase 9: Memory Actions
  const refreshMemories = useCallback(async () => {
    if (!wedding) return;
    try {
      const data = await memoryService.getMemories(wedding.id, {
        userRole,
        userId: user?.id,
      });
      setMemories(data);
    } catch (err) {
      console.warn('Failed to refresh memories:', err);
    }
  }, [wedding, userRole, user]);

  const addMemory = async (data: CreateMemoryFormData): Promise<WeddingMemory> => {
    if (!wedding) throw new Error('No active wedding');
    const actorName = profile?.full_name || currentMember?.display_name || 'Family Member';
    const newMem = await memoryService.createMemory(wedding.id, data, {
      userId: user?.id || 'demo-user',
      userRole,
      actorName,
    });
    setMemories((prev) => [newMem, ...prev]);
    return newMem;
  };

  const updateMemory = async (
    id: string,
    data: Partial<CreateMemoryFormData>
  ): Promise<WeddingMemory | null> => {
    if (!wedding) throw new Error('No active wedding');
    const actorName = profile?.full_name || currentMember?.display_name || 'Family Member';
    const updated = await memoryService.updateMemory(id, wedding.id, data, {
      userId: user?.id || 'demo-user',
      userRole,
      actorName,
    });
    if (updated) {
      setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
    return updated;
  };

  const deleteMemory = async (id: string): Promise<boolean> => {
    if (!wedding) throw new Error('No active wedding');
    const actorName = profile?.full_name || currentMember?.display_name || 'Family Member';
    const success = await memoryService.deleteMemory(id, wedding.id, {
      userId: user?.id || 'demo-user',
      userRole,
      actorName,
    });
    if (success) {
      setMemories((prev) => prev.filter((m) => m.id !== id));
    }
    return success;
  };

  const uploadMemoryMedia = async (
    memoryId: string,
    file: File,
    options?: { sortOrder?: number; onProgress?: (status: string) => void }
  ): Promise<MemoryMedia> => {
    if (!wedding) throw new Error('No active wedding');
    const actorName = profile?.full_name || currentMember?.display_name || 'Family Member';
    const mediaRecord = await memoryService.uploadMemoryMedia(
      wedding.id,
      memoryId,
      file,
      {
        userId: user?.id || 'demo-user',
        userRole,
        actorName,
      },
      options
    );
    await refreshMemories();
    return mediaRecord;
  };

  const deleteMemoryMedia = async (mediaId: string): Promise<boolean> => {
    if (!wedding) throw new Error('No active wedding');
    const actorName = profile?.full_name || currentMember?.display_name || 'Family Member';
    const success = await memoryService.deleteMedia(mediaId, wedding.id, {
      userId: user?.id || 'demo-user',
      userRole,
      actorName,
    });
    if (success) {
      await refreshMemories();
    }
    return success;
  };

  return (
    <WeddingContext.Provider
      value={{
        wedding,
        categories,
        expenses,
        events,
        tasks,
        guests,
        accommodations,
        transports,
        vendors,
        vendorPayments,
        vendorDocuments,
        vendorMetrics,
        nextEvent,
        daysUntilNextEvent,
        todayTasks,
        groupedTasks,
        guestMetrics,
        groupSummaries,
        sideSummaries,
        isLoading,
        totalBudget,
        totalSpent,
        totalRemaining,
        totalAllocated,
        unallocatedBudget,
        isOverAllocated,
        overAllocatedAmount,
        budgetPercentageUsed,
        recentExpenses,
        categorySummaries,
        insights,
        pendingExpensesTotal,
        pendingExpensesCount: pendingExpenses.length,
        spendingVelocity,
        pendingIntelligence,
        budgetForecast,
        budgetHealthResult,
        budgetInsights,
        getEventSpending,
        getEventGuestStats: getEventGuestStatsCallback,
        createWedding,
        updateWedding,
        addExpense,
        updateExpense,
        deleteExpense,
        updateCategoryBudget,
        addEvent,
        updateEvent,
        deleteEvent,
        addTask,
        updateTask,
        toggleTask,
        deleteTask,
        addGuest,
        updateGuest,
        deleteGuest,
        addAccommodation,
        updateAccommodation,
        deleteAccommodation,
        addTransport,
        updateTransport,
        deleteTransport,
        addVendor,
        updateVendor,
        deleteVendor,
        addVendorPayment,
        updateVendorPayment,
        deleteVendorPayment,
        addVendorDocument,
        deleteVendorDocument,
        members,
        invitations,
        activities,
        currentMember,
        userRole,
        can,
        logActivity,
        inviteMember,
        updateMemberRole,
        removeMember,
        transferOwnership,
        acceptInvitation,
        resendInvitation,
        revokeInvitation,
        loadWeddingData,
        loadSampleData,
        clearSampleData,
        memories,
        addMemory,
        updateMemory,
        deleteMemory,
        refreshMemories,
        uploadMemoryMedia,
        deleteMemoryMedia,
        refresh: loadWeddingData,
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
};

export function useWedding() {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  return context;
}
