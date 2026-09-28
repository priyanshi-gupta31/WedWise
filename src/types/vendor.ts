import { PaymentMethod, WeddingEvent, Expense } from './database.types';

export type VendorCategory =
  | 'Venue'
  | 'Catering'
  | 'Decoration'
  | 'Photography'
  | 'Videography'
  | 'Makeup & Beauty'
  | 'Mehendi'
  | 'DJ / Music'
  | 'Choreography'
  | 'Invitations & Printing'
  | 'Jewellery'
  | 'Clothing'
  | 'Transportation'
  | 'Accommodation'
  | 'Priest / Rituals'
  | 'Entertainment'
  | 'Other';

export type VendorStatus =
  | 'Shortlisted'
  | 'Contacted'
  | 'Negotiating'
  | 'Confirmed'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type VendorPaymentStatus =
  | 'Fully Paid'
  | 'Partially Paid'
  | 'Unpaid'
  | 'No Contract Amount';

export type VendorAttentionState =
  | 'Follow Up'
  | 'Contract Pending'
  | 'Payment Due'
  | 'All Clear';

export interface Vendor {
  id: string;
  wedding_id: string;
  vendor_name: string;
  category: VendorCategory;
  contact_person?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  service_description?: string | null;
  event_id?: string | null;
  status: VendorStatus;
  agreed_amount: number;
  advance_amount: number;
  paid_amount: number;
  remaining_amount: number;
  next_follow_up_date?: string | null;
  contract_due_date?: string | null;
  payment_due_date?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  event?: WeddingEvent;
  payments?: VendorPayment[];
  documents?: VendorDocument[];
}

export interface VendorPayment {
  id: string;
  wedding_id: string;
  vendor_id: string;
  expense_id?: string | null; // Stable unique link to core Expense
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  paid_by: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type VendorDocumentType =
  | 'Contract'
  | 'Quotation'
  | 'Invoice'
  | 'Receipt'
  | 'Payment Proof'
  | 'Other';

export interface VendorDocument {
  id: string;
  wedding_id: string;
  vendor_id: string;
  document_type: VendorDocumentType;
  document_name: string;
  file_reference?: string | null; // Document identifier, storage URL, or contract ref
  uploaded_date: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VendorFormData {
  vendor_name: string;
  category: VendorCategory;
  contact_person?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  service_description?: string;
  event_id?: string | null;
  status: VendorStatus;
  agreed_amount: number;
  advance_amount?: number;
  next_follow_up_date?: string;
  contract_due_date?: string;
  payment_due_date?: string;
  notes?: string;
}

export interface VendorPaymentFormData {
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  paid_by: string;
  notes?: string;
  custom_title?: string;
}

export interface VendorDocumentFormData {
  document_type: VendorDocumentType;
  document_name: string;
  file_reference?: string;
  notes?: string;
}

export interface VendorMetricsSummary {
  totalVendors: number;
  confirmedVendors: number;
  followUpCount: number;
  contractPendingCount: number;
  paymentDueCount: number;
  totalContractedValue: number;
  totalPaidValue: number;
  totalOutstandingValue: number;
  paymentsDueSoonCount: number;
}

export interface VendorFilterOptions {
  searchQuery?: string;
  category?: string | 'all';
  status?: string | 'all';
  event_id?: string | 'all';
  payment_status?: string | 'all';
}
