import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import { WeddingEvent } from '../../types/database.types';
import { EventArtwork } from '../common/WedWiseIllustrations';
import { formatINR } from '../../utils/currency';
import { formatEventTimeRange, getEventCountdown } from '../../utils/timelineUtils';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  Receipt,
  ListTodo,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: WeddingEvent | null;
  onEdit: (event: WeddingEvent) => void;
  onAddTask: (eventId: string) => void;
  onAddExpense: (eventId: string) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  onEdit,
  onAddTask,
  onAddExpense,
}) => {
  const { tasks, expenses, toggleTask, deleteEvent, getEventSpending, getEventGuestStats } = useWedding();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'tasks' | 'expenses' | 'guests'>('tasks');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!event) return null;

  const countdown = getEventCountdown(event.date);
  const spending = getEventSpending(event.id);
  const guestStats = getEventGuestStats(event.id);
  const eventTasks = tasks.filter((t) => t.event_id === event.id);
  const eventExpenses = expenses.filter((e) => e.event_id === event.id);

  const completedTasksCount = eventTasks.filter((t) => t.status === 'Completed').length;

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to remove "${event.event_name}" from your wedding timeline?`)) {
      setIsDeleting(true);
      try {
        await deleteEvent(event.id);
        showToast(`Ceremony removed from timeline`, 'info');
        onClose();
      } catch (err) {
        console.error('Failed to delete event:', err);
        showToast('Failed to delete event. Please try again.', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleTask(taskId);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const timeDisplay = formatEventTimeRange(event.start_time, event.end_time);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event.event_name}
      subtitle={`Ceremony Milestone • ${event.event_type}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* CEREMONY HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#641F35] via-[#4D1527] to-[#2B0B15] text-[#FFF8F0] p-5 shadow-wine">
          {/* Subtle Arch Decor Pattern in background */}
          <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none transform translate-x-4 translate-y-4">
            <EventArtwork type={event.event_type} size="xl" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-[#FFF8F0]/10 backdrop-blur-md rounded-2xl border border-[#FFF8F0]/20 flex-shrink-0">
                <EventArtwork type={event.event_type} size="md" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-[#E89838]/20 text-[#FFD699] border border-[#E89838]/30">
                    {event.event_type}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      event.status === 'Completed'
                        ? 'bg-[#2D5A43] text-[#A9CEB5]'
                        : event.status === 'Today'
                        ? 'bg-[#E89838] text-white animate-pulse'
                        : 'bg-white/15 text-[#FFF8F0]'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
                  {event.event_name}
                </h3>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto bg-black/20 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-xl sm:rounded-none border border-white/10 sm:border-0">
              <span className="text-[10px] uppercase font-semibold text-[#D6B36A] tracking-wider">
                Ceremony Pacing
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                {countdown.label}
              </span>
            </div>
          </div>

          {/* CEREMONY METADATA PILLS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D6B36A] flex-shrink-0" />
              <span className="truncate">{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D6B36A] flex-shrink-0" />
              <span className="truncate">{timeDisplay}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <MapPin className="w-4 h-4 text-[#D6B36A] flex-shrink-0" />
              <span className="truncate">{event.venue || 'Venue TBD'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D6B36A] flex-shrink-0" />
              <span>{event.expected_guests ? `${event.expected_guests} Guests` : 'Guests unassigned'}</span>
            </div>
          </div>

          {/* Optional notes */}
          {event.description && (
            <p className="text-xs text-[#FFF8F0]/85 italic mt-3 pt-3 border-t border-white/10">
              "{event.description}"
            </p>
          )}
        </div>

        {/* CEREMONY BUDGET CARD */}
        {spending && (
          <div className="bg-[#FFF8F0] p-4 rounded-2xl border border-[#F1E4D6] shadow-subtle space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#641F35] tracking-[0.2em] flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5" />
                Ceremony Dedicated Budget
              </span>
              <span className="text-xs font-serif font-bold text-[#16162A]">
                Allocated: {formatINR(spending.allocated)}
              </span>
            </div>

            {/* Visual pacing bar */}
            <div className="w-full bg-[#E8DFD5] h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  spending.percentageUsed > 100
                    ? 'bg-[#C93B2B]'
                    : spending.percentageUsed > 80
                    ? 'bg-[#E89838]'
                    : 'bg-[#2D5A43]'
                }`}
                style={{ width: `${Math.min(100, spending.percentageUsed)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 bg-white rounded-xl border border-[#F1E4D6]">
                <span className="block text-[10px] uppercase font-semibold text-[#8C7A8E]">Spent</span>
                <span className="text-xs sm:text-sm font-bold text-[#16162A]">
                  {formatINR(spending.spent)}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-[#F1E4D6]">
                <span className="block text-[10px] uppercase font-semibold text-[#8C7A8E]">Remaining</span>
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    spending.remaining < 0 ? 'text-[#C93B2B]' : 'text-[#2D5A43]'
                  }`}
                >
                  {formatINR(spending.remaining)}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-[#F1E4D6]">
                <span className="block text-[10px] uppercase font-semibold text-[#8C7A8E]">Budget Used</span>
                <span className="text-xs sm:text-sm font-bold text-[#641F35]">
                  {Math.round(spending.percentageUsed)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TABS FOR TASKS & EXPENSES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-1.5 pb-1 px-2.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
                  activeTab === 'tasks'
                    ? 'text-[#641F35] border-b-2 border-[#641F35]'
                    : 'text-[#8C7A8E] hover:text-[#16162A]'
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span>Ceremony Tasks ({completedTasksCount}/{eventTasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('expenses')}
                className={`flex items-center gap-1.5 pb-1 px-2.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
                  activeTab === 'expenses'
                    ? 'text-[#641F35] border-b-2 border-[#641F35]'
                    : 'text-[#8C7A8E] hover:text-[#16162A]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ceremony Expenses ({eventExpenses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('guests')}
                className={`flex items-center gap-1.5 pb-1 px-2.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
                  activeTab === 'guests'
                    ? 'text-[#641F35] border-b-2 border-[#641F35]'
                    : 'text-[#8C7A8E] hover:text-[#16162A]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Invited Guests ({guestStats.guests.length})</span>
              </button>
            </div>

            {activeTab === 'tasks' ? (
              <button
                type="button"
                onClick={() => onAddTask(event.id)}
                className="text-xs font-semibold text-[#641F35] hover:text-[#C93B2B] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            ) : activeTab === 'expenses' ? (
              <button
                type="button"
                onClick={() => onAddExpense(event.id)}
                className="text-xs font-semibold text-[#641F35] hover:text-[#C93B2B] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            ) : null}
          </div>

          {/* TAB CONTENT: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {eventTasks.length === 0 ? (
                <div className="text-center py-6 bg-[#FFFDF9] rounded-xl border border-dashed border-[#E8DFD5] text-[#8C7A8E]">
                  <p className="text-xs">No tasks attached to this ceremony yet.</p>
                  <button
                    type="button"
                    onClick={() => onAddTask(event.id)}
                    className="mt-2 text-xs font-bold text-[#641F35] hover:underline"
                  >
                    + Add first ceremony task
                  </button>
                </div>
              ) : (
                eventTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={(e) => handleToggleTask(t.id, e)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      t.status === 'Completed'
                        ? 'bg-[#FAF8F5] border-[#E8DFD5] opacity-65'
                        : 'bg-white border-[#F1E4D6] hover:border-[#D6B36A] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button type="button" className="text-[#641F35] flex-shrink-0">
                        {t.status === 'Completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-[#2D5A43]" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#8C7A8E] hover:text-[#641F35]" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold text-[#16162A] truncate ${
                            t.status === 'Completed' ? 'line-through text-[#8C7A8E]' : ''
                          }`}
                        >
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-[#8C7A8E] mt-0.5">
                          {t.assigned_to && <span>Assigned: {t.assigned_to}</span>}
                          {t.due_date && <span>• Due: {t.due_date}</span>}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                        t.priority === 'Urgent'
                          ? 'bg-[#FFF0F0] text-[#C93B2B] border border-[#F2B8B8]'
                          : t.priority === 'Important'
                          ? 'bg-[#FFF2E0] text-[#E89838] border border-[#F8DCB5]'
                          : 'bg-[#F4EFEA] text-[#615163]'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB CONTENT: EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {eventExpenses.length === 0 ? (
                <div className="text-center py-6 bg-[#FFFDF9] rounded-xl border border-dashed border-[#E8DFD5] text-[#8C7A8E]">
                  <p className="text-xs">No expenses assigned to this ceremony yet.</p>
                  <button
                    type="button"
                    onClick={() => onAddExpense(event.id)}
                    className="mt-2 text-xs font-bold text-[#641F35] hover:underline"
                  >
                    + Record ceremony expense
                  </button>
                </div>
              ) : (
                eventExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-[#F1E4D6] bg-white text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-[#16162A] truncate">{exp.expense_name}</p>
                      <p className="text-[10px] text-[#8C7A8E]">
                        Paid by {exp.paid_by} • {exp.expense_date}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-serif font-bold text-[#16162A]">{formatINR(exp.amount)}</p>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          exp.payment_status === 'Paid'
                            ? 'bg-[#EAF3EC] text-[#2D5A43]'
                            : 'bg-[#FFF0F0] text-[#C93B2B]'
                        }`}
                      >
                        {exp.payment_status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB CONTENT: GUESTS */}
          {activeTab === 'guests' && (
            <div className="space-y-3">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-[#FFFDF9] rounded-xl border border-[#E8DFD5]">
                  <span className="block text-[10px] uppercase font-semibold text-[#8C7A8E]">Headcount</span>
                  <span className="text-sm font-serif font-bold text-[#16162A]">
                    {guestStats.invitedCount}
                  </span>
                </div>
                <div className="p-2 bg-[#EAF3EC] rounded-xl border border-[#A9CEB5]">
                  <span className="block text-[10px] uppercase font-semibold text-[#2D5A43]">Confirmed</span>
                  <span className="text-sm font-serif font-bold text-[#2D5A43]">
                    {guestStats.confirmedCount}
                  </span>
                </div>
                <div className="p-2 bg-[#FFF2E0] rounded-xl border border-[#E89838]/40">
                  <span className="block text-[10px] uppercase font-semibold text-[#9E5D0A]">Awaiting RSVP</span>
                  <span className="text-sm font-serif font-bold text-[#9E5D0A]">
                    {guestStats.awaitingCount}
                  </span>
                </div>
              </div>

              {/* Guest list */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {guestStats.guests.length === 0 ? (
                  <div className="text-center py-6 bg-[#FFFDF9] rounded-xl border border-dashed border-[#E8DFD5] text-[#8C7A8E]">
                    <p className="text-xs">No guests specifically assigned to this ceremony.</p>
                  </div>
                ) : (
                  guestStats.guests.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-[#F1E4D6] bg-white text-xs hover:border-[#E89838]/50 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-[#16162A] truncate">
                          {g.full_name}{' '}
                          <span className="text-[11px] font-normal text-[#8C7A8E]">
                            ({1 + (g.accompanying_members || 0)} attending)
                          </span>
                        </p>
                        <p className="text-[10px] text-[#8C7A8E]">
                          {g.family_group} · {g.wedding_side} Side
                          {g.phone ? ` · ${g.phone}` : ''}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          g.rsvp_status === 'Confirmed'
                            ? 'bg-[#EAF3EC] text-[#2D5A43]'
                            : g.rsvp_status === 'Declined'
                            ? 'bg-[#FFF0F0] text-[#C93B2B]'
                            : 'bg-[#FFF2E0] text-[#9E5D0A]'
                        }`}
                      >
                        {g.rsvp_status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E8DFD5]">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs font-semibold text-[#C93B2B] hover:text-[#9A1F1F] flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#FFF5F5] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Ceremony</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onEdit(event)}
              className="text-xs flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Ceremony</span>
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
