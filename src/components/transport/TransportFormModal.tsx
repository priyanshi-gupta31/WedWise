import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import {
  GuestTransport,
  TransportFormData,
  TransportType,
  TransportStatus,
} from '../../types/guest';
import { TRANSPORT_TYPES, TRANSPORT_STATUSES } from '../../constants/guestConstants';
import { Car, User, Calendar, Clock, Phone, MapPin, Navigation, FileText } from 'lucide-react';

interface TransportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  transportToEdit?: GuestTransport | null;
  defaultGuestId?: string;
}

export const TransportFormModal: React.FC<TransportFormModalProps> = ({
  isOpen,
  onClose,
  transportToEdit,
  defaultGuestId,
}) => {
  const { guests, events, addTransport, updateTransport } = useWedding();
  const { showToast } = useToast();

  const [guestId, setGuestId] = useState<string>('');
  const [transportType, setTransportType] = useState<TransportType>('Pickup');
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('12:00');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [vehicleDetails, setVehicleDetails] = useState<string>('');
  const [status, setStatus] = useState<TransportStatus>('Planned');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedGuest = useMemo(() => {
    return guests.find((g) => g.id === guestId);
  }, [guests, guestId]);

  useEffect(() => {
    if (isOpen) {
      if (transportToEdit) {
        setGuestId(transportToEdit.guest_id);
        setTransportType(transportToEdit.transport_type);
        setPickupLocation(transportToEdit.pickup_location);
        setDestination(transportToEdit.destination);
        setDate(transportToEdit.date);
        setTime(transportToEdit.time);
        setDriverName(transportToEdit.driver_name || '');
        setDriverPhone(transportToEdit.driver_phone || '');
        setVehicleDetails(transportToEdit.vehicle_details || '');
        setStatus(transportToEdit.status);
        setNotes(transportToEdit.notes || '');
      } else {
        const initialGuestId = defaultGuestId || (guests.length > 0 ? guests[0].id : '');
        setGuestId(initialGuestId);
        setTransportType('Pickup');
        setPickupLocation('Airport Terminal 3');
        setDestination('Wedding Venue / Hotel');

        // Pre-fill date from events if available, else today
        if (events.length > 0) {
          const sortedDates = [...events].map((e) => e.date).sort();
          setDate(sortedDates[0]);
        } else {
          setDate(new Date().toISOString().split('T')[0]);
        }
        setTime('14:00');
        setDriverName('');
        setDriverPhone('');
        setVehicleDetails('');
        setStatus('Planned');
        setNotes('');
      }
      setErrors({});
    }
  }, [isOpen, transportToEdit, defaultGuestId, guests, events]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!guestId) {
      errs.guestId = 'Please select a wedding guest.';
    }
    if (!pickupLocation.trim()) {
      errs.pickupLocation = 'Pickup location is required.';
    }
    if (!destination.trim()) {
      errs.destination = 'Destination is required.';
    }
    if (!date) {
      errs.date = 'Date is required.';
    }
    if (!time) {
      errs.time = 'Time is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: TransportFormData = {
        guest_id: guestId,
        transport_type: transportType,
        pickup_location: pickupLocation.trim(),
        destination: destination.trim(),
        date,
        time,
        driver_name: driverName.trim() || undefined,
        driver_phone: driverPhone.trim() || undefined,
        vehicle_details: vehicleDetails.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
      };

      if (transportToEdit) {
        await updateTransport(transportToEdit.id, payload);
        showToast('Transport trip updated successfully', 'success');
      } else {
        await addTransport(payload);
        showToast('Transport trip scheduled successfully', 'success');
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save transport schedule', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const locationPresets = [
    'Airport Terminal 3',
    'Airport Terminal 1',
    'Central Railway Station',
    'Palace Hotel',
    'Wedding Lawn & Banquet',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transportToEdit ? 'Edit Transport Schedule' : 'Schedule Guest Transport'}
      subtitle="Arrange airport/station pickups, venue transfers, and driver details"
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
              onChange={(e) => setGuestId(e.target.value)}
              disabled={Boolean(transportToEdit)}
              className={`w-full appearance-none pl-10 pr-10 py-2.5 rounded-xl border bg-[#FFFDF9] text-sm text-[#16162A] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 ${
                errors.guestId ? 'border-[#C93B2B]' : 'border-[#E8DFD5]'
              } ${transportToEdit ? 'opacity-70 bg-stone-100 cursor-not-allowed' : ''}`}
            >
              <option value="">-- Select a Guest --</option>
              {guests.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.full_name} ({1 + (g.accompanying_members || 0)} guests) — {g.family_group}
                  {g.transport_required ? ' 🚗 [Requested]' : ''}
                </option>
              ))}
            </select>
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A8E] pointer-events-none" />
          </div>
          {errors.guestId && <p className="text-xs text-[#C93B2B] mt-1">{errors.guestId}</p>}
          {selectedGuest && (
            <p className="text-[11px] text-[#8C7A8E] mt-1 font-serif italic">
              Party of {1 + (selectedGuest.accompanying_members || 0)} · Phone: {selectedGuest.phone || 'None provided'}
            </p>
          )}
        </div>

        {/* Transport Type Selector */}
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
            Trip Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TRANSPORT_TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => {
                  setTransportType(t.value);
                  if (t.value === 'Pickup' && !transportToEdit) {
                    setPickupLocation('Airport Terminal 3');
                    setDestination('Palace Hotel');
                  } else if (t.value === 'Drop' && !transportToEdit) {
                    setPickupLocation('Palace Hotel');
                    setDestination('Airport Terminal 3');
                  }
                }}
                className={`py-2 px-1.5 text-[11px] sm:text-xs font-medium rounded-xl border text-center transition-all ${
                  transportType === t.value
                    ? 'bg-[#E89838] text-white border-[#E89838] shadow-sm'
                    : 'bg-white text-[#615163] border-[#E8DFD5] hover:border-[#E89838]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pickup & Destination Locations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
              Pickup Location <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="e.g. Airport T3, New Delhi"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border bg-[#FFFDF9] text-sm text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 ${
                  errors.pickupLocation ? 'border-[#C93B2B]' : 'border-[#E8DFD5]'
                }`}
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A8E]" />
            </div>
            {errors.pickupLocation && <p className="text-xs text-[#C93B2B] mt-1">{errors.pickupLocation}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
              Destination <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Palace Hotel, Civil Lines"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border bg-[#FFFDF9] text-sm text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 ${
                  errors.destination ? 'border-[#C93B2B]' : 'border-[#E8DFD5]'
                }`}
              />
              <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A8E]" />
            </div>
            {errors.destination && <p className="text-xs text-[#C93B2B] mt-1">{errors.destination}</p>}
          </div>
        </div>

        {/* Quick Location Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-[#8C7A8E] mr-1 font-serif">Quick fill:</span>
          {locationPresets.map((loc) => (
            <button
              type="button"
              key={loc}
              onClick={() => {
                if (transportType === 'Pickup') {
                  setPickupLocation(loc);
                } else {
                  setDestination(loc);
                }
              }}
              className="text-[10px] px-2 py-0.5 rounded-full border border-[#E8DFD5] bg-white text-[#615163] hover:border-[#E89838] hover:text-[#E89838] transition-all"
            >
              {loc}
            </button>
          ))}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
              Date <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-[#FFFDF9] text-sm text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 ${
                  errors.date ? 'border-[#C93B2B]' : 'border-[#E8DFD5]'
                }`}
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A8E]" />
            </div>
            {errors.date && <p className="text-xs text-[#C93B2B] mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
              Scheduled Time <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="relative">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-[#FFFDF9] text-sm text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40 ${
                  errors.time ? 'border-[#C93B2B]' : 'border-[#E8DFD5]'
                }`}
              />
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A8E]" />
            </div>
            {errors.time && <p className="text-xs text-[#C93B2B] mt-1">{errors.time}</p>}
          </div>
        </div>

        {/* Driver & Vehicle Details */}
        <div className="rounded-xl border border-[#E8DFD5] bg-[#FAF8F5] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#16162A] uppercase tracking-wider flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-[#E89838]" /> Driver & Vehicle Assignment
            </span>
            <span className="text-[10px] text-[#8C7A8E] italic font-serif">(Can be updated closer to date)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#16162A]/70 mb-1">
                Driver Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g., Ramesh Singh"
                className="w-full px-3 py-1.5 rounded-lg border border-[#E8DFD5] bg-white text-xs text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#16162A]/70 mb-1">
                Driver Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E8DFD5] bg-white text-xs text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40"
                />
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C7A8E]" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#16162A]/70 mb-1">
              Vehicle Make & Registration
            </label>
            <input
              type="text"
              value={vehicleDetails}
              onChange={(e) => setVehicleDetails(e.target.value)}
              placeholder="e.g., Toyota Innova Crysta (Silver) · DL 01 AB 1234"
              className="w-full px-3 py-1.5 rounded-lg border border-[#E8DFD5] bg-white text-xs text-[#16162A] focus:outline-none focus:ring-2 focus:ring-[#E89838]/40"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
            Trip Status
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TRANSPORT_STATUSES.map((st) => (
              <button
                type="button"
                key={st.value}
                onClick={() => setStatus(st.value)}
                className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                  status === st.value
                    ? 'bg-[#16162A] text-[#F3E5AB] border-[#16162A] shadow-sm font-semibold'
                    : 'bg-white text-[#615163] border-[#E8DFD5] hover:border-[#16162A]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold tracking-wider uppercase text-[#16162A]/70 mb-1.5">
            Flight/Train Details or Special Notes (Optional)
          </label>
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Flight 6E 214 landing 14:15, 3 large bags, elderly passenger needing wheelchair assistance"
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
            {isSubmitting ? 'Saving...' : transportToEdit ? 'Save Changes' : 'Confirm Trip'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
