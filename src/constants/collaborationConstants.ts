import { WeddingRole } from '../types/collaboration';

export interface RoleConfig {
  role: WeddingRole;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  description: string;
  permissionsSummary: string[];
}

export const ROLE_CONFIGS: Record<WeddingRole, RoleConfig> = {
  OWNER: {
    role: 'OWNER',
    label: 'Wedding Owner',
    badgeBg: 'bg-[#641F35]',
    badgeText: 'text-white',
    badgeBorder: 'border-[#641F35]',
    description: 'Full sovereign control of celebration details, financial ledgers, and family memberships.',
    permissionsSummary: [
      'Full workspace & financial control',
      'Manage family members & assign roles',
      'Transfer ownership of wedding',
      'Create, edit & delete all data',
      'Manage cloud database & reset options',
    ],
  },
  FAMILY_ADMIN: {
    role: 'FAMILY_ADMIN',
    label: 'Family Admin',
    badgeBg: 'bg-[#FFF7ED]',
    badgeText: 'text-[#9E5D0A]',
    badgeBorder: 'border-[#E89838]/40',
    description: 'Operational coordinator. Manages vendors, ceremonies, guest accommodations, and payments.',
    permissionsSummary: [
      'Manage guests, rooms & travel pickups',
      'Record payments & track vendor contracts',
      'Manage ceremonies, schedule & tasks',
      'Invite Contributors & Viewers',
      'Cannot remove owner or transfer ownership',
    ],
  },
  CONTRIBUTOR: {
    role: 'CONTRIBUTOR',
    label: 'Contributor',
    badgeBg: 'bg-[#EAF3EC]',
    badgeText: 'text-[#2D5A43]',
    badgeBorder: 'border-[#A9CEB5]',
    description: 'Family helper. Can add and update operational records, guests, tasks, and day-to-day receipts.',
    permissionsSummary: [
      'Add & update wedding guests',
      'Add tasks & ceremony check-ins',
      'Record expenses & vendor information',
      'Cannot delete financial history',
      'Cannot invite or manage members',
    ],
  },
  VIEWER: {
    role: 'VIEWER',
    label: 'Viewer',
    badgeBg: 'bg-[#F9F5F0]',
    badgeText: 'text-[#7C6B7E]',
    badgeBorder: 'border-[#E8DFD5]',
    description: 'Read-only access for family members to stay informed on schedules, venues, and arrangements.',
    permissionsSummary: [
      'View wedding schedule & ceremonies',
      'View guest lists & room assignments',
      'View permitted financial summaries',
      'Read-only: cannot create, edit, or delete',
    ],
  },
};

export const RELATIONSHIP_PRESETS = [
  'Mom',
  'Dad',
  "Bride's Sister",
  "Bride's Brother",
  "Groom's Sister",
  "Groom's Brother",
  'Chacha Ji / Uncle',
  'Bua Ji / Aunt',
  'Maasi Ji / Aunt',
  'Mama Ji / Uncle',
  'Best Friend',
  'Cousin',
  'Wedding Planner',
  'Family Coordinator',
] as const;

export const INVITATION_EXPIRY_DAYS = 7;
