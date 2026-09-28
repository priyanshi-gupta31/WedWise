import {
  Expense,
  ExpenseCategory,
  Profile,
  Wedding,
  WeddingEvent,
  WeddingTask,
  Guest,
  GuestAccommodation,
  GuestTransport,
  Vendor,
  VendorPayment,
  VendorDocument,
  WeddingMember,
  WeddingInvitation,
  WeddingActivity,
  WeddingRole,
  InviteMemberFormData,
  WeddingMemory,
  MemoryMedia,
  MemoryPeopleTag,
} from '../types/database.types';
import { createSampleWedding, DEFAULT_CATEGORY_NAMES } from './sampleData';
import { canInviteRole, canManageMember } from '../utils/permissions';

const STORAGE_KEYS = {
  PROFILE: 'wedwise_local_profile',
  WEDDINGS: 'wedwise_local_weddings',
  CATEGORIES: 'wedwise_local_categories',
  EXPENSES: 'wedwise_local_expenses',
  EVENTS: 'wedwise_local_events',
  TASKS: 'wedwise_local_tasks',
  GUESTS: 'wedwise_local_guests',
  ACCOMMODATIONS: 'wedwise_local_accommodations',
  TRANSPORTS: 'wedwise_local_transports',
  VENDORS: 'wedwise_local_vendors',
  VENDOR_PAYMENTS: 'wedwise_local_vendor_payments',
  VENDOR_DOCUMENTS: 'wedwise_local_vendor_documents',
  MEMBERS: 'wedwise_local_members',
  INVITATIONS: 'wedwise_local_invitations',
  ACTIVITIES: 'wedwise_local_activities',
  MEMORIES: 'wedwise_local_memories',
  MEMORY_MEDIA: 'wedwise_local_memory_media',
  MEMORY_PEOPLE_TAGS: 'wedwise_local_memory_people_tags',
};

export const localStore = {
  getProfile(): Profile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setProfile(profile: Profile | null) {
    if (!profile) {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
    } else {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    }
  },

  getWeddings(): Wedding[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WEDDINGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  getActiveWedding(ownerId?: string): Wedding | null {
    const weddings = this.getWeddings();
    if (!weddings.length) return null;
    if (ownerId) {
      const owned = weddings.find((w) => w.owner_id === ownerId);
      if (owned) return owned;
      // Check if user is an accepted member of any wedding
      const members = this.getMembers();
      const membership = members.find((m) => m.user_id === ownerId && m.status === 'Accepted');
      if (membership) {
        return weddings.find((w) => w.id === membership.wedding_id) || null;
      }
      return null;
    }
    return weddings[0] || null;
  },

  /**
   * Caches active wedding workspace and collections from Supabase into localStore
   * for seamless deterministic offline assistant availability.
   */
  cacheActiveWedding(
    wedding: Wedding,
    members?: WeddingMember[],
    categories?: ExpenseCategory[],
    expenses?: Expense[]
  ): void {
    if (!wedding || !wedding.id) return;
    try {
      // 1. Upsert wedding into local weddings list
      const weddings = this.getWeddings();
      const existingIndex = weddings.findIndex((w) => w.id === wedding.id);
      if (existingIndex >= 0) {
        weddings[existingIndex] = { ...weddings[existingIndex], ...wedding };
      } else {
        weddings.unshift(wedding);
      }
      localStorage.setItem(STORAGE_KEYS.WEDDINGS, JSON.stringify(weddings));

      // 2. Upsert members if provided
      if (members && members.length > 0) {
        const existingMembers = this.getMembers();
        const filtered = existingMembers.filter((m) => m.wedding_id !== wedding.id);
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([...members, ...filtered]));
      } else {
        this.ensureWeddingOwnerMember(wedding);
      }

      // 3. Upsert categories if provided
      if (categories && categories.length > 0) {
        const existingCats = this.getCategories();
        const filteredCats = existingCats.filter((c) => c.wedding_id !== wedding.id);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([...categories, ...filteredCats]));
      }

      // 4. Upsert expenses if provided
      if (expenses && expenses.length > 0) {
        const existingExps = this.getExpenses();
        const filteredExps = existingExps.filter((e) => e.wedding_id !== wedding.id);
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([...expenses, ...filteredExps]));
      }
    } catch {
      // Ignore quota errors in restricted browser storage
    }
  },

  createWedding(
    ownerId: string,
    data: {
      wedding_name: string;
      bride_name: string;
      groom_name: string;
      wedding_date: string;
      total_budget: number;
    }
  ): { wedding: Wedding; categories: ExpenseCategory[] } {
    const weddingId = 'wed-' + Date.now();
    const now = new Date().toISOString();

    const newWedding: Wedding = {
      id: weddingId,
      owner_id: ownerId,
      wedding_name: data.wedding_name,
      bride_name: data.bride_name,
      groom_name: data.groom_name,
      wedding_date: data.wedding_date,
      total_budget: data.total_budget,
      created_at: now,
      updated_at: now,
    };

    const weddings = this.getWeddings();
    weddings.unshift(newWedding);
    localStorage.setItem(STORAGE_KEYS.WEDDINGS, JSON.stringify(weddings));

    // Seed default 14 categories for this wedding
    const categories: ExpenseCategory[] = DEFAULT_CATEGORY_NAMES.map((cat, idx) => ({
      id: `cat-${weddingId}-${idx + 1}`,
      wedding_id: weddingId,
      name: cat.name,
      icon: cat.icon,
      budget_limit: 0,
      created_at: now,
    }));

    const existingCategories = this.getCategories();
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([...categories, ...existingCategories]));

    // Register creator as sole active OWNER member for the new workspace
    this.ensureWeddingOwnerMember(newWedding);

    return { wedding: newWedding, categories };
  },

  updateWedding(weddingId: string, updates: Partial<Wedding>): Wedding | null {
    const weddings = this.getWeddings();
    const index = weddings.findIndex((w) => w.id === weddingId);
    if (index === -1) return null;

    const updated: Wedding = {
      ...weddings[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    weddings[index] = updated;
    localStorage.setItem(STORAGE_KEYS.WEDDINGS, JSON.stringify(weddings));
    return updated;
  },

  getCategories(weddingId?: string): ExpenseCategory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) return [];
    try {
      const all: ExpenseCategory[] = JSON.parse(raw);
      if (weddingId) {
        return all.filter((c) => c.wedding_id === weddingId);
      }
      return all;
    } catch {
      return [];
    }
  },

  updateCategoryBudget(categoryId: string, newLimit: number): ExpenseCategory | null {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === categoryId);
    if (index === -1) return null;

    categories[index].budget_limit = newLimit;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return categories[index];
  },

  getExpenses(weddingId?: string): Expense[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) return [];
    try {
      const all: Expense[] = JSON.parse(raw);
      const filtered = weddingId ? all.filter((e) => e.wedding_id === weddingId) : all;
      const categories = this.getCategories(weddingId);
      const events = this.getEvents(weddingId);

      return filtered.map((exp) => ({
        ...exp,
        category: categories.find((c) => c.id === exp.category_id),
        event: events.find((ev) => ev.id === exp.event_id),
      }));
    } catch {
      return [];
    }
  },

  addExpense(data: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Expense {
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...data,
      id: 'exp-' + Date.now(),
      created_at: now,
      updated_at: now,
    };

    const expenses = this.getExpenses();
    expenses.unshift(newExpense);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    const categories = this.getCategories();
    const events = this.getEvents();
    return {
      ...newExpense,
      category: categories.find((c) => c.id === newExpense.category_id),
      event: events.find((ev) => ev.id === newExpense.event_id),
    };
  },

  updateExpense(expenseId: string, updates: Partial<Expense>): Expense | null {
    const expenses = this.getExpenses();
    const index = expenses.findIndex((e) => e.id === expenseId);
    if (index === -1) return null;

    const updated: Expense = {
      ...expenses[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    expenses[index] = updated;
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    const categories = this.getCategories();
    const events = this.getEvents();
    return {
      ...updated,
      category: categories.find((c) => c.id === updated.category_id),
      event: events.find((ev) => ev.id === updated.event_id),
    };
  },

  deleteExpense(expenseId: string): boolean {
    const expenses = this.getExpenses();
    const filtered = expenses.filter((e) => e.id !== expenseId);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
    return true;
  },

  // -------------------------------------------------------------
  // WEDDING EVENTS
  // -------------------------------------------------------------
  getEvents(weddingId?: string): WeddingEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!raw) return [];
    try {
      const all: WeddingEvent[] = JSON.parse(raw);
      const filtered = weddingId ? all.filter((e) => e.wedding_id === weddingId) : all;
      return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch {
      return [];
    }
  },

  addEvent(data: Omit<WeddingEvent, 'id' | 'created_at' | 'updated_at'>): WeddingEvent {
    const now = new Date().toISOString();
    const newEvent: WeddingEvent = {
      ...data,
      id: 'evt-' + Date.now(),
      created_at: now,
      updated_at: now,
    };

    const events = this.getEvents();
    events.push(newEvent);
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    return newEvent;
  },

  updateEvent(eventId: string, updates: Partial<WeddingEvent>): WeddingEvent | null {
    const events = this.getEvents();
    const index = events.findIndex((e) => e.id === eventId);
    if (index === -1) return null;

    const updated: WeddingEvent = {
      ...events[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    events[index] = updated;
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    return updated;
  },

  deleteEvent(eventId: string): boolean {
    const events = this.getEvents();
    const filtered = events.filter((e) => e.id !== eventId);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(filtered));

    // Also unassign event_id from related tasks and expenses
    const tasks = this.getTasks();
    const updatedTasks = tasks.map((t) => (t.event_id === eventId ? { ...t, event_id: null } : t));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));

    const expenses = this.getExpenses();
    const updatedExpenses = expenses.map((e) =>
      e.event_id === eventId ? { ...e, event_id: null } : e
    );
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));

    // Also unassign event_id from related memories
    const memoriesRaw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    if (memoriesRaw) {
      try {
        const memories: WeddingMemory[] = JSON.parse(memoriesRaw);
        const updatedMemories = memories.map((m) =>
          m.event_id === eventId ? { ...m, event_id: null } : m
        );
        localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updatedMemories));
      } catch (err) {
        console.warn('Failed to cascade event deletion to memories:', err);
      }
    }

    return true;
  },

  // -------------------------------------------------------------
  // WEDDING TASKS
  // -------------------------------------------------------------
  getTasks(weddingId?: string): WeddingTask[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return [];
    try {
      const all: WeddingTask[] = JSON.parse(raw);
      const filtered = weddingId ? all.filter((t) => t.wedding_id === weddingId) : all;
      const events = this.getEvents(weddingId);

      return filtered
        .map((task) => ({
          ...task,
          event: events.find((ev) => ev.id === task.event_id),
        }))
        .sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
    } catch {
      return [];
    }
  },

  addTask(data: Omit<WeddingTask, 'id' | 'created_at' | 'updated_at'>): WeddingTask {
    const now = new Date().toISOString();
    const newTask: WeddingTask = {
      ...data,
      id: 'task-' + Date.now(),
      created_at: now,
      updated_at: now,
    };

    const tasks = this.getTasks();
    tasks.unshift(newTask);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    const events = this.getEvents();
    return {
      ...newTask,
      event: events.find((ev) => ev.id === newTask.event_id),
    };
  },

  updateTask(taskId: string, updates: Partial<WeddingTask>): WeddingTask | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const updated: WeddingTask = {
      ...tasks[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    tasks[index] = updated;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    const events = this.getEvents();
    return {
      ...updated,
      event: events.find((ev) => ev.id === updated.event_id),
    };
  },

  deleteTask(taskId: string): boolean {
    const tasks = this.getTasks();
    const filtered = tasks.filter((t) => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
    return true;
  },

  // --- GUESTS ---
  getGuests(weddingId?: string): Guest[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GUESTS);
    if (!raw) return [];
    try {
      const all: Guest[] = JSON.parse(raw);
      if (weddingId) {
        return all.filter((g) => g.wedding_id === weddingId);
      }
      return all;
    } catch {
      return [];
    }
  },

  addGuest(payload: Omit<Guest, 'id' | 'created_at' | 'updated_at'>): Guest {
    const guests = this.getGuests();
    const now = new Date().toISOString();
    const newGuest: Guest = {
      ...payload,
      id: 'gst-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: now,
      updated_at: now,
    };
    guests.unshift(newGuest);
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
    return newGuest;
  },

  updateGuest(guestId: string, updates: Partial<Guest>): Guest | null {
    const guests = this.getGuests();
    const index = guests.findIndex((g) => g.id === guestId);
    if (index === -1) return null;

    const updated: Guest = {
      ...guests[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    guests[index] = updated;
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
    return updated;
  },

  deleteGuest(guestId: string): boolean {
    const guests = this.getGuests();
    const filtered = guests.filter((g) => g.id !== guestId);
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify(filtered));

    // Cascade delete associated accommodations and transports
    const accommodations = this.getAccommodations().filter((a) => a.guest_id !== guestId);
    localStorage.setItem(STORAGE_KEYS.ACCOMMODATIONS, JSON.stringify(accommodations));

    const transports = this.getTransports().filter((t) => t.guest_id !== guestId);
    localStorage.setItem(STORAGE_KEYS.TRANSPORTS, JSON.stringify(transports));

    // Cascade delete associated people tags in memories
    const tagsRaw = localStorage.getItem(STORAGE_KEYS.MEMORY_PEOPLE_TAGS);
    if (tagsRaw) {
      try {
        const allTags: MemoryPeopleTag[] = JSON.parse(tagsRaw);
        const remainingTags = allTags.filter((t) => t.guest_id !== guestId);
        localStorage.setItem(STORAGE_KEYS.MEMORY_PEOPLE_TAGS, JSON.stringify(remainingTags));
      } catch (err) {
        console.warn('Failed to cascade guest deletion to memory_people_tags:', err);
      }
    }

    return true;
  },

  // --- ACCOMMODATION ---
  getAccommodations(weddingId?: string): GuestAccommodation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOMMODATIONS);
    if (!raw) return [];
    try {
      const all: GuestAccommodation[] = JSON.parse(raw);
      const guests = this.getGuests();
      const withGuests = all.map((a) => ({
        ...a,
        guest: guests.find((g) => g.id === a.guest_id),
      }));
      if (weddingId) {
        return withGuests.filter((a) => a.wedding_id === weddingId);
      }
      return withGuests;
    } catch {
      return [];
    }
  },

  addAccommodation(
    payload: Omit<GuestAccommodation, 'id' | 'created_at' | 'updated_at'>
  ): GuestAccommodation {
    const accommodations = this.getAccommodations();
    const now = new Date().toISOString();
    const newRecord: GuestAccommodation = {
      ...payload,
      id: 'acc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: now,
      updated_at: now,
    };
    accommodations.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.ACCOMMODATIONS, JSON.stringify(accommodations));

    const guests = this.getGuests();
    return {
      ...newRecord,
      guest: guests.find((g) => g.id === newRecord.guest_id),
    };
  },

  updateAccommodation(
    id: string,
    updates: Partial<GuestAccommodation>
  ): GuestAccommodation | null {
    const accommodations = this.getAccommodations();
    const index = accommodations.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const updated: GuestAccommodation = {
      ...accommodations[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    accommodations[index] = updated;
    localStorage.setItem(STORAGE_KEYS.ACCOMMODATIONS, JSON.stringify(accommodations));

    const guests = this.getGuests();
    return {
      ...updated,
      guest: guests.find((g) => g.id === updated.guest_id),
    };
  },

  deleteAccommodation(id: string): boolean {
    const accommodations = this.getAccommodations();
    const filtered = accommodations.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ACCOMMODATIONS, JSON.stringify(filtered));
    return true;
  },

  // --- TRANSPORT ---
  getTransports(weddingId?: string): GuestTransport[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSPORTS);
    if (!raw) return [];
    try {
      const all: GuestTransport[] = JSON.parse(raw);
      const guests = this.getGuests();
      const withGuests = all.map((t) => ({
        ...t,
        guest: guests.find((g) => g.id === t.guest_id),
      }));
      if (weddingId) {
        return withGuests.filter((t) => t.wedding_id === weddingId);
      }
      return withGuests;
    } catch {
      return [];
    }
  },

  addTransport(payload: Omit<GuestTransport, 'id' | 'created_at' | 'updated_at'>): GuestTransport {
    const transports = this.getTransports();
    const now = new Date().toISOString();
    const newRecord: GuestTransport = {
      ...payload,
      id: 'trp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: now,
      updated_at: now,
    };
    transports.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.TRANSPORTS, JSON.stringify(transports));

    const guests = this.getGuests();
    return {
      ...newRecord,
      guest: guests.find((g) => g.id === newRecord.guest_id),
    };
  },

  updateTransport(id: string, updates: Partial<GuestTransport>): GuestTransport | null {
    const transports = this.getTransports();
    const index = transports.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const updated: GuestTransport = {
      ...transports[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    transports[index] = updated;
    localStorage.setItem(STORAGE_KEYS.TRANSPORTS, JSON.stringify(transports));

    const guests = this.getGuests();
    return {
      ...updated,
      guest: guests.find((g) => g.id === updated.guest_id),
    };
  },

  deleteTransport(id: string): boolean {
    const transports = this.getTransports();
    const filtered = transports.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSPORTS, JSON.stringify(filtered));
    return true;
  },

  // -------------------------------------------------------------
  // WEDDING VENDORS
  // -------------------------------------------------------------
  getVendors(weddingId?: string): Vendor[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VENDORS);
    if (!raw) return [];
    try {
      const all: Vendor[] = JSON.parse(raw);
      const events = this.getEvents(weddingId);
      const allPayments = this.getVendorPayments(undefined, weddingId);
      const allDocs = this.getVendorDocuments(undefined, weddingId);

      const filtered = weddingId ? all.filter((v) => v.wedding_id === weddingId) : all;
      return filtered.map((v) => {
        const vendorPayments = allPayments.filter((p) => p.vendor_id === v.id);
        const totalPaid = vendorPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const agreed = Number(v.agreed_amount) || 0;
        const remaining = Math.max(0, agreed - totalPaid);

        return {
          ...v,
          event: events.find((e) => e.id === v.event_id),
          payments: vendorPayments,
          documents: allDocs.filter((d) => d.vendor_id === v.id),
          paid_amount: totalPaid,
          remaining_amount: remaining,
        };
      });
    } catch {
      return [];
    }
  },

  addVendor(
    data: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'paid_amount' | 'remaining_amount' | 'event' | 'payments' | 'documents'>
  ): Vendor {
    const now = new Date().toISOString();
    const agreed = Number(data.agreed_amount) || 0;
    const advance = Number(data.advance_amount) || 0;

    const newVendor: Vendor = {
      ...data,
      id: 'vnd-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      agreed_amount: agreed,
      advance_amount: advance,
      paid_amount: 0,
      remaining_amount: agreed,
      created_at: now,
      updated_at: now,
    };

    const raw = localStorage.getItem(STORAGE_KEYS.VENDORS);
    const existing: Vendor[] = raw ? JSON.parse(raw) : [];
    existing.unshift(newVendor);
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(existing));

    // If initial advance payment was recorded, automatically create VendorPayment & linked Expense
    if (advance > 0) {
      this.addVendorPayment({
        wedding_id: newVendor.wedding_id,
        vendor_id: newVendor.id,
        amount: advance,
        payment_date: now.split('T')[0],
        payment_method: 'UPI',
        paid_by: 'Host Family',
        notes: 'Initial Booking Advance',
      });
    }

    return this.getVendors().find((v) => v.id === newVendor.id) || newVendor;
  },

  updateVendor(vendorId: string, updates: Partial<Vendor>): Vendor | null {
    const raw = localStorage.getItem(STORAGE_KEYS.VENDORS);
    if (!raw) return null;
    const vendors: Vendor[] = JSON.parse(raw);
    const index = vendors.findIndex((v) => v.id === vendorId);
    if (index === -1) return null;

    const existing = vendors[index];
    const newAgreed = updates.agreed_amount !== undefined ? Number(updates.agreed_amount) : existing.agreed_amount;
    const payments = this.getVendorPayments(vendorId);
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const updated: Vendor = {
      ...existing,
      ...updates,
      agreed_amount: newAgreed,
      paid_amount: totalPaid,
      remaining_amount: Math.max(0, newAgreed - totalPaid),
      updated_at: new Date().toISOString(),
    };

    vendors[index] = updated;
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
    return this.getVendors().find((v) => v.id === vendorId) || updated;
  },

  deleteVendor(
    vendorId: string,
    preserveExpenses: boolean = true
  ): { success: boolean; affectedExpensesCount: number } {
    const raw = localStorage.getItem(STORAGE_KEYS.VENDORS);
    if (!raw) return { success: false, affectedExpensesCount: 0 };
    const vendors: Vendor[] = JSON.parse(raw);
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return { success: false, affectedExpensesCount: 0 };

    const filteredVendors = vendors.filter((v) => v.id !== vendorId);
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(filteredVendors));

    // Clean up vendor documents
    const rawDocs = localStorage.getItem(STORAGE_KEYS.VENDOR_DOCUMENTS);
    if (rawDocs) {
      const docs: VendorDocument[] = JSON.parse(rawDocs);
      const remainingDocs = docs.filter((d) => d.vendor_id !== vendorId);
      localStorage.setItem(STORAGE_KEYS.VENDOR_DOCUMENTS, JSON.stringify(remainingDocs));
    }

    // Handle payments and linked expenses
    const payments = this.getVendorPayments().filter((p) => p.vendor_id === vendorId);
    const paymentIds = new Set(payments.map((p) => p.id));
    const allExpenses = this.getExpenses();
    let affectedCount = 0;

    if (preserveExpenses) {
      // Disassociate expenses so financial history is never lost!
      const updatedExpenses = allExpenses.map((exp) => {
        if (exp.vendor_id === vendorId || (exp.vendor_payment_id && paymentIds.has(exp.vendor_payment_id))) {
          affectedCount++;
          return {
            ...exp,
            vendor_id: null,
            notes: (exp.notes ? `${exp.notes} • ` : '') + `[From released vendor: ${vendor.vendor_name}]`,
          };
        }
        return exp;
      });
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));
    } else {
      // Explicit deletion of linked expenses requested
      const remainingExpenses = allExpenses.filter((exp) => {
        const isLinked = exp.vendor_id === vendorId || (exp.vendor_payment_id && paymentIds.has(exp.vendor_payment_id));
        if (isLinked) affectedCount++;
        return !isLinked;
      });
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(remainingExpenses));
    }

    // Remove vendor payments
    const rawPayments = localStorage.getItem(STORAGE_KEYS.VENDOR_PAYMENTS);
    if (rawPayments) {
      const allP: VendorPayment[] = JSON.parse(rawPayments);
      const remainingPayments = allP.filter((p) => p.vendor_id !== vendorId);
      localStorage.setItem(STORAGE_KEYS.VENDOR_PAYMENTS, JSON.stringify(remainingPayments));
    }

    return { success: true, affectedExpensesCount: affectedCount };
  },

  // -------------------------------------------------------------
  // VENDOR PAYMENTS (1-TO-1 IDEMPOTENT EXPENSE SYNC)
  // -------------------------------------------------------------
  getVendorPayments(vendorId?: string, weddingId?: string): VendorPayment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VENDOR_PAYMENTS);
    if (!raw) return [];
    try {
      const all: VendorPayment[] = JSON.parse(raw);
      let filtered = all;
      if (weddingId) filtered = filtered.filter((p) => p.wedding_id === weddingId);
      if (vendorId) filtered = filtered.filter((p) => p.vendor_id === vendorId);
      return filtered.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
    } catch {
      return [];
    }
  },

  addVendorPayment(
    payload: Omit<VendorPayment, 'id' | 'created_at' | 'updated_at'>,
    customExpenseCategoryId?: string,
    customExpenseTitle?: string
  ): { payment: VendorPayment; expense: Expense } {
    const now = new Date().toISOString();
    const paymentId = 'vp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    // Retrieve vendor details to populate linked expense
    const vendors = this.getVendors();
    const vendor = vendors.find((v) => v.id === payload.vendor_id);
    const vendorName = vendor ? vendor.vendor_name : 'Wedding Vendor';
    const eventId = vendor ? vendor.event_id : null;

    // Determine category
    const categories = this.getCategories();
    let categoryId: string | null = customExpenseCategoryId || null;
    if (!categoryId && vendor) {
      const targetName = vendor.category.toLowerCase();
      const matched = categories.find(
        (c) => c.name.toLowerCase().includes(targetName) || targetName.includes(c.name.toLowerCase())
      );
      categoryId = matched ? matched.id : (categories[0]?.id || null);
    }

    // CREATE LINKED EXPENSE (IDEMPOTENT with vendor_payment_id)
    const expenseId = 'exp-vp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newExpense: Expense = {
      id: expenseId,
      wedding_id: payload.wedding_id,
      vendor_id: payload.vendor_id,
      vendor_payment_id: paymentId, // STABLE UNIQUE 1-TO-1 IDEMPOTENT KEY
      event_id: eventId,
      category_id: categoryId,
      expense_name: customExpenseTitle || `${vendorName} Payment`,
      amount: Number(payload.amount),
      paid_by: payload.paid_by,
      payment_method: payload.payment_method,
      payment_status: 'Paid',
      expense_date: payload.payment_date,
      notes: payload.notes || `Vendor payment to ${vendorName}`,
      created_at: now,
      updated_at: now,
    };

    // Save expense to expenses store
    const expenses = this.getExpenses();
    expenses.unshift(newExpense);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    // Save VendorPayment with expense_id
    const newPayment: VendorPayment = {
      ...payload,
      id: paymentId,
      expense_id: expenseId,
      created_at: now,
      updated_at: now,
    };

    const rawPayments = localStorage.getItem(STORAGE_KEYS.VENDOR_PAYMENTS);
    const allPayments: VendorPayment[] = rawPayments ? JSON.parse(rawPayments) : [];
    allPayments.unshift(newPayment);
    localStorage.setItem(STORAGE_KEYS.VENDOR_PAYMENTS, JSON.stringify(allPayments));

    // Refresh vendor paid_amount and remaining_amount in vendors store
    if (vendor) {
      const vendorPayments = allPayments.filter((p) => p.vendor_id === vendor.id);
      const totalPaid = vendorPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const rawVendors = localStorage.getItem(STORAGE_KEYS.VENDORS);
      if (rawVendors) {
        const vList: Vendor[] = JSON.parse(rawVendors);
        const vIndex = vList.findIndex((v) => v.id === vendor.id);
        if (vIndex !== -1) {
          vList[vIndex] = {
            ...vList[vIndex],
            paid_amount: totalPaid,
            remaining_amount: Math.max(0, vList[vIndex].agreed_amount - totalPaid),
            updated_at: now,
          };
          localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vList));
        }
      }
    }

    return { payment: newPayment, expense: newExpense };
  },

  updateVendorPayment(
    paymentId: string,
    updates: Partial<VendorPayment>
  ): { payment: VendorPayment; expense: Expense } | null {
    const rawPayments = localStorage.getItem(STORAGE_KEYS.VENDOR_PAYMENTS);
    if (!rawPayments) return null;
    const allPayments: VendorPayment[] = JSON.parse(rawPayments);
    const index = allPayments.findIndex((p) => p.id === paymentId);
    if (index === -1) return null;

    const existingPayment = allPayments[index];
    const updatedPayment: VendorPayment = {
      ...existingPayment,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    allPayments[index] = updatedPayment;
    localStorage.setItem(STORAGE_KEYS.VENDOR_PAYMENTS, JSON.stringify(allPayments));

    // UPDATE LINKED EXPENSE (Find by vendor_payment_id OR expense_id)
    const allExpenses = this.getExpenses();
    const expIndex = allExpenses.findIndex(
      (e) => e.vendor_payment_id === paymentId || (existingPayment.expense_id && e.id === existingPayment.expense_id)
    );

    let updatedExpense: Expense;
    if (expIndex !== -1) {
      updatedExpense = {
        ...allExpenses[expIndex],
        amount: updates.amount !== undefined ? Number(updates.amount) : allExpenses[expIndex].amount,
        expense_date: updates.payment_date || allExpenses[expIndex].expense_date,
        paid_by: updates.paid_by || allExpenses[expIndex].paid_by,
        payment_method: updates.payment_method || allExpenses[expIndex].payment_method,
        notes: updates.notes !== undefined ? updates.notes : allExpenses[expIndex].notes,
        updated_at: new Date().toISOString(),
      };
      allExpenses[expIndex] = updatedExpense;
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(allExpenses));
    } else {
      const fallbackExpense: Expense = {
        id: existingPayment.expense_id || ('exp-vp-' + Date.now()),
        wedding_id: updatedPayment.wedding_id,
        vendor_id: updatedPayment.vendor_id,
        vendor_payment_id: paymentId,
        category_id: null,
        expense_name: 'Vendor Payment',
        amount: Number(updatedPayment.amount),
        paid_by: updatedPayment.paid_by,
        payment_method: updatedPayment.payment_method,
        payment_status: 'Paid',
        expense_date: updatedPayment.payment_date,
        notes: updatedPayment.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      allExpenses.unshift(fallbackExpense);
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(allExpenses));
      updatedExpense = fallbackExpense;
    }

    // Refresh vendor totals
    const rawVendors = localStorage.getItem(STORAGE_KEYS.VENDORS);
    if (rawVendors) {
      const vList: Vendor[] = JSON.parse(rawVendors);
      const vIndex = vList.findIndex((v) => v.id === updatedPayment.vendor_id);
      if (vIndex !== -1) {
        const vendorPayments = allPayments.filter((p) => p.vendor_id === vList[vIndex].id);
        const totalPaid = vendorPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        vList[vIndex] = {
          ...vList[vIndex],
          paid_amount: totalPaid,
          remaining_amount: Math.max(0, vList[vIndex].agreed_amount - totalPaid),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vList));
      }
    }

    return { payment: updatedPayment, expense: updatedExpense };
  },

  deleteVendorPayment(paymentId: string): { success: boolean; deletedExpenseId?: string } {
    const rawPayments = localStorage.getItem(STORAGE_KEYS.VENDOR_PAYMENTS);
    if (!rawPayments) return { success: false };
    const allPayments: VendorPayment[] = JSON.parse(rawPayments);
    const payment = allPayments.find((p) => p.id === paymentId);
    if (!payment) return { success: false };

    // Remove payment
    const remainingPayments = allPayments.filter((p) => p.id !== paymentId);
    localStorage.setItem(STORAGE_KEYS.VENDOR_PAYMENTS, JSON.stringify(remainingPayments));

    // REMOVE OR DELETE LINKED EXPENSE
    const allExpenses = this.getExpenses();
    let deletedExpenseId: string | undefined;
    const remainingExpenses = allExpenses.filter((e) => {
      const isLinked = e.vendor_payment_id === paymentId || (payment.expense_id && e.id === payment.expense_id);
      if (isLinked) {
        deletedExpenseId = e.id;
        return false;
      }
      return true;
    });
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(remainingExpenses));

    // Refresh vendor totals
    const rawVendors = localStorage.getItem(STORAGE_KEYS.VENDORS);
    if (rawVendors) {
      const vList: Vendor[] = JSON.parse(rawVendors);
      const vIndex = vList.findIndex((v) => v.id === payment.vendor_id);
      if (vIndex !== -1) {
        const vendorPayments = remainingPayments.filter((p) => p.vendor_id === vList[vIndex].id);
        const totalPaid = vendorPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        vList[vIndex] = {
          ...vList[vIndex],
          paid_amount: totalPaid,
          remaining_amount: Math.max(0, vList[vIndex].agreed_amount - totalPaid),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vList));
      }
    }

    return { success: true, deletedExpenseId };
  },

  // -------------------------------------------------------------
  // VENDOR DOCUMENTS
  // -------------------------------------------------------------
  getVendorDocuments(vendorId?: string, weddingId?: string): VendorDocument[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VENDOR_DOCUMENTS);
    if (!raw) return [];
    try {
      const all: VendorDocument[] = JSON.parse(raw);
      let filtered = all;
      if (weddingId) filtered = filtered.filter((d) => d.wedding_id === weddingId);
      if (vendorId) filtered = filtered.filter((d) => d.vendor_id === vendorId);
      return filtered.sort((a, b) => new Date(b.uploaded_date).getTime() - new Date(a.uploaded_date).getTime());
    } catch {
      return [];
    }
  },

  addVendorDocument(
    payload: Omit<VendorDocument, 'id' | 'created_at' | 'updated_at'>
  ): VendorDocument {
    const now = new Date().toISOString();
    const newDoc: VendorDocument = {
      ...payload,
      id: 'vdoc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: now,
      updated_at: now,
    };

    const raw = localStorage.getItem(STORAGE_KEYS.VENDOR_DOCUMENTS);
    const docs: VendorDocument[] = raw ? JSON.parse(raw) : [];
    docs.unshift(newDoc);
    localStorage.setItem(STORAGE_KEYS.VENDOR_DOCUMENTS, JSON.stringify(docs));
    return newDoc;
  },

  deleteVendorDocument(documentId: string): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.VENDOR_DOCUMENTS);
    if (!raw) return true;
    const docs: VendorDocument[] = JSON.parse(raw);
    const remaining = docs.filter((d) => d.id !== documentId);
    localStorage.setItem(STORAGE_KEYS.VENDOR_DOCUMENTS, JSON.stringify(remaining));
    return true;
  },

  loadSampleData(ownerId: string): {
    wedding: Wedding;
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
  } {
    const sample = createSampleWedding(ownerId);

    // Save wedding
    const weddings = this.getWeddings().filter((w) => w.id !== sample.wedding.id);
    weddings.unshift(sample.wedding);
    localStorage.setItem(STORAGE_KEYS.WEDDINGS, JSON.stringify(weddings));

    // Save categories
    const categories = this.getCategories().filter((c) => c.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify([...sample.categories, ...categories])
    );

    // Save events
    const events = this.getEvents().filter((ev) => ev.wedding_id !== sample.wedding.id);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([...sample.events, ...events]));

    // Save tasks
    const tasks = this.getTasks().filter((t) => t.wedding_id !== sample.wedding.id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([...sample.tasks, ...tasks]));

    // Save expenses
    const expenses = this.getExpenses().filter((e) => e.wedding_id !== sample.wedding.id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([...sample.expenses, ...expenses]));

    // Save guests
    const guests = this.getGuests().filter((g) => g.wedding_id !== sample.wedding.id);
    localStorage.setItem(STORAGE_KEYS.GUESTS, JSON.stringify([...sample.guests, ...guests]));

    // Save accommodations
    const accommodations = this.getAccommodations().filter((a) => a.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.ACCOMMODATIONS,
      JSON.stringify([...sample.accommodations, ...accommodations])
    );

    // Save transports
    const transports = this.getTransports().filter((t) => t.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.TRANSPORTS,
      JSON.stringify([...sample.transports, ...transports])
    );

    // Save vendors
    const vendors = (this.getVendors ? this.getVendors() : []).filter((v) => v.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.VENDORS,
      JSON.stringify([...sample.vendors, ...vendors])
    );

    // Save vendor payments
    const payments = (this.getVendorPayments ? this.getVendorPayments() : []).filter((p) => p.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.VENDOR_PAYMENTS,
      JSON.stringify([...sample.vendorPayments, ...payments])
    );

    // Save vendor documents
    const docs = (this.getVendorDocuments ? this.getVendorDocuments() : []).filter((d) => d.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.VENDOR_DOCUMENTS,
      JSON.stringify([...sample.vendorDocuments, ...docs])
    );

    // Save members
    const members = this.getMembers().filter((m) => m.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.MEMBERS,
      JSON.stringify([...sample.members, ...members])
    );

    // Save invitations
    const invitations = this.getInvitations().filter((inv) => inv.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.INVITATIONS,
      JSON.stringify([...sample.invitations, ...invitations])
    );

    // Save activities
    const activities = this.getActivities().filter((a) => a.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.ACTIVITIES,
      JSON.stringify([...sample.activities, ...activities])
    );

    // Save memories
    const memories = (this.getMemories ? this.getMemories() : []).filter((m) => m.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.MEMORIES,
      JSON.stringify([...(sample.memories || []), ...memories])
    );

    // Save memory media
    const media = (this.getMemoryMedia ? this.getMemoryMedia() : []).filter((m) => m.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.MEMORY_MEDIA,
      JSON.stringify([...(sample.memoryMedia || []), ...media])
    );

    // Save memory people tags
    const tags = (this.getMemoryPeopleTags ? this.getMemoryPeopleTags() : []).filter((t) => t.wedding_id !== sample.wedding.id);
    localStorage.setItem(
      STORAGE_KEYS.MEMORY_PEOPLE_TAGS,
      JSON.stringify([...(sample.memoryPeopleTags || []), ...tags])
    );

    return sample;
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.WEDDINGS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.GUESTS);
    localStorage.removeItem(STORAGE_KEYS.ACCOMMODATIONS);
    localStorage.removeItem(STORAGE_KEYS.TRANSPORTS);
    localStorage.removeItem(STORAGE_KEYS.VENDORS);
    localStorage.removeItem(STORAGE_KEYS.VENDOR_PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.VENDOR_DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.INVITATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.MEMORIES);
    localStorage.removeItem(STORAGE_KEYS.MEMORY_MEDIA);
    localStorage.removeItem(STORAGE_KEYS.MEMORY_PEOPLE_TAGS);
  },

  // -------------------------------------------------------------
  // PHASE 7: MEMBERSHIP, ROLES & OWNER INVARIANTS
  // -------------------------------------------------------------
  getMembers(weddingId?: string): WeddingMember[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) return [];
    try {
      const all: WeddingMember[] = JSON.parse(raw);
      if (weddingId) {
        return all.filter((m) => m.wedding_id === weddingId);
      }
      return all;
    } catch {
      return [];
    }
  },

  getMember(weddingId: string, userId: string): WeddingMember | null {
    const members = this.getMembers(weddingId);
    return members.find((m) => m.user_id === userId && m.status === 'Accepted') || null;
  },

  ensureWeddingOwnerMember(wedding: Wedding, profile?: Profile | null): WeddingMember {
    const members = this.getMembers(wedding.id);
    const existing = members.find((m) => m.user_id === wedding.owner_id);
    if (existing) {
      if (existing.role !== 'OWNER') {
        existing.role = 'OWNER';
        existing.status = 'Accepted';
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      }
      return existing;
    }

    const now = new Date().toISOString();
    const prof = profile || this.getProfile();
    const newOwner: WeddingMember = {
      id: 'mem-owner-' + wedding.id.substring(0, 8),
      wedding_id: wedding.id,
      user_id: wedding.owner_id,
      role: 'OWNER',
      display_name: prof?.full_name || `${wedding.bride_name} & ${wedding.groom_name}`,
      email: prof?.email || 'owner@wedwise.local',
      relationship_title: 'Workspace Owner',
      status: 'Accepted',
      joined_at: wedding.created_at || now,
      created_at: now,
      updated_at: now,
    };

    const allMembers = this.getMembers();
    allMembers.unshift(newOwner);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(allMembers));
    return newOwner;
  },

  addMember(payload: Omit<WeddingMember, 'id' | 'created_at' | 'updated_at'>): WeddingMember {
    const now = new Date().toISOString();
    const newMember: WeddingMember = {
      ...payload,
      id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: now,
      updated_at: now,
    };

    const all = this.getMembers();
    // Unique check (wedding_id, user_id)
    const existingIdx = all.findIndex(
      (m) => m.wedding_id === payload.wedding_id && m.user_id === payload.user_id
    );
    if (existingIdx !== -1) {
      all[existingIdx] = {
        ...all[existingIdx],
        ...payload,
        status: payload.status || 'Accepted',
        updated_at: now,
      };
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(all));
      return all[existingIdx];
    }

    all.unshift(newMember);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(all));
    return newMember;
  },

  updateMemberRole(
    weddingId: string,
    memberId: string,
    newRole: WeddingRole,
    actorUserId?: string
  ): { success: boolean; member?: WeddingMember; error?: string } {
    const all = this.getMembers();
    const targetIdx = all.findIndex((m) => m.id === memberId && m.wedding_id === weddingId);
    if (targetIdx === -1) {
      return { success: false, error: 'Member not found.' };
    }

    const target = all[targetIdx];

    // Check actor permissions if actorUserId provided
    if (actorUserId) {
      const actor = all.find((m) => m.wedding_id === weddingId && m.user_id === actorUserId);
      if (!actor || actor.status !== 'Accepted') {
        return { success: false, error: 'Unauthorized: Actor is not an active workspace member.' };
      }

      const check = canManageMember(actor.role, actorUserId, target, all.filter((m) => m.wedding_id === weddingId));
      if (!check.allowed) {
        return { success: false, error: check.reason || 'Unauthorized.' };
      }
    }

    // Owner Protection Invariant: Cannot demote the only owner
    if (target.role === 'OWNER' && newRole !== 'OWNER') {
      const activeOwners = all.filter(
        (m) => m.wedding_id === weddingId && m.role === 'OWNER' && m.status === 'Accepted'
      );
      if (activeOwners.length <= 1) {
        return {
          success: false,
          error: 'Cannot demote the sole Wedding Owner. Transfer ownership first.',
        };
      }
    }

    const now = new Date().toISOString();
    const updatedMember: WeddingMember = {
      ...target,
      role: newRole,
      updated_at: now,
    };
    all[targetIdx] = updatedMember;
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(all));

    // Log activity
    this.logActivity({
      wedding_id: weddingId,
      actor_user_id: actorUserId || 'system',
      actor_name: target.display_name,
      action: 'role_changed',
      entity_type: 'member',
      entity_id: memberId,
      entity_title: target.display_name,
      metadata: {
        old_value: target.role,
        new_value: newRole,
        details: `Role updated to ${newRole}`,
      },
    });

    return { success: true, member: updatedMember };
  },

  removeMember(
    weddingId: string,
    memberId: string,
    actorUserId?: string
  ): { success: boolean; error?: string } {
    const all = this.getMembers();
    const target = all.find((m) => m.id === memberId && m.wedding_id === weddingId);
    if (!target) {
      return { success: false, error: 'Member not found.' };
    }

    // Owner Protection: Cannot remove sole owner
    if (target.role === 'OWNER') {
      const activeOwners = all.filter(
        (m) => m.wedding_id === weddingId && m.role === 'OWNER' && m.status === 'Accepted'
      );
      if (activeOwners.length <= 1) {
        return {
          success: false,
          error: 'Cannot remove the sole Wedding Owner. Transfer ownership first.',
        };
      }
    }

    // Check actor permissions
    if (actorUserId) {
      const actor = all.find((m) => m.wedding_id === weddingId && m.user_id === actorUserId);
      if (!actor || actor.status !== 'Accepted') {
        return { success: false, error: 'Unauthorized.' };
      }
      const check = canManageMember(actor.role, actorUserId, target, all.filter((m) => m.wedding_id === weddingId));
      if (!check.allowed) {
        return { success: false, error: check.reason || 'Unauthorized.' };
      }
    }

    // Non-destructive: Remove membership access only, historical expenses & data remain intact!
    const remaining = all.filter((m) => m.id !== memberId);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(remaining));

    // Log activity
    this.logActivity({
      wedding_id: weddingId,
      actor_user_id: actorUserId || 'system',
      actor_name: target.display_name,
      action: 'deleted',
      entity_type: 'member',
      entity_id: memberId,
      entity_title: target.display_name,
      metadata: {
        details: `${target.display_name} was removed from workspace roster`,
      },
    });

    return { success: true };
  },

  transferOwnership(
    weddingId: string,
    targetMemberId: string,
    currentOwnerUserId: string
  ): { success: boolean; error?: string } {
    const all = this.getMembers();
    const currentOwner = all.find(
      (m) => m.wedding_id === weddingId && m.user_id === currentOwnerUserId && m.role === 'OWNER'
    );
    if (!currentOwner) {
      return { success: false, error: 'Only the current Wedding Owner can transfer ownership.' };
    }

    const targetIdx = all.findIndex((m) => m.id === targetMemberId && m.wedding_id === weddingId);
    if (targetIdx === -1) {
      return { success: false, error: 'Target member not found.' };
    }

    const target = all[targetIdx];
    if (target.status !== 'Accepted') {
      return { success: false, error: 'Ownership can only be transferred to an active member.' };
    }

    const now = new Date().toISOString();

    // Promote target to OWNER
    all[targetIdx] = { ...target, role: 'OWNER', updated_at: now };

    // Demote previous owner to FAMILY_ADMIN
    const curIdx = all.findIndex((m) => m.id === currentOwner.id);
    if (curIdx !== -1) {
      all[curIdx] = { ...currentOwner, role: 'FAMILY_ADMIN', updated_at: now };
    }

    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(all));

    // Update weddings table owner_id
    const weddings = this.getWeddings();
    const wIndex = weddings.findIndex((w) => w.id === weddingId);
    if (wIndex !== -1) {
      weddings[wIndex] = { ...weddings[wIndex], owner_id: target.user_id, updated_at: now };
      localStorage.setItem(STORAGE_KEYS.WEDDINGS, JSON.stringify(weddings));
    }

    // Log activity
    this.logActivity({
      wedding_id: weddingId,
      actor_user_id: currentOwnerUserId,
      actor_name: currentOwner.display_name,
      action: 'ownership_transferred',
      entity_type: 'wedding',
      entity_id: weddingId,
      entity_title: target.display_name,
      metadata: {
        details: `Wedding ownership transferred to ${target.display_name}`,
      },
    });

    return { success: true };
  },

  // -------------------------------------------------------------
  // INVITATIONS LIFECYCLE
  // -------------------------------------------------------------
  getInvitations(weddingId?: string): WeddingInvitation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
    if (!raw) return [];
    try {
      const all: WeddingInvitation[] = JSON.parse(raw);
      if (weddingId) {
        return all.filter((inv) => inv.wedding_id === weddingId);
      }
      return all;
    } catch {
      return [];
    }
  },

  createInvitation(
    weddingId: string,
    inviterUserId: string,
    inviterName: string,
    inviterRole: WeddingRole,
    data: InviteMemberFormData
  ): { invitation?: WeddingInvitation; error?: string } {
    // 1. Role authorization check
    if (!canInviteRole(inviterRole, data.role)) {
      return {
        error: `As ${inviterRole}, you do not have permission to invite members with the role ${data.role}.`,
      };
    }

    const emailClean = data.email.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      return { error: 'Please provide a valid email address.' };
    }

    // 2. Prevent duplicate active (Pending) invitation for same wedding and email
    const all = this.getInvitations();
    const existingPending = all.find(
      (inv) =>
        inv.wedding_id === weddingId &&
        inv.email.toLowerCase() === emailClean &&
        inv.status === 'Pending'
    );
    if (existingPending) {
      return {
        error: `An active invitation has already been sent to ${emailClean}.`,
      };
    }

    // 3. Prevent inviting someone who is already an active member
    const members = this.getMembers(weddingId);
    const alreadyMember = members.find(
      (m) => m.email.toLowerCase() === emailClean && m.status === 'Accepted'
    );
    if (alreadyMember) {
      return {
        error: `${emailClean} is already an active member of this wedding workspace.`,
      };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const token = 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);

    const newInvitation: WeddingInvitation = {
      id: 'inv-' + Date.now(),
      wedding_id: weddingId,
      email: emailClean,
      role: data.role,
      display_name: data.display_name?.trim() || undefined,
      relationship_title: data.relationship_title || undefined,
      invited_by: inviterUserId,
      invited_by_name: inviterName,
      message: data.message?.trim() || undefined,
      status: 'Pending',
      token,
      expires_at: expiresAt,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    all.unshift(newInvitation);
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(all));

    // Log activity
    this.logActivity({
      wedding_id: weddingId,
      actor_user_id: inviterUserId,
      actor_name: inviterName,
      action: 'invited',
      entity_type: 'invitation',
      entity_id: newInvitation.id,
      entity_title: emailClean,
      metadata: {
        details: `Invited as ${data.role} (${data.relationship_title || 'Family'})`,
      },
    });

    return { invitation: newInvitation };
  },

  getInvitationByToken(token: string): WeddingInvitation | null {
    const all = this.getInvitations();
    return all.find((inv) => inv.token === token) || null;
  },

  acceptInvitation(
    token: string,
    userId: string,
    userEmail: string,
    displayName: string
  ): { success: boolean; member?: WeddingMember; error?: string } {
    const all = this.getInvitations();
    const invIndex = all.findIndex((inv) => inv.token === token);
    if (invIndex === -1) {
      return { success: false, error: 'Invitation not found or invalid token.' };
    }

    const inv = all[invIndex];
    if (inv.status !== 'Pending') {
      return { success: false, error: `This invitation is already ${inv.status.toLowerCase()}.` };
    }

    // Expiry check
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      inv.status = 'Expired';
      inv.updated_at = new Date().toISOString();
      all[invIndex] = inv;
      localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(all));
      return { success: false, error: 'This invitation has expired. Please ask for a new invite.' };
    }

    const now = new Date().toISOString();

    // Mark invitation accepted
    inv.status = 'Accepted';
    inv.updated_at = now;
    all[invIndex] = inv;
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(all));

    // Add or update member in workspace
    const newMember = this.addMember({
      wedding_id: inv.wedding_id,
      user_id: userId,
      role: inv.role,
      display_name: displayName || inv.display_name || 'Family Member',
      email: userEmail || inv.email,
      relationship_title: inv.relationship_title || 'Family',
      status: 'Accepted',
      invited_at: inv.created_at,
      joined_at: now,
    });

    // Log activity
    this.logActivity({
      wedding_id: inv.wedding_id,
      actor_user_id: userId,
      actor_name: newMember.display_name,
      action: 'joined',
      entity_type: 'member',
      entity_id: newMember.id,
      entity_title: newMember.display_name,
      metadata: {
        details: `Joined celebration workspace as ${inv.role}`,
      },
    });

    return { success: true, member: newMember };
  },

  revokeInvitation(
    invitationId: string,
    actorUserId?: string
  ): { success: boolean; error?: string } {
    const all = this.getInvitations();
    const index = all.findIndex((i) => i.id === invitationId);
    if (index === -1) return { success: false, error: 'Invitation not found.' };

    all[index].status = 'Revoked';
    all[index].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(all));

    return { success: true };
  },

  // -------------------------------------------------------------
  // ACTIVITY FEED
  // -------------------------------------------------------------
  getActivities(weddingId?: string, limit: number = 50): WeddingActivity[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!raw) return [];
    try {
      const all: WeddingActivity[] = JSON.parse(raw);
      let filtered = all;
      if (weddingId) {
        filtered = filtered.filter((a) => a.wedding_id === weddingId);
      }
      return filtered
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch {
      return [];
    }
  },

  logActivity(activity: Omit<WeddingActivity, 'id' | 'created_at'>): WeddingActivity {
    const now = new Date().toISOString();
    const newAct: WeddingActivity = {
      ...activity,
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: now,
    };

    const all = this.getActivities(undefined, 200);
    all.unshift(newAct);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(all));
    return newAct;
  },

  // -------------------------------------------------------------
  // PHASE 9: WEDDING MEMORIES & MOMENTS
  // -------------------------------------------------------------
  getMemories(weddingId?: string): WeddingMemory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    if (!raw) return [];
    try {
      const all: WeddingMemory[] = JSON.parse(raw);
      const filtered = weddingId ? all.filter((m) => m.wedding_id === weddingId) : all;
      const media = this.getMemoryMedia();
      const tags = this.getMemoryPeopleTags();
      const events = this.getEvents();

      return filtered
        .map((m) => {
          const mMedia = media.filter((med) => med.memory_id === m.id);
          const mTags = tags.filter((t) => t.memory_id === m.id);
          const mEvent = m.event_id ? events.find((e) => e.id === m.event_id) : null;
          return {
            ...m,
            media: mMedia,
            people_tags: mTags,
            event: mEvent
              ? {
                  id: mEvent.id,
                  event_name: mEvent.event_name,
                  event_type: mEvent.event_type as string,
                  date: mEvent.date,
                }
              : null,
          };
        })
        .sort((a, b) => new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime());
    } catch {
      return [];
    }
  },

  getMemory(id: string): WeddingMemory | null {
    const memories = this.getMemories();
    return memories.find((m) => m.id === id) || null;
  },

  addMemory(payload: Omit<WeddingMemory, 'id' | 'created_at' | 'updated_at'>): WeddingMemory {
    const now = new Date().toISOString();
    const newMemory: WeddingMemory = {
      ...payload,
      id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: now,
      updated_at: now,
      media: [],
      people_tags: [],
    };

    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    const all: WeddingMemory[] = raw ? JSON.parse(raw) : [];
    all.unshift(newMemory);
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(all));
    return newMemory;
  },

  updateMemory(id: string, updates: Partial<WeddingMemory>): WeddingMemory | null {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    if (!raw) return null;
    const all: WeddingMemory[] = JSON.parse(raw);
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) return null;

    const updated: WeddingMemory = {
      ...all[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    all[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(all));
    return this.getMemory(id);
  },

  deleteMemory(id: string): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    if (!raw) return true;
    const all: WeddingMemory[] = JSON.parse(raw);
    const remaining = all.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(remaining));

    // Also remove associated media and people tags
    const rawMedia = localStorage.getItem(STORAGE_KEYS.MEMORY_MEDIA);
    if (rawMedia) {
      const allMedia: MemoryMedia[] = JSON.parse(rawMedia);
      localStorage.setItem(
        STORAGE_KEYS.MEMORY_MEDIA,
        JSON.stringify(allMedia.filter((m) => m.memory_id !== id))
      );
    }
    const rawTags = localStorage.getItem(STORAGE_KEYS.MEMORY_PEOPLE_TAGS);
    if (rawTags) {
      const allTags: MemoryPeopleTag[] = JSON.parse(rawTags);
      localStorage.setItem(
        STORAGE_KEYS.MEMORY_PEOPLE_TAGS,
        JSON.stringify(allTags.filter((t) => t.memory_id !== id))
      );
    }
    return true;
  },

  getMemoryMedia(memoryId?: string, weddingId?: string): MemoryMedia[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORY_MEDIA);
    if (!raw) return [];
    try {
      const all: MemoryMedia[] = JSON.parse(raw);
      let filtered = all;
      if (memoryId) {
        filtered = filtered.filter((m) => m.memory_id === memoryId);
      }
      if (weddingId) {
        filtered = filtered.filter((m) => m.wedding_id === weddingId);
      }
      return filtered.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    } catch {
      return [];
    }
  },

  addMemoryMedia(payload: Omit<MemoryMedia, 'id' | 'created_at'>): MemoryMedia {
    const now = new Date().toISOString();
    const newMedia: MemoryMedia = {
      ...payload,
      id: 'med-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: now,
    };

    const raw = localStorage.getItem(STORAGE_KEYS.MEMORY_MEDIA);
    const all: MemoryMedia[] = raw ? JSON.parse(raw) : [];
    all.push(newMedia);
    localStorage.setItem(STORAGE_KEYS.MEMORY_MEDIA, JSON.stringify(all));
    return newMedia;
  },

  deleteMemoryMedia(id: string): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORY_MEDIA);
    if (!raw) return true;
    const all: MemoryMedia[] = JSON.parse(raw);
    const remaining = all.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEMORY_MEDIA, JSON.stringify(remaining));
    return true;
  },

  getMemoryPeopleTags(memoryId?: string, weddingId?: string): MemoryPeopleTag[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORY_PEOPLE_TAGS);
    if (!raw) return [];
    try {
      const all: MemoryPeopleTag[] = JSON.parse(raw);
      let filtered = all;
      if (memoryId) {
        filtered = filtered.filter((t) => t.memory_id === memoryId);
      }
      if (weddingId) {
        filtered = filtered.filter((t) => t.wedding_id === weddingId);
      }
      const guests = this.getGuests();
      return filtered.map((t) => {
        const guest = t.guest_id ? guests.find((g) => g.id === t.guest_id) : null;
        return {
          ...t,
          guest_name: guest ? guest.full_name : t.custom_name,
        };
      });
    } catch {
      return [];
    }
  },

  addMemoryPeopleTag(payload: Omit<MemoryPeopleTag, 'id' | 'created_at'>): MemoryPeopleTag {
    const now = new Date().toISOString();
    const newTag: MemoryPeopleTag = {
      ...payload,
      id: 'mtag-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: now,
    };

    const raw = localStorage.getItem(STORAGE_KEYS.MEMORY_PEOPLE_TAGS);
    const all: MemoryPeopleTag[] = raw ? JSON.parse(raw) : [];
    all.push(newTag);
    localStorage.setItem(STORAGE_KEYS.MEMORY_PEOPLE_TAGS, JSON.stringify(all));
    return newTag;
  },

  deleteMemoryPeopleTag(id: string): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORY_PEOPLE_TAGS);
    if (!raw) return true;
    const all: MemoryPeopleTag[] = JSON.parse(raw);
    const remaining = all.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEMORY_PEOPLE_TAGS, JSON.stringify(remaining));
    return true;
  },
};

