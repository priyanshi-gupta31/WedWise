import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import { WeddingEvent, WeddingEventType, EventStatus } from '../../types/database.types';
import { EventFormData, DEFAULT_EVENT_TYPES } from '../../types/event';
import { EventArtwork } from '../common/WedWiseIllustrations';
import { formatINR, parseCurrencyInput } from '../../utils/currency';
import { Calendar, Clock, MapPin, Users, Sparkles, IndianRupee } from 'lucide-react';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: WeddingEvent | null;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
}) => {
  const { addEvent, updateEvent, wedding } = useWedding();
  const { showToast } = useToast();

  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<WeddingEventType>('Sangeet');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [expectedGuests, setExpectedGuests] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [status, setStatus] = useState<EventStatus>('Upcoming');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setEventName(eventToEdit.event_name);
        setEventType((eventToEdit.event_type as WeddingEventType) || 'Custom');
        setDate(eventToEdit.date);
        setStartTime(eventToEdit.start_time || '');
        setEndTime(eventToEdit.end_time || '');
        setVenue(eventToEdit.venue || '');
        setDescription(eventToEdit.description || '');
        setExpectedGuests(eventToEdit.expected_guests ? String(eventToEdit.expected_guests) : '');
        setBudgetInput(eventToEdit.budget_allocation ? String(eventToEdit.budget_allocation) : '');
        setStatus(eventToEdit.status);
      } else {
        setEventName('');
        setEventType('Sangeet');
        setDate(wedding?.wedding_date || new Date().toISOString().split('T')[0]);
        setStartTime('18:00');
        setEndTime('22:30');
        setVenue('');
        setDescription('');
        setExpectedGuests('');
        setBudgetInput('');
        setStatus('Upcoming');
      }
      setErrors({});
    }
  }, [isOpen, eventToEdit, wedding]);

  const handleTypeSelect = (type: WeddingEventType) => {
    setEventType(type);
    if (!eventName || DEFAULT_EVENT_TYPES.includes(eventName as any)) {
      setEventName(type === 'Custom' ? '' : `${type} Ceremony`);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!eventName.trim()) {
      errs.eventName = 'Event ceremony name is required.';
    }
    if (!date) {
      errs.date = 'Event date is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const parsedBudget = budgetInput ? parseCurrencyInput(budgetInput) : 0;
      const parsedGuests = expectedGuests ? parseInt(expectedGuests, 10) : undefined;

      const payload: EventFormData = {
        event_name: eventName.trim(),
        event_type: eventType,
        date,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        venue: venue.trim() || undefined,
        description: description.trim() || undefined,
        expected_guests: parsedGuests && !isNaN(parsedGuests) ? parsedGuests : undefined,
        budget_allocation: !isNaN(parsedBudget) ? parsedBudget : 0,
        status,
      };

      if (eventToEdit) {
        await updateEvent(eventToEdit.id, payload);
        showToast('Ceremony updated successfully! ✨', 'success');
      } else {
        await addEvent(payload);
        showToast('Ceremony added to timeline! 🪷', 'success');
      }

      onClose();
    } catch (err) {
      console.error('Failed to save event:', err);
      showToast('Could not save ceremony event. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedBudgetNum = budgetInput ? parseCurrencyInput(budgetInput) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Edit Ceremony Event' : 'Add Wedding Ceremony'}
      subtitle={eventToEdit ? 'Update ceremony time, venue & dedicated budget' : 'Craft an auspicious milestone in your wedding journey'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. CEREMONY TYPE PICKER */}
        <div>
          <label className="block text-[10px] font-bold text-[#641F35] uppercase tracking-[0.25em] mb-2">
            Select Ceremony Type
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {DEFAULT_EVENT_TYPES.map((type) => {
              const isSelected = eventType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeSelect(type)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35] shadow-sm scale-[1.02]'
                      : 'bg-[#FFFDF9] text-[#4A3B4E] border-[#E8DFD5] hover:border-[#D6B36A] hover:bg-[#FFF8F0]'
                  }`}
                >
                  <EventArtwork type={type} size="sm" />
                  <span className="text-[11px] font-semibold mt-1 truncate max-w-full">
                    {type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. EVENT NAME */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Ceremony Name <span className="text-[#C93B2B]">*</span>
          </label>
          <input
            type="text"
            required
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g. Royal Sangeet & Musical Night, Haldi Utsav"
            className={`w-full px-4 py-2.5 text-sm bg-[#FFFDF9] border rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] focus:ring-1 focus:ring-[#641F35]/30 font-medium ${
              errors.eventName ? 'border-[#C93B2B] bg-[#FFF5F5]' : 'border-[#E8DFD5]'
            }`}
          />
          {errors.eventName && <p className="text-xs text-[#C93B2B] mt-0.5">{errors.eventName}</p>}
        </div>

        {/* 3. DATE & TIME RANGE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Event Date <span className="text-[#C93B2B]">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
              />
            </div>
            {errors.date && <p className="text-xs text-[#C93B2B] mt-0.5">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Start Time
            </label>
            <div className="relative">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              End Time
            </label>
            <div className="relative">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
              />
            </div>
          </div>
        </div>

        {/* 4. VENUE & EXPECTED GUESTS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Venue / Location
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Lotus Courtyard, Heritage Haveli"
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Expected Guests
            </label>
            <div className="relative">
              <Users className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                min="0"
                value={expectedGuests}
                onChange={(e) => setExpectedGuests(e.target.value)}
                placeholder="e.g. 250"
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
              />
            </div>
          </div>
        </div>

        {/* 5. BUDGET ALLOCATION & STATUS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FFF8F0] p-3.5 rounded-2xl border border-[#F1E4D6]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-[#641F35] uppercase tracking-wider">
                Ceremony Budget Allocation
              </label>
              {parsedBudgetNum > 0 && (
                <span className="text-xs font-serif font-bold text-[#C93B2B]">
                  {formatINR(parsedBudgetNum)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="text-sm font-serif font-bold text-[#C93B2B] absolute left-3 top-1/2 -translate-y-1/2">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="e.g. 250000"
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-[#E8DFD5] rounded-xl text-[#16162A] font-semibold focus:outline-none focus:border-[#641F35]"
              />
            </div>
            <p className="text-[10px] text-[#8C7A8E] mt-1">
              Expenses linked to this ceremony will track against this budget.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#641F35] uppercase tracking-wider mb-1">
              Ceremony Status
            </label>
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {(['Upcoming', 'Today', 'Completed'] as EventStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-1 text-[11px] font-semibold rounded-xl border transition-all ${
                    status === st
                      ? st === 'Completed'
                        ? 'bg-[#EAF3EC] border-[#A9CEB5] text-[#2D5A43]'
                        : st === 'Today'
                        ? 'bg-[#FFF2E0] border-[#E89838] text-[#9E5D0A]'
                        : 'bg-[#641F35] text-white border-[#641F35]'
                      : 'bg-white border-[#E8DFD5] text-[#615163]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 6. DESCRIPTION & CEREMONIAL NOTES */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Ceremony Notes & Dress Code (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Traditional yellow attire for Haldi; choreography entry at 8:30 PM."
            className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] resize-none"
          />
        </div>

        {/* BUTTONS */}
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
                <span>{eventToEdit ? 'Save Changes' : 'Create Ceremony'}</span>
                <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
