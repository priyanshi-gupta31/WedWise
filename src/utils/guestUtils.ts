import {
  Guest,
  GuestMetricsSummary,
  GroupSummary,
  SideSummary,
  EventGuestStats,
  WeddingSide,
} from '../types/guest';
import { DEFAULT_GUEST_GROUPS, WEDDING_SIDES } from '../constants/guestConstants';

/**
 * Computes live, deterministic metrics across the wedding guest directory
 */
export function calculateGuestMetrics(guests: Guest[]): GuestMetricsSummary {
  let totalParties = guests.length;
  let totalInvitedHeadcount = 0;
  let confirmedParties = 0;
  let confirmedHeadcount = 0;
  let awaitingParties = 0;
  let awaitingHeadcount = 0;
  let maybeParties = 0;
  let maybeHeadcount = 0;
  let declinedParties = 0;
  let declinedHeadcount = 0;
  let adultsCount = 0;
  let childrenCount = 0;
  let needingAccommodationCount = 0;
  let needingTransportCount = 0;

  guests.forEach((g) => {
    const partySize = 1 + (Number(g.accompanying_members) || 0);
    totalInvitedHeadcount += partySize;

    if (g.adults_count !== undefined && g.adults_count !== null) {
      adultsCount += Number(g.adults_count);
    } else {
      adultsCount += partySize - (Number(g.children_count) || 0);
    }

    if (g.children_count) {
      childrenCount += Number(g.children_count);
    }

    if (g.rsvp_status === 'Confirmed') {
      confirmedParties += 1;
      confirmedHeadcount += partySize;
    } else if (g.rsvp_status === 'Awaiting Response' || g.rsvp_status === 'Invited') {
      awaitingParties += 1;
      awaitingHeadcount += partySize;
    } else if (g.rsvp_status === 'Maybe') {
      maybeParties += 1;
      maybeHeadcount += partySize;
    } else if (g.rsvp_status === 'Declined') {
      declinedParties += 1;
      declinedHeadcount += partySize;
    }

    if (g.accommodation_required) {
      needingAccommodationCount += partySize;
    }

    if (g.transport_required) {
      needingTransportCount += partySize;
    }
  });

  return {
    totalParties,
    totalInvitedHeadcount,
    confirmedParties,
    confirmedHeadcount,
    awaitingParties,
    awaitingHeadcount,
    maybeParties,
    maybeHeadcount,
    declinedParties,
    declinedHeadcount,
    adultsCount,
    childrenCount,
    needingAccommodationCount,
    needingTransportCount,
  };
}

/**
 * Calculates breakdowns by guest groups (e.g. Bride Family, Groom Family, Friends, VIP)
 */
export function calculateGroupSummaries(guests: Guest[]): GroupSummary[] {
  // Discover all groups present in data + defaults
  const groupSet = new Set<string>(DEFAULT_GUEST_GROUPS);
  guests.forEach((g) => {
    if (g.family_group) groupSet.add(g.family_group);
  });

  return Array.from(groupSet).map((groupName) => {
    const groupGuests = guests.filter((g) => g.family_group === groupName);
    let totalHeadcount = 0;
    let confirmed = 0;
    let awaiting = 0;
    let declined = 0;

    groupGuests.forEach((g) => {
      const partySize = 1 + (Number(g.accompanying_members) || 0);
      totalHeadcount += partySize;
      if (g.rsvp_status === 'Confirmed') confirmed += partySize;
      else if (g.rsvp_status === 'Declined') declined += partySize;
      else awaiting += partySize;
    });

    return {
      groupName,
      totalGuests: groupGuests.length,
      totalHeadcount,
      confirmed,
      awaiting,
      declined,
    };
  });
}

/**
 * Calculates breakdowns by wedding side (Bride, Groom, Both, Other)
 */
export function calculateSideSummaries(guests: Guest[]): SideSummary[] {
  const sides: WeddingSide[] = ['Bride', 'Groom', 'Both', 'Other'];

  return sides.map((side) => {
    const sideGuests = guests.filter((g) => g.wedding_side === side);
    let totalHeadcount = 0;
    let confirmed = 0;
    let awaiting = 0;
    let declined = 0;

    sideGuests.forEach((g) => {
      const partySize = 1 + (Number(g.accompanying_members) || 0);
      totalHeadcount += partySize;
      if (g.rsvp_status === 'Confirmed') confirmed += partySize;
      else if (g.rsvp_status === 'Declined') declined += partySize;
      else awaiting += partySize;
    });

    return {
      side,
      totalGuests: sideGuests.length,
      totalHeadcount,
      confirmed,
      awaiting,
      declined,
    };
  });
}

/**
 * Smart, non-blocking deduplication checker
 * Checks for identical phone numbers or matching full names
 */
export function findDuplicateGuest(
  guests: Guest[],
  name: string,
  phone?: string | null,
  excludeId?: string
): Guest | null {
  const cleanName = name.toLowerCase().replace(/\s+/g, ' ').trim();
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

  if (!cleanName && !cleanPhone) return null;

  return (
    guests.find((g) => {
      if (excludeId && g.id === excludeId) return false;

      // Check phone match
      if (cleanPhone && cleanPhone.length >= 7 && g.phone) {
        const otherPhone = g.phone.replace(/\D/g, '');
        if (otherPhone === cleanPhone) return true;
      }

      // Check name match
      if (cleanName && cleanName.length >= 3) {
        const otherName = g.full_name.toLowerCase().replace(/\s+/g, ' ').trim();
        if (otherName === cleanName) return true;
      }

      return false;
    }) || null
  );
}

/**
 * Computes ceremony-specific guest statistics
 */
export function getEventGuestStats(guests: Guest[], eventId: string): EventGuestStats {
  const eventGuests = guests.filter(
    (g) => g.invited_events && g.invited_events.includes(eventId)
  );

  let invitedCount = 0;
  let confirmedCount = 0;
  let awaitingCount = 0;
  let needingAccommodationCount = 0;
  let needingTransportCount = 0;

  eventGuests.forEach((g) => {
    const partySize = 1 + (Number(g.accompanying_members) || 0);
    invitedCount += partySize;
    if (g.rsvp_status === 'Confirmed') {
      confirmedCount += partySize;
    } else if (g.rsvp_status !== 'Declined') {
      awaitingCount += partySize;
    }

    if (g.accommodation_required) needingAccommodationCount += partySize;
    if (g.transport_required) needingTransportCount += partySize;
  });

  return {
    invitedCount,
    confirmedCount,
    awaitingCount,
    needingAccommodationCount,
    needingTransportCount,
    guests: eventGuests,
  };
}
