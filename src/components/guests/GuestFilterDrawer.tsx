import React from 'react';
import { createPortal } from 'react-dom';
import { WeddingSide, RSVPStatus, FoodPreference } from '../../types/guest';
import {
  DEFAULT_GUEST_GROUPS,
  WEDDING_SIDES,
  RSVP_STATUSES,
  FOOD_PREFERENCES,
} from '../../constants/guestConstants';
import { X, RotateCcw, Check } from 'lucide-react';

export interface GuestFilterState {
  side: WeddingSide | 'all';
  group: string | 'all';
  rsvp: RSVPStatus | 'all';
  accommodation: 'all' | 'needed' | 'not_needed';
  transport: 'all' | 'needed' | 'not_needed';
  food: FoodPreference | 'all';
}

interface GuestFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: GuestFilterState;
  onChange: (filters: GuestFilterState) => void;
  onReset: () => void;
  availableGroups: string[];
}

export const GuestFilterDrawer: React.FC<GuestFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
  availableGroups,
}) => {
  if (!isOpen) return null;

  const activeFiltersCount = [
    filters.side !== 'all',
    filters.group !== 'all',
    filters.rsvp !== 'all',
    filters.accommodation !== 'all',
    filters.transport !== 'all',
    filters.food !== 'all',
  ].filter(Boolean).length;

  if (!isOpen || typeof document === 'undefined') return null;

  const drawerContent = (
    <div className="fixed inset-0 z-[60] overflow-hidden select-none animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto max-w-md w-full bg-[#FFFDF9] rounded-t-3xl sm:rounded-l-3xl sm:rounded-t-none border-t sm:border-l border-[#F1E4D6] shadow-modal flex flex-col max-h-[85vh] sm:max-h-full">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#F1E4D6] flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[10px] font-bold text-[#641F35] uppercase tracking-[0.2em] block">
              Guest Book Filters
            </span>
            <h3 className="text-lg font-serif font-bold text-[#16162A]">
              Refine Directory {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-semibold text-[#641F35] hover:text-[#C93B2B] flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[#FFF2E0] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#F1E4D6] text-[#8C7A8E] hover:text-[#16162A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Scrollable Area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* 1. WEDDING SIDE */}
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-2">
              Wedding Side
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ ...filters, side: 'all' })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filters.side === 'all'
                    ? 'bg-[#641F35] text-white border-[#641F35]'
                    : 'bg-white text-[#615163] border-[#E8DFD5]'
                }`}
              >
                All Sides
              </button>
              {WEDDING_SIDES.map((side) => (
                <button
                  key={side.value}
                  type="button"
                  onClick={() => onChange({ ...filters, side: side.value })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filters.side === side.value
                      ? 'bg-[#641F35] text-white border-[#641F35]'
                      : 'bg-white text-[#615163] border-[#E8DFD5]'
                  }`}
                >
                  {side.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. FAMILY / GUEST GROUP */}
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-2">
              Family & Group
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ ...filters, group: 'all' })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filters.group === 'all'
                    ? 'bg-[#641F35] text-white border-[#641F35]'
                    : 'bg-white text-[#615163] border-[#E8DFD5]'
                }`}
              >
                All Groups
              </button>
              {availableGroups.map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => onChange({ ...filters, group: grp })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filters.group === grp
                      ? 'bg-[#641F35] text-white border-[#641F35]'
                      : 'bg-white text-[#615163] border-[#E8DFD5]'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          {/* 3. RSVP STATUS */}
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-2">
              RSVP Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ ...filters, rsvp: 'all' })}
                className={`py-2 px-2.5 rounded-xl text-center font-semibold border transition-all ${
                  filters.rsvp === 'all'
                    ? 'bg-[#641F35] text-white border-[#641F35]'
                    : 'bg-white text-[#615163] border-[#E8DFD5]'
                }`}
              >
                All RSVPs
              </button>
              {RSVP_STATUSES.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => onChange({ ...filters, rsvp: st.value })}
                  className={`py-2 px-2 rounded-xl text-center font-semibold border transition-all truncate ${
                    filters.rsvp === st.value
                      ? `${st.badgeBg} ${st.badgeText} ${st.badgeBorder} ring-1 ring-black/10 font-bold`
                      : 'bg-white text-[#8C7A8E] border-[#E8DFD5]'
                  }`}
                >
                  {st.value}
                </button>
              ))}
            </div>
          </div>

          {/* 4. ACCOMMODATION & TRANSPORT LOGISTICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1.5">
                Hotel Room
              </label>
              <div className="space-y-1">
                {(['all', 'needed', 'not_needed'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChange({ ...filters, accommodation: opt })}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-left text-xs font-semibold border transition-all ${
                      filters.accommodation === opt
                        ? 'bg-[#FAF1F3] text-[#641F35] border-[#641F35]/40'
                        : 'bg-white text-[#615163] border-[#E8DFD5]'
                    }`}
                  >
                    {opt === 'all'
                      ? 'All Guests'
                      : opt === 'needed'
                      ? 'Requires Room'
                      : 'No Room Required'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1.5">
                Transport
              </label>
              <div className="space-y-1">
                {(['all', 'needed', 'not_needed'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChange({ ...filters, transport: opt })}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-left text-xs font-semibold border transition-all ${
                      filters.transport === opt
                        ? 'bg-[#FAF1F3] text-[#641F35] border-[#641F35]/40'
                        : 'bg-white text-[#615163] border-[#E8DFD5]'
                    }`}
                  >
                    {opt === 'all'
                      ? 'All Guests'
                      : opt === 'needed'
                      ? 'Requires Transport'
                      : 'Self Arranged'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. FOOD PREFERENCE */}
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-2">
              Food Preference
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onChange({ ...filters, food: 'all' })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filters.food === 'all'
                    ? 'bg-[#641F35] text-white border-[#641F35]'
                    : 'bg-white text-[#615163] border-[#E8DFD5]'
                }`}
              >
                All Diets
              </button>
              {FOOD_PREFERENCES.map((food) => (
                <button
                  key={food}
                  type="button"
                  onClick={() => onChange({ ...filters, food })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filters.food === food
                      ? 'bg-[#641F35] text-white border-[#641F35]'
                      : 'bg-white text-[#615163] border-[#E8DFD5]'
                  }`}
                >
                  {food}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer CTA */}
        <div className="p-4 border-t border-[#F1E4D6] flex items-center justify-between gap-3 bg-[#FFF8F0]">
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-[#8C7A8E] hover:text-[#16162A]"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-[#641F35] hover:bg-[#52172A] text-white font-semibold text-xs uppercase tracking-wider shadow-wine"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};
