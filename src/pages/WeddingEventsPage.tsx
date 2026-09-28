import React, { useState, useMemo, useEffect } from 'react';
import { useWedding } from '../context/WeddingContext';
import { useToast } from '../context/ToastContext';
import { WeddingEvent, WeddingTask, EventStatus } from '../types/database.types';
import { EventArtwork } from '../components/common/WedWiseIllustrations';
import { EventFormModal } from '../components/events/EventFormModal';
import { EventDetailsModal } from '../components/events/EventDetailsModal';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { ExpenseFormModal } from '../components/expenses/ExpenseFormModal';
import { formatINR } from '../utils/currency';
import { formatEventTimeRange, getEventCountdown } from '../utils/timelineUtils';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronRight,
  ListTodo,
  Milestone,
  CheckSquare,
  AlertCircle,
  IndianRupee,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';

interface WeddingEventsPageProps {
  initialEventId?: string | null;
  onNavigateToMemories?: (eventId?: string) => void;
}

export const WeddingEventsPage: React.FC<WeddingEventsPageProps> = ({
  initialEventId,
  onNavigateToMemories,
}) => {
  const {
    events,
    tasks,
    nextEvent,
    daysUntilNextEvent,
    groupedTasks,
    toggleTask,
    deleteTask,
    getEventSpending,
  } = useWedding();
  const { showToast } = useToast();

  // Active view: 'timeline' or 'tasks'
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks'>('timeline');

  // Filter for timeline
  const [eventFilter, setEventFilter] = useState<'all' | EventStatus>('all');

  // Modals state
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<WeddingEvent | null>(null);

  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WeddingEvent | null>(null);

  // Auto-focus event when initialEventId changes (e.g. from memory badge deep-link)
  useEffect(() => {
    if (initialEventId && events.length > 0) {
      const matched = events.find((e) => e.id === initialEventId);
      if (matched) {
        setSelectedEvent(matched);
        setIsEventDetailsOpen(true);
      }
    }
  }, [initialEventId, events]);

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<WeddingTask | null>(null);
  const [defaultTaskEventId, setDefaultTaskEventId] = useState<string | null>(null);

  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [defaultExpenseEventId, setDefaultExpenseEventId] = useState<string | null>(null);

  // Sorted events
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return sortedEvents;
    return sortedEvents.filter((e) => e.status === eventFilter);
  }, [sortedEvents, eventFilter]);

  // Handlers
  const handleOpenNewEvent = () => {
    setEventToEdit(null);
    setIsEventFormOpen(true);
  };

  const handleEditEvent = (event: WeddingEvent) => {
    setEventToEdit(event);
    setIsEventDetailsOpen(false);
    setIsEventFormOpen(true);
  };

  const handleOpenEventDetails = (event: WeddingEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const handleOpenNewTask = (eventId?: string) => {
    setTaskToEdit(null);
    setDefaultTaskEventId(eventId || null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: WeddingTask) => {
    setTaskToEdit(task);
    setIsTaskFormOpen(true);
  };

  const handleOpenNewExpense = (eventId?: string) => {
    setDefaultExpenseEventId(eventId || null);
    setIsExpenseFormOpen(true);
  };

  const handleToggleTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleTask(taskId);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete task "${title}"?`)) {
      try {
        await deleteTask(taskId);
        showToast('Task removed', 'info');
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. EDITORIAL HEADER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#F1E4D6] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FFF8F0] border border-[#F1E4D6] text-[10px] font-bold text-[#641F35] uppercase tracking-[0.25em] mb-2 shadow-subtle">
            <Sparkles className="w-3 h-3 text-[#E89838]" />
            <span>Ceremonial Calendar & Milestones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#16162A] tracking-tight">
            Wedding Events & Timeline
          </h1>
          <p className="text-xs sm:text-sm text-[#615163] mt-1 max-w-xl font-light">
            Every ritual, sacred gathering, and family task orchestrated in ceremonial harmony.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenNewTask()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D6B36A]/60 bg-[#FFFDF9] hover:bg-[#FFF8F0] text-[#641F35] text-xs font-semibold uppercase tracking-wider transition-all shadow-subtle hover:border-[#641F35]"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#E89838]" />
            <span>+ Add Task</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewEvent}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#641F35] hover:bg-[#52172A] active:scale-[0.99] text-[#FFF8F0] text-xs font-semibold uppercase tracking-wider transition-all shadow-wine"
          >
            <Plus className="w-4 h-4 text-[#E89838]" />
            <span>+ Add Ceremony</span>
          </button>
        </div>
      </div>

      {/* 2. NEXT UPCOMING CEREMONY BANNER (If event exists) */}
      {nextEvent && (
        <div
          onClick={() => handleOpenEventDetails(nextEvent)}
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#641F35] via-[#4F1629] to-[#2B0B15] p-5 sm:p-7 text-[#FFF8F0] shadow-wine border border-[#D6B36A]/30 cursor-pointer transition-all hover:shadow-xl"
        >
          {/* Subtle Arch Decor Motif */}
          <div className="absolute -right-6 -bottom-6 opacity-15 pointer-events-none transform group-hover:scale-105 transition-transform duration-500">
            <EventArtwork type={nextEvent.event_type} size="xl" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3.5 bg-[#FFF8F0]/10 backdrop-blur-md rounded-2xl border border-[#FFF8F0]/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                <EventArtwork type={nextEvent.event_type} size="lg" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#FFD699] px-2.5 py-0.5 rounded-full bg-[#E89838]/20 border border-[#E89838]/30">
                    Next Ceremony Milestone
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-[#FFF8F0]">
                    {nextEvent.event_type}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white leading-tight">
                  {nextEvent.event_name}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[#FFF8F0]/80 pt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#D6B36A]" />
                    {nextEvent.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#D6B36A]" />
                    {formatEventTimeRange(nextEvent.start_time, nextEvent.end_time)}
                  </span>
                  {nextEvent.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D6B36A]" />
                      <span className="truncate max-w-xs">{nextEvent.venue}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Countdown Badge & CTA */}
            <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
              <div className="text-left lg:text-right">
                <span className="block text-[10px] uppercase font-bold text-[#D6B36A] tracking-widest">
                  Countdown
                </span>
                <span className="text-sm sm:text-base font-bold text-white">
                  {getEventCountdown(nextEvent.date).label}
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-[#FFF8F0] group-hover:bg-[#E89838] group-hover:text-[#16162A] transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION SWITCHER TABS & FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DFD5] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'timeline'
                ? 'bg-[#641F35] text-[#FFF8F0] shadow-sm'
                : 'bg-transparent text-[#615163] hover:text-[#16162A] hover:bg-[#FFF8F0]'
            }`}
          >
            <Milestone className="w-3.5 h-3.5" />
            <span>Ceremonial Timeline ({events.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'tasks'
                ? 'bg-[#641F35] text-[#FFF8F0] shadow-sm'
                : 'bg-transparent text-[#615163] hover:text-[#16162A] hover:bg-[#FFF8F0]'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Task Timeline ({tasks.length})</span>
          </button>
        </div>

        {/* Timeline filters */}
        {activeTab === 'timeline' && events.length > 0 && (
          <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto">
            {(['all', 'Upcoming', 'Today', 'Completed'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setEventFilter(filter)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  eventFilter === filter
                    ? 'bg-[#E89838] text-white shadow-xs'
                    : 'bg-[#FFFDF9] text-[#615163] border border-[#E8DFD5] hover:border-[#D6B36A]'
                }`}
              >
                {filter === 'all' ? 'All Events' : filter}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. TAB CONTENT: CEREMONIAL TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {events.length === 0 ? (
            /* BRANDED EMPTY STATE */
            <div className="text-center py-16 px-4 bg-[#FFF8F0] rounded-3xl border border-[#F1E4D6] shadow-subtle max-w-2xl mx-auto space-y-4">
              <div className="inline-flex p-4 rounded-3xl bg-[#FFFDF9] border border-[#D6B36A]/40 shadow-sm mx-auto">
                <EventArtwork type="Custom" size="lg" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#16162A]">
                  YOUR WEDDING JOURNEY STARTS HERE
                </h3>
                <p className="text-xs sm:text-sm text-[#615163] max-w-md mx-auto">
                  Build your ceremonial itinerary—from the auspicious Engagement and joyous Sangeet to the sacred Pheras and Grand Reception.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewEvent}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#641F35] hover:bg-[#52172A] text-[#FFF8F0] text-xs font-semibold uppercase tracking-wider shadow-wine transition-all"
              >
                <Plus className="w-4 h-4 text-[#E89838]" />
                <span>+ Add First Ceremony</span>
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#E8DFD5] text-[#8C7A8E]">
              <p className="text-xs">No events found matching "{eventFilter}".</p>
              <button
                type="button"
                onClick={() => setEventFilter('all')}
                className="mt-2 text-xs font-bold text-[#641F35] hover:underline"
              >
                Show all events
              </button>
            </div>
          ) : (
            /* VERTICAL TIMELINE SPINE */
            <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-[#D6B36A] before:via-[#641F35]/40 before:to-[#D6B36A]/20">
              {filteredEvents.map((event, idx) => {
                const countdown = getEventCountdown(event.date);
                const spending = getEventSpending(event.id);
                const eventTasks = tasks.filter((t) => t.event_id === event.id);
                const pendingTasksCount = eventTasks.filter((t) => t.status !== 'Completed').length;
                const timeRange = formatEventTimeRange(event.start_time, event.end_time);

                return (
                  <div key={event.id} className="relative group">
                    {/* TIMELINE NODE (Gold/Marigold Milestone Circle) */}
                    <div
                      className={`absolute -left-6 sm:-left-10 top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                        event.status === 'Completed'
                          ? 'bg-[#2D5A43] border-[#A9CEB5] text-white shadow-xs'
                          : event.status === 'Today'
                          ? 'bg-[#E89838] border-white text-white shadow-gold animate-bounce'
                          : 'bg-[#FFF8F0] border-[#D6B36A] text-[#641F35] shadow-xs group-hover:scale-110 group-hover:border-[#641F35]'
                      }`}
                    >
                      {event.status === 'Completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : (
                        <span className="text-[10px] sm:text-xs font-serif font-bold">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    {/* EVENT CARD */}
                    <div
                      onClick={() => handleOpenEventDetails(event)}
                      className="bg-[#FFFDF9] hover:bg-[#FFFBF5] rounded-2xl border border-[#F1E4D6] hover:border-[#D6B36A] p-4 sm:p-5 shadow-subtle hover:shadow-card transition-all cursor-pointer space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="p-2.5 bg-[#FFF8F0] rounded-xl border border-[#F1E4D6] flex-shrink-0 group-hover:scale-105 transition-transform">
                            <EventArtwork type={event.event_type} size="md" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#641F35]/10 text-[#641F35]">
                                {event.event_type}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  event.status === 'Completed'
                                    ? 'bg-[#EAF3EC] text-[#2D5A43]'
                                    : event.status === 'Today'
                                    ? 'bg-[#FFF2E0] text-[#9E5D0A] font-bold border border-[#E89838]/40'
                                    : 'bg-[#F4EFEA] text-[#615163]'
                                }`}
                              >
                                {event.status}
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-serif font-bold text-[#16162A] group-hover:text-[#641F35] transition-colors">
                              {event.event_name}
                            </h3>
                          </div>
                        </div>

                        {/* Countdown Tag */}
                        <div className="text-left sm:text-right flex-shrink-0">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-block ${
                              countdown.isToday
                                ? 'bg-[#FFF2E0] border-[#E89838] text-[#9E5D0A]'
                                : countdown.isPast
                                ? 'bg-[#F4EFEA] border-[#E8DFD5] text-[#8C7A8E]'
                                : 'bg-[#FFF8F0] border-[#D6B36A] text-[#641F35]'
                            }`}
                          >
                            {countdown.label}
                          </span>
                        </div>
                      </div>

                      {/* METADATA CHIPS */}
                      <div className="flex items-center gap-4 text-xs text-[#615163] flex-wrap pt-1 border-t border-[#F1E4D6]/60">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#D6B36A]" />
                          <span>{event.date}</span>
                        </div>

                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#D6B36A]" />
                          <span>{timeRange}</span>
                        </div>

                        {event.venue && (
                          <div className="flex items-center gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#D6B36A]" />
                            <span className="truncate max-w-xs">{event.venue}</span>
                          </div>
                        )}

                        {event.expected_guests ? (
                          <div className="flex items-center gap-1.5 font-medium">
                            <Users className="w-3.5 h-3.5 text-[#D6B36A]" />
                            <span>{event.expected_guests} Guests</span>
                          </div>
                        ) : null}
                      </div>

                      {/* BUDGET PACING & TASK COUNTER ROW */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#F1E4D6]/60 text-xs">
                        {/* Ceremony Budget Allocation */}
                        <div className="flex items-center justify-between p-2.5 bg-[#FFF8F0] rounded-xl border border-[#F1E4D6]">
                          <span className="text-[11px] font-semibold text-[#641F35] flex items-center gap-1">
                            <IndianRupee className="w-3 h-3" />
                            Ceremony Budget:
                          </span>
                          <span className="font-serif font-bold text-[#16162A]">
                            {spending ? (
                              <>
                                <span>{formatINR(spending.spent)}</span>
                                <span className="text-[#8C7A8E] font-normal font-sans ml-1 text-[11px]">
                                  / {formatINR(spending.allocated)}
                                </span>
                              </>
                            ) : (
                              formatINR(event.budget_allocation || 0)
                            )}
                          </span>
                        </div>

                        {/* Ceremony Tasks Link */}
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#F1E4D6]">
                          <span className="text-[11px] font-semibold text-[#615163] flex items-center gap-1">
                            <ListTodo className="w-3 h-3 text-[#E89838]" />
                            Ceremony Tasks:
                          </span>
                          <span className="text-[11px] font-semibold text-[#16162A]">
                            {eventTasks.length > 0 ? (
                              <span>
                                {pendingTasksCount} pending / {eventTasks.length} total
                              </span>
                            ) : (
                              <span className="text-[#8C7A8E]">No tasks</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* QUICK CARD ACTIONS */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-bold text-[#641F35] hover:underline flex items-center gap-1">
                          <span>View Full Ceremony Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {onNavigateToMemories && (
                            <button
                              type="button"
                              onClick={() => onNavigateToMemories(event.id)}
                              className="text-[11px] font-semibold text-[#852C47] hover:text-[#641F35] px-2 py-1 rounded-lg hover:bg-[#FAF1F3] transition-colors flex items-center gap-1"
                              title="View Memories for this ceremony"
                            >
                              <Sparkles className="w-3 h-3 text-[#E89838]" />
                              <span>Memories</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenNewTask(event.id)}
                            className="text-[11px] font-semibold text-[#615163] hover:text-[#641F35] px-2 py-1 rounded-lg hover:bg-[#FFF8F0] transition-colors"
                          >
                            + Task
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenNewExpense(event.id)}
                            className="text-[11px] font-semibold text-[#615163] hover:text-[#641F35] px-2 py-1 rounded-lg hover:bg-[#FFF8F0] transition-colors"
                          >
                            + Expense
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditEvent(event)}
                            className="text-[11px] font-semibold text-[#615163] hover:text-[#641F35] p-1 rounded-lg hover:bg-[#FFF8F0] transition-colors"
                            title="Edit Event"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT: TASK TIMELINE */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {tasks.length === 0 ? (
            /* BRANDED EMPTY STATE */
            <div className="text-center py-16 px-4 bg-[#FFF8F0] rounded-3xl border border-[#F1E4D6] shadow-subtle max-w-2xl mx-auto space-y-4">
              <div className="inline-flex p-4 rounded-3xl bg-[#FFFDF9] border border-[#D6B36A]/40 shadow-sm mx-auto">
                <CheckSquare className="w-10 h-10 text-[#641F35]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#16162A]">
                  Nothing on the calendar yet
                </h3>
                <p className="text-xs sm:text-sm text-[#615163] max-w-md mx-auto">
                  Delegate tasks across the family—from bridal fittings and dhol logistics to caterer tastings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenNewTask()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#641F35] hover:bg-[#52172A] text-[#FFF8F0] text-xs font-semibold uppercase tracking-wider shadow-wine transition-all"
              >
                <Plus className="w-4 h-4 text-[#E89838]" />
                <span>+ Add First Task</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SECTION: TODAY & OVERDUE */}
              {groupedTasks.today.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#C93B2B] uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Today & Overdue ({groupedTasks.today.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupedTasks.today.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        events={events}
                        onToggle={(e) => handleToggleTask(task.id, e)}
                        onEdit={() => handleEditTask(task)}
                        onDelete={(e) => handleDeleteTask(task.id, task.title, e)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: THIS WEEK */}
              {groupedTasks.thisWeek.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#E89838] uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      This Week ({groupedTasks.thisWeek.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupedTasks.thisWeek.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        events={events}
                        onToggle={(e) => handleToggleTask(task.id, e)}
                        onEdit={() => handleEditTask(task)}
                        onDelete={(e) => handleDeleteTask(task.id, task.title, e)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: UPCOMING */}
              {groupedTasks.upcoming.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#641F35] uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Upcoming Tasks ({groupedTasks.upcoming.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupedTasks.upcoming.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        events={events}
                        onToggle={(e) => handleToggleTask(task.id, e)}
                        onEdit={() => handleEditTask(task)}
                        onDelete={(e) => handleDeleteTask(task.id, task.title, e)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: COMPLETED */}
              {groupedTasks.completed.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-[#E8DFD5]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D5A43] uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed Milestones ({groupedTasks.completed.length})
                    </span>
                  </div>
                  <div className="space-y-2 opacity-75">
                    {groupedTasks.completed.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        events={events}
                        onToggle={(e) => handleToggleTask(task.id, e)}
                        onEdit={() => handleEditTask(task)}
                        onDelete={(e) => handleDeleteTask(task.id, task.title, e)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <EventFormModal
        isOpen={isEventFormOpen}
        onClose={() => setIsEventFormOpen(false)}
        eventToEdit={eventToEdit}
      />

      <EventDetailsModal
        isOpen={isEventDetailsOpen}
        onClose={() => setIsEventDetailsOpen(false)}
        event={selectedEvent}
        onEdit={(event) => handleEditEvent(event)}
        onAddTask={(eventId) => {
          setIsEventDetailsOpen(false);
          handleOpenNewTask(eventId);
        }}
        onAddExpense={(eventId) => {
          setIsEventDetailsOpen(false);
          handleOpenNewExpense(eventId);
        }}
      />

      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        taskToEdit={taskToEdit}
        defaultEventId={defaultTaskEventId}
      />

      <ExpenseFormModal
        isOpen={isExpenseFormOpen}
        onClose={() => setIsExpenseFormOpen(false)}
        defaultEventId={defaultExpenseEventId}
      />
    </div>
  );
};

interface TaskRowProps {
  task: WeddingTask;
  events: WeddingEvent[];
  onToggle: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, events, onToggle, onEdit, onDelete }) => {
  const linkedEvent = events.find((e) => e.id === task.event_id);
  const isCompleted = task.status === 'Completed';

  return (
    <div
      onClick={onEdit}
      className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
        isCompleted
          ? 'bg-[#FAF8F5] border-[#E8DFD5] opacity-70'
          : 'bg-[#FFFDF9] hover:bg-[#FFFBF5] border-[#F1E4D6] hover:border-[#D6B36A] shadow-subtle'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 pr-3">
        {/* Toggle Checkbox */}
        <button
          type="button"
          onClick={onToggle}
          className="flex-shrink-0 transition-transform active:scale-90"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-[#2D5A43]" />
          ) : (
            <Circle className="w-5 h-5 text-[#8C7A8E] hover:text-[#641F35]" />
          )}
        </button>

        <div className="min-w-0 space-y-0.5">
          <p
            className={`text-xs sm:text-sm font-semibold text-[#16162A] truncate ${
              isCompleted ? 'line-through text-[#8C7A8E]' : ''
            }`}
          >
            {task.title}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-[#8C7A8E] flex-wrap">
            {linkedEvent && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#641F35] bg-[#FFF2E0] px-2 py-0.5 rounded-full border border-[#E89838]/30">
                <span>🪷</span>
                <span className="truncate max-w-[120px]">{linkedEvent.event_name}</span>
              </span>
            )}

            {task.assigned_to && (
              <span className="font-medium text-[#615163]">
                Assigned: <strong className="text-[#16162A]">{task.assigned_to}</strong>
              </span>
            )}

            {task.due_date && <span>• Due {task.due_date}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Priority Badge */}
        <span
          className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
            task.priority === 'Urgent'
              ? 'bg-[#FFF0F0] text-[#C93B2B] border border-[#F2B8B8]'
              : task.priority === 'Important'
              ? 'bg-[#FFF2E0] text-[#E89838] border border-[#F8DCB5]'
              : 'bg-[#F4EFEA] text-[#615163]'
          }`}
        >
          {task.priority}
        </span>

        {/* Delete Trigger */}
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded-lg text-[#8C7A8E] hover:text-[#C93B2B] hover:bg-[#FFF5F5] opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete Task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
