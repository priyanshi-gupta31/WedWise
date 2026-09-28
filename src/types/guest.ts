export type WeddingSide = 'Bride' | 'Groom' | 'Both' | 'Other';

export type RSVPStatus = 'Invited' | 'Awaiting Response' | 'Confirmed' | 'Maybe' | 'Declined';

export type FoodPreference = 'Vegetarian' | 'Non-Vegetarian' | 'Jain' | 'Vegan' | 'Other';

export type AccommodationStatus = 'Requested' | 'Assigned' | 'Checked In' | 'Checked Out';

export type TransportType = 'Pickup' | 'Drop' | 'Custom';

export type TransportStatus = 'Planned' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface Guest {
  id: string;
  wedding_id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  family_group: string;
  wedding_side: WeddingSide;
  accompanying_members: number; // Headcount = 1 + accompanying_members
  adults_count?: number | null;
  children_count?: number | null;
  rsvp_status: RSVPStatus;
  food_preference?: FoodPreference | null;
  accommodation_required: boolean;
  transport_required: boolean;
  notes?: string | null;
  invited_events?: string[]; // Array of event IDs
  created_at?: string;
  updated_at?: string;
}

export interface GuestAccommodation {
  id: string;
  wedding_id: string;
  guest_id: string;
  guest?: Guest;
  hotel_name: string;
  room_number?: string | null;
  room_type?: string | null;
  check_in_date: string;
  check_out_date: string;
  occupants_count: number;
  payment_status: 'Paid' | 'Pending' | 'Complimentary';
  status: AccommodationStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GuestTransport {
  id: string;
  wedding_id: string;
  guest_id: string;
  guest?: Guest;
  transport_type: TransportType;
  pickup_location: string;
  destination: string;
  date: string;
  time: string;
  driver_name?: string | null;
  driver_phone?: string | null;
  vehicle_details?: string | null;
  status: TransportStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GuestFormData {
  full_name: string;
  phone?: string;
  email?: string;
  family_group: string;
  wedding_side: WeddingSide;
  accompanying_members: number;
  adults_count?: number;
  children_count?: number;
  rsvp_status: RSVPStatus;
  food_preference?: FoodPreference;
  accommodation_required: boolean;
  transport_required: boolean;
  notes?: string;
  invited_events?: string[];
}

export interface AccommodationFormData {
  guest_id: string;
  hotel_name: string;
  room_number?: string;
  room_type?: string;
  check_in_date: string;
  check_out_date: string;
  occupants_count: number;
  payment_status: 'Paid' | 'Pending' | 'Complimentary';
  status: AccommodationStatus;
  notes?: string;
}

export interface TransportFormData {
  guest_id: string;
  transport_type: TransportType;
  pickup_location: string;
  destination: string;
  date: string;
  time: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_details?: string;
  status: TransportStatus;
  notes?: string;
}

export interface GuestMetricsSummary {
  totalParties: number;
  totalInvitedHeadcount: number;
  confirmedParties: number;
  confirmedHeadcount: number;
  awaitingParties: number;
  awaitingHeadcount: number;
  maybeParties: number;
  maybeHeadcount: number;
  declinedParties: number;
  declinedHeadcount: number;
  adultsCount: number;
  childrenCount: number;
  needingAccommodationCount: number;
  needingTransportCount: number;
}

export interface GroupSummary {
  groupName: string;
  totalGuests: number;
  totalHeadcount: number;
  confirmed: number;
  awaiting: number;
  declined: number;
}

export interface SideSummary {
  side: WeddingSide;
  totalGuests: number;
  totalHeadcount: number;
  confirmed: number;
  awaiting: number;
  declined: number;
}

export interface EventGuestStats {
  invitedCount: number;
  confirmedCount: number;
  awaitingCount: number;
  needingAccommodationCount: number;
  needingTransportCount: number;
  guests: Guest[];
}
