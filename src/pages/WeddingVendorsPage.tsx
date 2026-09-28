import React, { useState, useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
import { useToast } from '../context/ToastContext';
import {
  Vendor,
  VendorCategory,
  VendorPayment,
} from '../types/vendor';
import {
  calculateVendorAttentionState,
  getDerivedPaymentStatus,
} from '../utils/vendorUtils';
import { VendorFormModal } from '../components/vendors/VendorFormModal';
import { VendorDetailsModal } from '../components/vendors/VendorDetailsModal';
import { VendorPaymentModal } from '../components/vendors/VendorPaymentModal';
import { VendorDocumentModal } from '../components/vendors/VendorDocumentModal';
import {
  VendorFilterDrawer,
  VendorFilterState,
} from '../components/vendors/VendorFilterDrawer';
import { FloralArchArt } from '../components/common/FloralArchArt';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Phone,
  MessageSquare,
  Clock,
  Calendar,
  IndianRupee,
  Sparkles,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

const initialFilters: VendorFilterState = {
  category: 'all',
  status: 'all',
  eventId: 'all',
  paymentStatus: 'all',
  attentionState: 'all',
  sortBy: 'name',
};

export const WeddingVendorsPage: React.FC = () => {
  const {
    vendors,
    vendorMetrics,
    events,
  } = useWedding();
  const { showToast } = useToast();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryQuickFilter, setCategoryQuickFilter] = useState<VendorCategory | 'all'>('all');
  const [filters, setFilters] = useState<VendorFilterState>(initialFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Modals state
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);

  const [isVendorDetailsOpen, setIsVendorDetailsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [vendorForPayment, setVendorForPayment] = useState<Vendor | null>(null);
  const [paymentToEdit, setPaymentToEdit] = useState<VendorPayment | null>(null);

  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [vendorForDocument, setVendorForDocument] = useState<Vendor | null>(null);

  // Handle open modals
  const handleOpenAddVendor = () => {
    setVendorToEdit(null);
    setIsVendorFormOpen(true);
  };

  const handleOpenEditVendor = (v: Vendor) => {
    setVendorToEdit(v);
    setIsVendorDetailsOpen(false);
    setIsVendorFormOpen(true);
  };

  const handleOpenDetails = (v: Vendor) => {
    setSelectedVendor(v);
    setIsVendorDetailsOpen(true);
  };

  const handleOpenRecordPayment = (v: Vendor, payment?: VendorPayment) => {
    setVendorForPayment(v);
    setPaymentToEdit(payment || null);
    setIsPaymentModalOpen(true);
  };

  const handleOpenAddDocument = (v: Vendor) => {
    setVendorForDocument(v);
    setIsDocumentModalOpen(true);
  };

  // Filtered & Sorted Vendors
  const filteredVendors = useMemo(() => {
    return vendors
      .filter((v) => {
        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = v.vendor_name.toLowerCase().includes(q);
          const matchesContact = v.contact_person?.toLowerCase().includes(q) || false;
          const matchesPhone = v.phone?.toLowerCase().includes(q) || false;
          const matchesCategory = v.category.toLowerCase().includes(q);
          const matchesNotes = v.notes?.toLowerCase().includes(q) || false;
          if (!matchesName && !matchesContact && !matchesPhone && !matchesCategory && !matchesNotes) {
            return false;
          }
        }

        // Quick Category Filter
        if (categoryQuickFilter !== 'all' && v.category !== categoryQuickFilter) {
          return false;
        }

        // Drawer Category
        if (filters.category !== 'all' && v.category !== filters.category) {
          return false;
        }

        // Drawer Status
        if (filters.status !== 'all' && v.status !== filters.status) {
          return false;
        }

        // Drawer Ceremony
        if (filters.eventId !== 'all') {
          if (filters.eventId === '' && v.event_id) return false;
          if (filters.eventId !== '' && v.event_id !== filters.eventId) return false;
        }

        // Drawer Payment Status
        if (filters.paymentStatus !== 'all') {
          const pStatus = getDerivedPaymentStatus(v);
          if (pStatus !== filters.paymentStatus) return false;
        }

        // Drawer Action State
        if (filters.attentionState !== 'all') {
          const att = calculateVendorAttentionState(v);
          if (att !== filters.attentionState) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'remaining_high') {
          return (Number(b.remaining_amount) || 0) - (Number(a.remaining_amount) || 0);
        }
        if (filters.sortBy === 'agreed_high') {
          return (Number(b.agreed_amount) || 0) - (Number(a.agreed_amount) || 0);
        }
        if (filters.sortBy === 'due_date') {
          if (!a.payment_due_date) return 1;
          if (!b.payment_due_date) return -1;
          return a.payment_due_date.localeCompare(b.payment_due_date);
        }
        // default name
        return a.vendor_name.localeCompare(b.vendor_name);
      });
  }, [vendors, searchQuery, categoryQuickFilter, filters]);

  // Keep selectedVendor up to date if state changed in background
  const liveSelectedVendor = useMemo(() => {
    if (!selectedVendor) return null;
    return vendors.find((v) => v.id === selectedVendor.id) || selectedVendor;
  }, [vendors, selectedVendor]);

  const activeFiltersCount = [
    categoryQuickFilter !== 'all',
    filters.category !== 'all',
    filters.status !== 'all',
    filters.eventId !== 'all',
    filters.paymentStatus !== 'all',
    filters.attentionState !== 'all',
    filters.sortBy !== 'name',
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSearchQuery('');
    setCategoryQuickFilter('all');
    setFilters(initialFilters);
  };

  // Popular quick categories for filter bar
  const quickCategories: Array<VendorCategory | 'all'> = [
    'all',
    'Venue',
    'Catering',
    'Decoration',
    'Photography',
    'DJ / Music',
    'Makeup & Beauty',
  ];

  const overallPaidPercentage =
    vendorMetrics.totalContractedValue > 0
      ? Math.min(
          100,
          Math.round((vendorMetrics.totalPaidValue / vendorMetrics.totalContractedValue) * 100)
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-24">
      {/* 1. EDITORIAL MASTHEAD */}
      <div className="bg-gradient-to-b from-[#F9F5F0] via-[#FDFBF7] to-[#FFFDF9] border-b border-[#E8DFD5] pt-6 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-[#641F35] uppercase tracking-[0.25em] bg-[#F1E4D6]/50 px-2.5 py-0.5 rounded-full border border-[#E8DFD5]">
                  The People Behind The Wedding
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#16162A] tracking-tight">
                Wedding Vendor Book
              </h1>
              <p className="text-xs sm:text-sm text-[#7C6B7E] mt-1 max-w-2xl font-normal leading-relaxed">
                Every ceremony has craftspeople behind it — the caterers, floral architects, dhol troupes, and photographers bringing the celebration to life.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddVendor}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#641F35] hover:bg-[#50182A] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Vendor
              </button>
            </div>
          </div>

          {/* 2. DYNAMIC FINANCIAL & CONTRACT KPI HERO */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
            {/* Total Vendors */}
            <div className="p-3.5 bg-white/80 backdrop-blur-xs border border-[#E8DFD5] rounded-2xl shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7C6B7E]">
                Total Vendors
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-serif font-bold text-[#16162A]">
                  {vendorMetrics.totalVendors}
                </span>
                <span className="text-[11px] text-[#7C6B7E]">partners</span>
              </div>
            </div>

            {/* Confirmed Contracts */}
            <div className="p-3.5 bg-white/80 backdrop-blur-xs border border-[#E8DFD5] rounded-2xl shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7C6B7E]">
                Confirmed
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-serif font-bold text-[#2C6E49]">
                  {vendorMetrics.confirmedVendors}
                </span>
                <span className="text-[11px] text-[#7C6B7E]">contracts</span>
              </div>
            </div>

            {/* Pending Action */}
            <div className="p-3.5 bg-white/80 backdrop-blur-xs border border-[#E8DFD5] rounded-2xl shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7C6B7E]">
                Action Due
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-serif font-bold text-[#E89838]">
                  {vendorMetrics.followUpCount + vendorMetrics.paymentDueCount}
                </span>
                <span className="text-[11px] text-[#7C6B7E]">alerts</span>
              </div>
            </div>

            {/* Total Agreed */}
            <div className="p-3.5 bg-white/80 backdrop-blur-xs border border-[#E8DFD5] rounded-2xl shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7C6B7E]">
                Contract Total
              </p>
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="text-lg sm:text-xl font-serif font-bold text-[#16162A]">
                  ₹{Math.round(vendorMetrics.totalContractedValue).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Total Paid */}
            <div className="p-3.5 bg-white/80 backdrop-blur-xs border border-[#E8DFD5] rounded-2xl shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#2C6E49]">
                Total Paid
              </p>
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="text-lg sm:text-xl font-serif font-bold text-[#2C6E49]">
                  ₹{Math.round(vendorMetrics.totalPaidValue).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Outstanding Balance */}
            <div className="p-3.5 bg-[#FFF5F5]/60 backdrop-blur-xs border border-[#C93B2B]/20 rounded-2xl shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#C93B2B]">
                Balance Due
              </p>
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="text-lg sm:text-xl font-serif font-bold text-[#C93B2B]">
                  ₹{Math.round(vendorMetrics.totalOutstandingValue).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* 3. SETTLEMENT PACING BAR */}
          {vendorMetrics.totalContractedValue > 0 && (
            <div className="mt-3 p-3 bg-white/60 border border-[#E8DFD5] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E89838] flex-shrink-0" />
                <span className="text-[#523D35] font-medium">
                  <strong>{overallPaidPercentage}%</strong> of total vendor commitments settled
                </span>
              </div>
              <div className="w-full sm:w-64 h-2 bg-[#E8DFD5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2C6E49] rounded-full transition-all duration-500"
                  style={{ width: `${overallPaidPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MAIN DIRECTORY CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-4">
        {/* SEARCH & FILTER CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors, contacts, phones, or services..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8DFD5] rounded-xl text-[#16162A] placeholder-[#8C7A8E] focus:outline-none focus:border-[#641F35]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#7C6B7E] hover:text-[#16162A] absolute right-3 top-1/2 -translate-y-1/2 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Drawer Trigger */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeFiltersCount > 0
                ? 'bg-[#641F35] text-white border-[#641F35] shadow-xs'
                : 'bg-white text-[#523D35] border-[#E8DFD5] hover:border-[#641F35]/40'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 bg-white text-[#641F35] rounded-full text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* QUICK CATEGORY PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          {quickCategories.map((qc) => {
            const isSelected = categoryQuickFilter === qc;
            const count =
              qc === 'all'
                ? vendors.length
                : vendors.filter((v) => v.category === qc).length;

            return (
              <button
                key={qc}
                onClick={() => setCategoryQuickFilter(qc)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#641F35] text-white shadow-2xs font-semibold'
                    : 'bg-white text-[#523D35] border border-[#E8DFD5] hover:bg-[#F9F5F0]'
                }`}
              >
                <span>{qc === 'all' ? 'All Services' : qc}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#F1E4D6]/60 text-[#7C6B7E]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE FILTER SUMMARY IF ANY */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between text-xs text-[#7C6B7E] bg-[#F9F5F0] px-3 py-1.5 rounded-xl border border-[#E8DFD5]">
            <span>
              Showing <strong>{filteredVendors.length}</strong> of {vendors.length} vendors
            </span>
            <button
              onClick={resetAllFilters}
              className="text-[#641F35] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}

        {/* 5. VENDOR DIRECTORY CARDS */}
        {filteredVendors.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-12 px-4 bg-white border border-[#E8DFD5] rounded-3xl text-center space-y-4">
            <FloralArchArt className="w-24 h-24 mx-auto opacity-70" />
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-serif font-bold text-[#16162A]">
                {vendors.length === 0
                  ? 'No Wedding Partners Registered Yet'
                  : 'No Vendors Match Filter Criteria'}
              </h3>
              <p className="text-xs text-[#7C6B7E]">
                {vendors.length === 0
                  ? 'Add caterers, decorators, photographers, pandits, and musicians to track agreements, due dates, and payments in one verified place.'
                  : 'Try changing your search term or clearing the active filters.'}
              </p>
            </div>
            <div>
              {vendors.length === 0 ? (
                <button
                  onClick={handleOpenAddVendor}
                  className="px-4 py-2 bg-[#641F35] text-white text-xs font-semibold rounded-xl hover:bg-[#50182A] transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add First Vendor
                </button>
              ) : (
                <button
                  onClick={resetAllFilters}
                  className="px-3 py-1.5 border border-[#E8DFD5] text-[#523D35] text-xs font-semibold rounded-xl hover:bg-[#F9F5F0] transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredVendors.map((vendor) => {
              const attention = calculateVendorAttentionState(vendor);
              const pStatus = getDerivedPaymentStatus(vendor);
              const linkedEvent = events.find((e) => e.id === vendor.event_id);
              const agreedNum = Number(vendor.agreed_amount) || 0;
              const paidNum = Number(vendor.paid_amount) || 0;
              const remNum = Number(vendor.remaining_amount) || 0;
              const paidPct = agreedNum > 0 ? Math.min(100, Math.round((paidNum / agreedNum) * 100)) : 0;

              const cleanPhone = vendor.phone ? vendor.phone.replace(/[^0-9+]/g, '') : null;
              const cleanWhatsapp = vendor.whatsapp
                ? vendor.whatsapp.replace(/[^0-9+]/g, '')
                : cleanPhone;
              const waUrl = cleanWhatsapp
                ? `https://wa.me/${cleanWhatsapp.replace('+', '')}?text=${encodeURIComponent(
                    `Namaste ${vendor.contact_person || vendor.vendor_name}, regarding wedding preparations:`
                  )}`
                : null;

              return (
                <div
                  key={vendor.id}
                  className="bg-white border border-[#E8DFD5] hover:border-[#641F35]/40 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3 group"
                >
                  {/* TOP ROW: CATEGORY + STATUS BADGES */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-[#641F35] uppercase tracking-wider bg-[#F9F5F0] px-2 py-0.5 rounded-md border border-[#E8DFD5]">
                        {vendor.category}
                      </span>

                      <div className="flex items-center gap-1">
                        {attention !== 'All Clear' && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              attention === 'Payment Due'
                                ? 'bg-[#FFF5F5] text-[#C93B2B] border border-[#C93B2B]/30'
                                : attention === 'Follow Up'
                                ? 'bg-[#FFF7E8] text-[#9E5D0A] border border-[#E89838]/40'
                                : 'bg-[#F9F5F0] text-[#7C6B7E] border border-[#E8DFD5]'
                            }`}
                          >
                            {attention}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            vendor.status === 'Confirmed' || vendor.status === 'Completed'
                              ? 'bg-[#2C6E49]/10 text-[#2C6E49]'
                              : vendor.status === 'Cancelled'
                              ? 'bg-[#C93B2B]/10 text-[#C93B2B]'
                              : 'bg-[#E89838]/15 text-[#9E5D0A]'
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </div>
                    </div>

                    {/* VENDOR NAME & CONTACT */}
                    <div
                      onClick={() => handleOpenDetails(vendor)}
                      className="cursor-pointer group-hover:text-[#641F35] transition-colors"
                    >
                      <h3 className="font-serif font-bold text-[#16162A] text-base leading-snug">
                        {vendor.vendor_name}
                      </h3>
                      {vendor.contact_person && (
                        <p className="text-xs text-[#7C6B7E] mt-0.5">
                          {vendor.contact_person}
                        </p>
                      )}
                    </div>

                    {/* CEREMONY PILL */}
                    {linkedEvent && (
                      <div className="mt-1.5">
                        <span className="inline-block text-[10px] font-medium text-[#7C6B7E] bg-[#F9F5F0] px-2 py-0.5 rounded-md border border-[#E8DFD5]/60">
                          {linkedEvent.event_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* FINANCIAL PACING */}
                  <div className="bg-[#F9F5F0]/70 border border-[#E8DFD5] rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#7C6B7E] block">
                          Agreed
                        </span>
                        <span className="font-bold text-[#16162A]">
                          ₹{agreedNum.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-[#2C6E49] block">
                          Paid
                        </span>
                        <span className="font-bold text-[#2C6E49]">
                          ₹{paidNum.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#C93B2B] block">
                          Due
                        </span>
                        <span className="font-bold text-[#C93B2B]">
                          ₹{remNum.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* PACING BAR */}
                    {agreedNum > 0 && (
                      <div className="w-full h-1.5 bg-[#E8DFD5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2C6E49] rounded-full transition-all duration-300"
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="pt-1 flex items-center justify-between gap-1.5 border-t border-[#E8DFD5]/60">
                    <div className="flex items-center gap-1">
                      {cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          title="Call Vendor"
                          className="p-1.5 text-[#2C6E49] hover:bg-[#2C6E49]/10 rounded-lg transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Chat on WhatsApp"
                          className="p-1.5 text-[#128C7E] hover:bg-[#25D366]/10 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenRecordPayment(vendor)}
                        className="px-2.5 py-1 bg-[#641F35]/10 hover:bg-[#641F35] text-[#641F35] hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        + Payment
                      </button>
                      <button
                        onClick={() => handleOpenDetails(vendor)}
                        className="p-1 text-[#7C6B7E] hover:text-[#16162A] rounded-lg transition-colors"
                        title="View Full Dossier"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. MODALS & DRAWERS */}
      <VendorFormModal
        isOpen={isVendorFormOpen}
        onClose={() => {
          setIsVendorFormOpen(false);
          setVendorToEdit(null);
        }}
        vendorToEdit={vendorToEdit}
      />

      {liveSelectedVendor && (
        <VendorDetailsModal
          isOpen={isVendorDetailsOpen}
          onClose={() => {
            setIsVendorDetailsOpen(false);
            setSelectedVendor(null);
          }}
          vendor={liveSelectedVendor}
          onEditVendor={handleOpenEditVendor}
          onRecordPayment={(v) => {
            setIsVendorDetailsOpen(false);
            handleOpenRecordPayment(v);
          }}
          onAddDocument={(v) => {
            setIsVendorDetailsOpen(false);
            handleOpenAddDocument(v);
          }}
          onEditPayment={(v, p) => {
            setIsVendorDetailsOpen(false);
            handleOpenRecordPayment(v, p);
          }}
        />
      )}

      {vendorForPayment && (
        <VendorPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setVendorForPayment(null);
            setPaymentToEdit(null);
          }}
          vendor={vendorForPayment}
          paymentToEdit={paymentToEdit}
        />
      )}

      {vendorForDocument && (
        <VendorDocumentModal
          isOpen={isDocumentModalOpen}
          onClose={() => {
            setIsDocumentModalOpen(false);
            setVendorForDocument(null);
          }}
          vendor={vendorForDocument}
        />
      )}

      <VendorFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        events={events}
      />
    </div>
  );
};
