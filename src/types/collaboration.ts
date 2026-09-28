import { WeddingEvent } from './database.types';

export type WeddingRole = 'OWNER' | 'FAMILY_ADMIN' | 'CONTRIBUTOR' | 'VIEWER';
export type MemberStatus = 'Pending' | 'Accepted' | 'Declined' | 'Revoked';
export type InvitationStatus = 'Pending' | 'Accepted' | 'Declined' | 'Revoked' | 'Expired';

export interface WeddingMember {
  id: string;
  wedding_id: string;
  user_id: string;
  role: WeddingRole;
  display_name: string;
  email: string;
  avatar_url?: string | null;
  relationship_title?: string | null; // e.g. "Mom", "Bride's Sister", "Groom's Father"
  status: MemberStatus;
  invited_at?: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WeddingInvitation {
  id: string;
  wedding_id: string;
  email: string;
  role: WeddingRole;
  display_name?: string;
  relationship_title?: string;
  invited_by: string; // user_id of inviter
  invited_by_name?: string;
  message?: string;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  accepted_at?: string;
  accepted_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InvitationPreview {
  id: string;
  wedding_id: string;
  wedding_name: string;
  bride_name?: string;
  groom_name?: string;
  wedding_date?: string;
  message?: string;
  email: string;
  role: WeddingRole;
  display_name?: string;
  relationship_title?: string;
  invited_by_name?: string;
  status: InvitationStatus;
  expires_at: string;
  is_expired: boolean;
  created_at: string;
}

export interface InviteMemberFormData {
  email: string;
  role: WeddingRole;
  display_name?: string;
  relationship_title?: string;
  message?: string;
}

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'confirmed'
  | 'assigned'
  | 'paid'
  | 'invited'
  | 'joined'
  | 'role_changed'
  | 'ownership_transferred'
  | 'revoked';

export type ActivityEntityType =
  | 'expense'
  | 'vendor'
  | 'vendor_payment'
  | 'guest'
  | 'event'
  | 'task'
  | 'accommodation'
  | 'transport'
  | 'member'
  | 'invitation'
  | 'wedding'
  | 'memory';

export interface WeddingActivity {
  id: string;
  wedding_id: string;
  actor_user_id: string;
  actor_name: string;
  actor_role?: WeddingRole;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string;
  entity_title: string;
  metadata?: {
    amount?: number;
    notes?: string;
    details?: string;
    old_value?: string;
    new_value?: string;
  };
  created_at: string;
}

export type PermissionCapability =
  | 'VIEW_WEDDING'
  | 'EDIT_WEDDING_PROFILE'
  | 'RESET_WEDDING_DATA'
  | 'MANAGE_MEMBERS'
  | 'INVITE_MEMBERS'
  | 'CHANGE_MEMBER_ROLE'
  | 'TRANSFER_OWNERSHIP'
  | 'REMOVE_MEMBER'
  | 'VIEW_FINANCES'
  | 'CREATE_EXPENSE'
  | 'EDIT_EXPENSE'
  | 'DELETE_EXPENSE'
  | 'MANAGE_BUDGET'
  | 'MANAGE_GUESTS'
  | 'DELETE_GUESTS'
  | 'MANAGE_EVENTS'
  | 'MANAGE_TASKS'
  | 'MANAGE_VENDORS'
  | 'DELETE_VENDORS'
  | 'RECORD_VENDOR_PAYMENT'
  | 'DELETE_VENDOR_PAYMENT'
  | 'MANAGE_ACCOMMODATION'
  | 'MANAGE_TRANSPORT'
  | 'MANAGE_DOCUMENTS'
  | 'VIEW_ACTIVITY_LOG'
  | 'VIEW_MEMORIES'
  | 'CREATE_MEMORY'
  | 'MANAGE_MEMORIES';
