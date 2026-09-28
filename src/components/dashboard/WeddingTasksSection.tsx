import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Sparkles, Clock, CheckCircle2, Circle, ChevronRight, CheckSquare, Plus } from 'lucide-react';

interface WeddingTasksSectionProps {
  onNavigateToTasks?: () => void;
}

export const WeddingTasksSection: React.FC<WeddingTasksSectionProps> = ({
  onNavigateToTasks,
}) => {
  const { tasks, events, toggleTask, todayTasks } = useWedding();

  // Tasks to feature on Home: pending tasks due today or urgent/important ones
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');

  // Display today's tasks first; if none, show the top pending tasks
  const displayTasks = todayTasks.length > 0 ? todayTasks.slice(0, 4) : pendingTasks.slice(0, 4);

  const handleToggle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleTask(id);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  return (
    <section className="relative w-full py-10 px-6 sm:px-10 lg:px-16 select-none border-t border-[#F1E4D6]/70">
      <div className="max-w-4xl mx-auto">
        {/* Editorial Section Header (Cardless) */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-6 border-b border-[#F1E4D6]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.28em] text-[#E89838] uppercase">
                Attention Required
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1B1220] tracking-tight">
              Today's Priorities
            </h2>
            <p className="text-xs sm:text-sm text-[#615163] font-serif italic mt-0.5">
              {pendingTasks.length === 0
                ? 'All wedding milestones are beautifully completed.'
                : `${pendingTasks.length} task${pendingTasks.length === 1 ? '' : 's'} need your family's coordination.`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onNavigateToTasks && (
              <button
                type="button"
                onClick={onNavigateToTasks}
                className="text-xs font-bold text-[#641F35] hover:text-[#C93B2B] flex items-center gap-1 hover:underline"
              >
                <span>View All Tasks ({tasks.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Editorial Vertical Flow */}
        {tasks.length === 0 ? (
          <div className="text-center py-10 px-4 bg-[#FFF8F0] rounded-2xl border border-dashed border-[#E8DFD5] space-y-3 mt-6">
            <div className="inline-flex p-3 rounded-2xl bg-white border border-[#F1E4D6] text-[#641F35]">
              <CheckSquare className="w-6 h-6 text-[#E89838]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-serif font-bold text-[#16162A]">
                Nothing on the calendar yet
              </p>
              <p className="text-xs text-[#615163] max-w-sm mx-auto">
                Delegate tasks across the family—from bridal fittings and logistics to vendor advance settlements.
              </p>
            </div>
            {onNavigateToTasks && (
              <button
                type="button"
                onClick={onNavigateToTasks}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#641F35] text-[#FFF8F0] text-xs font-semibold uppercase tracking-wider hover:bg-[#52172A] transition-all shadow-wine"
              >
                <Plus className="w-3.5 h-3.5 text-[#E89838]" />
                <span>+ Add Family Task</span>
              </button>
            )}
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="text-center py-8 bg-[#EAF3EC] rounded-2xl border border-[#A9CEB5] mt-6 text-[#2D5A43]">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-[#2D5A43]" />
            <p className="text-sm font-serif font-bold">All today's tasks completed!</p>
            <p className="text-xs opacity-80 mt-0.5">Everything is on track for the celebrations.</p>
          </div>
        ) : (
          <div className="pt-8 space-y-6 relative">
            {/* Vertical Connecting Spine Line */}
            <div className="absolute left-4 sm:left-6 top-10 bottom-6 w-px bg-gradient-to-b from-[#E89838] via-[#F1E4D6] to-transparent pointer-events-none" />

            {displayTasks.map((t, idx) => {
              const linkedEvent = events.find((e) => e.id === t.event_id);
              const isDone = t.status === 'Completed';

              return (
                <div
                  key={t.id}
                  onClick={(e) => handleToggle(t.id, e)}
                  className="relative flex items-start gap-4 sm:gap-6 group cursor-pointer"
                >
                  {/* Timeline Node Pip */}
                  <div
                    className={`relative z-10 w-8 sm:w-12 h-8 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 font-serif font-bold text-xs sm:text-sm ${
                      isDone
                        ? 'bg-[#2D5A43] text-white shadow-sm'
                        : 'bg-[#FFF8F0] border-2 border-[#E89838] text-[#5A1224] shadow-sm group-hover:bg-[#5A1224] group-hover:text-white group-hover:border-[#5A1224]'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5" />
                    ) : (
                      <span>0{idx + 1}</span>
                    )}
                  </div>

                  {/* Content (Editorial Flow, NO CARDS!) */}
                  <div className="flex-1 min-w-0 pt-0.5 pb-4 border-b border-[#F1E4D6]/50">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            t.priority === 'Urgent'
                              ? 'text-[#C93B2B]'
                              : t.priority === 'Important'
                              ? 'text-[#E89838]'
                              : 'text-[#615163]'
                          }`}
                        >
                          {t.priority}
                        </span>

                        {linkedEvent && (
                          <span className="text-[10px] text-[#641F35] font-semibold bg-[#FFF2E0] px-2 py-0.5 rounded-full border border-[#E89838]/30">
                            🪷 {linkedEvent.event_name}
                          </span>
                        )}
                      </div>

                      {t.assigned_to && (
                        <span className="text-xs font-serif font-bold text-[#5A1224]">
                          {t.assigned_to}
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-lg sm:text-xl font-serif font-bold tracking-tight transition-all ${
                        isDone ? 'line-through text-[#8C7A8E]' : 'text-[#1B1220] group-hover:text-[#5A1224]'
                      }`}
                    >
                      {t.title}
                    </h3>

                    {t.due_date && (
                      <p className="text-xs sm:text-sm text-[#615163] mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#E89838]" />
                        <span>Due {t.due_date}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
