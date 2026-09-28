import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import {
  Guest,
  GuestFormData,
  WeddingSide,
  RSVPStatus,
  FoodPreference,
} from '../../types/guest';
import {
  DEFAULT_GUEST_GROUPS,
  WEDDING_SIDES,
  RSVP_STATUSES,
  FOOD_PREFERENCES,
} from '../../constants/guestConstants';
import { findDuplicateGuest } from '../../utils/guestUtils';
import {
  User,
  Phone,
  Mail,
  Users,
  Hotel,
  Car,
  AlertTriangle,
  Calendar,
  Sparkles,
  Utensils,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface GuestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestToEdit?: Guest | null;
}

export const GuestFormModal: React.FC<GuestFormModalProps> = ({
  isOpen,
  onClose,
  guestToEdit,
}) => {
  const { guests, events, addGuest, updateGuest } = useWedding();
  const { showToast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [familyGroup, setFamilyGroup] = useState<string>('Bride Family');
  const [customGroup, setCustomGroup] = useState('');
  const [weddingSide, setWeddingSide] = useState<WeddingSide>('Bride');
  const [accompanyingMembers, setAccompanyingMembers] = useState<number>(0);
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>('Invited');
  const [foodPreference, setFoodPreference] = useState<FoodPreference>('Vegetarian');
  const [accommodationRequired, setAccommodationRequired] = useState(false);
  const [transportRequired, setTransportRequired] = useState(false);
  const [notes, setNotes] = useState('');
  const [invitedEvents, setInvitedEvents] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (guestToEdit) {
        setFullName(guestToEdit.full_name);
        setPhone(guestToEdit.phone || '');
        setEmail(guestToEdit.email || '');
        if (DEFAULT_GUEST_GROUPS.includes(guestToEdit.family_group as any)) {
          setFamilyGroup(guestToEdit.family_group);
          setCustomGroup('');
        } else {
          setFamilyGroup('Custom');
          setCustomGroup(guestToEdit.family_group);
        }
        setWeddingSide(guestToEdit.wedding_side);
        setAccompanyingMembers(guestToEdit.accompanying_members || 0);
        setAdultsCount(guestToEdit.adults_count ?? (1 + (guestToEdit.accompanying_members || 0)));
        setChildrenCount(guestToEdit.children_count ?? 0);
        setRsvpStatus(guestToEdit.rsvp_status);
        setFoodPreference(guestToEdit.food_preference || 'Vegetarian');
        setAccommodationRequired(Boolean(guestToEdit.accommodation_required));
        setTransportRequired(Boolean(guestToEdit.transport_required));
        setNotes(guestToEdit.notes || '');
        setInvitedEvents(guestToEdit.invited_events || []);
        setShowAdvanced(Boolean(guestToEdit.email || guestToEdit.notes || (guestToEdit.children_count ?? 0) > 0));
      } else {
        setFullName('');
        setPhone('');
        setEmail('');
        setFamilyGroup('Bride Family');
        setCustomGroup('');
        setWeddingSide('Bride');
        setAccompanyingMembers(0);
        setAdultsCount(1);
        setChildrenCount(0);
        setRsvpStatus('Invited');
        setFoodPreference('Vegetarian');
        setAccommodationRequired(false);
        setTransportRequired(false);
        setNotes('');
        // By default invite to all events
        setInvitedEvents(events.map((e) => e.id));
        setShowAdvanced(false);
      }
      setErrors({});

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, guestToEdit, events]);

  // Adjust adult count when accompanying members changes
  const handleAccompanyingChange = (val: number) => {
    const num = Math.max(0, val);
    setAccompanyingMembers(num);
    const totalHeadcount = 1 + num;
    setAdultsCount(Math.max(1, totalHeadcount - childrenCount));
  };

  // Live duplicate detection
  const duplicateWarning = useMemo(() => {
    if (!isOpen) return null;
    return findDuplicateGuest(guests, fullName, phone, guestToEdit?.id);
  }, [guests, fullName, phone, guestToEdit?.id, isOpen]);

  const effectiveGroup = familyGroup === 'Custom' ? customGroup.trim() || 'Custom' : familyGroup;

  const toggleEvent = (eventId: string) => {
    setInvitedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) {
      errs.fullName = 'Guest full name is required.';
    }
    if (familyGroup === 'Custom' && !customGroup.trim()) {
      errs.customGroup = 'Please specify custom group name.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: GuestFormData = {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        family_group: effectiveGroup,
        wedding_side: weddingSide,
        accompanying_members: Number(accompanyingMembers) || 0,
        adults_count: Number(adultsCount) || 1,
        children_count: Number(childrenCount) || 0,
        rsvp_status: rsvpStatus,
        food_preference: foodPreference,
        accommodation_required: accommodationRequired,
        transport_required: transportRequired,
        notes: notes.trim() || undefined,
        invited_events: invitedEvents,
      };

      if (guestToEdit) {
        await updateGuest(guestToEdit.id, payload);
        showToast('Guest record updated in wedding registry! 🪷', 'success');
      } else {
        await addGuest(payload);
        showToast('Guest added to Digital Wedding Guest Book! ✨', 'success');
      }

      onClose();
    } catch (err) {
      console.error('Failed to save guest:', err);
      showToast('Could not save guest details. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalHeadcount = 1 + (Number(accompanyingMembers) || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={guestToEdit ? 'Edit Wedding Guest' : 'Add to Guest Book'}
      subtitle={
        guestToEdit
          ? 'Update RSVP, group, accommodation & logistics'
          : 'Welcome family, friends and loved ones to the celebration'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* DEDUPLICATION WARNING BANNER */}
        {duplicateWarning && (
          <div className="p-3 bg-[#FFF7E8] border border-[#E89838]/40 rounded-2xl flex items-start gap-2.5 text-xs text-[#9E5D0A] animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-[#E89838] flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Possible duplicate guest detected</p>
              <p className="text-[11px] mt-0.5 text-[#7C4806]">
                <strong>"{duplicateWarning.full_name}"</strong> already exists in{' '}
                <em>{duplicateWarning.family_group}</em> ({duplicateWarning.wedding_side}
                {duplicateWarning.phone ? ` • ${duplicateWarning.phone}` : ''}). You can still proceed if this is a separate party.
              </p>
            </div>
          </div>
        )}

        {/* 1. FULL NAME & HEADCOUNT */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Full Name / Family Name <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={nameInputRef}
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rajesh & Sunita Sharma, Dr. Vikram Malhotra"
                className={`w-full pl-8 pr-3 py-2.5 text-sm bg-[#FFFDF9] border rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35] ${
                  errors.fullName ? 'border-[#C93B2B] bg-[#FFF5F5]' : 'border-[#E8DFD5]'
                }`}
              />
            </div>
            {errors.fullName && <p className="text-xs text-[#C93B2B] mt-0.5">{errors.fullName}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider">
                Accompanying
              </label>
              <span className="text-[11px] font-serif font-bold text-[#641F35]">
                Total: {totalHeadcount}
              </span>
            </div>
            <div className="relative">
              <Users className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                min="0"
                max="20"
                value={accompanyingMembers}
                onChange={(e) => handleAccompanyingChange(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-semibold focus:outline-none focus:border-[#641F35]"
              />
            </div>
            <p className="text-[10px] text-[#8C7A8E] mt-0.5">
              +{accompanyingMembers} additional member{accompanyingMembers === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* 2. WEDDING SIDE & GUEST GROUP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FFF8F0] p-3.5 rounded-2xl border border-[#F1E4D6]">
          {/* Side Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#641F35] uppercase tracking-wider mb-1.5">
              Wedding Side <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {WEDDING_SIDES.map((side) => {
                const isSelected = weddingSide === side.value;
                return (
                  <button
                    key={side.value}
                    type="button"
                    onClick={() => setWeddingSide(side.value)}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35] shadow-xs'
                        : 'bg-white text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A]'
                    }`}
                  >
                    {side.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#641F35] uppercase tracking-wider mb-1.5">
              Family / Group <span className="text-[#C93B2B]">*</span>
            </label>
            <select
              value={familyGroup}
              onChange={(e) => setFamilyGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
            >
              {DEFAULT_GUEST_GROUPS.map((grp) => (
                <option key={grp} value={grp}>
                  {grp}
                </option>
              ))}
            </select>

            {familyGroup === 'Custom' && (
              <input
                type="text"
                autoFocus
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                placeholder="Enter custom group (e.g. Society Friends)"
                className="w-full px-3 py-1.5 mt-1.5 text-xs bg-white border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
              />
            )}
            {errors.customGroup && (
              <p className="text-xs text-[#C93B2B] mt-0.5">{errors.customGroup}</p>
            )}
          </div>
        </div>

        {/* 3. RSVP STATUS & FOOD PREFERENCE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              RSVP Status <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-1">
              {RSVP_STATUSES.map((st) => {
                const isSelected = rsvpStatus === st.value;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setRsvpStatus(st.value)}
                    className={`py-1.5 px-1 text-[10px] font-semibold rounded-xl border text-center transition-all truncate ${
                      isSelected
                        ? `${st.badgeBg} ${st.badgeText} ${st.badgeBorder} shadow-xs font-bold ring-1 ring-black/10`
                        : 'bg-[#FFFDF9] text-[#8C7A8E] border-[#E8DFD5]'
                    }`}
                  >
                    {st.value}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Food Preference
            </label>
            <select
              value={foodPreference}
              onChange={(e) => setFoodPreference(e.target.value as FoodPreference)}
              className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
            >
              {FOOD_PREFERENCES.map((food) => (
                <option key={food} value={food}>
                  {food}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. LOGISTICS TOGGLES: ACCOMMODATION & TRANSPORT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Room Required */}
          <div
            onClick={() => setAccommodationRequired(!accommodationRequired)}
            className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              accommodationRequired
                ? 'bg-[#FAF1F3] border-[#641F35]/40 text-[#641F35]'
                : 'bg-[#FFFDF9] border-[#E8DFD5] text-[#615163] hover:border-[#D6B36A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Hotel className={`w-4 h-4 ${accommodationRequired ? 'text-[#641F35]' : 'text-[#8C7A8E]'}`} />
              <div>
                <span className="text-xs font-bold block leading-tight">Hotel Room</span>
                <span className="text-[10px] text-[#8C7A8E]">Needs hotel room allocation</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={accommodationRequired}
              onChange={(e) => setAccommodationRequired(e.target.checked)}
              className="w-4 h-4 accent-[#641F35] pointer-events-none"
            />
          </div>

          {/* Transport Required */}
          <div
            onClick={() => setTransportRequired(!transportRequired)}
            className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              transportRequired
                ? 'bg-[#FAF1F3] border-[#641F35]/40 text-[#641F35]'
                : 'bg-[#FFFDF9] border-[#E8DFD5] text-[#615163] hover:border-[#D6B36A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Car className={`w-4 h-4 ${transportRequired ? 'text-[#641F35]' : 'text-[#8C7A8E]'}`} />
              <div>
                <span className="text-xs font-bold block leading-tight">Transport</span>
                <span className="text-[10px] text-[#8C7A8E]">Needs airport/station pickup</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={transportRequired}
              onChange={(e) => setTransportRequired(e.target.checked)}
              className="w-4 h-4 accent-[#641F35] pointer-events-none"
            />
          </div>
        </div>

        {/* 5. CEREMONY INVITATIONS (OPTIONAL ASSOCIATION) */}
        {events && events.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider">
                Invited Ceremonies <span className="text-[10px] font-normal text-[#8C7A8E] lowercase">(optional)</span>
              </label>
              <div className="flex gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => setInvitedEvents(events.map((e) => e.id))}
                  className="text-[#641F35] hover:underline font-semibold"
                >
                  All
                </button>
                <span className="text-[#8C7A8E]">•</span>
                <button
                  type="button"
                  onClick={() => setInvitedEvents([])}
                  className="text-[#8C7A8E] hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {events.map((ev) => {
                const isInvited = invitedEvents.includes(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => toggleEvent(ev.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${
                      isInvited
                        ? 'bg-[#641F35] text-white border-[#641F35] shadow-xs'
                        : 'bg-[#FFFDF9] text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A]'
                    }`}
                  >
                    <span>🪷</span>
                    <span>{ev.event_name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. ADVANCED DETAILS TOGGLE: PHONE, EMAIL, ADULT/CHILD SPLIT, NOTES */}
        <div className="pt-1 border-t border-[#E8DFD5]">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-[#641F35] hover:text-[#C93B2B] flex items-center justify-between w-full py-1.5"
          >
            <span>{showAdvanced ? 'Hide Contact & Notes' : '+ Add Phone, Email & Additional Notes'}</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-2 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      placeholder="e.g. +91 98200 12345"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
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
                      placeholder="e.g. sharma@gmail.com"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
                    />
                  </div>
                </div>
              </div>

              {/* Adults & Children Split */}
              <div className="grid grid-cols-2 gap-3 bg-[#FFF8F0] p-2.5 rounded-xl border border-[#F1E4D6]">
                <div>
                  <label className="block text-[10px] font-bold text-[#641F35] uppercase tracking-wider mb-1">
                    Adults Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adultsCount}
                    onChange={(e) => setAdultsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-2.5 py-1 text-xs bg-white border border-[#E8DFD5] rounded-lg text-[#16162A] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#641F35] uppercase tracking-wider mb-1">
                    Children Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-2.5 py-1 text-xs bg-white border border-[#E8DFD5] rounded-lg text-[#16162A] font-semibold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
                  Family Notes & Dietary Restrictions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Wheelchair assistance required, arriving via Shatabdi on Friday morning."
                  className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* PRIMARY ACTION BUTTONS */}
        <div className="flex gap-2.5 pt-2">
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
                <span>{guestToEdit ? 'Save Changes' : 'Add to Guest Book'}</span>
                <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
