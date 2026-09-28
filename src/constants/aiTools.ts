import { PermissionCapability } from '../types/collaboration';

/**
 * Standard Function/Tool Declaration Specification conforming to Gemini,
 * Claude, and OpenAI tool-calling schemas.
 */
export interface AIToolDefinition {
  name: string;
  description: string;
  requiredCapability: PermissionCapability;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

/**
 * THE 10 INITIAL READ-ONLY WEDWISE AI TOOLS
 * Strictly wedding-scoped, read-only, and deterministic.
 */
export const AI_READ_ONLY_TOOLS: Record<string, AIToolDefinition> = {
  get_wedding_pulse: {
    name: 'get_wedding_pulse',
    description: 'Retrieves the high-level financial health and countdown pulse of the wedding celebration. Returns total budget, total spent, remaining balance, burn percentage, countdown days, and health state.',
    requiredCapability: 'VIEW_FINANCES',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  get_budget_summary: {
    name: 'get_budget_summary',
    description: 'Retrieves category-wise wedding budget allocations, expenditures, remaining balances, and over-allocation warnings across all 15 celebration categories.',
    requiredCapability: 'VIEW_FINANCES',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  get_expense_summary: {
    name: 'get_expense_summary',
    description: 'Retrieves itemized expenses with optional category or ceremony filter. Omits private payment credentials and internal notes.',
    requiredCapability: 'VIEW_FINANCES',
    parameters: {
      type: 'object',
      properties: {
        categoryId: {
          type: 'string',
          description: 'Optional ID of a specific expense category to filter by.',
        },
        eventId: {
          type: 'string',
          description: 'Optional ID of a specific wedding ceremony/event to filter by.',
        },
        paymentStatus: {
          type: 'string',
          description: 'Filter by payment status.',
          enum: ['Paid', 'Pending'],
        },
        limit: {
          type: 'string',
          description: 'Maximum number of items to return (default is 10).',
        },
      },
    },
  },

  get_vendor_settlements: {
    name: 'get_vendor_settlements',
    description: 'Retrieves vendor contracts, agreed amounts, total disbursed payments, remaining balances, payment due dates, and attention alerts (Payment Due, Follow Up, Contract Pending).',
    requiredCapability: 'VIEW_FINANCES',
    parameters: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'Filter vendors by payment attention state.',
          enum: ['all', 'pending', 'due_soon', 'overdue'],
        },
      },
    },
  },

  get_guest_rsvp_metrics: {
    name: 'get_guest_rsvp_metrics',
    description: 'Retrieves aggregate guest statistics, total invited, confirmed headcount, declined count, pending responses, food preferences, and wedding side breakdown. Omits personal phone numbers, emails, and private notes.',
    requiredCapability: 'VIEW_WEDDING',
    parameters: {
      type: 'object',
      properties: {
        side: {
          type: 'string',
          description: 'Filter by wedding side.',
          enum: ['Bride', 'Groom', 'Both', 'Other'],
        },
        group: {
          type: 'string',
          description: 'Filter by guest family/group.',
        },
      },
    },
  },

  get_event_timeline: {
    name: 'get_event_timeline',
    description: 'Retrieves the chronological schedule of wedding ceremonies and milestones, including dates, start/end times, venues, and descriptions.',
    requiredCapability: 'VIEW_WEDDING',
    parameters: {
      type: 'object',
      properties: {
        upcomingOnly: {
          type: 'string',
          description: 'Whether to return only future ceremonies (set to "true" or "false").',
          enum: ['true', 'false'],
        },
      },
    },
  },

  get_task_summary: {
    name: 'get_task_summary',
    description: 'Retrieves task execution metrics, total tasks, completed count, overdue count, and priority tasks due today or this week.',
    requiredCapability: 'VIEW_WEDDING',
    parameters: {
      type: 'object',
      properties: {
        window: {
          type: 'string',
          description: 'Filter tasks by time window.',
          enum: ['all', 'today', 'this_week', 'overdue'],
        },
      },
    },
  },

  get_accommodation_summary: {
    name: 'get_accommodation_summary',
    description: 'Retrieves hotel and guest stay capacity metrics, total room blocks, occupied capacity, and the number of confirmed guests who still need room assignments.',
    requiredCapability: 'VIEW_WEDDING',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  get_transport_summary: {
    name: 'get_transport_summary',
    description: 'Retrieves airport and railway station pickup logistics, passenger counts, flight details, and pending vehicle allocations. Omits guest phone numbers.',
    requiredCapability: 'VIEW_WEDDING',
    parameters: {
      type: 'object',
      properties: {
        pendingOnly: {
          type: 'string',
          description: 'Whether to return only pickups that have no vehicle/driver assigned (set to "true" or "false").',
          enum: ['true', 'false'],
        },
      },
    },
  },

  get_activity_summary: {
    name: 'get_activity_summary',
    description: 'Retrieves recent collaborator mutations, financial entries, and updates logged in the wedding workspace.',
    requiredCapability: 'VIEW_ACTIVITY_LOG',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'string',
          description: 'Number of recent activities to retrieve (default is 10).',
        },
      },
    },
  },

  get_wedding_memories: {
    name: 'get_wedding_memories',
    description: 'Retrieves preserved wedding memories, moments, and photographs, optionally filtered by search text, ceremony event, or milestone phase. Strictly read-only and respects family visibility rules.',
    requiredCapability: 'VIEW_MEMORIES',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Optional search text to filter memories by title, story caption, or location.',
        },
        eventId: {
          type: 'string',
          description: 'Optional ID of a specific wedding ceremony/event to filter by.',
        },
        milestonePhase: {
          type: 'string',
          description: 'Optional milestone phase to filter by.',
          enum: ['Pre-Wedding', 'Ceremony', 'Wedding Day', 'Reception', 'Post-Wedding'],
        },
        limit: {
          type: 'string',
          description: 'Maximum number of memories to return (default is 10, maximum is 10).',
        },
      },
    },
  },
};

/**
 * Array export for LLM function calling registration.
 */
export const AI_TOOL_DEFINITIONS: AIToolDefinition[] = Object.values(AI_READ_ONLY_TOOLS);

