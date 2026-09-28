import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import { Guest } from '../../types/guest';
import { RSVP_STATUSES } from '../../constants/guestConstants';
import {
  User,
  Phone,
  Mail,
  Users,
  Hotel,
  Car,
  Utensils,
  Calendar,
  Edit3,
  Trash2,
  Plus,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface GuestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
  onEdit: (guest: Guest) => void;
  onAssignRoom: (guestId: string) => void;
  onPlanTransport: (guestId: string) => void;
}

export const GuestDetailsModal: React.FC<GuestDetailsModalProps> = ({
  isOpen,
  onClose,
  guest,
  onEdit,
  onAssignRoom,
  onPlanTransport,
}) => {
  const { deleteGuest, events, accommodations, transports } = useWedding();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!guest) return null;

  const rsvpConfig =
    RSVP_STATUSES.find((s) => s.value === guest.rsvp_status) || RSVP_STATUSES[0];

  const guestAccommodations = accommodations.filter((a) => a.guest_id === guest.id);
  const guestTransports = transports.filter((t) => t.guest_id === guest.id);

  const invitedEventObjects = events.filter(
    (e) => guest.invited_events && guest.invited_events.includes(e.id)
  );

  const totalHeadcount = 1 + (Number(guest.accompanying_members) || 0);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to remove "${guest.full_name}" from the wedding guest directory?`)) {
      setIsDeleting(true);
      try {
        await deleteGuest(guest.id);
        showToast('Guest record removed from guest book', 'info');
        onClose();
      } catch (err) {
        console.error('Failed to delete guest:', err);
        showToast('Could not delete guest. Please try again.', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={guest.full_name}
      subtitle={`Wedding Guest Book • ${guest.family_group}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#641F35] via-[#4D1527] to-[#2B0B15] text-[#FFF8F0] p-5 shadow-wine">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-[#FFF8F0]/10 border border-[#FFF8F0]/20 flex items-center justify-center text-xl font-serif font-bold text-[#D6B36A] flex-shrink-0">
                {guest.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E89838]/20 text-[#FFD699] border border-[#E89838]/30">
                    {guest.wedding_side}'s Side
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-[#FFF8F0]">
                    {guest.family_group}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
                  {guest.full_name}
                </h3>
              </div>
            </div>

            {/* RSVP Badge */}
            <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center bg-black/20 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-[#D6B36A] tracking-wider">
                RSVP Status
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border mt-0.5 ${rsvpConfig.badgeBg} ${rsvpConfig.badgeText} ${rsvpConfig.badgeBorder}`}
              >
                {guest.rsvp_status}
              </span>
            </div>
          </div>

          {/* HEADCOUNT & PARTY STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D6B36A] flex-shrink-0" />
              <span>
                <strong>{totalHeadcount}</strong> {totalHeadcount === 1 ? 'Guest' : 'Guests (Party)'}
              </span>
            </div>
            {guest.food_preference && (
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#D6B36A] flex-shrink-0" />
                <span>{guest.food_preference}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Hotel className="w-4 h-4 text-[#D6B36A] flex-shrink-0" />
              <span>{guest.accommodation_required ? 'Room Needed' : 'No Room Needed'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[#D6B36A] flex-shrink-0" />
              <span>{guest.transport_required ? 'Transport Needed' : 'Self Arranged'}</span>
            </div>
          </div>
        </div>

        {/* CONTACT ROW */}
        {(guest.phone || guest.email) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guest.phone && (
              <a
                href={`tel:${guest.phone}`}
                className="flex items-center justify-between p-3 rounded-xl border border-[#F1E4D6] bg-white hover:border-[#D6B36A] transition-all text-xs text-[#16162A]"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#E89838]" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#8C7A8E]">Phone</span>
                    <span className="font-semibold">{guest.phone}</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#8C7A8E]" />
              </a>
            )}

            {guest.email && (
              <a
                href={`mailto:${guest.email}`}
                className="flex items-center justify-between p-3 rounded-xl border border-[#F1E4D6] bg-white hover:border-[#D6B36A] transition-all text-xs text-[#16162A]"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#E89838]" />
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#8C7A8E]">Email</span>
                    <span className="font-semibold truncate max-w-[180px] block">{guest.email}</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#8C7A8E]" />
              </a>
            )}
          </div>
        )}

        {/* LOGISTICS: ROOMS & TRANSPORT SUB-CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Hotel Accommodation Card */}
          <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F1E4D6] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#641F35] tracking-wider flex items-center gap-1.5">
                <Hotel className="w-3.5 h-3.5 text-[#641F35]" />
                Room Allotment
              </span>
              <span className="text-[10px] font-semibold text-[#8C7A8E]">
                {guest.accommodation_required ? 'Required' : 'Not Required'}
              </span>
            </div>

            {guestAccommodations.length > 0 ? (
              guestAccommodations.map((acc) => (
                <div key={acc.id} className="p-2.5 bg-white rounded-xl border border-[#F1E4D6] text-xs">
                  <p className="font-bold text-[#16162A]">{acc.hotel_name}</p>
                  <p className="text-[11px] text-[#615163] mt-0.5">
                    {acc.room_number ? `${acc.room_number} • ` : ''}
                    {acc.room_type || 'Standard Room'} ({acc.occupants_count} Occupants)
                  </p>
                  <p className="text-[10px] text-[#8C7A8E] mt-1">
                    {acc.check_in_date} → {acc.check_out_date}
                  </p>
                </div>
              ))
            ) : guest.accommodation_required ? (
              <div className="p-3 bg-white rounded-xl border border-dashed border-[#E8DFD5] text-center">
                <p className="text-xs text-[#8C7A8E] mb-2">Room needed but not yet assigned.</p>
                <button
                  type="button"
                  onClick={() => onAssignRoom(guest.id)}
                  className="text-xs font-bold text-[#641F35] hover:underline"
                >
                  + Assign Hotel Room
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#8C7A8E] italic">Guest does not require accommodation.</p>
            )}
          </div>

          {/* Transport Card */}
          <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#F1E4D6] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#641F35] tracking-wider flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-[#641F35]" />
                Travel & Pickups
              </span>
              <span className="text-[10px] font-semibold text-[#8C7A8E]">
                {guest.transport_required ? 'Required' : 'Not Required'}
              </span>
            </div>

            {guestTransports.length > 0 ? (
              guestTransports.map((trp) => (
                <div key={trp.id} className="p-2.5 bg-white rounded-xl border border-[#F1E4D6] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#16162A]">{trp.transport_type}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#FFF2E0] text-[#9E5D0A]">
                      {trp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#615163] mt-0.5 truncate">
                    {trp.pickup_location} → {trp.destination}
                  </p>
                  <p className="text-[10px] text-[#8C7A8E] mt-0.5">
                    {trp.date} at {trp.time}
                    {trp.driver_name ? ` • Driver: ${trp.driver_name}` : ''}
                  </p>
                </div>
              ))
            ) : guest.transport_required ? (
              <div className="p-3 bg-white rounded-xl border border-dashed border-[#E8DFD5] text-center">
                <p className="text-xs text-[#8C7A8E] mb-2">Transport requested but not scheduled.</p>
                <button
                  type="button"
                  onClick={() => onPlanTransport(guest.id)}
                  className="text-xs font-bold text-[#641F35] hover:underline"
                >
                  + Schedule Pickup / Drop
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#8C7A8E] italic">Guest does not require transport.</p>
            )}
          </div>
        </div>

        {/* CEREMONIES ASSOCIATED */}
        {invitedEventObjects.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider">
              Invited Ceremonial Functions ({invitedEventObjects.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {invitedEventObjects.map((ev) => (
                <span
                  key={ev.id}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF8F0] border border-[#F1E4D6] text-[#641F35] flex items-center gap-1"
                >
                  <span>🪷</span>
                  <span>
                    {ev.event_name} ({ev.date})
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* NOTES */}
        {guest.notes && (
          <div className="p-3 bg-[#FFFDF9] rounded-xl border border-[#F1E4D6] text-xs text-[#615163] italic">
            "{guest.notes}"
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E8DFD5]">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs font-semibold text-[#C93B2B] hover:text-[#9A1F1F] flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#FFF5F5] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Guest</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onEdit(guest)}
              className="text-xs flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </Button>
            <Button type="button" onClick={onClose} className="text-xs">
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
