import {
  WeddingSide,
  RSVPStatus,
  FoodPreference,
  AccommodationStatus,
  TransportType,
  TransportStatus,
} from '../types/guest';

export const DEFAULT_GUEST_GROUPS = [
  'Bride Family',
  'Groom Family',
  'Friends',
  'Relatives',
  'College',
  'Office',
  'VIP',
  'Custom',
] as const;

export const WEDDING_SIDES: { value: WeddingSide; label: string }[] = [
  { value: 'Bride', label: "Bride's Side" },
  { value: 'Groom', label: "Groom's Side" },
  { value: 'Both', label: 'Mutual / Both' },
  { value: 'Other', label: 'Other' },
];

export const RSVP_STATUSES: {
  value: RSVPStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}[] = [
  {
    value: 'Confirmed',
    label: 'Confirmed Attending',
    badgeBg: 'bg-[#EAF3EC]',
    badgeText: 'text-[#2D5A43]',
    badgeBorder: 'border-[#A9CEB5]',
  },
  {
    value: 'Awaiting Response',
    label: 'Awaiting RSVP',
    badgeBg: 'bg-[#FFF2E0]',
    badgeText: 'text-[#9E5D0A]',
    badgeBorder: 'border-[#E89838]/40',
  },
  {
    value: 'Invited',
    label: 'Invitation Sent',
    badgeBg: 'bg-[#FFFDF9]',
    badgeText: 'text-[#615163]',
    badgeBorder: 'border-[#E8DFD5]',
  },
  {
    value: 'Maybe',
    label: 'Tentative / Maybe',
    badgeBg: 'bg-[#FFF8E6]',
    badgeText: 'text-[#B88728]',
    badgeBorder: 'border-[#D6B36A]/50',
  },
  {
    value: 'Declined',
    label: 'Regrets / Declined',
    badgeBg: 'bg-[#FFF0F0]',
    badgeText: 'text-[#C93B2B]',
    badgeBorder: 'border-[#F2B8B8]',
  },
];

export const FOOD_PREFERENCES: FoodPreference[] = [
  'Vegetarian',
  'Non-Vegetarian',
  'Jain',
  'Vegan',
  'Other',
];

export const ACCOMMODATION_STATUSES: {
  value: AccommodationStatus;
  label: string;
  colorClass: string;
}[] = [
  { value: 'Requested', label: 'Requested', colorClass: 'text-[#E89838] bg-[#FFF2E0]' },
  { value: 'Assigned', label: 'Room Assigned', colorClass: 'text-[#641F35] bg-[#FAF1F3]' },
  { value: 'Checked In', label: 'Checked In', colorClass: 'text-[#2D5A43] bg-[#EAF3EC]' },
  { value: 'Checked Out', label: 'Checked Out', colorClass: 'text-[#8C7A8E] bg-[#F4EFEA]' },
];

export const TRANSPORT_TYPES: { value: TransportType; label: string }[] = [
  { value: 'Pickup', label: 'Airport / Station Pickup' },
  { value: 'Drop', label: 'Airport / Station Drop' },
  { value: 'Custom', label: 'Inter-Venue Transfer' },
];

export const TRANSPORT_STATUSES: {
  value: TransportStatus;
  label: string;
  colorClass: string;
}[] = [
  { value: 'Planned', label: 'Planned / Unassigned', colorClass: 'text-[#8C7A8E] bg-[#F4EFEA]' },
  { value: 'Confirmed', label: 'Driver Confirmed', colorClass: 'text-[#9E5D0A] bg-[#FFF2E0]' },
  { value: 'Completed', label: 'Trip Completed', colorClass: 'text-[#2D5A43] bg-[#EAF3EC]' },
  { value: 'Cancelled', label: 'Cancelled', colorClass: 'text-[#C93B2B] bg-[#FFF0F0]' },
];
