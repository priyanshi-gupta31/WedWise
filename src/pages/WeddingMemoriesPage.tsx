import React, { useState, useMemo, useEffect } from 'react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WeddingMemory, MemoryVisibility } from '../types/memories';
import { MemoryEntryCard } from '../components/memories/MemoryEntryCard';
import { MemoryFormModal } from '../components/memories/MemoryFormModal';
import { MemoryDetailsModal } from '../components/memories/MemoryDetailsModal';
import { CoupleCelebrationArt } from '../components/common/WedWiseIllustrations';
import {
  Sparkles,
  Plus,
  Filter,
  X,
  Calendar,
  Users,
  Lock,
  Globe,
  Search,
  RotateCcw,
  Camera,
  ChevronDown,
} from 'lucide-react';

interface WeddingMemoriesPageProps {
  initialEventId?: string | null;
  initialMemoryId?: string | null;
  onNavigateToEvent?: (eventId: string) => void;
}

export const WeddingMemoriesPage: React.FC<WeddingMemoriesPageProps> = ({
  initialEventId,
  initialMemoryId,
  onNavigateToEvent,
}) => {
  const { wedding, events, guests, memories, can, deleteMemory } = useWedding();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Filters State
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || 'all');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');
  const [selectedGuestId, setSelectedGuestId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [memoryToEdit, setMemoryToEdit] = useState<WeddingMemory | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<WeddingMemory | null>(null);

  // Sync initialEventId when it changes (e.g. from ceremony deep link)
  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(initialEventId);
    }
  }, [initialEventId]);

  // Sync initialMemoryId when it changes (e.g. from Home archive filmstrip or direct URL)
  useEffect(() => {
    if (initialMemoryId && memories.length > 0) {
      const match = memories.find((m) => m.id === initialMemoryId);
      if (match) {
        setSelectedMemory(match);
      }
    }
  }, [initialMemoryId, memories]);

  // Active filters count
  const activeFiltersCount =
    (selectedEventId !== 'all' ? 1 : 0) +
    (selectedVisibility !== 'all' ? 1 : 0) +
    (selectedGuestId !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedEventId('all');
    setSelectedVisibility('all');
    setSelectedGuestId('all');
    setSearchQuery('');
  };

  // Filtered memories
  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      // Event filter
      if (selectedEventId !== 'all') {
        if (selectedEventId === 'no-event') {
          if (m.event_id) return false;
        } else if (m.event_id !== selectedEventId) {
          return false;
        }
      }

      // Visibility filter
      if (selectedVisibility !== 'all' && m.visibility !== selectedVisibility) {
        return false;
      }

      // Guest tag filter
      if (selectedGuestId !== 'all') {
        const hasGuest = m.people_tags?.some((t) => t.guest_id === selectedGuestId);
        if (!hasGuest) return false;
      }

      // Search query (title, caption, location)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = m.title.toLowerCase().includes(query);
        const inStory = (m.story_caption || '').toLowerCase().includes(query);
        const inLoc = (m.location || '').toLowerCase().includes(query);
        const inEvent = (m.event?.event_name || '').toLowerCase().includes(query);
        if (!inTitle && !inStory && !inLoc && !inEvent) return false;
      }

      return true;
    });
  }, [memories, selectedEventId, selectedVisibility, selectedGuestId, searchQuery]);

  // Group memories dynamically around wedding ceremonies and phases
  const groupedTimeline = useMemo(() => {
    if (!filteredMemories.length) return [];

    // Chronologically sorted events
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstEventDate = sortedEvents[0]?.date || wedding?.wedding_date || '';
    const lastEventDate = sortedEvents[sortedEvents.length - 1]?.date || wedding?.wedding_date || '';

    // Buckets:
    // 1. Before the Wedding / Pre-Wedding (no event and date < first event date, or milestone_phase === 'Pre-Wedding')
    // 2. Each specific ceremony / event
    // 3. Wedding Day General (no event and date matches wedding date)
    // 4. After the Wedding / Post-Wedding (date > last event date)
    // 5. Other Family Moments

    const groups: Array<{
      id: string;
      title: string;
      subtitle?: string;
      date?: string;
      badge?: string;
      memories: WeddingMemory[];
    }> = [];

    // Pre-wedding memories without linked event
    const preWeddingMemories = filteredMemories.filter(
      (m) =>
        !m.event_id &&
        (m.milestone_phase === 'Pre-Wedding' ||
          (firstEventDate && m.memory_date < firstEventDate))
    );
    if (preWeddingMemories.length > 0) {
      groups.push({
        id: 'pre-wedding',
        title: 'BEFORE THE WEDDING',
        subtitle: 'Intimate beginnings, family rokas, and wedding preparations',
        badge: 'Pre-Wedding',
        memories: preWeddingMemories,
      });
    }

    // Dynamic ceremony groups based on actual events
    sortedEvents.forEach((evt) => {
      const eventMemories = filteredMemories.filter((m) => m.event_id === evt.id);
      if (eventMemories.length > 0 || selectedEventId === evt.id) {
        groups.push({
          id: `event-${evt.id}`,
          title: evt.event_name.toUpperCase(),
          subtitle: evt.venue ? `Celebrated at ${evt.venue}` : undefined,
          date: evt.date,
          badge: evt.event_type,
          memories: eventMemories,
        });
      }
    });

    // Wedding Day / Ceremony moments without linked event
    const weddingDayMemories = filteredMemories.filter(
      (m) =>
        !m.event_id &&
        (m.milestone_phase === 'Ceremony' || m.milestone_phase === 'Wedding Day') &&
        (!firstEventDate || m.memory_date >= firstEventDate) &&
        (!lastEventDate || m.memory_date <= lastEventDate)
    );
    if (weddingDayMemories.length > 0) {
      groups.push({
        id: 'wedding-day',
        title: 'WEDDING CEREMONY & RITUALS',
        subtitle: 'Unscripted sacred moments from the wedding festivities',
        badge: 'Ceremony',
        memories: weddingDayMemories,
      });
    }

    // Post-wedding memories without linked event
    const postWeddingMemories = filteredMemories.filter(
      (m) =>
        !m.event_id &&
        (m.milestone_phase === 'Post-Wedding' ||
          (lastEventDate && m.memory_date > lastEventDate))
    );
    if (postWeddingMemories.length > 0) {
      groups.push({
        id: 'post-wedding',
        title: 'AFTER THE WEDDING',
        subtitle: 'Grihapravesh, quiet reflections, and new beginnings',
        badge: 'Post-Wedding',
        memories: postWeddingMemories,
      });
    }

    // Fallback for any memory not captured above
    const allocatedIds = new Set(groups.flatMap((g) => g.memories.map((m) => m.id)));
    const remainingMemories = filteredMemories.filter((m) => !allocatedIds.has(m.id));
    if (remainingMemories.length > 0) {
      groups.push({
        id: 'other-moments',
        title: 'FAMILY MOMENTS & SNAPSHOTS',
        subtitle: 'Treasured memories preserved by your loved ones',
        badge: 'Family',
        memories: remainingMemories,
      });
    }

    return groups;
  }, [filteredMemories, events, wedding, selectedEventId]);

  // Memory Delete Handler
  const handleDeleteMemory = async (memory: WeddingMemory) => {
    try {
      await deleteMemory(memory.id);
      showToast('Memory removed from your wedding archive.', 'info');
      setSelectedMemory(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete memory', 'error');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-8 animate-fade-in text-[#29202A]">
      {/* 1. EDITORIAL CEREMONIAL HEADER */}
      <header className="relative pb-6 border-b border-[#F1E4D6] flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          {/* Subtle Arch Linework Motif */}
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-px bg-[#D6B36A]" />
            <span className="text-[10px] sm:text-[11px] font-bold text-[#E89838] uppercase tracking-[0.25em]">
              Family Heirloom & Moments
            </span>
            <span className="w-8 h-px bg-[#D6B36A]" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1B1220] tracking-tight leading-tight">
            Wedding Memories
          </h1>

          <p className="text-sm sm:text-base text-[#615163] font-serif italic mt-2 max-w-xl leading-relaxed">
            "Keep the moments that become your wedding story — from late-night sangeet rehearsals to sacred vows."
          </p>

          {wedding && (
            <span className="inline-block mt-3 text-xs font-serif text-[#8C7A8E]">
              Dedicated archive for <span className="font-bold text-[#641F35]">{wedding.bride_name} & {wedding.groom_name}</span>
            </span>
          )}
        </div>

        {/* Primary Action Button */}
        {can('CREATE_MEMORY') && (
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setMemoryToEdit(null);
                setIsFormOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#641F35] hover:bg-[#852C47] text-[#FFF7ED] text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#E89838]" />
              <span>+ Add Memory</span>
            </button>
          </div>
        )}
      </header>

      {/* 2. FILTER BAR */}
      {memories.length > 0 && (
        <section aria-label="Memory Filters" className="space-y-3">
          {/* Mobile Filter Trigger Button */}
          <div className="flex sm:hidden items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search moments, stories..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#E8DFD5] text-xs text-[#29202A]"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E8DFD5] text-xs font-semibold text-[#641F35] flex items-center gap-1.5 shadow-xs"
            >
              <Filter className="w-3.5 h-3.5 text-[#E89838]" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#641F35] text-white text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Filter Bar */}
          <div className="hidden sm:flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-[#F1E4D6] shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search story, venue..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E8DFD5] text-xs text-[#29202A] placeholder-[#B5A8B8] focus:border-[#641F35] w-48"
                />
              </div>

              {/* Ceremony / Event Filter */}
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E8DFD5] text-xs font-medium text-[#29202A] bg-white focus:border-[#641F35]"
              >
                <option value="all">All Ceremonies</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.event_name}
                  </option>
                ))}
                <option value="no-event">General Moments (No Ceremony)</option>
              </select>

              {/* Visibility Filter */}
              <select
                value={selectedVisibility}
                onChange={(e) => setSelectedVisibility(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E8DFD5] text-xs font-medium text-[#29202A] bg-white focus:border-[#641F35]"
              >
                <option value="all">All Visibility</option>
                <option value="PUBLIC_FAMILY">Public Family</option>
                <option value="CORE_FAMILY_ONLY">Core Family Only</option>
              </select>

              {/* People Tag Filter */}
              <select
                value={selectedGuestId}
                onChange={(e) => setSelectedGuestId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E8DFD5] text-xs font-medium text-[#29202A] bg-white focus:border-[#641F35]"
              >
                <option value="all">All People</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Stats & Reset */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8C7A8E]">
                Showing <strong className="text-[#29202A]">{filteredMemories.length}</strong> of {memories.length}
              </span>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-[#E86A5B] hover:text-[#641F35] font-semibold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. MOBILE FILTER BOTTOM SHEET DRAWER */}
      {isMobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:hidden animate-fade-in"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            className="bg-[#FFFDF9] rounded-t-3xl border-t border-[#F1E4D6] p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F1E4D6]">
              <h3 className="font-serif font-bold text-lg text-[#29202A]">
                Filter Memories
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#F1E4D6] text-[#8C7A8E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter: Ceremony */}
            <div>
              <label className="block text-xs font-bold text-[#8C7A8E] uppercase tracking-wider mb-1.5">
                Ceremony / Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] text-xs text-[#29202A]"
              >
                <option value="all">All Ceremonies</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.event_name}
                  </option>
                ))}
                <option value="no-event">General Moments</option>
              </select>
            </div>

            {/* Filter: Visibility */}
            <div>
              <label className="block text-xs font-bold text-[#8C7A8E] uppercase tracking-wider mb-1.5">
                Visibility
              </label>
              <select
                value={selectedVisibility}
                onChange={(e) => setSelectedVisibility(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] text-xs text-[#29202A]"
              >
                <option value="all">All Visibility</option>
                <option value="PUBLIC_FAMILY">Public Family</option>
                <option value="CORE_FAMILY_ONLY">Core Family Only</option>
              </select>
            </div>

            {/* Filter: Guest */}
            <div>
              <label className="block text-xs font-bold text-[#8C7A8E] uppercase tracking-wider mb-1.5">
                Tagged Guest
              </label>
              <select
                value={selectedGuestId}
                onChange={(e) => setSelectedGuestId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] text-xs text-[#29202A]"
              >
                <option value="all">All Guests</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#F1E4D6]">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2.5 rounded-xl border border-[#E8DFD5] text-xs font-bold text-[#615163]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#641F35] text-[#FFF7ED] text-xs font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CHRONOLOGICAL TIMELINE OR EMPTY STATE */}
      {memories.length === 0 ? (
        // HEIRLOOM EMPTY STATE
        <div className="py-12 px-6 sm:px-12 text-center bg-white border border-[#F1E4D6] rounded-3xl shadow-card max-w-3xl mx-auto my-8">
          <div className="w-36 h-36 mx-auto mb-6 opacity-90">
            <CoupleCelebrationArt className="w-full h-full" />
          </div>

          <span className="text-[11px] font-bold text-[#E89838] uppercase tracking-[0.2em] block mb-2">
            The Family Chronicle
          </span>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1220] tracking-tight">
            This space will become your wedding story.
          </h2>

          <p className="text-sm sm:text-base text-[#615163] font-serif italic mt-3 max-w-lg mx-auto leading-relaxed">
            "As ceremonies begin and moments unfold, save them here for generations to cherish."
          </p>

          {can('CREATE_MEMORY') && (
            <div className="mt-8">
              <button
                type="button"
                onClick={() => {
                  setMemoryToEdit(null);
                  setIsFormOpen(true);
                }}
                className="px-7 py-3 rounded-2xl bg-[#641F35] hover:bg-[#852C47] text-[#FFF7ED] text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-[#E89838]" />
                <span>Add your first memory</span>
              </button>
            </div>
          )}
        </div>
      ) : filteredMemories.length === 0 ? (
        // NO FILTER MATCHES EMPTY STATE
        <div className="py-12 px-6 text-center bg-white border border-[#F1E4D6] rounded-3xl max-w-xl mx-auto">
          <Camera className="w-10 h-10 text-[#D6B36A] mx-auto mb-3" />
          <h3 className="font-serif font-bold text-xl text-[#29202A]">
            No memories match your filters
          </h3>
          <p className="text-xs text-[#8C7A8E] mt-1 font-serif italic">
            Try adjusting your ceremony, visibility, or person filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-[#641F35] text-[#FFF7ED] text-xs font-bold"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        // CHRONOLOGICAL TIMELINE GROUPS
        <div className="space-y-12">
          {groupedTimeline.map((group) => (
            <section
              key={group.id}
              className="space-y-5"
              aria-label={`Ceremony: ${group.title}`}
            >
              {/* Group Divider & Heading */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#E89838] border-2 border-white shadow-xs" />
                  <h2 className="font-serif font-bold text-lg sm:text-xl text-[#1B1220] tracking-wide">
                    {group.title}
                  </h2>
                </div>

                {group.date && (
                  <span className="text-xs font-serif italic text-[#8C7A8E] hidden sm:inline">
                    • {group.date}
                  </span>
                )}

                {group.badge && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF1F3] border border-[#641F35]/15 text-[#641F35] text-[10px] font-bold uppercase tracking-wider">
                    {group.badge}
                  </span>
                )}

                <div className="flex-1 border-t border-[#F1E4D6]" />
              </div>

              {group.subtitle && (
                <p className="text-xs sm:text-sm text-[#8C7A8E] font-serif italic -mt-2 pl-6">
                  {group.subtitle}
                </p>
              )}

              {/* Group Memory Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pl-2 sm:pl-4">
                {group.memories.map((memory) => (
                  <MemoryEntryCard
                    key={memory.id}
                    memory={memory}
                    onClick={() => setSelectedMemory(memory)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 5. MEMORY FORM MODAL (Add / Edit) */}
      <MemoryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setMemoryToEdit(null);
        }}
        memoryToEdit={memoryToEdit}
        initialEventId={initialEventId}
      />

      {/* 6. MEMORY DETAILS MODAL */}
      <MemoryDetailsModal
        isOpen={Boolean(selectedMemory)}
        onClose={() => setSelectedMemory(null)}
        memory={selectedMemory}
        onEdit={(memory) => {
          setSelectedMemory(null);
          setMemoryToEdit(memory);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteMemory}
        onNavigateToEvent={onNavigateToEvent}
      />
    </div>
  );
};
