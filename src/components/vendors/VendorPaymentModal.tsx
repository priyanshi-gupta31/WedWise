import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import {
  Vendor,
  VendorPayment,
  VendorPaymentFormData,
} from '../../types/vendor';
import { PaymentMethod } from '../../types/database.types';
import {
  VENDOR_PAYER_PRESETS,
  VENDOR_PAYMENT_METHODS,
} from '../../constants/vendorConstants';
import {
  IndianRupee,
  Calendar,
  CreditCard,
  User,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface VendorPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  paymentToEdit?: VendorPayment | null;
}

export const VendorPaymentModal: React.FC<VendorPaymentModalProps> = ({
  isOpen,
  onClose,
  vendor,
  paymentToEdit,
}) => {
  const { addVendorPayment, updateVendorPayment } = useWedding();
  const { showToast } = useToast();
  const amountInputRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paidBy, setPaidBy] = useState('Family');
  const [customPaidBy, setCustomPaidBy] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (paymentToEdit) {
        setAmount(String(paymentToEdit.amount));
        setPaymentDate(paymentToEdit.payment_date);
        if (VENDOR_PAYER_PRESETS.includes(paymentToEdit.paid_by as any)) {
          setPaidBy(paymentToEdit.paid_by);
          setCustomPaidBy('');
        } else {
          setPaidBy('Other');
          setCustomPaidBy(paymentToEdit.paid_by);
        }
        setPaymentMethod(paymentToEdit.payment_method);
        setNotes(paymentToEdit.notes || '');
      } else {
        // Default to remaining balance if > 0, otherwise empty
        setAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaidBy('Family');
        setCustomPaidBy('');
        setPaymentMethod('Bank Transfer');
        setNotes('');
      }
      setErrors({});
      setTimeout(() => amountInputRef.current?.focus(), 150);
    }
  }, [isOpen, paymentToEdit, vendor]);

  const effectivePayer = paidBy === 'Other' ? customPaidBy.trim() : paidBy;

  const validate = () => {
    const errs: Record<string, string> = {};
    const amtNum = Number(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0) {
      errs.amount = 'Please enter a valid payment amount greater than zero.';
    }
    if (paidBy === 'Other' && !customPaidBy.trim()) {
      errs.customPaidBy = 'Please enter who paid this amount.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: VendorPaymentFormData = {
        amount: Number(amount),
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        paid_by: effectivePayer || 'Family',
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      };

      if (paymentToEdit) {
        await updateVendorPayment(paymentToEdit.id, payload);
        showToast('Payment and corresponding expense record synchronized! ✨', 'success');
      } else {
        await addVendorPayment(vendor.id, payload);
        showToast(
          `Recorded ₹${Number(amount).toLocaleString('en-IN')} payment to ${vendor.vendor_name}! 🪷`,
          'success'
        );
      }
      onClose();
    } catch (err) {
      console.error('Failed to save vendor payment:', err);
      showToast('Could not record payment. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillRemaining = () => {
    if (vendor.remaining_amount > 0) {
      setAmount(String(vendor.remaining_amount));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paymentToEdit ? 'Edit Vendor Payment' : `Record Payment — ${vendor.vendor_name}`}
      subtitle={`Agreed Contract: ₹${Number(vendor.agreed_amount || 0).toLocaleString('en-IN')} • Category: ${vendor.category}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* VENDOR BALANCE SNAPSHOT */}
        <div className="p-3 bg-[#F9F5F0] border border-[#E8DFD5] rounded-2xl flex items-center justify-between text-xs">
          <div>
            <p className="text-[10px] uppercase font-bold text-[#7C6B7E]">Paid So Far</p>
            <p className="text-sm font-bold text-[#2C6E49] mt-0.5">
              ₹{Number(vendor.paid_amount || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-[#7C6B7E]">Remaining Balance</p>
            <p className="text-sm font-bold text-[#C93B2B] mt-0.5">
              ₹{Number(vendor.remaining_amount || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* AMOUNT & QUICK REMAINING FILL */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider">
              Payment Amount (₹) <span className="text-[#C93B2B]">*</span>
            </label>
            {vendor.remaining_amount > 0 && !paymentToEdit && (
              <button
                type="button"
                onClick={handleFillRemaining}
                className="text-[11px] font-bold text-[#641F35] hover:underline flex items-center gap-1"
              >
                Pay full balance (₹{Number(vendor.remaining_amount).toLocaleString('en-IN')})
              </button>
            )}
          </div>
          <div className="relative">
            <span className="text-sm font-bold text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2">
              ₹
            </span>
            <input
              ref={amountInputRef}
              type="number"
              min="1"
              step="100"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              className={`w-full pl-8 pr-3 py-2.5 text-base bg-[#FFFDF9] border rounded-xl text-[#16162A] font-bold focus:outline-none focus:border-[#641F35] ${
                errors.amount ? 'border-[#C93B2B] bg-[#FFF5F5]' : 'border-[#E8DFD5]'
              }`}
            />
          </div>
          {errors.amount && <p className="text-xs text-[#C93B2B] mt-0.5">{errors.amount}</p>}
        </div>

        {/* PAYMENT DATE */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Payment Date <span className="text-[#C93B2B]">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
            />
          </div>
        </div>

        {/* PAID BY PRESETS */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1.5">
            Paid By
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {VENDOR_PAYER_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPaidBy(preset)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  paidBy === preset
                    ? 'bg-[#641F35] text-white shadow-xs'
                    : 'bg-[#F9F5F0] text-[#7C6B7E] hover:bg-[#E8DFD5]/60'
                }`}
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPaidBy('Other')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                paidBy === 'Other'
                  ? 'bg-[#641F35] text-white shadow-xs'
                  : 'bg-[#F9F5F0] text-[#7C6B7E] hover:bg-[#E8DFD5]/60'
              }`}
            >
              Other...
            </button>
          </div>

          {paidBy === 'Other' && (
            <div className="relative animate-fade-in">
              <User className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={customPaidBy}
                onChange={(e) => setCustomPaidBy(e.target.value)}
                placeholder="e.g. Uncle Ramesh, Chachi"
                className={`w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] ${
                  errors.customPaidBy ? 'border-[#C93B2B]' : 'border-[#E8DFD5]'
                }`}
              />
            </div>
          )}
        </div>

        {/* PAYMENT METHOD */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Payment Method
          </label>
          <div className="relative">
            <CreditCard className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
            >
              {VENDOR_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NOTES & TRANSACTION REFERENCE */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Notes / UTR / Reference ID
          </label>
          <div className="relative">
            <FileText className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-3 pointer-events-none" />
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. IMPS Ref #9928371, 2nd installment for Sangeet stage"
              className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] resize-none"
            />
          </div>
        </div>

        {/* LEDGER INTEGRATION NOTICE */}
        <div className="p-2.5 bg-[#FFF7E8] border border-[#E89838]/40 rounded-xl flex items-center gap-2 text-xs text-[#9E5D0A]">
          <Sparkles className="w-4 h-4 text-[#E89838] flex-shrink-0" />
          <p className="text-[11px] leading-tight">
            <strong>Budget Invariant:</strong> This entry automatically creates and synchronizes a 1-to-1 expense record in your total wedding spend.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E8DFD5]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? 'Recording...'
              : paymentToEdit
              ? 'Update Payment'
              : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
