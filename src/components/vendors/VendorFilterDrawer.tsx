import React from 'react';
import { createPortal } from 'react-dom';
import {
  VendorCategory,
  VendorStatus,
  VendorPaymentStatus,
  VendorAttentionState,
} from '../../types/vendor';
import {
  VENDOR_CATEGORIES,
  VENDOR_STATUSES,
} from '../../constants/vendorConstants';
import { WeddingEvent } from '../../types/database.types';
import { X, RotateCcw, Check } from 'lucide-react';

export interface VendorFilterState {
  category: VendorCategory | 'all';
  status: VendorStatus | 'all';
  eventId: string | 'all';
  paymentStatus: VendorPaymentStatus | 'all';
  attentionState: VendorAttentionState | 'all';
  sortBy: 'name' | 'agreed_high' | 'remaining_high' | 'due_date';
}

interface VendorFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: VendorFilterState;
  onChange: (filters: VendorFilterState) => void;
  onReset: () => void;
  events: WeddingEvent[];
}

export const VendorFilterDrawer: React.FC<VendorFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
  events,
}) => {
  if (!isOpen) return null;

  const activeFiltersCount = [
    filters.category !== 'all',
    filters.status !== 'all',
    filters.eventId !== 'all',
    filters.paymentStatus !== 'all',
    filters.attentionState !== 'all',
    filters.sortBy !== 'name',
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
              Vendor Book Filters
            </span>
            <h3 className="text-lg font-serif font-bold text-[#16162A]">
              Refine Directory {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={onReset}
                className="text-xs font-semibold text-[#641F35] hover:underline flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#F9F5F0]"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#8C7A8E] hover:text-[#16162A] hover:bg-[#F9F5F0] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* 1. SORT BY */}
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-2">
              Sort Order
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'name', label: 'Name (A to Z)' },
                { id: 'remaining_high', label: 'Balance Due (High)' },
                { id: 'agreed_high', label: 'Agreed Total (High)' },
                { id: 'due_date', label: 'Payment Due Date' },
              ].map((sort) => (
                <button
                  key={sort.id}
                  onClick={() =>
                    onChange({ ...filters, sortBy: sort.id as VendorFilterState['sortBy'] })
                  }
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition-all ${
                    filters.sortBy === sort.id
                      ? 'bg-[#641F35] text-white border-[#641F35] shadow-xs'
                      : 'bg-white text-[#523D35] border-[#E8DFD5] hover:border-[#641F35]/40'
                  }`}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. ATTENTION / ACTION NEEDED */}
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-2">
              Action Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Vendors' },
                { id: 'Payment Due', label: 'Payment Due Soon' },
                { id: 'Follow Up', label: 'Follow-Up Pending' },
                { id: 'Contract Pending', label: 'Contract Pending' },
                { id: 'All Clear', label: 'All Clear' },
              ].map((att) => (
                <button
                  key={att.id}
                  onClick={() =>
                    onChange({
                      ...filters,
                      attentionState: att.id as VendorFilterState['attentionState'],
                    })
                  }
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    filters.attentionState === att.id
                      ? 'bg-[#641F35] text-white border-[#641F35] shadow-xs'
                      : 'bg-white text-[#523D35] border-[#E8DFD5] hover:border-[#641F35]/40'
                  }`}
                >
                  {att.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. PAYMENT STATUS */}
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-2">
              Payment Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'Partially Paid', label: 'Partially Paid' },
                { id: 'Unpaid', label: 'Unpaid' },
                { id: 'Fully Paid', label: 'Fully Paid' },
              ].map((ps) => (
                <button
                  key={ps.id}
                  onClick={() =>
                    onChange({
                      ...filters,
                      paymentStatus: ps.id as VendorFilterState['paymentStatus'],
                    })
                  }
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    filters.paymentStatus === ps.id
                      ? 'bg-[#641F35] text-white border-[#641F35] shadow-xs'
                      : 'bg-white text-[#523D35] border-[#E8DFD5] hover:border-[#641F35]/40'
                  }`}
                >
                  {ps.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. HIRING STATUS */}
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-2">
              Hiring Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onChange({ ...filters, status: 'all' })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                  filters.status === 'all'
                    ? 'bg-[#641F35] text-white border-[#641F35]'
                    : 'bg-white text-[#523D35] border-[#E8DFD5]'
                }`}
              >
                All
              </button>
              {VENDOR_STATUSES.map((st) => (
                <button
                  key={st.value}
                  onClick={() => onChange({ ...filters, status: st.value })}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    filters.status === st.value
                      ? 'bg-[#641F35] text-white border-[#641F35]'
                      : 'bg-white text-[#523D35] border-[#E8DFD5]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. CEREMONY LINK */}
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-2">
              Ceremony Assignment
            </label>
            <select
              value={filters.eventId}
              onChange={(e) => onChange({ ...filters, eventId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
            >
              <option value="all">All Ceremonies</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.event_name} ({evt.event_type})
                </option>
              ))}
            </select>
          </div>

          {/* 6. VENDOR CATEGORIES */}
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-2">
              Service Category
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 border border-[#E8DFD5] rounded-xl bg-white custom-scrollbar">
              <button
                onClick={() => onChange({ ...filters, category: 'all' })}
                className={`px-2.5 py-1.5 text-xs font-medium text-left rounded-lg transition-colors flex items-center justify-between ${
                  filters.category === 'all'
                    ? 'bg-[#641F35] text-white font-bold'
                    : 'text-[#523D35] hover:bg-[#F9F5F0]'
                }`}
              >
                <span>All Categories</span>
                {filters.category === 'all' && <Check className="w-3.5 h-3.5" />}
              </button>
              {VENDOR_CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => onChange({ ...filters, category: cat.name })}
                  className={`px-2.5 py-1.5 text-xs font-medium text-left rounded-lg transition-colors flex items-center justify-between ${
                    filters.category === cat.name
                      ? 'bg-[#641F35] text-white font-bold'
                      : 'text-[#523D35] hover:bg-[#F9F5F0]'
                  }`}
                >
                  <span className="truncate">
                    {cat.icon} {cat.name}
                  </span>
                  {filters.category === cat.name && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#F1E4D6] flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onReset}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-[#523D35] hover:text-[#16162A] border border-[#E8DFD5] rounded-xl hover:bg-[#F9F5F0] transition-colors"
          >
            Clear Filters
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-[#641F35] hover:bg-[#50182A] rounded-xl shadow-xs transition-colors"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};
