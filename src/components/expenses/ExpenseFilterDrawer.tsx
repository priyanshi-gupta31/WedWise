import React from 'react';
import { createPortal } from 'react-dom';
import { ExpenseCategory, PaymentMethod, PaymentStatus } from '../../types/database.types';
import { X, Check, RotateCcw } from 'lucide-react';

interface ExpenseFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  paidByList: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  selectedMethod: string;
  onSelectMethod: (method: string) => void;
  selectedPaidBy: string;
  onSelectPaidBy: (payer: string) => void;
  startDate: string;
  onSelectStartDate: (date: string) => void;
  endDate: string;
  onSelectEndDate: (date: string) => void;
  onClearAll: () => void;
  activeFiltersCount: number;
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'Other'];

export const ExpenseFilterDrawer: React.FC<ExpenseFilterDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  paidByList,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  selectedMethod,
  onSelectMethod,
  selectedPaidBy,
  onSelectPaidBy,
  startDate,
  onSelectStartDate,
  endDate,
  onSelectEndDate,
  onClearAll,
  activeFiltersCount,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const drawerContent = (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#16162A]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer / Sheet Content */}
      <div className="relative w-full max-w-lg max-h-[85vh] sm:max-h-[90vh] bg-[#FFF8F0] border-t sm:border border-[#F1E4D6] rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden animate-slide-up sm:animate-scale-in">
        {/* Mobile grab handle */}
        <div className="sm:hidden w-12 h-1.5 bg-[#D8CAB8] rounded-full mx-auto mt-3 mb-1" />

        {/* Drawer Header */}
        <div className="px-5 py-3.5 border-b border-[#F1E4D6] flex items-center justify-between bg-[#FFFDF9]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-serif font-bold text-[#16162A]">
                Filter Ledger
              </h3>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#C93B2B] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#615163]">
              Refine transactions by category, family payer, or status
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-[#C93B2B] hover:text-[#641F35] font-semibold flex items-center gap-1 transition-colors px-2 py-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FFF8F0] border border-[#F1E4D6] flex items-center justify-center text-[#615163] hover:text-[#16162A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Options */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)] scrollbar-thin">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#641F35] uppercase tracking-wider mb-1.5">
              Payment Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['All', 'Paid', 'Pending'].map((st) => {
                const isSelected = selectedStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onSelectStatus(st)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35] shadow-xs'
                        : 'bg-[#FFFDF9] text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#E89838]" />}
                    <span>{st === 'All' ? 'All Status' : st}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#641F35] uppercase tracking-wider mb-1.5">
              Ceremony Category
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl">
              <button
                type="button"
                onClick={() => onSelectCategory('All')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  selectedCategory === 'All'
                    ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35]'
                    : 'bg-[#FFF8F0] text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A]'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => {
                const isSelected = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectCategory(c.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35]'
                        : 'bg-[#FFF8F0] text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A]'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payer Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#641F35] uppercase tracking-wider mb-1.5">
              Paid By (Family Member)
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onSelectPaidBy('All')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  selectedPaidBy === 'All'
                    ? 'bg-[#C93B2B] text-white border-[#C93B2B]'
                    : 'bg-[#FFFDF9] text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A]'
                }`}
              >
                All
              </button>
              {paidByList.map((p) => {
                const isSelected = selectedPaidBy === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onSelectPaidBy(p)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-[#C93B2B] text-white border-[#C93B2B]'
                        : 'bg-[#FFFDF9] text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#641F35] uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onSelectMethod('All')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  selectedMethod === 'All'
                    ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35]'
                    : 'bg-[#FFFDF9] text-[#615163] border-[#E8DFD5]'
                }`}
              >
                All Methods
              </button>
              {PAYMENT_METHODS.map((m) => {
                const isSelected = selectedMethod === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onSelectMethod(m)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35]'
                        : 'bg-[#FFFDF9] text-[#615163] border-[#E8DFD5]'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#641F35] uppercase tracking-wider mb-1.5">
              Date Window
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-[#8C7A8E] block mb-0.5">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onSelectStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#8C7A8E] block mb-0.5">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onSelectEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="p-4 border-t border-[#F1E4D6] bg-[#FFFDF9]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#641F35] hover:bg-[#52172A] text-[#FFF8F0] font-semibold text-xs uppercase tracking-wider shadow-wine transition-all"
          >
            Apply Filters {activeFiltersCount > 0 ? `(${activeFiltersCount} Active)` : ''}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};
