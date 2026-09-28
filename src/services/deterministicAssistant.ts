import { AIToolExecutionContext, DeterministicAssistantResponse } from '../types/ai';
import { aiToolRegistry } from './aiToolRegistry';
import { localStore } from './localStore';
import { formatINR } from '../utils/currency';
import { WEDDING_CATEGORIES } from '../constants/categories';

/**
 * Canonical grounding citation required for all WedWise assistant outputs.
 */
const STANDARD_GROUNDING = 'Based on your WedWise data · Updated just now';

/**
 * Standard friendly response for queries outside local deterministic scope.
 */
const UNSUPPORTED_RESPONSE =
  "I can help with your wedding budget, expenses, vendors, guests, ceremonies, tasks, rooms, transport, recent activity, and memories. I'm offline right now, so I can only answer these supported questions.";

/**
 * Keyword sets for category identification in financial questions
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Venue: ['venue', 'palace', 'resort', 'banquet', 'lawn', 'lawns', 'hall'],
  Catering: [
    'catering',
    'caterer',
    'caterers',
    'food',
    'dinner',
    'lunch',
    'breakfast',
    'feast',
    'sweets',
    'mithai',
    'snacks',
    'buffet',
  ],
  Decoration: [
    'decoration',
    'decor',
    'decorations',
    'floral',
    'flowers',
    'mandap',
    'lights',
    'lighting',
    'stage',
  ],
  Photography: ['photography', 'photographer', 'photo', 'photos', 'pictures', 'candid', 'album'],
  Videography: ['videography', 'videographer', 'video', 'videos', 'film', 'cinematic', 'teaser', 'reels'],
  Clothing: [
    'clothing',
    'clothes',
    'attire',
    'lehenga',
    'sherwani',
    'safa',
    'outfit',
    'outfits',
    'dress',
    'apparel',
  ],
  Jewellery: ['jewellery', 'jewelry', 'gold', 'diamond', 'polki', 'necklace', 'rings'],
  Invitations: ['invitation', 'invitations', 'invites', 'cards', 'printed cards', 'digital invite'],
  Transportation: ['transportation', 'transport', 'cabs', 'cars', 'coaches', 'buses', 'doli'],
  Accommodation: ['accommodation', 'hotel rooms', 'guest rooms', 'resort stay', 'room block'],
  'Makeup & Beauty': [
    'makeup',
    'beauty',
    'makeover',
    'hair',
    'hairstyling',
    'mehendi artist',
    'grooming',
    'salon',
  ],
  Entertainment: [
    'entertainment',
    'dj',
    'music',
    'sound system',
    'choreographer',
    'dance',
    'dhol',
    'dholak',
    'artist',
    'orchestra',
  ],
  Gifts: ['gifts', 'gift', 'favors', 'shagun', 'silver coins'],
  Rituals: ['rituals', 'ritual', 'puja', 'pooja', 'havan', 'pandit', 'samagri', 'dakshina'],
  Miscellaneous: ['miscellaneous', 'misc', 'tips', 'buffer', 'emergency'],
};

/**
 * Domain keywords used to detect whether an isolated word like "pending"
 * or "due" is qualified or ambiguous.
 */
const DOMAIN_QUALIFIERS = [
  'vendor',
  'vendors',
  'contract',
  'contracts',
  'supplier',
  'expense',
  'expenses',
  'bill',
  'bills',
  'rsvp',
  'rsvps',
  'guest',
  'guests',
  'invite',
  'invites',
  'invitation',
  'invitations',
  'headcount',
  'task',
  'tasks',
  'todo',
  'todos',
  'checklist',
  'pickup',
  'pickups',
  'transfer',
  'transfers',
  'cab',
  'cabs',
  'car',
  'cars',
  'room',
  'rooms',
  'stay',
  'hotel',
  'accommodation',
  'memory',
  'memories',
  'moment',
  'moments',
  'photo',
  'photos',
  'photograph',
  'photographs',
];

/**
 * Normalizes query string for reliable keyword matching
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/['"’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deterministic Assistant Service — Phase 8.2
 *
 * Resolves user natural-language questions locally and deterministically
 * without an external LLM, using the 10 read-only AI tools and WedWise calculation engines.
 */
export const deterministicAssistant = {
  /**
   * Main entry point: receives natural-language query and execution context.
   * Dispatches through permission-enforced tool registry and formats the result.
   */
  async resolveQuery(
    rawQuery: string,
    context: AIToolExecutionContext
  ): Promise<DeterministicAssistantResponse> {
    if (!rawQuery || !rawQuery.trim()) {
      return {
        text: 'Please ask a question about your wedding budget, expenses, vendors, guests, ceremonies, tasks, rooms, transport, or activity.',
        supportedOffline: true,
        needsClarification: false,
        toolUsed: null,
      };
    }

    const query = normalize(rawQuery);

    // -------------------------------------------------------------
    // 1. AMBIGUITY DETECTION
    // -------------------------------------------------------------
    // E.g., "How much is pending?", "What is pending?", "Show pending"
    const hasPendingOrDue = /\b(pending|due|left|outstanding)\b/.test(query);
    const hasDomainQualifier = DOMAIN_QUALIFIERS.some((keyword) => query.includes(keyword));

    // If query has "pending" or "due" without specifying which domain, ask for clarification
    if (
      hasPendingOrDue &&
      !hasDomainQualifier &&
      !query.includes('budget') &&
      !query.includes('money') &&
      !query.includes('spent') &&
      !query.includes('balance') &&
      !query.includes('funds')
    ) {
      return {
        text: 'Do you mean pending vendor payments, pending expenses, pending RSVPs, or pending tasks?',
        toolUsed: null,
        grounding: null,
        supportedOffline: true,
        needsClarification: true,
        clarificationOptions: [
          'Pending vendor payments',
          'Pending expenses',
          'Pending RSVPs',
          'Pending tasks',
        ],
      };
    }

    // -------------------------------------------------------------
    // 2. INTENT CLASSIFICATION & DISPATCH
    // -------------------------------------------------------------

    // A. OVERALL WEDDING SUMMARY / PULSE
    if (
      query.includes('wedding summary') ||
      query.includes('summary of wedding') ||
      query.includes('give me a wedding summary') ||
      query.includes('give me a summary') ||
      query.includes('overall summary') ||
      query.includes('how is everything going') ||
      query.includes('hows everything going') ||
      query.includes('how are things going') ||
      query.includes('current wedding status') ||
      query.includes('wedding status') ||
      query.includes('wedding overview') ||
      query.includes('wedding pulse')
    ) {
      return this.handleWeddingPulse(context);
    }

    // B. CATEGORY-SPECIFIC EXPENSES
    const matchedCategory = this.detectCategory(query);
    if (
      matchedCategory &&
      (query.includes('spent') ||
        query.includes('spending') ||
        query.includes('cost') ||
        query.includes('budget') ||
        query.includes('expense') ||
        query.includes('expenses') ||
        query.includes('allocated') ||
        query.includes('how much') ||
        query.includes('paid'))
    ) {
      return this.handleCategorySpending(matchedCategory, context);
    }

    // C. BIGGEST EXPENSES
    if (
      query.includes('biggest expense') ||
      query.includes('biggest expenses') ||
      query.includes('largest expense') ||
      query.includes('largest expenses') ||
      query.includes('top expense') ||
      query.includes('top expenses') ||
      query.includes('highest expense') ||
      query.includes('highest expenses') ||
      query.includes('most expensive')
    ) {
      return this.handleBiggestExpenses(context);
    }

    // D. BUDGET REMAINING / BALANCE LEFT
    if (
      query.includes('money is left') ||
      query.includes('money left') ||
      query.includes('budget remains') ||
      query.includes('budget remaining') ||
      query.includes('budget left') ||
      query.includes('remaining budget') ||
      query.includes('how much is left') ||
      query.includes('funds left') ||
      query.includes('balance left') ||
      query.includes('how much budget remains') ||
      query.includes('how much money is left')
    ) {
      return this.handleBudgetRemaining(context);
    }

    // E. TOTAL WEDDING BUDGET
    if (
      query.includes('wedding budget') ||
      query.includes('our budget') ||
      query.includes('whats our budget') ||
      query.includes('what is our budget') ||
      query.includes('what is the budget') ||
      query.includes('how much is our budget') ||
      query.includes('total budget')
    ) {
      return this.handleTotalBudget(context);
    }

    // F. TOTAL SPENT / GENERAL EXPENSES
    if (
      query.includes('have we spent') ||
      query.includes('have spent') ||
      query.includes('did we spend') ||
      query.includes('total spent') ||
      query.includes('total spending') ||
      query.includes('total expenses') ||
      query.includes('how much spent') ||
      query.includes('how much did we spend') ||
      query.includes('money spent') ||
      query.includes('spending so far')
    ) {
      return this.handleTotalSpent(context);
    }

    // G. VENDORS - OUTSTANDING / WHAT WE OWE
    if (
      query.includes('owe vendors') ||
      query.includes('owe to vendors') ||
      query.includes('what vendors do we still owe') ||
      query.includes('vendors do we still owe') ||
      query.includes('what do we owe') ||
      query.includes('how much do we owe') ||
      query.includes('vendor balance') ||
      query.includes('outstanding vendor') ||
      query.includes('vendor dues')
    ) {
      return this.handleVendorOutstanding(context);
    }

    // H. VENDORS - PENDING / DUE PAYMENTS
    if (
      query.includes('vendors are pending') ||
      query.includes('which vendors are pending') ||
      query.includes('vendor payments are due') ||
      query.includes('vendor payments due') ||
      query.includes('what vendor payments are due') ||
      query.includes('pending vendor') ||
      query.includes('due vendor') ||
      query.includes('vendors needing attention')
    ) {
      return this.handleVendorPending(context);
    }

    // I. VENDORS - TOTAL PAID
    if (
      query.includes('paid vendors') ||
      query.includes('paid to vendors') ||
      query.includes('how much have we paid vendors') ||
      query.includes('how much paid vendors') ||
      query.includes('vendor paid') ||
      query.includes('disbursed to vendors')
    ) {
      return this.handleVendorPaid(context);
    }

    // J. GUESTS - CONFIRMED / ATTENDING
    if (
      query.includes('guests are confirmed') ||
      query.includes('how many guests are confirmed') ||
      query.includes('people are coming') ||
      query.includes('how many people are coming') ||
      query.includes('confirmed guests') ||
      query.includes('confirmed attendees') ||
      query.includes('who is coming') ||
      query.includes('attending headcount') ||
      query.includes('how many attending')
    ) {
      return this.handleGuestConfirmed(context);
    }

    // K. GUESTS - PENDING RSVPS
    if (
      query.includes('rsvps are pending') ||
      query.includes('how many rsvps are pending') ||
      query.includes('pending rsvps') ||
      query.includes('pending rsvp') ||
      query.includes('awaiting rsvp') ||
      query.includes('pending guest') ||
      query.includes('unconfirmed guests')
    ) {
      return this.handleGuestPending(context);
    }

    // L. GUESTS - DECLINED
    if (
      query.includes('guests declined') ||
      query.includes('how many guests declined') ||
      query.includes('how many declined') ||
      query.includes('declined rsvps') ||
      query.includes('declined guests')
    ) {
      return this.handleGuestDeclined(context);
    }

    // M. GUESTS - FOOD PREFERENCES
    if (
      query.includes('food preference') ||
      query.includes('food preferences') ||
      query.includes('dietary') ||
      query.includes('vegetarians') ||
      query.includes('non vegetarian') ||
      query.includes('jain food')
    ) {
      return this.handleGuestDietary(context);
    }

    // N. EVENTS / CEREMONIES / TIMELINE
    if (
      query.includes('ceremonies are coming up') ||
      query.includes('what ceremonies are coming up') ||
      query.includes('when is the wedding') ||
      query.includes('what is the next event') ||
      query.includes('what is the next ceremony') ||
      query.includes('next event') ||
      query.includes('next ceremony') ||
      query.includes('upcoming ceremonies') ||
      query.includes('upcoming events') ||
      query.includes('wedding schedule') ||
      query.includes('wedding timeline') ||
      query.includes('event timeline')
    ) {
      return this.handleEventTimeline(context);
    }

    // O. TASKS - OVERDUE
    if (
      query.includes('tasks are overdue') ||
      query.includes('what tasks are overdue') ||
      query.includes('overdue tasks') ||
      query.includes('late tasks') ||
      query.includes('overdue checklist')
    ) {
      return this.handleTasksOverdue(context);
    }

    // P. TASKS - PENDING / THIS WEEK
    if (
      query.includes('need to do this week') ||
      query.includes('what do we need to do') ||
      query.includes('tasks this week') ||
      query.includes('tasks are pending') ||
      query.includes('how many tasks are pending') ||
      query.includes('pending tasks') ||
      query.includes('tasks left') ||
      query.includes('tasks to do') ||
      query.includes('upcoming tasks')
    ) {
      return this.handleTasksPending(context);
    }

    // Q. ACCOMMODATION
    if (
      query.includes('rooms do we need') ||
      query.includes('how many rooms do we need') ||
      query.includes('rooms are needed') ||
      query.includes('how many rooms are needed') ||
      query.includes('rooms are assigned') ||
      query.includes('how many rooms are assigned') ||
      query.includes('who needs accommodation') ||
      query.includes('accommodation status') ||
      query.includes('hotel rooms') ||
      query.includes('room allocation')
    ) {
      return this.handleAccommodation(context);
    }

    // R. TRANSPORT
    if (
      query.includes('pickups are pending') ||
      query.includes('how many pickups are pending') ||
      query.includes('transport is scheduled') ||
      query.includes('what transport is scheduled') ||
      query.includes('airport pickups') ||
      query.includes('how many airport pickups') ||
      query.includes('transport status') ||
      query.includes('pickup schedule') ||
      query.includes('guest transfers')
    ) {
      return this.handleTransport(context);
    }

    // S. RECENT ACTIVITY
    if (
      query.includes('what happened recently') ||
      query.includes('what changed today') ||
      query.includes('show recent wedding activity') ||
      query.includes('recent wedding activity') ||
      query.includes('recent activity') ||
      query.includes('recent updates') ||
      query.includes('recent changes') ||
      query.includes('activity log')
    ) {
      return this.handleActivity(context);
    }

    // T. WEDDING MEMORIES & MOMENTS (Phase 9.7)
    if (
      query.includes('memory') ||
      query.includes('memories') ||
      query.includes('moment') ||
      query.includes('moments') ||
      query.includes('what happened during') ||
      query.includes('who is tagged') ||
      query.includes('tagged in')
    ) {
      // Check for ambiguous query that needs clarification
      if (
        query === 'memories' ||
        query === 'which memories' ||
        query === 'what memories' ||
        query === 'show memories' ||
        query === 'wedding memories'
      ) {
        return {
          text: 'Would you like to see recent memories, memories by ceremony (such as Mehendi or Sangeet), or tagged family members?',
          toolUsed: null,
          grounding: null,
          supportedOffline: true,
          needsClarification: true,
          clarificationOptions: [
            'Recent memories',
            'Mehendi memories',
            'Sangeet memories',
            'Who is tagged in recent memories?',
          ],
        };
      }

      return this.handleMemoriesQuery(query, context);
    }

    // -------------------------------------------------------------
    // 3. UNSUPPORTED / OUT OF SCOPE
    // -------------------------------------------------------------
    return {
      text: UNSUPPORTED_RESPONSE,
      toolUsed: null,
      grounding: null,
      supportedOffline: false,
      needsClarification: false,
    };
  },

  // -------------------------------------------------------------
  // HELPER: Category Detector
  // -------------------------------------------------------------
  detectCategory(query: string): string | null {
    for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => query.includes(kw))) {
        return catName;
      }
    }
    return null;
  },

  // -------------------------------------------------------------
  // HANDLERS (Permission-Hardened via aiToolRegistry)
  // -------------------------------------------------------------

  async handleWeddingPulse(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_wedding_pulse', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_wedding_pulse',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const daysText = d.days_remaining !== null ? ` (${d.days_remaining} days away)` : '';
    const text =
      `Wedding Overview for ${d.wedding_name}${daysText}:\n` +
      `• Budget Status: ${d.health_status}\n` +
      `• Total Budget: ${formatINR(d.total_budget)}\n` +
      `• Total Spent: ${formatINR(d.total_spent)} (${d.percentage_used}% used)\n` +
      `• Remaining Balance: ${formatINR(d.remaining_budget)}\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_wedding_pulse',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_wedding_pulse',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleTotalSpent(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_wedding_pulse', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_wedding_pulse',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `You have spent ${formatINR(d.total_spent)} so far out of your ${formatINR(d.total_budget)} total budget ` +
      `(${d.percentage_used}% used, ${formatINR(d.remaining_budget)} remaining).\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_wedding_pulse',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_wedding_pulse',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleBudgetRemaining(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_wedding_pulse', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_wedding_pulse',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `You have ${formatINR(d.remaining_budget)} remaining in your total wedding budget of ${formatINR(d.total_budget)} ` +
      `(total spent to date is ${formatINR(d.total_spent)}, or ${d.percentage_used}% used).\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_wedding_pulse',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_wedding_pulse',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleTotalBudget(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_budget_summary', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_budget_summary',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `Your total wedding budget is ${formatINR(d.total_budget)}. Currently, ${formatINR(d.total_allocated)} ` +
      `has been allocated across categories, with ${formatINR(d.unallocated_budget)} remaining unallocated.\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_budget_summary',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_budget_summary',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleCategorySpending(
    categoryName: string,
    context: AIToolExecutionContext
  ): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_budget_summary', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_budget_summary',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const cat = d.categories.find(
      (c: any) => c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!cat) {
      return {
        text: `Category "${categoryName}" does not have an active allocation target in your wedding budget.`,
        toolUsed: 'get_budget_summary',
        grounding: {
          source: STANDARD_GROUNDING,
          timestamp: res.timestamp,
          scope: 'get_budget_summary',
        },
        supportedOffline: true,
        needsClarification: false,
      };
    }

    const text =
      `For ${cat.name}, you have spent ${formatINR(cat.spent)} of the allocated ${formatINR(cat.allocated_limit)} target ` +
      `(${cat.percentage_used}% used, ${formatINR(cat.remaining)} remaining).\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_budget_summary',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_budget_summary',
      },
      supportedOffline: true,
      needsClarification: false,
      data: cat,
    };
  },

  async handleBiggestExpenses(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_expense_summary', { limit: '20' }, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_expense_summary',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const expenses: any[] = [...(res.data.expenses || [])];
    expenses.sort((a, b) => b.amount - a.amount);
    const top = expenses.slice(0, 5);

    if (top.length === 0) {
      return {
        text: `No expenses have been recorded yet.\n\n*${STANDARD_GROUNDING}*`,
        toolUsed: 'get_expense_summary',
        grounding: {
          source: STANDARD_GROUNDING,
          timestamp: res.timestamp,
          scope: 'get_expense_summary',
        },
        supportedOffline: true,
        needsClarification: false,
      };
    }

    const lines = top.map(
      (e, i) => `${i + 1}. ${e.expense_name} — ${formatINR(e.amount)} (${e.category_name})`
    );
    const text =
      `Your largest recorded expenses are:\n${lines.join('\n')}\n\n*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_expense_summary',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_expense_summary',
      },
      supportedOffline: true,
      needsClarification: false,
      data: top,
    };
  },

  async handleVendorOutstanding(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_vendor_settlements', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_vendor_settlements',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `You have ${formatINR(d.total_outstanding)} outstanding across your vendors. ` +
      `${formatINR(d.total_paid)} has been disbursed out of ${formatINR(d.total_contracted)} total contracted commitments ` +
      `across ${d.vendors.length} vendors.\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_vendor_settlements',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_vendor_settlements',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleVendorPending(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_vendor_settlements', { filter: 'pending' }, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_vendor_settlements',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const pendingVendors = d.vendors.filter((v: any) => v.remaining_amount > 0);

    if (pendingVendors.length === 0) {
      return {
        text: `All vendor payments are settled! You have 0 pending vendor balances.\n\n*${STANDARD_GROUNDING}*`,
        toolUsed: 'get_vendor_settlements',
        grounding: {
          source: STANDARD_GROUNDING,
          timestamp: res.timestamp,
          scope: 'get_vendor_settlements',
        },
        supportedOffline: true,
        needsClarification: false,
      };
    }

    const list = pendingVendors.map(
      (v: any) =>
        `• ${v.vendor_name} (${v.category}): ${formatINR(v.remaining_amount)} remaining [${v.attention_flag}]`
    );
    const text =
      `There are ${pendingVendors.length} vendors with pending balances:\n${list.join('\n')}\n\n*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_vendor_settlements',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_vendor_settlements',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleVendorPaid(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_vendor_settlements', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_vendor_settlements',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `You have disbursed ${formatINR(d.total_paid)} to vendors so far against total contracted commitments of ` +
      `${formatINR(d.total_contracted)} (${formatINR(d.total_outstanding)} outstanding balance).\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_vendor_settlements',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_vendor_settlements',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleGuestConfirmed(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_guest_rsvp_metrics', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_guest_rsvp_metrics',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `You have ${d.confirmed_count} confirmed guests (${d.total_attending_headcount} attending headcount) ` +
      `out of ${d.total_invited} total invited guests.\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_guest_rsvp_metrics',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_guest_rsvp_metrics',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleGuestPending(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_guest_rsvp_metrics', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_guest_rsvp_metrics',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `There are ${d.pending_count} guest RSVPs still pending response out of ${d.total_invited} total invited guests.\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_guest_rsvp_metrics',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_guest_rsvp_metrics',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleGuestDeclined(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_guest_rsvp_metrics', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_guest_rsvp_metrics',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `${d.declined_count} guests have declined the wedding invitation out of ${d.total_invited} total invited.\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_guest_rsvp_metrics',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_guest_rsvp_metrics',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleGuestDietary(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_guest_rsvp_metrics', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_guest_rsvp_metrics',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `Guest dietary breakdown:\n` +
      `• Vegetarian: ${d.food_preferences.vegetarian}\n` +
      `• Non-Vegetarian: ${d.food_preferences.non_vegetarian}\n` +
      `• Jain: ${d.food_preferences.jain}\n` +
      `• Other: ${d.food_preferences.other}\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_guest_rsvp_metrics',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_guest_rsvp_metrics',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleEventTimeline(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_event_timeline', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_event_timeline',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const nextText = d.next_event_name ? `Your next ceremony is ${d.next_event_name}. ` : '';
    const eventList = d.events
      .map(
        (e: any) =>
          `• ${e.event_name} (${e.date}${e.start_time ? ' at ' + e.start_time : ''}${
            e.venue ? ' — ' + e.venue : ''
          }) [${e.status}]`
      )
      .join('\n');

    const text =
      `${nextText}There are ${d.total_events} ceremonies scheduled in total:\n${eventList}\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_event_timeline',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_event_timeline',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleTasksOverdue(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_task_summary', { window: 'overdue' }, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_task_summary',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    if (d.overdue_count === 0) {
      return {
        text: `All clear! You have 0 overdue tasks.\n\n*${STANDARD_GROUNDING}*`,
        toolUsed: 'get_task_summary',
        grounding: {
          source: STANDARD_GROUNDING,
          timestamp: res.timestamp,
          scope: 'get_task_summary',
        },
        supportedOffline: true,
        needsClarification: false,
        data: d,
      };
    }

    const list = d.urgent_tasks.map(
      (t: any) => `• ${t.title}${t.due_date ? ' (Due: ' + t.due_date + ')' : ''}`
    );
    const text = `You have ${d.overdue_count} overdue task(s):\n${list.join('\n')}\n\n*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_task_summary',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_task_summary',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleTasksPending(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_task_summary', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_task_summary',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `You have ${d.pending_count} pending task(s) out of ${d.total_tasks} total ` +
      `(${d.completed_count} completed, ${d.overdue_count} overdue).\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_task_summary',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_task_summary',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleAccommodation(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_accommodation_summary', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_accommodation_summary',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `You have ${d.total_rooms} rooms booked accommodating up to ${d.total_capacity} guests ` +
      `(${d.total_assigned_guests} assigned). ${d.unassigned_guests_needing_rooms} confirmed guests still require room assignments.\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_accommodation_summary',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_accommodation_summary',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleTransport(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_transport_summary', {}, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_transport_summary',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    const text =
      `You have ${d.total_transports} transport transfers scheduled, with ${d.pending_assignment_count} ` +
      `awaiting driver or vehicle allocation.\n\n` +
      `*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_transport_summary',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_transport_summary',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleActivity(context: AIToolExecutionContext): Promise<DeterministicAssistantResponse> {
    const res = await aiToolRegistry.executeTool('get_activity_summary', { limit: '5' }, context);
    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_activity_summary',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const d = res.data;
    if (d.recent_activities.length === 0) {
      return {
        text: `No recent wedding activity recorded yet.\n\n*${STANDARD_GROUNDING}*`,
        toolUsed: 'get_activity_summary',
        grounding: {
          source: STANDARD_GROUNDING,
          timestamp: res.timestamp,
          scope: 'get_activity_summary',
        },
        supportedOffline: true,
        needsClarification: false,
      };
    }

    const list = d.recent_activities
      .slice(0, 5)
      .map((a: any) => `• ${a.summary} (${a.actor_name})`);
    const text = `Recent wedding activity:\n${list.join('\n')}\n\n*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_activity_summary',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_activity_summary',
      },
      supportedOffline: true,
      needsClarification: false,
      data: d,
    };
  },

  async handleMemoriesQuery(
    query: string,
    context: AIToolExecutionContext
  ): Promise<DeterministicAssistantResponse> {
    // 1. Memory count query
    if (
      query.includes('how many memories') ||
      query.includes('memory count') ||
      query.includes('total memories') ||
      query.includes('how many memory')
    ) {
      const res = await aiToolRegistry.executeTool('get_wedding_memories', {}, context);
      if (!res.success) {
        return {
          text: res.error || 'Access Denied.',
          toolUsed: 'get_wedding_memories',
          grounding: null,
          supportedOffline: true,
          needsClarification: false,
          error: res.error,
        };
      }
      const count = res.data.total_memories_count;
      const text =
        count === 0
          ? `You have not preserved any wedding memories in your archive yet.\n\n*${STANDARD_GROUNDING}*`
          : `You have ${count} ${count === 1 ? 'memory' : 'memories'} preserved in your wedding archive.\n\n*${STANDARD_GROUNDING}*`;

      return {
        text,
        toolUsed: 'get_wedding_memories',
        grounding: {
          source: STANDARD_GROUNDING,
          timestamp: res.timestamp,
          scope: 'get_wedding_memories',
        },
        supportedOffline: true,
        needsClarification: false,
        data: res.data,
      };
    }

    // 2. Who is tagged query
    if (
      query.includes('who is tagged') ||
      query.includes('tagged in') ||
      query.includes('tagged people') ||
      query.includes('tagged guest') ||
      query.includes('tagged family')
    ) {
      const res = await aiToolRegistry.executeTool('get_wedding_memories', { limit: '10' }, context);
      if (!res.success) {
        return {
          text: res.error || 'Access Denied.',
          toolUsed: 'get_wedding_memories',
          grounding: null,
          supportedOffline: true,
          needsClarification: false,
          error: res.error,
        };
      }
      const memories = res.data.memories || [];
      const allTags = new Set<string>();
      memories.forEach((m: any) => {
        (m.people_tags || []).forEach((tag: string) => allTags.add(tag));
      });

      if (allTags.size === 0) {
        return {
          text: `No family members or guests are tagged in your recent wedding memories.\n\n*${STANDARD_GROUNDING}*`,
          toolUsed: 'get_wedding_memories',
          grounding: {
            source: STANDARD_GROUNDING,
            timestamp: res.timestamp,
            scope: 'get_wedding_memories',
          },
          supportedOffline: true,
          needsClarification: false,
          data: res.data,
        };
      }

      const tagList = Array.from(allTags).join(', ');
      const text = `The following loved ones are tagged in your recent wedding memories:\n• ${tagList}\n\n*${STANDARD_GROUNDING}*`;

      return {
        text,
        toolUsed: 'get_wedding_memories',
        grounding: {
          source: STANDARD_GROUNDING,
          timestamp: res.timestamp,
          scope: 'get_wedding_memories',
        },
        supportedOffline: true,
        needsClarification: false,
        data: res.data,
      };
    }

    // 3. Specific ceremony or event memory queries
    const events = localStore.getEvents(context.weddingId);
    let matchedEvent = events.find((e) => query.includes(e.event_name.toLowerCase()));
    if (!matchedEvent) {
      if (query.includes('mehendi') || query.includes('mehndi')) {
        matchedEvent = events.find(
          (e) => e.event_name.toLowerCase().includes('mehendi') || e.event_name.toLowerCase().includes('mehndi')
        );
      } else if (query.includes('sangeet')) {
        matchedEvent = events.find((e) => e.event_name.toLowerCase().includes('sangeet'));
      } else if (query.includes('haldi')) {
        matchedEvent = events.find((e) => e.event_name.toLowerCase().includes('haldi'));
      } else if (query.includes('reception')) {
        matchedEvent = events.find((e) => e.event_name.toLowerCase().includes('reception'));
      }
    }

    if (matchedEvent) {
      const res = await aiToolRegistry.executeTool(
        'get_wedding_memories',
        { eventId: matchedEvent.id, limit: '10' },
        context
      );
      if (!res.success) {
        return {
          text: res.error || 'Access Denied.',
          toolUsed: 'get_wedding_memories',
          grounding: null,
          supportedOffline: true,
          needsClarification: false,
          error: res.error,
        };
      }

      const memories = res.data.memories || [];
      if (memories.length === 0) {
        return {
          text: `I couldn't find that in your wedding archive.\n\n*${STANDARD_GROUNDING}*`,
          toolUsed: 'get_wedding_memories',
          grounding: {
            source: STANDARD_GROUNDING,
            timestamp: res.timestamp,
            scope: 'get_wedding_memories',
          },
          supportedOffline: true,
          needsClarification: false,
          data: res.data,
        };
      }

      const lines = memories.map((m: any) => {
        const storyPart = m.story ? ` — "${m.story}"` : '';
        const tagsPart = m.people_tags && m.people_tags.length > 0 ? ` (with ${m.people_tags.join(', ')})` : '';
        return `• ${m.title}${storyPart}${tagsPart}`;
      });

      const text = `Memories from ${matchedEvent.event_name}:\n${lines.join('\n')}\n\n*${STANDARD_GROUNDING}*`;

      return {
        text,
        toolUsed: 'get_wedding_memories',
        grounding: {
          source: STANDARD_GROUNDING,
          timestamp: res.timestamp,
          scope: 'get_wedding_memories',
        },
        supportedOffline: true,
        needsClarification: false,
        data: res.data,
      };
    }

    // 4. Milestone phase queries (e.g. Wedding Day, Pre-Wedding)
    let milestoneFilter: string | undefined;
    if (query.includes('wedding day') || query.includes('wedding ceremony')) {
      milestoneFilter = 'Wedding Day';
    } else if (query.includes('pre wedding') || query.includes('before the wedding')) {
      milestoneFilter = 'Pre-Wedding';
    } else if (query.includes('post wedding') || query.includes('after the wedding')) {
      milestoneFilter = 'Post-Wedding';
    }

    if (milestoneFilter) {
      let res = await aiToolRegistry.executeTool(
        'get_wedding_memories',
        { milestonePhase: milestoneFilter, limit: '10' },
        context
      );
      if (res.success && (!res.data.memories || res.data.memories.length === 0)) {
        res = await aiToolRegistry.executeTool(
          'get_wedding_memories',
          { query: milestoneFilter === 'Wedding Day' ? 'wedding' : milestoneFilter, limit: '10' },
          context
        );
      }

      if (!res.success) {
        return {
          text: res.error || 'Access Denied.',
          toolUsed: 'get_wedding_memories',
          grounding: null,
          supportedOffline: true,
          needsClarification: false,
          error: res.error,
        };
      }

      const memories = res.data.memories || [];
      if (memories.length === 0) {
        return {
          text: `I couldn't find that in your wedding archive.\n\n*${STANDARD_GROUNDING}*`,
          toolUsed: 'get_wedding_memories',
          grounding: {
            source: STANDARD_GROUNDING,
            timestamp: res.timestamp,
            scope: 'get_wedding_memories',
          },
          supportedOffline: true,
          needsClarification: false,
          data: res.data,
        };
      }

      const lines = memories.map((m: any) => {
        const storyPart = m.story ? ` — "${m.story}"` : '';
        return `• ${m.title}${storyPart} (${m.date})`;
      });

      const text = `Memories from ${milestoneFilter}:\n${lines.join('\n')}\n\n*${STANDARD_GROUNDING}*`;

      return {
        text,
        toolUsed: 'get_wedding_memories',
        grounding: {
          source: STANDARD_GROUNDING,
          timestamp: res.timestamp,
          scope: 'get_wedding_memories',
        },
        supportedOffline: true,
        needsClarification: false,
        data: res.data,
      };
    }

    // 5. Recent or general search query
    const cleanSearch = query
      .replace(/\b(show|me|memories|memory|recent|latest|what|our|are|the|do|we|have|about|from)\b/g, '')
      .trim();

    const res = await aiToolRegistry.executeTool(
      'get_wedding_memories',
      { query: cleanSearch || undefined, limit: '5' },
      context
    );

    if (!res.success) {
      return {
        text: res.error || 'Access Denied.',
        toolUsed: 'get_wedding_memories',
        grounding: null,
        supportedOffline: true,
        needsClarification: false,
        error: res.error,
      };
    }

    const memories = res.data.memories || [];
    if (memories.length === 0) {
      return {
        text: `I couldn't find that in your wedding archive.\n\n*${STANDARD_GROUNDING}*`,
        toolUsed: 'get_wedding_memories',
        grounding: {
          source: STANDARD_GROUNDING,
          timestamp: res.timestamp,
          scope: 'get_wedding_memories',
        },
        supportedOffline: true,
        needsClarification: false,
        data: res.data,
      };
    }

    const lines = memories.map((m: any) => {
      const storyPart = m.story ? ` — "${m.story}"` : '';
      return `• ${m.title}${storyPart} (${m.milestone})`;
    });

    const text = `Here are moments from your wedding archive:\n${lines.join('\n')}\n\n*${STANDARD_GROUNDING}*`;

    return {
      text,
      toolUsed: 'get_wedding_memories',
      grounding: {
        source: STANDARD_GROUNDING,
        timestamp: res.timestamp,
        scope: 'get_wedding_memories',
      },
      supportedOffline: true,
      needsClarification: false,
      data: res.data,
    };
  },
};

/**
 * Deterministic Story Polisher Fallback (Phase 9.7)
 * Improves readability, flow, and emotional warmth while strictly preserving all factual details.
 */
export function polishStoryDeterministic(
  story: string,
  _context?: { memoryTitle?: string; milestone?: string; ceremonyName?: string }
): { success: boolean; originalText: string; polishedText: string; source: 'cloud' | 'offline'; error?: string } {
  if (!story || !story.trim()) {
    return {
      success: false,
      originalText: story,
      polishedText: story,
      source: 'offline',
      error: 'Cannot polish an empty story.',
    };
  }

  const trimmed = story.trim();

  // Gentle deterministic polish that improves prose and warmth while strictly preserving all facts, names, dates, places:
  let polished = trimmed
    .replace(/\s+/g, ' ')
    .replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, prefix, char) => prefix + char.toUpperCase());

  // Gentle warm touch-ups for colloquial phrases if present
  polished = polished
    .replace(/\ba lot\b/gi, 'with immense joy')
    .replace(/\bvery nice and emotional\b/gi, 'deeply moving and filled with heartfelt warmth')
    .replace(/\bvery nice\b/gi, 'wonderfully heartwarming')
    .replace(/\bvery good\b/gi, 'truly wonderful');

  if (!/[.!?]$/.test(polished)) {
    polished += '.';
  }

  return {
    success: true,
    originalText: story,
    polishedText: polished,
    source: 'offline',
  };
}

