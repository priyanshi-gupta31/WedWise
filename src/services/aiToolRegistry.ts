import { AI_READ_ONLY_TOOLS } from '../constants/aiTools';
import {
  AIToolExecutionContext,
  AIToolResult,
  WeddingPulseToolResult,
  BudgetSummaryToolResult,
  ExpenseSummaryToolResult,
  VendorSettlementsToolResult,
  GuestRsvpMetricsToolResult,
  EventTimelineToolResult,
  TaskSummaryToolResult,
  AccommodationSummaryToolResult,
  TransportSummaryToolResult,
  ActivitySummaryToolResult,
  WeddingMemoriesToolResult,
  MinimalVendorItem,
  MinimalEventItem,
  MinimalTaskItem,
} from '../types/ai';
import { WeddingRole } from '../types/collaboration';
import { checkPermission } from '../utils/permissions';
import { localStore } from './localStore';
import { expenseService } from './expenseService';
import { calculateGuestMetrics } from '../utils/guestUtils';
import { getEventCountdown } from '../utils/timelineUtils';
import { calculateVendorAttentionState } from '../utils/vendorUtils';

const STANDARD_GROUNDING = 'Based on your WedWise data · Updated just now';

/**
 * Server-Side / Service-Side Permission Pipeline:
 * Authenticated User -> Active Wedding Membership -> User Role -> Required Capability -> Scoped DB Query
 */
async function verifyToolAccess(
  toolName: string,
  context: AIToolExecutionContext
): Promise<{ allowed: boolean; role?: WeddingRole; error?: string }> {
  // 1. Tool validity check
  const toolDef = AI_READ_ONLY_TOOLS[toolName];
  if (!toolDef) {
    return { allowed: false, error: `Tool "${toolName}" is not recognized or not available.` };
  }

  // 2. Authenticated user check
  if (!context.userId || !context.userId.trim()) {
    return { allowed: false, error: 'Unauthorized: User authentication is required.' };
  }

  // 3. Wedding ID check
  if (!context.weddingId || !context.weddingId.trim()) {
    return { allowed: false, error: 'Bad Request: Missing target wedding context ID.' };
  }

  // 4. Active wedding membership & role resolution
  let resolvedRole: WeddingRole | null = null;

  // Check if member in workspace roster
  const member = localStore.getMember(context.weddingId, context.userId);
  if (member && member.status === 'Accepted') {
    resolvedRole = member.role;
  } else {
    // Check if the user is the wedding creator / owner
    const weddings = localStore.getWeddings();
    const targetWedding = weddings.find((w) => w.id === context.weddingId);
    if (targetWedding && targetWedding.owner_id === context.userId) {
      resolvedRole = 'OWNER';
    }
  }

  if (!resolvedRole) {
    return {
      allowed: false,
      error: 'Forbidden: You are not an active member of this wedding workspace.',
    };
  }

  // 5. Capability-based permission verification
  const hasPermission = checkPermission(resolvedRole, toolDef.requiredCapability);
  if (!hasPermission) {
    return {
      allowed: false,
      role: resolvedRole,
      error: `Access Denied: Your role (${resolvedRole}) does not have permission to view this wedding information.`,
    };
  }

  return { allowed: true, role: resolvedRole };
}

/**
 * AIToolRegistry — Centralized execution engine for all 10 read-only AI tools.
 * Enforces server-side permissions, deterministic calculations, and minimum data exposure.
 */
export const aiToolRegistry = {
  /**
   * Dispatches and securely executes an AI tool request.
   */
  async executeTool(
    toolName: string,
    args: Record<string, any> = {},
    context: AIToolExecutionContext
  ): Promise<AIToolResult> {
    const timestamp = new Date().toISOString();

    // 1. Execute strict multi-tier security pipeline
    const authCheck = await verifyToolAccess(toolName, context);
    if (!authCheck.allowed) {
      return {
        success: false,
        tool_name: toolName,
        error: authCheck.error,
        grounding: STANDARD_GROUNDING,
        timestamp,
      };
    }

    try {
      let data: any;

      switch (toolName) {
        case 'get_wedding_pulse':
          data = await this.getWeddingPulse(context);
          break;
        case 'get_budget_summary':
          data = await this.getBudgetSummary(context);
          break;
        case 'get_expense_summary':
          data = await this.getExpenseSummary(context, args);
          break;
        case 'get_vendor_settlements':
          data = await this.getVendorSettlements(context, args);
          break;
        case 'get_guest_rsvp_metrics':
          data = await this.getGuestRsvpMetrics(context, args);
          break;
        case 'get_event_timeline':
          data = await this.getEventTimeline(context, args);
          break;
        case 'get_task_summary':
          data = await this.getTaskSummary(context, args);
          break;
        case 'get_accommodation_summary':
          data = await this.getAccommodationSummary(context);
          break;
        case 'get_transport_summary':
          data = await this.getTransportSummary(context, args);
          break;
        case 'get_activity_summary':
          data = await this.getActivitySummary(context, args);
          break;
        case 'get_wedding_memories':
          data = await this.getWeddingMemories(context, args);
          break;
        default:
          return {
            success: false,
            tool_name: toolName,
            error: `Tool handler for "${toolName}" is not implemented.`,
            grounding: STANDARD_GROUNDING,
            timestamp,
          };
      }

      return {
        success: true,
        tool_name: toolName,
        data,
        grounding: STANDARD_GROUNDING,
        timestamp,
      };
    } catch (err: any) {
      return {
        success: false,
        tool_name: toolName,
        error: err.message || 'An unexpected error occurred while processing the request.',
        grounding: STANDARD_GROUNDING,
        timestamp,
      };
    }
  },

  // -------------------------------------------------------------
  // TOOL 1: get_wedding_pulse
  // -------------------------------------------------------------
  async getWeddingPulse(context: AIToolExecutionContext): Promise<WeddingPulseToolResult> {
    const wedding = localStore.getWeddings().find((w) => w.id === context.weddingId);
    if (!wedding) throw new Error('Wedding workspace not found.');

    const expenses = localStore.getExpenses(context.weddingId);
    const totalBudget = Number(wedding.total_budget) || 0;
    const totalSpent = expenses
      .filter((e) => e.payment_status === 'Paid')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const remainingBudget = totalBudget - totalSpent;
    const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const countdown = getEventCountdown(wedding.wedding_date);

    // Compute health status deterministically
    let healthStatus: WeddingPulseToolResult['health_status'] = 'On Track';
    if (totalSpent > totalBudget) {
      healthStatus = 'Over Budget';
    } else if (percentageUsed > 85) {
      healthStatus = 'Attention Needed';
    } else if (percentageUsed >= 50) {
      healthStatus = 'Balanced';
    }

    return {
      wedding_name: wedding.wedding_name,
      wedding_date: wedding.wedding_date,
      days_remaining: countdown.daysRemaining,
      total_budget: totalBudget,
      total_spent: totalSpent,
      remaining_budget: remainingBudget,
      percentage_used: Math.round(percentageUsed * 10) / 10,
      health_status: healthStatus,
    };
  },

  // -------------------------------------------------------------
  // TOOL 2: get_budget_summary
  // -------------------------------------------------------------
  async getBudgetSummary(context: AIToolExecutionContext): Promise<BudgetSummaryToolResult> {
    const wedding = localStore.getWeddings().find((w) => w.id === context.weddingId);
    if (!wedding) throw new Error('Wedding workspace not found.');

    const categories = localStore.getCategories(context.weddingId);
    const expenses = localStore.getExpenses(context.weddingId);
    const summaries = expenseService.calculateCategorySummaries(categories, expenses);

    const totalBudget = Number(wedding.total_budget) || 0;
    const totalAllocated = categories.reduce((sum, c) => sum + (Number(c.budget_limit) || 0), 0);
    const unallocated = totalBudget - totalAllocated;

    return {
      total_budget: totalBudget,
      total_allocated: totalAllocated,
      unallocated_budget: unallocated,
      is_over_allocated: totalAllocated > totalBudget,
      over_allocated_amount: Math.max(0, totalAllocated - totalBudget),
      categories: summaries.map((s) => ({
        id: s.category.id,
        name: s.category.name,
        allocated_limit: s.allocated,
        spent: s.spent,
        remaining: s.remaining,
        percentage_used: Math.round(s.percentageUsed * 10) / 10,
        is_over_budget: Boolean(s.allocated > 0 && s.spent > s.allocated),
      })),
    };
  },

  // -------------------------------------------------------------
  // TOOL 3: get_expense_summary
  // -------------------------------------------------------------
  async getExpenseSummary(
    context: AIToolExecutionContext,
    args: { categoryId?: string; eventId?: string; paymentStatus?: string; limit?: string }
  ): Promise<ExpenseSummaryToolResult> {
    const all = localStore.getExpenses(context.weddingId);

    let filtered = all;
    if (args.categoryId) {
      filtered = filtered.filter((e) => e.category_id === args.categoryId);
    }
    if (args.eventId) {
      filtered = filtered.filter((e) => e.event_id === args.eventId);
    }
    if (args.paymentStatus) {
      filtered = filtered.filter((e) => e.payment_status === args.paymentStatus);
    }

    const totalSpent = filtered
      .filter((e) => e.payment_status === 'Paid')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalPending = filtered
      .filter((e) => e.payment_status === 'Pending')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const limit = args.limit ? parseInt(args.limit, 10) : 10;
    const sliced = filtered.slice(0, isNaN(limit) ? 10 : limit);

    // Minimum Necessary Data Sanitization (strips private notes, accounts)
    return {
      total_expenses_count: filtered.length,
      total_spent_amount: totalSpent,
      total_pending_amount: totalPending,
      expenses: sliced.map((e) => ({
        id: e.id,
        expense_name: e.expense_name,
        category_name: e.category?.name || 'General',
        amount: Number(e.amount) || 0,
        expense_date: e.expense_date,
        paid_by: e.paid_by,
        payment_status: e.payment_status,
        ceremony_name: e.event?.event_name,
      })),
    };
  },

  // -------------------------------------------------------------
  // TOOL 4: get_vendor_settlements
  // -------------------------------------------------------------
  async getVendorSettlements(
    context: AIToolExecutionContext,
    args: { filter?: string }
  ): Promise<VendorSettlementsToolResult> {
    const vendors = localStore.getVendors(context.weddingId);

    const totalContracted = vendors.reduce((s, v) => s + (Number(v.agreed_amount) || 0), 0);
    const totalPaid = vendors.reduce((s, v) => s + (Number(v.paid_amount) || 0), 0);
    const totalOutstanding = Math.max(0, totalContracted - totalPaid);

    let filtered = vendors;
    if (args.filter === 'pending' || args.filter === 'due_soon') {
      filtered = filtered.filter((v) => (Number(v.remaining_amount) || 0) > 0);
    }

    // Minimum Necessary Data Sanitization (strips phone, email, private notes)
    return {
      total_contracted: totalContracted,
      total_paid: totalPaid,
      total_outstanding: totalOutstanding,
      pending_payments_count: vendors.filter((v) => (Number(v.remaining_amount) || 0) > 0).length,
      vendors: filtered.map((v) => {
        const attentionState = calculateVendorAttentionState(v);

        return {
          id: v.id,
          vendor_name: v.vendor_name,
          category: v.category,
          agreed_amount: Number(v.agreed_amount) || 0,
          paid_amount: Number(v.paid_amount) || 0,
          remaining_amount: Number(v.remaining_amount) || 0,
          status: v.status,
          next_payment_due_date: v.payment_due_date || undefined,
          attention_flag: attentionState,
        };
      }),
    };
  },

  // -------------------------------------------------------------
  // TOOL 5: get_guest_rsvp_metrics
  // -------------------------------------------------------------
  async getGuestRsvpMetrics(
    context: AIToolExecutionContext,
    args: { side?: string; group?: string }
  ): Promise<GuestRsvpMetricsToolResult> {
    const all = localStore.getGuests(context.weddingId);

    let filtered = all;
    if (args.side) {
      filtered = filtered.filter((g) => g.wedding_side === args.side);
    }
    if (args.group) {
      filtered = filtered.filter((g) => g.family_group === args.group);
    }

    const metrics = calculateGuestMetrics(filtered);

    // Aggregate food preferences
    const vegCount = filtered
      .filter((g) => g.food_preference === 'Vegetarian')
      .reduce((sum, g) => sum + 1 + (Number(g.accompanying_members) || 0), 0);
    const nonVegCount = filtered
      .filter((g) => g.food_preference === 'Non-Vegetarian')
      .reduce((sum, g) => sum + 1 + (Number(g.accompanying_members) || 0), 0);
    const jainCount = filtered
      .filter((g) => g.food_preference === 'Jain')
      .reduce((sum, g) => sum + 1 + (Number(g.accompanying_members) || 0), 0);
    const otherFoodCount = filtered
      .filter((g) => !['Vegetarian', 'Non-Vegetarian', 'Jain'].includes(g.food_preference || ''))
      .reduce((sum, g) => sum + 1 + (Number(g.accompanying_members) || 0), 0);

    // Aggregate wedding sides
    const brideSide = filtered.filter((g) => g.wedding_side === 'Bride').length;
    const groomSide = filtered.filter((g) => g.wedding_side === 'Groom').length;
    const bothSide = filtered.filter((g) => g.wedding_side === 'Both').length;
    const otherSide = filtered.filter((g) => g.wedding_side === 'Other').length;

    // Minimum Necessary Data Sanitization (EXPLICITLY ZERO phone numbers, emails, or personal names)
    return {
      total_invited: metrics.totalInvitedHeadcount,
      confirmed_count: metrics.confirmedHeadcount,
      declined_count: metrics.declinedHeadcount,
      pending_count: metrics.awaitingHeadcount,
      total_attending_headcount: metrics.confirmedHeadcount,
      food_preferences: {
        vegetarian: vegCount,
        non_vegetarian: nonVegCount,
        jain: jainCount,
        other: otherFoodCount,
      },
      by_side: {
        bride: brideSide,
        groom: groomSide,
        both: bothSide,
        other: otherSide,
      },
    };
  },

  // -------------------------------------------------------------
  // TOOL 6: get_event_timeline
  // -------------------------------------------------------------
  async getEventTimeline(
    context: AIToolExecutionContext,
    args: { upcomingOnly?: string }
  ): Promise<EventTimelineToolResult> {
    const events = localStore.getEvents(context.weddingId);
    const todayStr = new Date().toISOString().split('T')[0];

    let filtered = events;
    if (args.upcomingOnly === 'true') {
      filtered = filtered.filter((e) => e.date >= todayStr);
    }

    const upcoming = events.find((e) => e.date >= todayStr);

    return {
      total_events: filtered.length,
      next_event_name: upcoming ? upcoming.event_name : null,
      events: filtered.map((e) => {
        let status: MinimalEventItem['status'] = 'Upcoming';
        if (e.date < todayStr) status = 'Completed';
        else if (e.date === todayStr) status = 'Today';

        return {
          id: e.id,
          event_name: e.event_name,
          event_type: e.event_type,
          date: e.date,
          start_time: e.start_time || undefined,
          end_time: e.end_time || undefined,
          venue: e.venue || undefined,
          description: e.description || undefined,
          expected_guests: e.expected_guests ? Number(e.expected_guests) : undefined,
          status,
        };
      }),
    };
  },

  // -------------------------------------------------------------
  // TOOL 7: get_task_summary
  // -------------------------------------------------------------
  async getTaskSummary(
    context: AIToolExecutionContext,
    args: { window?: string }
  ): Promise<TaskSummaryToolResult> {
    const tasks = localStore.getTasks(context.weddingId);
    const todayStr = new Date().toISOString().split('T')[0];

    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const pending = tasks.filter((t) => t.status !== 'Completed').length;
    const overdue = tasks.filter(
      (t) => t.status !== 'Completed' && t.due_date && t.due_date < todayStr
    ).length;

    let filtered = tasks;
    if (args.window === 'today') {
      filtered = filtered.filter((t) => t.due_date === todayStr);
    } else if (args.window === 'overdue') {
      filtered = filtered.filter((t) => t.status !== 'Completed' && t.due_date && t.due_date < todayStr);
    }

    return {
      total_tasks: tasks.length,
      completed_count: completed,
      pending_count: pending,
      overdue_count: overdue,
      urgent_tasks: filtered.slice(0, 10).map((t) => ({
        id: t.id,
        title: t.title,
        due_date: t.due_date || null,
        status: t.status,
        priority: t.priority,
        is_overdue: Boolean(t.status !== 'Completed' && t.due_date && t.due_date < todayStr),
        ceremony_name: t.event?.event_name,
      })),
    };
  },

  // -------------------------------------------------------------
  // TOOL 8: get_accommodation_summary
  // -------------------------------------------------------------
  async getAccommodationSummary(
    context: AIToolExecutionContext
  ): Promise<AccommodationSummaryToolResult> {
    const rooms = localStore.getAccommodations(context.weddingId);
    const guests = localStore.getGuests(context.weddingId);

    const totalRooms = rooms.length;
    const totalAssignedGuests = rooms.reduce((s, r) => s + (Number(r.occupants_count) || 0), 0);

    const needingGuests = guests.filter(
      (g) => g.accommodation_required && (g.rsvp_status === 'Confirmed' || g.rsvp_status === 'Invited')
    );
    const totalNeedingHeadcount = needingGuests.reduce(
      (s, g) => s + 1 + (Number(g.accompanying_members) || 0),
      0
    );

    return {
      total_rooms: totalRooms,
      total_capacity: totalAssignedGuests,
      total_assigned_guests: totalAssignedGuests,
      available_capacity: 0,
      unassigned_guests_needing_rooms: Math.max(0, totalNeedingHeadcount - totalAssignedGuests),
    };
  },

  // -------------------------------------------------------------
  // TOOL 9: get_transport_summary
  // -------------------------------------------------------------
  async getTransportSummary(
    context: AIToolExecutionContext,
    args: { pendingOnly?: string }
  ): Promise<TransportSummaryToolResult> {
    const transports = localStore.getTransports(context.weddingId);

    let filtered = transports;
    if (args.pendingOnly === 'true') {
      filtered = filtered.filter((t) => !t.driver_name || !t.vehicle_details);
    }

    return {
      total_transports: transports.length,
      pending_assignment_count: transports.filter(
        (t) => !t.driver_name || !t.vehicle_details
      ).length,
      upcoming_pickups: filtered.slice(0, 10).map((t) => ({
        id: t.id,
        guest_name: t.guest?.full_name || 'Guest',
        date: t.date,
        time: t.time,
        pickup_location: t.pickup_location,
        destination: t.destination,
        driver_name: t.driver_name || undefined,
        vehicle_details: t.vehicle_details || undefined,
        status: t.status,
        has_vehicle_assigned: Boolean(t.vehicle_details),
      })),
    };
  },

  // -------------------------------------------------------------
  // TOOL 10: get_activity_summary
  // -------------------------------------------------------------
  async getActivitySummary(
    context: AIToolExecutionContext,
    args: { limit?: string }
  ): Promise<ActivitySummaryToolResult> {
    const limit = args.limit ? parseInt(args.limit, 10) : 10;
    const activities = localStore.getActivities(context.weddingId, isNaN(limit) ? 10 : limit);

    return {
      total_activities_recorded: activities.length,
      recent_activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        entity_type: a.entity_type,
        summary: a.metadata?.details || `${a.actor_name} ${a.action} ${a.entity_type}`,
        actor_name: a.actor_name,
        created_at: a.created_at,
      })),
    };
  },

  // -------------------------------------------------------------
  // TOOL 11: get_wedding_memories (Phase 9.7)
  // -------------------------------------------------------------
  async getWeddingMemories(
    context: AIToolExecutionContext,
    args: { query?: string; eventId?: string; milestonePhase?: string; limit?: string }
  ): Promise<WeddingMemoriesToolResult> {
    const all = localStore.getMemories(context.weddingId);
    const events = localStore.getEvents(context.weddingId);
    const eventMap = new Map(events.map((e) => [e.id, e.event_name]));

    // 1. Role-based visibility enforcement
    let filtered = all;
    if (context.userRole === 'VIEWER' || context.userRole === 'CONTRIBUTOR') {
      filtered = filtered.filter(
        (m) => m.visibility === 'PUBLIC_FAMILY' || (context.userId && m.created_by === context.userId)
      );
    }

    // 2. Filter by ceremony / event
    if (args.eventId) {
      filtered = filtered.filter((m) => m.event_id === args.eventId);
    }

    // 3. Filter by milestone phase
    if (args.milestonePhase) {
      filtered = filtered.filter((m) => m.milestone_phase === args.milestonePhase);
    }

    // 4. Filter by natural search text
    if (args.query && args.query.trim()) {
      const q = args.query.toLowerCase().trim();
      filtered = filtered.filter((m) => {
        const inTitle = m.title.toLowerCase().includes(q);
        const inStory = (m.story_caption || '').toLowerCase().includes(q);
        const inLocation = (m.location || '').toLowerCase().includes(q);
        const eventName = m.event_id ? eventMap.get(m.event_id) : undefined;
        const inEvent = eventName ? eventName.toLowerCase().includes(q) : false;
        const inPeople = (m.people_tags || []).some((pt) => {
          const name = pt.guest_name || pt.custom_name || '';
          return name.toLowerCase().includes(q);
        });
        return inTitle || inStory || inLocation || inEvent || inPeople;
      });
    }

    // Sort by date descending (latest first)
    filtered.sort((a, b) => new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime());

    // 5. Enforce server-side limit (max 10)
    const limit = Math.min(args.limit ? parseInt(args.limit, 10) || 10 : 10, 10);
    const sliced = filtered.slice(0, limit);

    // 6. Minimum Necessary Data Sanitization (PII minimization, zero paths/credentials/IDs)
    return {
      total_memories_count: filtered.length,
      memories: sliced.map((m) => {
        const tagNames = (m.people_tags || [])
          .map((pt) => pt.guest_name || pt.custom_name)
          .filter(Boolean) as string[];

        return {
          title: m.title,
          story: m.story_caption || undefined,
          date: m.memory_date,
          milestone: m.milestone_phase,
          ceremony_name: m.event_id ? eventMap.get(m.event_id) : m.event?.event_name,
          location: m.location || undefined,
          people_tags: tagNames,
          author_name: m.author_name || undefined,
          media_count: m.media?.length || 0,
        };
      }),
    };
  },
};

