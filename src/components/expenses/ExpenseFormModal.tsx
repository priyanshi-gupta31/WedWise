import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import { Expense, PaymentMethod, PaymentStatus } from '../../types/database.types';
import { ExpenseFormData } from '../../types/expense';
import { getTodayISODate } from '../../utils/date';
import { formatINR, parseCurrencyInput } from '../../utils/currency';
import { CategoryArtwork } from '../common/WedWiseIllustrations';
import { WEDDING_CATEGORIES } from '../../constants/categories';
import { Check, Sparkles, ChevronDown, ChevronUp, Calendar, FileText } from 'lucide-react';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
  defaultEventId?: string | null;
}

const PAYER_PRESETS = ['Dad', 'Mom', 'Groom', 'Bride', 'Sister', 'Brother'];
const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'Other'];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
  defaultEventId,
}) => {
  const { categories, events, addExpense, updateExpense } = useWedding();
  const { showToast } = useToast();
  const amountInputRef = useRef<HTMLInputElement>(null);

  const [amountInput, setAmountInput] = useState('');
  const [expenseName, setExpenseName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [eventId, setEventId] = useState<string>('');
  const [paidBy, setPaidBy] = useState('Dad');
  const [customPayer, setCustomPayer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [expenseDate, setExpenseDate] = useState(getTodayISODate());
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Central categories or active db categories
  const activeCategories = categories.length > 0 ? categories : WEDDING_CATEGORIES.map((c, idx) => ({
    id: `cat-${idx + 1}`,
    wedding_id: '',
    name: c.name,
    budget_limit: 0,
    created_at: '',
  }));

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setAmountInput(String(expenseToEdit.amount));
        setExpenseName(expenseToEdit.expense_name);
        setCategoryId(expenseToEdit.category_id || activeCategories[0]?.id || '');
        setEventId(expenseToEdit.event_id || '');
        if (PAYER_PRESETS.includes(expenseToEdit.paid_by)) {
          setPaidBy(expenseToEdit.paid_by);
          setCustomPayer('');
        } else {
          setPaidBy('Custom');
          setCustomPayer(expenseToEdit.paid_by);
        }
        setPaymentMethod(expenseToEdit.payment_method);
        setPaymentStatus(expenseToEdit.payment_status);
        setExpenseDate(expenseToEdit.expense_date);
        setNotes(expenseToEdit.notes || '');
        setShowNotes(Boolean(expenseToEdit.notes));
      } else {
        setAmountInput('');
        setExpenseName('');
        setCategoryId(activeCategories[0]?.id || '');
        setEventId(defaultEventId || '');
        setPaidBy('Dad');
        setCustomPayer('');
        setPaymentMethod('UPI');
        setPaymentStatus('Paid');
        setExpenseDate(getTodayISODate());
        setNotes('');
        setShowNotes(false);
      }
      setErrors({});

      // Autofocus amount on open for ultra-fast entry
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, expenseToEdit, categories, defaultEventId]);

  const effectivePayer = paidBy === 'Custom' ? customPayer.trim() : paidBy;

  const validate = () => {
    const errs: Record<string, string> = {};
    const parsedAmount = parseCurrencyInput(amountInput);
    if (!amountInput || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid expense amount.';
    }
    if (!expenseName.trim()) {
      errs.expenseName = 'Please enter what this payment was for.';
    }
    if (!effectivePayer) {
      errs.paidBy = 'Please select or type who paid.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const parsedAmount = parseCurrencyInput(amountInput);
      const payload: ExpenseFormData = {
        expense_name: expenseName.trim(),
        amount: parsedAmount,
        category_id: categoryId || activeCategories[0]?.id || '',
        event_id: eventId || null,
        paid_by: effectivePayer,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        expense_date: expenseDate,
        notes: notes.trim(),
      };

      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, payload);
        showToast('Wedding receipt updated successfully! 💍', 'success');
      } else {
        await addExpense(payload);
        showToast('Receipt recorded to wedding ledger! ✨', 'success');
      }

      onClose();
    } catch (err) {
      console.error('Failed to record expense:', err);
      showToast("Couldn't record expense. Please try again.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAmountNum = parseCurrencyInput(amountInput);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Wedding Receipt' : 'Record Wedding Expense'}
      subtitle={expenseToEdit ? 'Adjust ledger payment transaction' : 'Record vendor advance or ceremony cost in seconds'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. AMOUNT FIRST (₹ ______) with large typography and live Indian Rupee formatting */}
        <div className="bg-[#FFF8F0] p-4 rounded-2xl border border-[#F1E4D6]/80 text-center shadow-subtle">
          <label className="block text-[10px] font-bold text-[#641F35] uppercase tracking-[0.25em] mb-1">
            Amount Paid <span className="text-[#C93B2B]">*</span>
          </label>

          <div className="relative inline-flex items-center justify-center w-full max-w-xs mx-auto">
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#C93B2B] mr-2 select-none">
              ₹
            </span>
            <input
              ref={amountInputRef}
              type="number"
              inputMode="numeric"
              required
              min="1"
              step="1"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0"
              className={`w-full text-center text-3xl sm:text-4xl font-serif font-bold bg-transparent text-[#16162A] placeholder-[#D8CAB8] focus:outline-none border-b-2 transition-colors ${
                errors.amount ? 'border-[#C93B2B]' : 'border-[#D6B36A] focus:border-[#641F35]'
              }`}
            />
          </div>

          {/* Live Indian Rupee Preview */}
          <div className="min-h-[22px] mt-1">
            {amountInput && !isNaN(currentAmountNum) && currentAmountNum > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-serif font-semibold text-[#641F35] bg-[#FFF2E0] px-3 py-0.5 rounded-full border border-[#E89838]/30 animate-fade-in">
                <span>{formatINR(currentAmountNum)}</span>
              </span>
            ) : (
              <span className="text-[11px] text-[#8C7A8E]">Enter wedding amount in INR</span>
            )}
          </div>
          {errors.amount && <p className="text-xs text-[#C93B2B] mt-1 font-medium">{errors.amount}</p>}
        </div>

        {/* 2. WHAT WAS IT FOR? (Title) */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider">
            What was it for? <span className="text-[#C93B2B]">*</span>
          </label>
          <input
            type="text"
            required
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
            placeholder="e.g. Mandap Flowers Advance, Catering 2nd Installment, Bridal Lehenga"
            className={`w-full px-4 py-2.5 text-sm bg-[#FFFDF9] border rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] focus:ring-1 focus:ring-[#641F35]/30 font-medium transition-all ${
              errors.expenseName ? 'border-[#C93B2B] bg-[#FFF5F5]' : 'border-[#E8DFD5]'
            }`}
          />
          {errors.expenseName && <p className="text-xs text-[#C93B2B] mt-0.5">{errors.expenseName}</p>}
        </div>

        {/* 3. CATEGORY VISUAL PICKER (15 Centralized Categories) */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider">
            Category
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
            {activeCategories.map((cat) => {
              const isSelected = cat.id === categoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    isSelected
                      ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35] shadow-sm'
                      : 'bg-[#FFFDF9] text-[#4A3B4E] border-[#E8DFD5] hover:border-[#D6B36A] hover:text-[#16162A]'
                  }`}
                >
                  <CategoryArtwork category={cat.name} size="sm" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ceremony / Event Link (Optional) */}
        {events && events.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider">
                Ceremony / Event <span className="text-[10px] font-normal text-[#8C7A8E] lowercase">(optional)</span>
              </label>
              {eventId && (
                <button
                  type="button"
                  onClick={() => setEventId('')}
                  className="text-[10px] text-[#C93B2B] hover:underline"
                >
                  Clear event
                </button>
              )}
            </div>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
            >
              <option value="">General Wedding (All Events / Shared)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.event_name} — {ev.event_type} ({ev.date})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 4. PAYER PRESETS (Dad, Mom, Groom, Bride, Sister, Brother + Custom) */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider">
            Who Paid? <span className="text-[#C93B2B]">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PAYER_PRESETS.map((preset) => {
              const isSelected = paidBy === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setPaidBy(preset);
                    setCustomPayer('');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-[#C93B2B] text-white border-[#C93B2B] shadow-sm'
                      : 'bg-[#FFFDF9] text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A]'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPaidBy('Custom')}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                paidBy === 'Custom'
                  ? 'bg-[#C93B2B] text-white border-[#C93B2B]'
                  : 'bg-[#FFFDF9] text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A]'
              }`}
            >
              Other...
            </button>
          </div>

          {paidBy === 'Custom' && (
            <input
              type="text"
              autoFocus
              value={customPayer}
              onChange={(e) => setCustomPayer(e.target.value)}
              placeholder="e.g. Uncle Ramesh, Maasi, Cousin Rohan"
              className="w-full px-3.5 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] mt-1"
            />
          )}
          {errors.paidBy && <p className="text-xs text-[#C93B2B] mt-0.5">{errors.paidBy}</p>}
        </div>

        {/* 5. PAYMENT METHOD & 6. STATUS (Paid / Pending) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Payment Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('Paid')}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                  paymentStatus === 'Paid'
                    ? 'bg-[#EAF3EC] border-[#A9CEB5] text-[#2D5A43] shadow-sm'
                    : 'bg-[#FFFDF9] border-[#E8DFD5] text-[#8C7A8E]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Paid</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('Pending')}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                  paymentStatus === 'Pending'
                    ? 'bg-[#FFF0F0] border-[#F2B8B8] text-[#C93B2B] shadow-sm'
                    : 'bg-[#FFFDF9] border-[#E8DFD5] text-[#8C7A8E]'
                }`}
              >
                <span>Pending</span>
              </button>
            </div>
          </div>
        </div>

        {/* 7. DATE (default today) & 8. OPTIONAL NOTES */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[#615163]">
              <Calendar className="w-3.5 h-3.5 text-[#8C7A8E]" />
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="bg-transparent text-xs font-medium text-[#16162A] focus:outline-none border-b border-[#E8DFD5] pb-0.5 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="text-xs text-[#641F35] hover:text-[#C93B2B] font-semibold flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showNotes ? 'Hide Notes' : '+ Add Notes / Memo'}</span>
              {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {showNotes && (
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 50% advance given via GPay, final settlement due before Baraat"
              className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] resize-none animate-fade-in"
            />
          )}
        </div>

        {/* 9. PRIMARY SAVE EXPENSE BUTTON */}
        <div className="flex gap-2.5 pt-2 pb-1">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-xs">
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-2 py-3 px-6 rounded-xl bg-[#641F35] hover:bg-[#52172A] active:scale-[0.99] text-[#FFF8F0] font-semibold text-xs tracking-wider uppercase shadow-wine transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#FFF8F0] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{expenseToEdit ? 'Update Expense' : 'Save Expense'}</span>
                <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
