import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import {
  Vendor,
  VendorCategory,
  VendorStatus,
  VendorFormData,
} from '../../types/vendor';
import {
  VENDOR_CATEGORIES,
  VENDOR_STATUSES,
} from '../../constants/vendorConstants';
import {
  Briefcase,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

interface VendorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorToEdit?: Vendor | null;
}

export const VendorFormModal: React.FC<VendorFormModalProps> = ({
  isOpen,
  onClose,
  vendorToEdit,
}) => {
  const { events, addVendor, updateVendor } = useWedding();
  const { showToast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [vendorName, setVendorName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('Photography');
  const [eventId, setEventId] = useState<string>('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [status, setStatus] = useState<VendorStatus>('Contacted');
  const [agreedAmount, setAgreedAmount] = useState<string>('');
  const [advanceAmount, setAdvanceAmount] = useState<string>('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (vendorToEdit) {
        setVendorName(vendorToEdit.vendor_name);
        setCategory(vendorToEdit.category);
        setEventId(vendorToEdit.event_id || '');
        setContactPerson(vendorToEdit.contact_person || '');
        setPhone(vendorToEdit.phone || '');
        setWhatsapp(vendorToEdit.whatsapp || '');
        setEmail(vendorToEdit.email || '');
        setServiceDescription(vendorToEdit.service_description || '');
        setStatus(vendorToEdit.status);
        setAgreedAmount(vendorToEdit.agreed_amount ? String(vendorToEdit.agreed_amount) : '');
        setAdvanceAmount('');
        setNextFollowUpDate(vendorToEdit.next_follow_up_date || '');
        setPaymentDueDate(vendorToEdit.payment_due_date || '');
        setNotes(vendorToEdit.notes || '');
        setShowAdvanced(
          Boolean(
            vendorToEdit.email ||
              vendorToEdit.whatsapp ||
              vendorToEdit.service_description ||
              vendorToEdit.notes
          )
        );
      } else {
        setVendorName('');
        setCategory('Photography');
        setEventId('');
        setContactPerson('');
        setPhone('');
        setWhatsapp('');
        setEmail('');
        setServiceDescription('');
        setStatus('Contacted');
        setAgreedAmount('');
        setAdvanceAmount('');
        setNextFollowUpDate('');
        setPaymentDueDate('');
        setNotes('');
        setShowAdvanced(false);
      }
      setErrors({});
      setTimeout(() => nameInputRef.current?.focus(), 150);
    }
  }, [isOpen, vendorToEdit]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!vendorName.trim()) {
      errs.vendorName = 'Vendor / Business name is required.';
    }
    const agreedNum = Number(agreedAmount) || 0;
    const advanceNum = Number(advanceAmount) || 0;
    if (agreedNum < 0) {
      errs.agreedAmount = 'Agreed amount cannot be negative.';
    }
    if (advanceNum < 0) {
      errs.advanceAmount = 'Advance cannot be negative.';
    }
    if (!vendorToEdit && advanceNum > agreedNum && agreedNum > 0) {
      errs.advanceAmount = 'Advance deposit cannot exceed total agreed contract amount.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: VendorFormData = {
        vendor_name: vendorName.trim(),
        category,
        event_id: eventId || null,
        contact_person: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        email: email.trim() || undefined,
        service_description: serviceDescription.trim() || undefined,
        status,
        agreed_amount: Number(agreedAmount) || 0,
        advance_amount: !vendorToEdit ? Number(advanceAmount) || 0 : undefined,
        next_follow_up_date: nextFollowUpDate || undefined,
        payment_due_date: paymentDueDate || undefined,
        notes: notes.trim() || undefined,
      };

      if (vendorToEdit) {
        await updateVendor(vendorToEdit.id, payload);
        showToast('Vendor record updated in wedding book! ✨', 'success');
      } else {
        await addVendor(payload);
        if (Number(advanceAmount) > 0) {
          showToast(
            `Added "${payload.vendor_name}" & recorded advance of ₹${Number(advanceAmount).toLocaleString('en-IN')}! 🪷`,
            'success'
          );
        } else {
          showToast(`Vendor "${payload.vendor_name}" added to wedding registry! 🪷`, 'success');
        }
      }
      onClose();
    } catch (err) {
      console.error('Failed to save vendor:', err);
      showToast('Could not save vendor. Please check all fields.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vendorToEdit ? 'Edit Wedding Vendor' : 'Add to Vendor Book'}
      subtitle={
        vendorToEdit
          ? 'Update service details, contract amounts, and due dates'
          : 'Record the people and teams orchestrating the wedding'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. BUSINESS NAME & CATEGORY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Vendor / Business Name <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="relative">
              <Briefcase className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={nameInputRef}
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Royal Decorators, Shutter Stories Studio"
                className={`w-full pl-8 pr-3 py-2.5 text-sm bg-[#FFFDF9] border rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35] ${
                  errors.vendorName ? 'border-[#C93B2B] bg-[#FFF5F5]' : 'border-[#E8DFD5]'
                }`}
              />
            </div>
            {errors.vendorName && <p className="text-xs text-[#C93B2B] mt-0.5">{errors.vendorName}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Category <span className="text-[#C93B2B]">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VendorCategory)}
              className="w-full px-3 py-2.5 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
            >
              {VENDOR_CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. CEREMONY LINK & STATUS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Ceremony Assignment
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
            >
              <option value="">All Ceremonies / Entire Wedding</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.event_name} ({evt.event_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Hiring Status <span className="text-[#C93B2B]">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as VendorStatus)}
              className="w-full px-3 py-2.5 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
            >
              {VENDOR_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. CONTACT PERSON & PHONE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Contact Person / Lead
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rajesh Saini, Chef Kapoor"
                className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98290 12345"
                className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
              />
            </div>
          </div>
        </div>

        {/* 4. FINANCIAL CONTRACT & ADVANCE DEPOSIT */}
        <div className="p-3.5 bg-[#F9F5F0] border border-[#E8DFD5] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#641F35] flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              Contract Financials
            </span>
            <span className="text-[10px] text-[#7C6B7E]">Rupee Values</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#16162A] mb-1">
                Agreed Contract Total (₹)
              </label>
              <div className="relative">
                <span className="text-xs font-bold text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={agreedAmount}
                  onChange={(e) => setAgreedAmount(e.target.value)}
                  placeholder="e.g. 150000"
                  className={`w-full pl-7 pr-3 py-2 text-sm bg-[#FFFDF9] border rounded-xl text-[#16162A] font-semibold focus:outline-none focus:border-[#641F35] ${
                    errors.agreedAmount ? 'border-[#C93B2B] bg-[#FFF5F5]' : 'border-[#E8DFD5]'
                  }`}
                />
              </div>
              {errors.agreedAmount && (
                <p className="text-xs text-[#C93B2B] mt-0.5">{errors.agreedAmount}</p>
              )}
            </div>

            {!vendorToEdit ? (
              <div>
                <label className="block text-[11px] font-bold text-[#16162A] mb-1">
                  Initial Advance Paid (₹)
                </label>
                <div className="relative">
                  <span className="text-xs font-bold text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className={`w-full pl-7 pr-3 py-2 text-sm bg-[#FFFDF9] border rounded-xl text-[#16162A] font-semibold focus:outline-none focus:border-[#641F35] ${
                      errors.advanceAmount ? 'border-[#C93B2B] bg-[#FFF5F5]' : 'border-[#E8DFD5]'
                    }`}
                  />
                </div>
                {errors.advanceAmount && (
                  <p className="text-xs text-[#C93B2B] mt-0.5">{errors.advanceAmount}</p>
                )}
                {Number(advanceAmount) > 0 && (
                  <p className="text-[10px] text-[#2C6E49] mt-1 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 text-[#E89838]" />
                    Will auto-create a verified payment & wedding expense of ₹
                    {Number(advanceAmount).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-[#16162A] mb-1">
                  Current Paid vs Remaining
                </label>
                <div className="py-2 px-3 bg-white/80 border border-[#E8DFD5] rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#2C6E49] font-bold">
                    Paid: ₹{Number(vendorToEdit.paid_amount || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[#C93B2B] font-bold">
                    Due: ₹{Number(vendorToEdit.remaining_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. DATES: FOLLOW-UP & DUE DATE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Next Follow-up Date
            </label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Final Payment Due Date
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={paymentDueDate}
                onChange={(e) => setPaymentDueDate(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
              />
            </div>
          </div>
        </div>

        {/* 6. ADVANCED TOGGLE (Email, WhatsApp, Address, Notes) */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-[#641F35] font-bold hover:underline flex items-center gap-1"
          >
            {showAdvanced ? '- Less Details' : '+ Add WhatsApp, Email, Address & Notes'}
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 pt-3 border-t border-[#E8DFD5]/60 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="e.g. +91 98290 12345"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vendor@company.com"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
                  Studio Address / Service Scope
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="e.g. C-Scheme, Jaipur • Candid photography + drone team"
                    className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
                  Vendor Notes & Details
                </label>
                <div className="relative">
                  <FileText className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-3 pointer-events-none" />
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Deliverables, timing, meal requirements, etc."
                    className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 7. ACTIONS */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E8DFD5]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting
              ? 'Saving...'
              : vendorToEdit
              ? 'Update Vendor'
              : 'Save to Vendor Book'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
