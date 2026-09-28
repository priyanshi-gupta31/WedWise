export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

import { Guest, GuestAccommodation, GuestTransport } from './guest';
export * from './guest';
import { Vendor, VendorPayment, VendorDocument } from './vendor';
export * from './vendor';
import { WeddingMember, WeddingInvitation, WeddingActivity, WeddingRole } from './collaboration';
export * from './collaboration';
import { WeddingMemory, MemoryMedia, MemoryPeopleTag } from './memories';
export * from './memories';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other';
export type PaymentStatus = 'Paid' | 'Pending';

export type WeddingEventType =
  | 'Engagement'
  | 'Haldi'
  | 'Mehendi'
  | 'Sangeet'
  | 'Wedding'
  | 'Reception'
  | 'Custom';

export type EventStatus = 'Upcoming' | 'Today' | 'Completed';

export type TaskPriority = 'Normal' | 'Important' | 'Urgent';
export type TaskStatus = 'Todo' | 'In Progress' | 'Completed';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Wedding {
  id: string;
  owner_id: string;
  wedding_name: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  total_budget: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  wedding_id: string;
  name: string;
  icon: string;
  budget_limit: number;
  created_at: string;
}

export interface WeddingEvent {
  id: string;
  wedding_id: string;
  event_name: string;
  event_type: WeddingEventType | string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  venue?: string | null;
  description?: string | null;
  expected_guests?: number | null;
  budget_allocation?: number | null;
  status: EventStatus;
  created_at?: string;
  updated_at?: string;
}

export interface WeddingTask {
  id: string;
  wedding_id: string;
  event_id?: string | null;
  title: string;
  description?: string | null;
  due_date?: string | null;
  assigned_to?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at?: string;
  updated_at?: string;
  event?: WeddingEvent;
}

export interface Expense {
  id: string;
  wedding_id: string;
  category_id: string | null;
  event_id?: string | null;
  vendor_id?: string | null;
  vendor_payment_id?: string | null;
  expense_name: string;
  amount: number;
  paid_by: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  expense_date: string;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory;
  event?: WeddingEvent;
  vendor?: Vendor;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & { created_at?: string };
        Update: Partial<Profile>;
      };
      weddings: {
        Row: Wedding;
        Insert: Omit<Wedding, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Wedding>;
      };
      expense_categories: {
        Row: ExpenseCategory;
        Insert: Omit<ExpenseCategory, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ExpenseCategory>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Expense>;
      };
      wedding_events: {
        Row: WeddingEvent;
        Insert: Omit<WeddingEvent, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<WeddingEvent>;
      };
      wedding_tasks: {
        Row: WeddingTask;
        Insert: Omit<WeddingTask, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<WeddingTask>;
      };
      wedding_guests: {
        Row: Guest;
        Insert: Omit<Guest, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Guest>;
      };
      guest_accommodations: {
        Row: GuestAccommodation;
        Insert: Omit<GuestAccommodation, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<GuestAccommodation>;
      };
      guest_transports: {
        Row: GuestTransport;
        Insert: Omit<GuestTransport, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<GuestTransport>;
      };
      wedding_vendors: {
        Row: Vendor;
        Insert: Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'paid_amount' | 'remaining_amount' | 'event' | 'payments' | 'documents'> & {
          id?: string;
          paid_amount?: number;
          remaining_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Vendor>;
      };
      vendor_payments: {
        Row: VendorPayment;
        Insert: Omit<VendorPayment, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<VendorPayment>;
      };
      vendor_documents: {
        Row: VendorDocument;
        Insert: Omit<VendorDocument, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<VendorDocument>;
      };
      wedding_members: {
        Row: WeddingMember;
        Insert: Omit<WeddingMember, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<WeddingMember>;
      };
      wedding_invitations: {
        Row: WeddingInvitation;
        Insert: Omit<WeddingInvitation, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<WeddingInvitation>;
      };
      wedding_activity: {
        Row: WeddingActivity;
        Insert: Omit<WeddingActivity, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<WeddingActivity>;
      };
      wedding_memories: {
        Row: WeddingMemory;
        Insert: Omit<WeddingMemory, 'id' | 'created_at' | 'updated_at' | 'media' | 'people_tags' | 'event' | 'author_name'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<WeddingMemory>;
      };
      memory_media: {
        Row: MemoryMedia;
        Insert: Omit<MemoryMedia, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<MemoryMedia>;
      };
      memory_people_tags: {
        Row: MemoryPeopleTag;
        Insert: Omit<MemoryPeopleTag, 'id' | 'created_at' | 'guest_name'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<MemoryPeopleTag>;
      };
    };
  };
}
