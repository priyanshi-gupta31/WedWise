import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import {
  GuestAccommodation,
  AccommodationFormData,
  AccommodationStatus,
} from '../../types/guest';
import { ACCOMMODATION_STATUSES } from '../../constants/guestConstants';
import { Hotel, User, Calendar, CreditCard, Bed, Users, FileText } from 'lucide-react';

interface AccommodationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodationToEdit?: GuestAccommodation | null;
  defaultGuestId?: string;
}

export const AccommodationFormModal: React.FC<AccommodationFormModalProps> = ({
  isOpen,
  onClose,
  accommodationToEdit,
  defaultGuestId,
}) => {
  const { guests, accommodations, events, addAccommodation, updateAccommodation } = useWedding();
  const { showToast } = useToast();

  const [guestId, setGuestId] = useState<string>('');
  const [hotelName, setHotelName] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [roomType, setRoomType] = useState<string>('Deluxe Room');
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [occupantsCount, setOccupantsCount] = useState<number>(2);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending' | 'Complimentary'>('Complimentary');
  const [status, setStatus] = useState<AccommodationStatus>('Assigned');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Unique list of existing hotel names for quick selection
  const existingHotels = useMemo(() => {
    const set = new Set<string>();
    accommodations.forEach((acc) => {
      if (acc.hotel_name) set.add(acc.hotel_name.trim());
    });
    return Array.from(set);
  }, [accommodations]);

  // Selected guest details
  const selectedGuest = useMemo(() => {
    return guests.find((g) => g.id === guestId);
  }, [guests, guestId]);

  useEffect(() => {
    if (isOpen) {
      if (accommodationToEdit) {
        setGuestId(accommodationToEdit.guest_id);
        setHotelName(accommodationToEdit.hotel_name);
        setRoomNumber(accommodationToEdit.room_number || '');
        setRoomType(accommodationToEdit.room_type || 'Deluxe Room');
        setCheckInDate(accommodationToEdit.check_in_date);
        setCheckOutDate(accommodationToEdit.check_out_date);
        setOccupantsCount(accommodationToEdit.occupants_count || 1);
        setPaymentStatus(accommodationToEdit.payment_status || 'Complimentary');
        setStatus(accommodationToEdit.status || 'Assigned');
        setNotes(accommodationToEdit.notes || '');
      } else {
        const initialGuestId = defaultGuestId || (guests.length > 0 ? guests[0].id : '');
        setGuestId(initialGuestId);
        
        // Find default guest to suggest occupants
        const initialGuest = guests.find((g) => g.id === initialGuestId);
        const partySize = initialGuest ? 1 + (initialGuest.accompanying_members || 0) : 2;
        setOccupantsCount(partySize);

        // Pre-fill hotel name if existing
        setHotelName(existingHotels.length > 0 ? existingHotels[0] : '');
        setRoomNumber('');
        setRoomType('Deluxe Room');

        // Pre-fill dates from events if available, else today & tomorrow
        if (events.length > 0) {
          const sortedDates = [...events].map((e) => e.date).sort();
          setCheckInDate(sortedDates[0]);
          setCheckOutDate(sortedDates[sortedDates.length - 1]);
        } else {
          const today = new Date().toISOString().split('T')[0];
          setCheckInDate(today);
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          setCheckOutDate(tomorrow);
        }

        setPaymentStatus('Complimentary');
        setStatus('Assigned');
        setNotes('');
      }
      setErrors({});
    }
  }, [isOpen, accommodationToEdit, defaultGuestId, guests, events, existingHotels]);

  // Automatically adjust occupants count when guest changes (in create mode)
  const handleGuestChange = (newGuestId: string) => {
    setGuestId(newGuestId);
    if (!accommodationToEdit) {
      const g = guests.find((item) => item.id === newGuestId);
      if (g) {
        setOccupantsCount(1 + (g.accompanying_members || 0));
      }
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!guestId) {
      errs.guestId = 'Please select a wedding guest.';
    }
    if (!hotelName.trim()) {
      errs.hotelName = 'Hotel or venue name is required.';
    }
    if (!checkInDate) {
      errs.checkInDate = 'Check-in date is required.';
    }
    if (!checkOutDate) {
      errs.checkOutDate = 'Check-out date is required.';
    }
    if (checkInDate && checkOutDate && checkInDate > checkOutDate) {
      errs.checkOutDate = 'Check-out date must be after check-in date.';
    }
    if (occupantsCount < 1) {
      errs.occupantsCount = 'At least 1 occupant is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: AccommodationFormData = {
        guest_id: guestId,
        hotel_name: hotelName.trim(),
        room_number: roomNumber.trim() || undefined,
        room_type: roomType.trim() || undefined,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        occupants_count: occupantsCount,
        payment_status: paymentStatus,
        status,
        notes: notes.trim() || undefined,
      };

      if (accommodationToEdit) {
        await updateAccommodation(accommodationToEdit.id, payload);
        showToast('Room allotment updated successfully', 'success');
      } else {
        await addAccommodation(payload);
        showToast('Room allotment created successfully', 'success');
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save accommodation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roomTypePresets = ['Deluxe Room', 'Executive Suite', 'Standard Room', 'Villa / Cottage', 'Bridal Suite'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={accommodationToEdit ? 'Edit Room Allotment' : 'Allot Guest Room'}
      subtitle="Manage hotel reservations, room numbers, and guest stays"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-[#16162A]">
        {/* Guest Selector */}
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
            Wedding Guest / Family Party <span className="text-[#C93B2B]">*</span>
          </label>
          <div className="relative">
            <select
              value={guestId}
              onChange={(e) => handleGuestChange(e.target.value)}
              disabled={Boolean(accommodationToEdit)}
              className={`w-full appearance-none pl-10 pr-10 py-2.5 rounded-xl border bg-[#FFFDF9] text-sm text-[#16162A] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 ${
                errors.guestId ? 'border-[#C93B2B]' : 'border-[#E8DFD5]'
              } ${accommodationToEdit ? 'opacity-70 bg-stone-100 cursor-not-allowed' : ''}`}
            >
              <option value="">-- Select a Guest --</option>
              {guests.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.full_name} ({1 + (g.accompanying_members || 0)} guests) — {g.family_group}
                  {g.accommodation_required ? ' 🏨 [Requested]' : ''}
                </option>
              ))}
            </select>
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A8E] pointer-events-none" />
          </div>
          {errors.guestId && <p className="text-xs text-[#C93B2B] mt-1">{errors.guestId}</p>}
          {selectedGuest && (
            <p className="text-[11px] text-[#8C7A8E] mt-1 font-serif italic">
              Party of {1 + (selectedGuest.accompanying_members || 0)} · {selectedGuest.wedding_side} Side · RSVP: {selectedGuest.rsvp_status}
            </p>
          )}
        </div>

        {/* Hotel / Venue Name */}
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
            Hotel or Property Name <span className="text-[#C93B2B]">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="e.g., The Leela Palace, ITC Grand Chola"
              className={`w-full pl-10 pr-3 py-2.5 rounded-xl border bg-[#FFFDF9] text-sm text-[#16162A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 ${
                errors.hotelName ? 'border-[#C93B2B]' : 'border-[#E8DFD5]'
              }`}
            />
            <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A8E]" />
          </div>
          {errors.hotelName && <p className="text-xs text-[#C93B2B] mt-1">{errors.hotelName}</p>}

          {/* Quick suggestions if available */}
          {existingHotels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-[#8C7A8E] self-center mr-1">Existing:</span>
              {existingHotels.map((hotel) => (
                <button
                  type="button"
                  key={hotel}
                  onClick={() => setHotelName(hotel)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                    hotelName === hotel
                      ? 'bg-[#E89838] text-white border-[#E89838]'
                      : 'bg-white text-[#615163] border-[#E8DFD5] hover:border-[#E89838]'
                  }`}
                >
                  {hotel}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Room Number & Room Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
              Room / Suite Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g., 402 or Wing B - 12"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E8DFD5] bg-[#FFFDF9] text-sm text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40"
              />
              <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A8E]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
              Room Category
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] bg-[#FFFDF9] text-sm text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40"
            >
              {roomTypePresets.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates & Occupants */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
              Check-In Date <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className={`w-full pl-9 pr-2 py-2 rounded-xl border bg-[#FFFDF9] text-xs text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 ${
                  errors.checkInDate ? 'border-[#C93B2B]' : 'border-[#E8DFD5]'
                }`}
              />
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C7A8E]" />
            </div>
            {errors.checkInDate && <p className="text-[11px] text-[#C93B2B] mt-1">{errors.checkInDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
              Check-Out Date <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className={`w-full pl-9 pr-2 py-2 rounded-xl border bg-[#FFFDF9] text-xs text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 ${
                  errors.checkOutDate ? 'border-[#C93B2B]' : 'border-[#E8DFD5]'
                }`}
              />
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C7A8E]" />
            </div>
            {errors.checkOutDate && <p className="text-[11px] text-[#C93B2B] mt-1">{errors.checkOutDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
              Occupants <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setOccupantsCount(Math.max(1, occupantsCount - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E8DFD5] bg-[#FFFDF9] hover:bg-amber-50 font-serif font-bold text-sm text-[#16162A]"
              >
                -
              </button>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={occupantsCount}
                  onChange={(e) => setOccupantsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center py-2 rounded-xl border border-[#E8DFD5] bg-[#FFFDF9] text-sm font-semibold text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40"
                />
              </div>
              <button
                type="button"
                onClick={() => setOccupantsCount(occupantsCount + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E8DFD5] bg-[#FFFDF9] hover:bg-amber-50 font-serif font-bold text-sm text-[#16162A]"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Room Status & Payment Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
              Stay Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AccommodationStatus)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E8DFD5] bg-[#FFFDF9] text-sm text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 font-medium"
            >
              {ACCOMMODATION_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
              Billing / Payment Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Complimentary', 'Pending', 'Paid'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPaymentStatus(p)}
                  className={`py-2 px-1 text-xs font-medium rounded-xl border transition-all text-center ${
                    paymentStatus === p
                      ? p === 'Complimentary'
                        ? 'bg-[#2D5A43] text-white border-[#2D5A43]'
                        : p === 'Paid'
                        ? 'bg-[#641F35] text-white border-[#641F35]'
                        : 'bg-[#E89838] text-white border-[#E89838]'
                      : 'bg-white text-[#615163] border-[#E8DFD5] hover:border-[#E89838]'
                  }`}
                >
                  {p === 'Complimentary' ? 'Host Paid' : p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
            Special Requests & Notes (Optional)
          </label>
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Ground floor preferred, extra rollaway bed requested, early check-in at 11 AM"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8DFD5] bg-[#FFFDF9] text-xs text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 resize-none"
            />
            <FileText className="absolute left-2.5 top-2.5 w-4 h-4 text-[#8C7A8E]" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 pb-2 border-t border-[#E8DFD5]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1 sm:flex-initial">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#641F35] hover:bg-[#52192B] text-white px-6 font-serif flex-1 sm:flex-initial"
          >
            {isSubmitting ? 'Saving...' : accommodationToEdit ? 'Save Changes' : 'Confirm Allotment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
