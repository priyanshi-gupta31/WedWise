import {
  WeddingRole,
  PermissionCapability,
  WeddingMember,
} from '../types/collaboration';

/**
 * Canonical capability mapping matrix for WedWise wedding workspaces.
 */
const ROLE_CAPABILITIES: Record<WeddingRole, Record<PermissionCapability, boolean>> = {
  OWNER: {
    VIEW_WEDDING: true,
    EDIT_WEDDING_PROFILE: true,
    RESET_WEDDING_DATA: true,
    MANAGE_MEMBERS: true,
    INVITE_MEMBERS: true,
    CHANGE_MEMBER_ROLE: true,
    TRANSFER_OWNERSHIP: true,
    REMOVE_MEMBER: true,
    VIEW_FINANCES: true,
    CREATE_EXPENSE: true,
    EDIT_EXPENSE: true,
    DELETE_EXPENSE: true,
    MANAGE_BUDGET: true,
    MANAGE_GUESTS: true,
    DELETE_GUESTS: true,
    MANAGE_EVENTS: true,
    MANAGE_TASKS: true,
    MANAGE_VENDORS: true,
    DELETE_VENDORS: true,
    RECORD_VENDOR_PAYMENT: true,
    DELETE_VENDOR_PAYMENT: true,
    MANAGE_ACCOMMODATION: true,
    MANAGE_TRANSPORT: true,
    MANAGE_DOCUMENTS: true,
    VIEW_ACTIVITY_LOG: true,
    VIEW_MEMORIES: true,
    CREATE_MEMORY: true,
    MANAGE_MEMORIES: true,
  },
  FAMILY_ADMIN: {
    VIEW_WEDDING: true,
    EDIT_WEDDING_PROFILE: true,
    RESET_WEDDING_DATA: false, // Protected owner-only
    MANAGE_MEMBERS: true, // Limited to Contributor / Viewer
    INVITE_MEMBERS: true, // Limited to Contributor / Viewer
    CHANGE_MEMBER_ROLE: false, // Only Owner can change member roles
    TRANSFER_OWNERSHIP: false, // Only Owner can transfer
    REMOVE_MEMBER: true, // Limited to Contributor / Viewer
    VIEW_FINANCES: true,
    CREATE_EXPENSE: true,
    EDIT_EXPENSE: true,
    DELETE_EXPENSE: true,
    MANAGE_BUDGET: true,
    MANAGE_GUESTS: true,
    DELETE_GUESTS: true,
    MANAGE_EVENTS: true,
    MANAGE_TASKS: true,
    MANAGE_VENDORS: true,
    DELETE_VENDORS: true,
    RECORD_VENDOR_PAYMENT: true,
    DELETE_VENDOR_PAYMENT: true,
    MANAGE_ACCOMMODATION: true,
    MANAGE_TRANSPORT: true,
    MANAGE_DOCUMENTS: true,
    VIEW_ACTIVITY_LOG: true,
    VIEW_MEMORIES: true,
    CREATE_MEMORY: true,
    MANAGE_MEMORIES: true,
  },
  CONTRIBUTOR: {
    VIEW_WEDDING: true,
    EDIT_WEDDING_PROFILE: false,
    RESET_WEDDING_DATA: false,
    MANAGE_MEMBERS: false,
    INVITE_MEMBERS: false,
    CHANGE_MEMBER_ROLE: false,
    TRANSFER_OWNERSHIP: false,
    REMOVE_MEMBER: false,
    VIEW_FINANCES: true,
    CREATE_EXPENSE: true,
    EDIT_EXPENSE: true,
    DELETE_EXPENSE: false, // Contributors cannot delete financial history!
    MANAGE_BUDGET: false,
    MANAGE_GUESTS: true, // Add and edit permitted
    DELETE_GUESTS: false,
    MANAGE_EVENTS: false,
    MANAGE_TASKS: true, // Add and complete tasks
    MANAGE_VENDORS: true, // Add and edit vendor info
    DELETE_VENDORS: false,
    RECORD_VENDOR_PAYMENT: true,
    DELETE_VENDOR_PAYMENT: false, // Cannot delete payment records
    MANAGE_ACCOMMODATION: true,
    MANAGE_TRANSPORT: true,
    MANAGE_DOCUMENTS: true,
    VIEW_ACTIVITY_LOG: true,
    VIEW_MEMORIES: true,
    CREATE_MEMORY: true,
    MANAGE_MEMORIES: false,
  },
  VIEWER: {
    VIEW_WEDDING: true,
    EDIT_WEDDING_PROFILE: false,
    RESET_WEDDING_DATA: false,
    MANAGE_MEMBERS: false,
    INVITE_MEMBERS: false,
    CHANGE_MEMBER_ROLE: false,
    TRANSFER_OWNERSHIP: false,
    REMOVE_MEMBER: false,
    VIEW_FINANCES: true, // Read-only view permitted
    CREATE_EXPENSE: false,
    EDIT_EXPENSE: false,
    DELETE_EXPENSE: false,
    MANAGE_BUDGET: false,
    MANAGE_GUESTS: false,
    DELETE_GUESTS: false,
    MANAGE_EVENTS: false,
    MANAGE_TASKS: false,
    MANAGE_VENDORS: false,
    DELETE_VENDORS: false,
    RECORD_VENDOR_PAYMENT: false,
    DELETE_VENDOR_PAYMENT: false,
    MANAGE_ACCOMMODATION: false,
    MANAGE_TRANSPORT: false,
    MANAGE_DOCUMENTS: false,
    VIEW_ACTIVITY_LOG: true,
    VIEW_MEMORIES: true,
    CREATE_MEMORY: false,
    MANAGE_MEMORIES: false,
  },
};

/**
 * Checks whether a given role holds a specific capability
 */
export function checkPermission(role: WeddingRole, capability: PermissionCapability): boolean {
  const roleCaps = ROLE_CAPABILITIES[role];
  if (!roleCaps) return false;
  return Boolean(roleCaps[capability]);
}

/**
 * Determines which roles an actor is authorized to invite
 */
export function canInviteRole(actorRole: WeddingRole, roleToInvite: WeddingRole): boolean {
  if (actorRole === 'OWNER') {
    return roleToInvite === 'FAMILY_ADMIN' || roleToInvite === 'CONTRIBUTOR' || roleToInvite === 'VIEWER';
  }
  if (actorRole === 'FAMILY_ADMIN') {
    return roleToInvite === 'CONTRIBUTOR' || roleToInvite === 'VIEWER';
  }
  return false;
}

/**
 * Evaluates whether an actor can manage, change, or remove a specific target member.
 * Enforces Owner Protection Invariants.
 */
export function canManageMember(
  actorRole: WeddingRole,
  actorUserId: string,
  targetMember: WeddingMember,
  allActiveMembers: WeddingMember[]
): { allowed: boolean; reason?: string } {
  // 1. Prevent self-escalation / self-management of roles
  if (actorUserId === targetMember.user_id) {
    return {
      allowed: false,
      reason: 'You cannot modify your own role or remove yourself from the workspace roster.',
    };
  }

  // 2. Viewers and Contributors have zero management permissions
  if (actorRole === 'CONTRIBUTOR' || actorRole === 'VIEWER') {
    return {
      allowed: false,
      reason: 'Contributors and Viewers do not have permission to manage workspace members.',
    };
  }

  // 3. Family Admins can only manage Contributors and Viewers
  if (actorRole === 'FAMILY_ADMIN') {
    if (targetMember.role === 'OWNER') {
      return {
        allowed: false,
        reason: 'Family Admins cannot modify or remove the Wedding Owner.',
      };
    }
    if (targetMember.role === 'FAMILY_ADMIN') {
      return {
        allowed: false,
        reason: 'Family Admins cannot manage peer Family Admins.',
      };
    }
    return { allowed: true };
  }

  // 4. Owner management & Owner Protection
  if (actorRole === 'OWNER') {
    if (targetMember.role === 'OWNER') {
      const activeOwners = allActiveMembers.filter(
        (m) => m.role === 'OWNER' && m.status === 'Accepted'
      );
      if (activeOwners.length <= 1) {
        return {
          allowed: false,
          reason: 'Cannot demote or remove the sole Wedding Owner. Transfer ownership first.',
        };
      }
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Unauthorized.' };
}
