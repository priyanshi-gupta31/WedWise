import { PermissionCapability, WeddingRole } from './collaboration';

/**
 * Execution context provided when an AI tool is invoked.
 * Contains user identity and wedding workspace scoping.
 */
export interface AIToolExecutionContext {
  weddingId: string;
  userId: string;
  userRole?: WeddingRole;
}

/**
 * Standardized envelope for all AI tool execution results.
 */
export interface AIToolResult<T = any> {
  success: boolean;
  tool_name: string;
  data?: T;
  error?: string;
  grounding: string;
  timestamp: string;
}

// -------------------------------------------------------------
// DTOs for the 10 Read-Only Tools (Minimum Necessary Data)
// -------------------------------------------------------------

/** Tool 1: get_wedding_pulse */
export interface WeddingPulseToolResult {
  wedding_name: string;
  wedding_date: string;
  days_remaining: number | null;
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  percentage_used: number;
  health_status: 'On Track' | 'Attention Needed' | 'Over Budget' | 'Balanced';
}

/** Tool 2: get_budget_summary */
export interface BudgetCategoryItem {
  id: string;
  name: string;
  allocated_limit: number;
  spent: number;
  remaining: number;
  percentage_used: number;
  is_over_budget: boolean;
}

export interface BudgetSummaryToolResult {
  total_budget: number;
  total_allocated: number;
  unallocated_budget: number;
  is_over_allocated: boolean;
  over_allocated_amount: number;
  categories: BudgetCategoryItem[];
}

/** Tool 3: get_expense_summary */
export interface MinimalExpenseItem {
  id: string;
  expense_name: string;
  category_name: string;
  amount: number;
  expense_date: string;
  paid_by: string;
  payment_status: string;
  ceremony_name?: string;
}

export interface ExpenseSummaryToolResult {
  total_expenses_count: number;
  total_spent_amount: number;
  total_pending_amount: number;
  expenses: MinimalExpenseItem[];
}

/** Tool 4: get_vendor_settlements */
export interface MinimalVendorItem {
  id: string;
  vendor_name: string;
  category: string;
  agreed_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
  next_payment_due_date?: string;
  attention_flag: 'All Clear' | 'Payment Due' | 'Follow Up' | 'Contract Pending';
}

export interface VendorSettlementsToolResult {
  total_contracted: number;
  total_paid: number;
  total_outstanding: number;
  pending_payments_count: number;
  vendors: MinimalVendorItem[];
}

/** Tool 5: get_guest_rsvp_metrics */
export interface GuestRsvpMetricsToolResult {
  total_invited: number;
  confirmed_count: number;
  declined_count: number;
  pending_count: number;
  total_attending_headcount: number;
  food_preferences: {
    vegetarian: number;
    non_vegetarian: number;
    jain: number;
    other: number;
  };
  by_side: {
    bride: number;
    groom: number;
    both: number;
    other: number;
  };
}

/** Tool 6: get_event_timeline */
export interface MinimalEventItem {
  id: string;
  event_name: string;
  event_type: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  venue?: string | null;
  description?: string | null;
  expected_guests?: number;
  status: 'Upcoming' | 'Today' | 'Completed';
}

export interface EventTimelineToolResult {
  total_events: number;
  next_event_name: string | null;
  events: MinimalEventItem[];
}

/** Tool 7: get_task_summary */
export interface MinimalTaskItem {
  id: string;
  title: string;
  due_date?: string | null;
  status: string;
  priority?: string;
  is_overdue: boolean;
  ceremony_name?: string;
}

export interface TaskSummaryToolResult {
  total_tasks: number;
  completed_count: number;
  pending_count: number;
  overdue_count: number;
  urgent_tasks: MinimalTaskItem[];
}

/** Tool 8: get_accommodation_summary */
export interface AccommodationSummaryToolResult {
  total_rooms: number;
  total_capacity: number;
  total_assigned_guests: number;
  available_capacity: number;
  unassigned_guests_needing_rooms: number;
}

/** Tool 9: get_transport_summary */
export interface MinimalTransportItem {
  id: string;
  guest_name: string;
  date: string;
  time: string;
  pickup_location: string;
  destination: string;
  driver_name?: string;
  vehicle_details?: string;
  status: string;
  has_vehicle_assigned: boolean;
}

export interface TransportSummaryToolResult {
  total_transports: number;
  pending_assignment_count: number;
  upcoming_pickups: MinimalTransportItem[];
}

/** Tool 10: get_activity_summary */
export interface MinimalActivityItem {
  id: string;
  action: string;
  entity_type: string;
  summary: string;
  actor_name: string;
  created_at: string;
}

export interface ActivitySummaryToolResult {
  total_activities_recorded: number;
  recent_activities: MinimalActivityItem[];
}

/** Tool 11: get_wedding_memories (Phase 9.7) */
export interface MinimalMemoryItem {
  id?: string;
  title: string;
  story?: string;
  date: string;
  milestone: string;
  ceremony_name?: string;
  location?: string;
  people_tags: string[];
  author_name?: string;
  media_count: number;
}

export interface WeddingMemoriesToolResult {
  total_memories_count: number;
  memories: MinimalMemoryItem[];
}

// -------------------------------------------------------------
// Assistant & Grounding Metadata Types
// -------------------------------------------------------------

export interface AIToolGroundingMetadata {
  source: string; // e.g. "Based on your WedWise data · Updated just now"
  timestamp: string;
  scope?: string;
}

export interface DeterministicAssistantResponse {
  text: string;
  toolUsed?: string | null;
  grounding?: AIToolGroundingMetadata | null;
  supportedOffline: boolean;
  needsClarification: boolean;
  clarificationOptions?: string[];
  data?: any;
  error?: string;
}

// -------------------------------------------------------------
// Phase 8.3 & 9.7 AI Gateway Types
// -------------------------------------------------------------

export interface AskWedWiseRequest {
  query: string;
  weddingId?: string;
}

export type AIResponseStatus = 'cloud' | 'offline' | 'auth_error' | 'cloud_error';

export interface AskWedWiseResponse {
  text: string;
  source: 'cloud' | 'offline';
  statusType?: AIResponseStatus;
  toolUsed: string | null;
  grounding: AIToolGroundingMetadata | null;
  supportedOffline: boolean;
  needsClarification: boolean;
  clarificationOptions?: string[];
  error?: string;
}

export interface PolishStoryRequest {
  story: string;
  memoryTitle?: string;
  milestone?: string;
  ceremonyName?: string;
  weddingId?: string;
}

export interface PolishStoryResponse {
  success: boolean;
  originalText: string;
  polishedText: string;
  source: 'cloud' | 'offline';
  error?: string;
}



