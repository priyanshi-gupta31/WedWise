import React, { useState, useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
import { useToast } from '../context/ToastContext';
import {
  Guest,
  GuestAccommodation,
  GuestTransport,
  WeddingSide,
} from '../types/guest';
import {
  DEFAULT_GUEST_GROUPS,
  WEDDING_SIDES,
  RSVP_STATUSES,
  ACCOMMODATION_STATUSES,
  TRANSPORT_STATUSES,
} from '../constants/guestConstants';
import { GuestFormModal } from '../components/guests/GuestFormModal';
import { GuestDetailsModal } from '../components/guests/GuestDetailsModal';
import { GuestFilterDrawer, GuestFilterState } from '../components/guests/GuestFilterDrawer';
import { AccommodationFormModal } from '../components/accommodation/AccommodationFormModal';
import { TransportFormModal } from '../components/transport/TransportFormModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { FloralArchArt } from '../components/common/FloralArchArt';
import {
  Users,
  UserPlus,
  Hotel,
  Car,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
  Bed,
  MapPin,
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
  Utensils,
  Plus,
} from 'lucide-react';

const initialFilters: GuestFilterState = {
  side: 'all',
  group: 'all',
  rsvp: 'all',
  accommodation: 'all',
  transport: 'all',
  food: 'all',
};

export const WeddingGuestsPage: React.FC = () => {
  const {
    guests,
    accommodations,
    transports,
    events,
    guestMetrics,
    groupSummaries,
    sideSummaries,
    deleteGuest,
    deleteAccommodation,
    deleteTransport,
  } = useWedding();
  const { showToast } = useToast();

  // Tab State: 'directory' | 'accommodation' | 'transport'
  const [activeTab, setActiveTab] = useState<'directory' | 'accommodation' | 'transport'>('directory');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sideQuickFilter, setSideQuickFilter] = useState<WeddingSide | 'all'>('all');
  const [filters, setFilters] = useState<GuestFilterState>(initialFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Modals state
  const [isGuestFormOpen, setIsGuestFormOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<Guest | null>(null);

  const [isGuestDetailsOpen, setIsGuestDetailsOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const [isAccFormOpen, setIsAccFormOpen] = useState(false);
  const [accToEdit, setAccToEdit] = useState<GuestAccommodation | null>(null);
  const [defaultGuestIdForAcc, setDefaultGuestIdForAcc] = useState<string | undefined>(undefined);

  const [isTransFormOpen, setIsTransFormOpen] = useState(false);
  const [transToEdit, setTransToEdit] = useState<GuestTransport | null>(null);
  const [defaultGuestIdForTrans, setDefaultGuestIdForTrans] = useState<string | undefined>(undefined);

  // Confirm delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'guest' | 'accommodation' | 'transport';
    id: string;
    title: string;
    message: string;
  } | null>(null);

  // Available groups for filter drawer
  const availableGroups = useMemo(() => {
    const set = new Set<string>(DEFAULT_GUEST_GROUPS);
    guests.forEach((g) => {
      if (g.family_group) set.add(g.family_group);
    });
    return Array.from(set);
  }, [guests]);

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.side !== 'all') count++;
    if (filters.group !== 'all') count++;
    if (filters.rsvp !== 'all') count++;
    if (filters.accommodation !== 'all') count++;
    if (filters.transport !== 'all') count++;
    if (filters.food !== 'all') count++;
    return count;
  }, [filters]);

  // Filtered guests
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = guest.full_name.toLowerCase().includes(q);
        const matchesPhone = (guest.phone || '').toLowerCase().includes(q);
        const matchesGroup = guest.family_group.toLowerCase().includes(q);
        const matchesNotes = (guest.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesGroup && !matchesNotes) {
          return false;
        }
      }

      // Quick side filter
      if (sideQuickFilter !== 'all' && guest.wedding_side !== sideQuickFilter) {
        return false;
      }

      // Drawer filters
      if (filters.side !== 'all' && guest.wedding_side !== filters.side) return false;
      if (filters.group !== 'all' && guest.family_group !== filters.group) return false;
      if (filters.rsvp !== 'all' && guest.rsvp_status !== filters.rsvp) return false;
      if (filters.accommodation === 'needed' && !guest.accommodation_required) return false;
      if (filters.accommodation === 'not_needed' && guest.accommodation_required) return false;
      if (filters.transport === 'needed' && !guest.transport_required) return false;
      if (filters.transport === 'not_needed' && guest.transport_required) return false;
      if (filters.food !== 'all' && guest.food_preference !== filters.food) return false;

      return true;
    });
  }, [guests, searchQuery, sideQuickFilter, filters]);

  // Guests needing room without an accommodation allotted
  const unallottedAccommodationGuests = useMemo(() => {
    const allottedGuestIds = new Set(accommodations.map((a) => a.guest_id));
    return guests.filter((g) => g.accommodation_required && !allottedGuestIds.has(g.id));
  }, [guests, accommodations]);

  // Guests needing transport without a scheduled trip
  const unscheduledTransportGuests = useMemo(() => {
    const scheduledGuestIds = new Set(transports.map((t) => t.guest_id));
    return guests.filter((g) => g.transport_required && !scheduledGuestIds.has(g.id));
  }, [guests, transports]);

  // Accommodations grouped by hotel
  const accommodationsByHotel = useMemo(() => {
    const map = new Map<string, GuestAccommodation[]>();
    accommodations.forEach((acc) => {
      const hotel = acc.hotel_name || 'Unspecified Hotel';
      if (!map.has(hotel)) {
        map.set(hotel, []);
      }
      map.get(hotel)!.push(acc);
    });
    return Array.from(map.entries());
  }, [accommodations]);

  // Handlers for Modals
  const handleOpenCreateGuest = () => {
    setGuestToEdit(null);
    setIsGuestFormOpen(true);
  };

  const handleEditGuest = (guest: Guest) => {
    setIsGuestDetailsOpen(false);
    setGuestToEdit(guest);
    setIsGuestFormOpen(true);
  };

  const handleOpenGuestDetails = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsGuestDetailsOpen(true);
  };

  const handleAllotRoomForGuest = (guestId?: string) => {
    setIsGuestDetailsOpen(false);
    setAccToEdit(null);
    setDefaultGuestIdForAcc(guestId);
    setIsAccFormOpen(true);
  };

  const handleScheduleTransportForGuest = (guestId?: string) => {
    setIsGuestDetailsOpen(false);
    setTransToEdit(null);
    setDefaultGuestIdForTrans(guestId);
    setIsTransFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'guest') {
        await deleteGuest(deleteTarget.id);
        showToast('Guest removed successfully', 'success');
        if (selectedGuest?.id === deleteTarget.id) {
          setIsGuestDetailsOpen(false);
        }
      } else if (deleteTarget.type === 'accommodation') {
        await deleteAccommodation(deleteTarget.id);
        showToast('Room allotment deleted', 'success');
      } else if (deleteTarget.type === 'transport') {
        await deleteTransport(deleteTarget.id);
        showToast('Transport schedule deleted', 'success');
      }
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Helper map to find guest name for an accommodation or transport entry
  const guestMap = useMemo(() => {
    const map = new Map<string, Guest>();
    guests.forEach((g) => map.set(g.id, g));
    return map;
  }, [guests]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24 text-[#16162A]">
      {/* Editorial Top Hero */}
      <section className="bg-gradient-to-b from-[#FAF6F0] via-[#FAF6F0] to-[#FDFBF7] border-b border-[#E8DFD5] pt-6 sm:pt-10 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Tag */}
          <div className="flex items-center space-x-2 text-xs font-serif uppercase tracking-widest text-[#E89838] mb-2 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Wedding Guest Book</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#16162A]">
                The Wedding Guests
              </h1>
              <p className="text-sm sm:text-base text-[#615163] mt-2 max-w-2xl font-serif italic">
                A shared family record of cherished guests, RSVPs, room allotments, and wedding journeys.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleOpenCreateGuest}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#641F35] text-white hover:bg-[#52192B] shadow-sm hover:shadow transition-all text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Guest</span>
              </button>
              <button
                onClick={() => handleAllotRoomForGuest()}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD5] text-[#16162A] hover:border-[#E89838] hover:bg-amber-50/50 shadow-xs transition-all text-sm font-medium"
              >
                <Hotel className="w-4 h-4 text-[#E89838]" />
                <span>Allot Room</span>
              </button>
              <button
                onClick={() => handleScheduleTransportForGuest()}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFD5] text-[#16162A] hover:border-[#E89838] hover:bg-amber-50/50 shadow-xs transition-all text-sm font-medium"
              >
                <Car className="w-4 h-4 text-[#2D5A43]" />
                <span>Plan Ride</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#E8DFD5] shadow-xs">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#8C7A8E]">
                Total Invited
              </div>
              <div className="font-serif text-2xl font-bold text-[#16162A] mt-1">
                {guestMetrics.totalInvitedHeadcount}
              </div>
              <div className="text-[11px] text-[#615163] mt-0.5">
                {guestMetrics.totalParties} {guestMetrics.totalParties === 1 ? 'party' : 'parties'}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#A9CEB5]/50 shadow-xs">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#2D5A43]">
                Confirmed
              </div>
              <div className="font-serif text-2xl font-bold text-[#2D5A43] mt-1">
                {guestMetrics.confirmedHeadcount}
              </div>
              <div className="text-[11px] text-[#2D5A43]/80 mt-0.5">
                {guestMetrics.confirmedParties} attending
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#E89838]/40 shadow-xs">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#9E5D0A]">
                Awaiting RSVP
              </div>
              <div className="font-serif text-2xl font-bold text-[#9E5D0A] mt-1">
                {guestMetrics.awaitingHeadcount}
              </div>
              <div className="text-[11px] text-[#9E5D0A]/80 mt-0.5">
                {guestMetrics.awaitingParties} pending
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#F2B8B8]/60 shadow-xs">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#C93B2B]">
                Declined
              </div>
              <div className="font-serif text-2xl font-bold text-[#C93B2B] mt-1">
                {guestMetrics.declinedHeadcount}
              </div>
              <div className="text-[11px] text-[#C93B2B]/80 mt-0.5">
                {guestMetrics.declinedParties} regrets
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#E8DFD5] shadow-xs">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#641F35] flex items-center gap-1">
                <Hotel className="w-3 h-3 text-[#E89838]" /> Rooms Needed
              </div>
              <div className="font-serif text-2xl font-bold text-[#16162A] mt-1">
                {guestMetrics.needingAccommodationCount}
              </div>
              <div className="text-[11px] text-[#8C7A8E] mt-0.5">
                {accommodations.length} allotted
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-[#E8DFD5] shadow-xs">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#2D5A43] flex items-center gap-1">
                <Car className="w-3 h-3 text-[#2D5A43]" /> Pickups Needed
              </div>
              <div className="font-serif text-2xl font-bold text-[#16162A] mt-1">
                {guestMetrics.needingTransportCount}
              </div>
              <div className="text-[11px] text-[#8C7A8E] mt-0.5">
                {transports.length} trips planned
              </div>
            </div>
          </div>

          {/* Side Headcount Distribution Strip */}
          {guestMetrics.totalInvitedHeadcount > 0 && (
            <div className="mt-5 bg-white/60 rounded-xl p-3 border border-[#E8DFD5]/70">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-serif mb-2">
                <div className="flex flex-wrap items-center gap-3">
                  {sideSummaries.map((s) => (
                    <span key={s.side} className="text-[#16162A]">
                      <strong className="font-bold">{s.side}:</strong> {s.totalHeadcount} ({s.confirmed} confirmed)
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-[#8C7A8E] italic">Headcount Distribution</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden flex">
                {sideSummaries.map((s) => {
                  const pct = (s.totalHeadcount / (guestMetrics.totalInvitedHeadcount || 1)) * 100;
                  if (pct === 0) return null;
                  let bg = 'bg-[#641F35]';
                  if (s.side === 'Groom') bg = 'bg-[#2D5A43]';
                  if (s.side === 'Both') bg = 'bg-[#E89838]';
                  if (s.side === 'Other') bg = 'bg-stone-400';
                  return (
                    <div
                      key={s.side}
                      style={{ width: `${pct}%` }}
                      className={`${bg} h-full transition-all duration-500`}
                      title={`${s.side}: ${s.totalHeadcount} (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-px mb-6 overflow-x-auto">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('directory')}
              className={`pb-3 text-sm sm:text-base font-serif font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'directory'
                  ? 'text-[#16162A]'
                  : 'text-[#8C7A8E] hover:text-[#16162A]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Guest Directory</span>
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-[#615163] font-sans">
                  {filteredGuests.length}
                </span>
              </div>
              {activeTab === 'directory' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#641F35]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('accommodation')}
              className={`pb-3 text-sm sm:text-base font-serif font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'accommodation'
                  ? 'text-[#16162A]'
                  : 'text-[#8C7A8E] hover:text-[#16162A]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Hotel className="w-4 h-4" />
                <span>Stay & Rooms</span>
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-[#615163] font-sans">
                  {accommodations.length}
                </span>
                {unallottedAccommodationGuests.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#E89838]" title="Unallotted rooms pending" />
                )}
              </div>
              {activeTab === 'accommodation' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#641F35]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('transport')}
              className={`pb-3 text-sm sm:text-base font-serif font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'transport'
                  ? 'text-[#16162A]'
                  : 'text-[#8C7A8E] hover:text-[#16162A]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Car className="w-4 h-4" />
                <span>Pickups & Transfers</span>
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-[#615163] font-sans">
                  {transports.length}
                </span>
                {unscheduledTransportGuests.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#E89838]" title="Unscheduled pickups pending" />
                )}
              </div>
              {activeTab === 'transport' && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#641F35]" />
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: GUEST DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by guest name, phone, family group, notes..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DFD5] bg-white text-sm text-[#16162A] placeholder-[#8C7A8E] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 transition-colors shadow-xs"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A8E]" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C7A8E] hover:text-[#16162A]"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Side Quick Buttons & Filter Drawer Trigger */}
              <div className="flex items-center space-x-2">
                <div className="flex rounded-xl border border-[#E8DFD5] bg-white p-1 shadow-xs">
                  {(['all', 'Bride', 'Groom', 'Both'] as const).map((side) => (
                    <button
                      key={side}
                      onClick={() => setSideQuickFilter(side)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        sideQuickFilter === side
                          ? 'bg-[#16162A] text-white shadow-xs'
                          : 'text-[#615163] hover:text-[#16162A]'
                      }`}
                    >
                      {side === 'all' ? 'All Sides' : side}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all shadow-xs ${
                    activeFiltersCount > 0
                      ? 'bg-amber-50 border-[#E89838] text-[#9E5D0A]'
                      : 'bg-white border-[#E8DFD5] text-[#615163] hover:border-[#16162A]'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#E89838] text-white text-[10px] flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Guest Directory List */}
            {filteredGuests.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#E8DFD5] shadow-xs">
                <div className="max-w-md mx-auto">
                  <FloralArchArt className="w-24 h-24 mx-auto text-[#E89838] opacity-80 mb-3" />
                  <h3 className="font-serif text-2xl font-bold text-[#16162A]">
                    {searchQuery || activeFiltersCount > 0
                      ? 'No matching guests found'
                      : 'Your Guest Book is Waiting'}
                  </h3>
                  <p className="text-sm text-[#615163] font-serif italic mt-2">
                    {searchQuery || activeFiltersCount > 0
                      ? 'Try clearing or changing your filters to see more guests.'
                      : 'Begin recording your family members, friends, and distinguished attendees.'}
                  </p>
                  <div className="mt-6">
                    {searchQuery || activeFiltersCount > 0 ? (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSideQuickFilter('all');
                          setFilters(initialFilters);
                        }}
                        className="px-4 py-2 rounded-xl border border-[#E8DFD5] bg-white text-sm font-medium text-[#16162A] hover:bg-stone-50"
                      >
                        Reset All Filters
                      </button>
                    ) : (
                      <button
                        onClick={handleOpenCreateGuest}
                        className="px-5 py-2.5 rounded-xl bg-[#641F35] text-white text-sm font-medium hover:bg-[#52192B] shadow-sm"
                      >
                        + Invite First Wedding Guest
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGuests.map((guest) => {
                  const rsvp =
                    RSVP_STATUSES.find((s) => s.value === guest.rsvp_status) ||
                    RSVP_STATUSES[0];
                  const partyHeadcount = 1 + (Number(guest.accompanying_members) || 0);

                  // Check if guest has room assigned
                  const guestAcc = accommodations.filter((a) => a.guest_id === guest.id);
                  const guestTrans = transports.filter((t) => t.guest_id === guest.id);

                  return (
                    <div
                      key={guest.id}
                      onClick={() => handleOpenGuestDetails(guest)}
                      className="group bg-white rounded-2xl border border-[#E8DFD5] hover:border-[#E89838]/60 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left Info */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#16162A] group-hover:text-[#641F35] transition-colors truncate">
                              {guest.full_name}
                            </h3>

                            {/* RSVP Badge */}
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${rsvp.badgeBg} ${rsvp.badgeText} ${rsvp.badgeBorder}`}
                            >
                              {rsvp.label}
                            </span>

                            {/* Side Pill */}
                            <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-stone-100 text-[#615163]">
                              {guest.wedding_side} Side
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#615163]">
                            <span className="font-medium text-[#16162A]">
                              Group: <strong className="font-semibold text-[#641F35]">{guest.family_group}</strong>
                            </span>

                            <span>
                              Headcount: <strong className="font-semibold text-[#16162A]">{partyHeadcount}</strong>{' '}
                              ({guest.accompanying_members ? `+${guest.accompanying_members} family` : 'solo'})
                            </span>

                            {guest.phone && (
                              <a
                                href={`tel:${guest.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-[#8C7A8E] hover:text-[#16162A] transition-colors"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{guest.phone}</span>
                              </a>
                            )}
                          </div>

                          {/* Invited Ceremonies Tags */}
                          {guest.invited_events && guest.invited_events.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-1">
                              <span className="text-[10px] text-[#8C7A8E] mr-1">Events:</span>
                              {guest.invited_events.map((evId) => {
                                const ev = events.find((e) => e.id === evId);
                                if (!ev) return null;
                                return (
                                  <span
                                    key={evId}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50/70 border border-[#E8DFD5] text-[#9E5D0A]"
                                  >
                                    {ev.event_name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Right Logistics Indicators & Quick Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F4EFEA]">
                          <div className="flex items-center gap-2">
                            {/* Accommodation Badge */}
                            {guest.accommodation_required && (
                              <span
                                title={
                                  guestAcc.length > 0
                                    ? `Room allotted: ${guestAcc[0].hotel_name}`
                                    : 'Room required (unassigned)'
                                }
                                className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border ${
                                  guestAcc.length > 0
                                    ? 'bg-[#FAF1F3] text-[#641F35] border-[#E8DFD5]'
                                    : 'bg-[#FFF2E0] text-[#9E5D0A] border-[#E89838]/40'
                                }`}
                              >
                                <Hotel className="w-3.5 h-3.5" />
                                <span>{guestAcc.length > 0 ? 'Room Allotted' : 'Room Needed'}</span>
                              </span>
                            )}

                            {/* Transport Badge */}
                            {guest.transport_required && (
                              <span
                                title={
                                  guestTrans.length > 0
                                    ? `Transport scheduled (${guestTrans.length} trip)`
                                    : 'Transport required (unscheduled)'
                                }
                                className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border ${
                                  guestTrans.length > 0
                                    ? 'bg-[#EAF3EC] text-[#2D5A43] border-[#A9CEB5]'
                                    : 'bg-[#FFF2E0] text-[#9E5D0A] border-[#E89838]/40'
                                }`}
                              >
                                <Car className="w-3.5 h-3.5" />
                                <span>{guestTrans.length > 0 ? 'Ride Set' : 'Ride Needed'}</span>
                              </span>
                            )}

                            {/* Food Preference Badge */}
                            {guest.food_preference && guest.food_preference !== 'Vegetarian' && (
                              <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-stone-100 text-[#615163]">
                                <Utensils className="w-3 h-3 text-[#8C7A8E]" />
                                <span>{guest.food_preference}</span>
                              </span>
                            )}
                          </div>

                          <ChevronRight className="w-4 h-4 text-[#8C7A8E] group-hover:text-[#641F35] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STAY & ACCOMMODATION */}
        {activeTab === 'accommodation' && (
          <div className="space-y-6">
            {/* Top Stat Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 border border-[#E8DFD5] shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#8C7A8E] uppercase tracking-wider">
                    Total Rooms Allotted
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#16162A] mt-1">
                    {accommodations.length}
                  </div>
                </div>
                <Hotel className="w-8 h-8 text-[#E89838] opacity-80" />
              </div>

              <div className="bg-white rounded-xl p-4 border border-[#E8DFD5] shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#8C7A8E] uppercase tracking-wider">
                    Guests Accommodated
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#2D5A43] mt-1">
                    {accommodations.reduce((acc, curr) => acc + (curr.occupants_count || 0), 0)}
                  </div>
                </div>
                <Users className="w-8 h-8 text-[#2D5A43] opacity-80" />
              </div>

              <div className="bg-white rounded-xl p-4 border border-[#E8DFD5] shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#8C7A8E] uppercase tracking-wider">
                    Unassigned Requests
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#9E5D0A] mt-1">
                    {unallottedAccommodationGuests.length}
                  </div>
                </div>
                <AlertTriangle className="w-8 h-8 text-[#E89838] opacity-80" />
              </div>
            </div>

            {/* Unassigned Warning Strip */}
            {unallottedAccommodationGuests.length > 0 && (
              <div className="bg-[#FFF8EE] rounded-2xl border border-[#E89838]/40 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#9E5D0A]">
                    <AlertTriangle className="w-4 h-4 text-[#E89838]" />
                    <span>{unallottedAccommodationGuests.length} guests requested hotel rooms</span>
                  </div>
                  <span className="text-xs text-[#8C7A8E] font-serif italic">Pending Allotment</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {unallottedAccommodationGuests.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E8DFD5] text-xs"
                    >
                      <span className="font-medium text-[#16162A]">{g.full_name}</span>
                      <span className="text-[10px] text-[#8C7A8E]">
                        ({1 + (g.accompanying_members || 0)} guests)
                      </span>
                      <button
                        onClick={() => handleAllotRoomForGuest(g.id)}
                        className="text-[11px] font-semibold text-[#641F35] hover:underline ml-1"
                      >
                        + Assign
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotel Groups List */}
            {accommodations.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#E8DFD5] shadow-xs">
                <Hotel className="w-16 h-16 mx-auto text-[#E89838] opacity-80 mb-3" />
                <h3 className="font-serif text-2xl font-bold text-[#16162A]">No Rooms Allotted Yet</h3>
                <p className="text-sm text-[#615163] font-serif italic mt-2 max-w-md mx-auto">
                  Assign hotels, room numbers, and dates to incoming family members and friends.
                </p>
                <button
                  onClick={() => handleAllotRoomForGuest()}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-[#641F35] text-white text-sm font-medium hover:bg-[#52192B]"
                >
                  + Allot First Room
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {accommodationsByHotel.map(([hotelName, roomList]) => (
                  <div
                    key={hotelName}
                    className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs overflow-hidden"
                  >
                    {/* Hotel Header */}
                    <div className="bg-[#FAF8F5] px-5 py-3.5 border-b border-[#E8DFD5] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hotel className="w-4 h-4 text-[#E89838]" />
                        <h4 className="font-serif font-bold text-lg text-[#16162A]">{hotelName}</h4>
                      </div>
                      <span className="text-xs text-[#615163] font-medium">
                        {roomList.length} {roomList.length === 1 ? 'room' : 'rooms'} allotted ·{' '}
                        {roomList.reduce((sum, r) => sum + (r.occupants_count || 0), 0)} guests
                      </span>
                    </div>

                    {/* Rooms in this hotel */}
                    <div className="divide-y divide-[#F4EFEA]">
                      {roomList.map((room) => {
                        const guest = guestMap.get(room.guest_id);
                        const statusConfig =
                          ACCOMMODATION_STATUSES.find((s) => s.value === room.status) ||
                          ACCOMMODATION_STATUSES[1];

                        return (
                          <div
                            key={room.id}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FFFDF9] transition-colors"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="font-serif font-bold text-base text-[#16162A]">
                                  {guest ? guest.full_name : 'Unknown Guest'}
                                </h5>
                                <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 text-[#615163] font-medium">
                                  {room.room_number ? `Room ${room.room_number}` : 'Room Pending'}
                                </span>
                                {room.room_type && (
                                  <span className="text-xs text-[#8C7A8E] font-serif italic">
                                    ({room.room_type})
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#615163]">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-[#8C7A8E]" />
                                  <span>
                                    {room.check_in_date} → {room.check_out_date}
                                  </span>
                                </span>

                                <span>
                                  Occupants: <strong className="font-semibold">{room.occupants_count}</strong>
                                </span>

                                <span className="font-medium text-[#641F35]">
                                  {room.payment_status === 'Complimentary'
                                    ? 'Host Paid'
                                    : `Billing: ${room.payment_status}`}
                                </span>
                              </div>

                              {room.notes && (
                                <p className="text-xs text-[#8C7A8E] font-serif italic pt-0.5">
                                  Note: {room.notes}
                                </p>
                              )}
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
                              <span
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig.colorClass}`}
                              >
                                {statusConfig.label}
                              </span>

                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    setAccToEdit(room);
                                    setIsAccFormOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-[#8C7A8E] hover:text-[#16162A] hover:bg-stone-100 transition-colors"
                                  title="Edit Allotment"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget({
                                      type: 'accommodation',
                                      id: room.id,
                                      title: 'Delete Room Allotment',
                                      message: `Are you sure you want to delete the room allotment for ${
                                        guest ? guest.full_name : 'this guest'
                                      }?`,
                                    });
                                  }}
                                  className="p-1.5 rounded-lg text-[#8C7A8E] hover:text-[#C93B2B] hover:bg-red-50 transition-colors"
                                  title="Delete Allotment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRANSPORT & TRANSFERS */}
        {activeTab === 'transport' && (
          <div className="space-y-6">
            {/* Top Stat Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 border border-[#E8DFD5] shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#8C7A8E] uppercase tracking-wider">
                    Total Scheduled Trips
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#16162A] mt-1">
                    {transports.length}
                  </div>
                </div>
                <Car className="w-8 h-8 text-[#2D5A43] opacity-80" />
              </div>

              <div className="bg-white rounded-xl p-4 border border-[#E8DFD5] shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#8C7A8E] uppercase tracking-wider">
                    Confirmed Drivers
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#641F35] mt-1">
                    {transports.filter((t) => t.status === 'Confirmed' || Boolean(t.driver_name)).length}
                  </div>
                </div>
                <CheckCircle2 className="w-8 h-8 text-[#641F35] opacity-80" />
              </div>

              <div className="bg-white rounded-xl p-4 border border-[#E8DFD5] shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#8C7A8E] uppercase tracking-wider">
                    Unscheduled Requests
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#9E5D0A] mt-1">
                    {unscheduledTransportGuests.length}
                  </div>
                </div>
                <AlertTriangle className="w-8 h-8 text-[#E89838] opacity-80" />
              </div>
            </div>

            {/* Unscheduled Warning Strip */}
            {unscheduledTransportGuests.length > 0 && (
              <div className="bg-[#FFF8EE] rounded-2xl border border-[#E89838]/40 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#9E5D0A]">
                    <AlertTriangle className="w-4 h-4 text-[#E89838]" />
                    <span>{unscheduledTransportGuests.length} guests requested airport/station pickups</span>
                  </div>
                  <span className="text-xs text-[#8C7A8E] font-serif italic">Pending Schedule</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {unscheduledTransportGuests.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E8DFD5] text-xs"
                    >
                      <span className="font-medium text-[#16162A]">{g.full_name}</span>
                      <span className="text-[10px] text-[#8C7A8E]">
                        ({1 + (g.accompanying_members || 0)} guests)
                      </span>
                      <button
                        onClick={() => handleScheduleTransportForGuest(g.id)}
                        className="text-[11px] font-semibold text-[#2D5A43] hover:underline ml-1"
                      >
                        + Schedule
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transport Trips List */}
            {transports.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#E8DFD5] shadow-xs">
                <Car className="w-16 h-16 mx-auto text-[#2D5A43] opacity-80 mb-3" />
                <h3 className="font-serif text-2xl font-bold text-[#16162A]">Transport is Ready to Plan</h3>
                <p className="text-sm text-[#615163] font-serif italic mt-2 max-w-md mx-auto">
                  Organize airport pickups, railway station drops, and bridal car logistics with assigned drivers.
                </p>
                <button
                  onClick={() => handleScheduleTransportForGuest()}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-[#2D5A43] text-white text-sm font-medium hover:bg-[#234734]"
                >
                  + Schedule First Trip
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {transports.map((trip) => {
                  const guest = guestMap.get(trip.guest_id);
                  const statusConfig =
                    TRANSPORT_STATUSES.find((s) => s.value === trip.status) ||
                    TRANSPORT_STATUSES[0];

                  return (
                    <div
                      key={trip.id}
                      className="bg-white rounded-2xl border border-[#E8DFD5] hover:border-[#2D5A43]/50 p-4 sm:p-5 shadow-xs transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-[#9E5D0A] border border-[#E89838]/30">
                              {trip.transport_type}
                            </span>
                            <h4 className="font-serif font-bold text-base text-[#16162A]">
                              {guest ? guest.full_name : 'Unknown Guest'}
                            </h4>
                            {guest && (
                              <span className="text-xs text-[#8C7A8E]">
                                ({1 + (guest.accompanying_members || 0)} guests)
                              </span>
                            )}
                          </div>

                          {/* Route */}
                          <div className="flex items-center gap-2 text-sm font-medium text-[#16162A] pt-0.5">
                            <MapPin className="w-4 h-4 text-[#E89838] shrink-0" />
                            <span>{trip.pickup_location}</span>
                            <span className="text-[#8C7A8E]">→</span>
                            <MapPin className="w-4 h-4 text-[#2D5A43] shrink-0" />
                            <span>{trip.destination}</span>
                          </div>

                          {/* Date & Time */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#615163] pt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#8C7A8E]" />
                              <span>{trip.date} at {trip.time}</span>
                            </span>

                            {trip.driver_name && (
                              <span className="font-medium text-[#16162A]">
                                Driver: {trip.driver_name}
                                {trip.driver_phone && (
                                  <a
                                    href={`tel:${trip.driver_phone}`}
                                    className="ml-1 text-[#2D5A43] hover:underline"
                                  >
                                    ({trip.driver_phone})
                                  </a>
                                )}
                              </span>
                            )}

                            {trip.vehicle_details && (
                              <span className="text-[#8C7A8E]">
                                Car: {trip.vehicle_details}
                              </span>
                            )}
                          </div>

                          {trip.notes && (
                            <p className="text-xs text-[#8C7A8E] font-serif italic pt-0.5">
                              Note: {trip.notes}
                            </p>
                          )}
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig.colorClass}`}
                          >
                            {statusConfig.label}
                          </span>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setTransToEdit(trip);
                                setIsTransFormOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-[#8C7A8E] hover:text-[#16162A] hover:bg-stone-100 transition-colors"
                              title="Edit Trip"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({
                                  type: 'transport',
                                  id: trip.id,
                                  title: 'Delete Transport Trip',
                                  message: `Are you sure you want to delete the transport trip for ${
                                    guest ? guest.full_name : 'this guest'
                                  }?`,
                                });
                              }}
                              className="p-1.5 rounded-lg text-[#8C7A8E] hover:text-[#C93B2B] hover:bg-red-50 transition-colors"
                              title="Delete Trip"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Guest Form Modal (Create / Edit) */}
      <GuestFormModal
        isOpen={isGuestFormOpen}
        onClose={() => setIsGuestFormOpen(false)}
        guestToEdit={guestToEdit}
      />

      {/* Guest Details Modal */}
      <GuestDetailsModal
        isOpen={isGuestDetailsOpen}
        onClose={() => setIsGuestDetailsOpen(false)}
        guest={selectedGuest}
        onEdit={handleEditGuest}
        onAssignRoom={(guestId) => handleAllotRoomForGuest(guestId)}
        onPlanTransport={(guestId) => handleScheduleTransportForGuest(guestId)}
      />

      {/* Guest Advanced Filter Drawer */}
      <GuestFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        availableGroups={availableGroups}
      />

      {/* Accommodation Form Modal */}
      <AccommodationFormModal
        isOpen={isAccFormOpen}
        onClose={() => setIsAccFormOpen(false)}
        accommodationToEdit={accToEdit}
        defaultGuestId={defaultGuestIdForAcc}
      />

      {/* Transport Form Modal */}
      <TransportFormModal
        isOpen={isTransFormOpen}
        onClose={() => setIsTransFormOpen(false)}
        transportToEdit={transToEdit}
        defaultGuestId={defaultGuestIdForTrans}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.title || 'Confirm Deletion'}
        message={deleteTarget?.message || 'Are you sure you want to delete this item?'}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};
