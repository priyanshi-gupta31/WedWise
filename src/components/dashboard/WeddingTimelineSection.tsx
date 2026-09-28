import React from 'react';
import { useWedding } from '../../context/WeddingContext';
import { Clock, MapPin, ChevronRight, Calendar, Sparkles, Plus } from 'lucide-react';
import { IndianArchArt, EventArtwork } from '../common/WedWiseIllustrations';
import { formatEventTimeRange, getEventCountdown } from '../../utils/timelineUtils';

interface WeddingTimelineSectionProps {
  onNavigateToTimeline?: () => void;
}

export const WeddingTimelineSection: React.FC<WeddingTimelineSectionProps> = ({
  onNavigateToTimeline,
}) => {
  const { events } = useWedding();

  const sortedEvents = [...events].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  return (
    <section className="bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
      {/* Decorative Jharokha arch linework watermark */}
      <div className="absolute right-0 top-0 w-64 h-64 pointer-events-none opacity-15 select-none translate-x-12 -translate-y-8">
        <IndianArchArt className="w-full h-full" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#F1E4D6] relative z-10 gap-2">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[#641F35] uppercase tracking-[0.25em] block mb-1">
            Ceremony Schedule & Milestones
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#29202A] tracking-tight">
            Wedding Timeline
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#FFF7ED] text-[#641F35] border border-[#F1E4D6]">
            {events.length} Ritual{events.length === 1 ? '' : 's'} Planned
          </span>
          {onNavigateToTimeline && (
            <button
              type="button"
              onClick={onNavigateToTimeline}
              className="text-xs font-bold text-[#641F35] hover:text-[#C93B2B] flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Ceremonies Flow */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-10 px-4 bg-[#FFF8F0] rounded-2xl border border-dashed border-[#E8DFD5] space-y-3 relative z-10">
          <div className="inline-flex p-3 rounded-2xl bg-white border border-[#F1E4D6] text-[#641F35]">
            <Sparkles className="w-6 h-6 text-[#E89838]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-serif font-bold text-[#16162A]">
              YOUR WEDDING JOURNEY STARTS HERE
            </p>
            <p className="text-xs text-[#615163] max-w-sm mx-auto">
              Plan your ceremonies—from Haldi & Mehendi to the Sangeet Gala & Sacred Muhurat.
            </p>
          </div>
          {onNavigateToTimeline && (
            <button
              type="button"
              onClick={onNavigateToTimeline}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#641F35] text-[#FFF8F0] text-xs font-semibold uppercase tracking-wider hover:bg-[#52172A] transition-all shadow-wine"
            >
              <Plus className="w-3.5 h-3.5 text-[#E89838]" />
              <span>Plan Ceremonies</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5 relative z-10">
          {sortedEvents.slice(0, 5).map((evt) => {
            const countdown = getEventCountdown(evt.date);
            const isMainEvent = evt.event_type === 'Wedding';
            const timeDisplay = formatEventTimeRange(evt.start_time, evt.end_time);

            return (
              <div
                key={evt.id}
                onClick={onNavigateToTimeline}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                  isMainEvent
                    ? 'bg-[#641F35] text-[#FFF7ED] border-[#641F35] shadow-wine'
                    : 'bg-[#FFFDF9] hover:bg-[#FFF8F0] text-[#29202A] border-[#F1E4D6] hover:border-[#D6B36A]'
                }`}
              >
                {/* Left: Date & Ritual */}
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 text-center ${
                      isMainEvent
                        ? 'bg-[#4A1425] text-[#D6B36A] border border-[#D6B36A]/40'
                        : 'bg-[#FFF8F0] text-[#641F35] border border-[#F1E4D6]'
                    }`}
                  >
                    <EventArtwork type={evt.event_type} size="sm" />
                    <span className="text-[10px] font-mono font-bold mt-1 leading-none truncate max-w-[50px]">
                      {evt.date.slice(5)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="text-base sm:text-lg font-serif font-bold truncate">
                        {evt.event_name}
                      </h3>
                      {isMainEvent && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#E89838] text-white font-bold uppercase tracking-wider">
                          ★ Sacred Muhurat
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-2.5 text-xs mt-0.5 flex-wrap ${
                        isMainEvent ? 'text-[#F6C6B6]' : 'text-[#615163]'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#D6B36A]" />
                        {timeDisplay}
                      </span>
                      {evt.venue && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate max-w-[180px]">
                            <MapPin className="w-3 h-3 text-[#D6B36A]" />
                            {evt.venue}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Tag & Countdown */}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:text-right flex-shrink-0">
                  <span
                    className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      isMainEvent
                        ? 'bg-[#4A1425] text-[#D6B36A] border border-[#D6B36A]/30'
                        : 'bg-white text-[#641F35] border border-[#F1E4D6]'
                    }`}
                  >
                    {evt.event_type}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      isMainEvent ? 'text-[#FFD699]' : 'text-[#641F35]'
                    }`}
                  >
                    {countdown.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
