import React, { useState, useMemo } from 'react';
import { Expense } from '../../types/database.types';
import { calculateSpendingTimeline, TimelineDataPoint } from '../../utils/budgetIntelligence';
import { formatINR } from '../../utils/currency';
import { Calendar, TrendingUp } from 'lucide-react';

interface SpendingTimelineChartProps {
  expenses: Expense[];
}

type TimelineRange = '7d' | '30d' | '90d' | 'all';

export const SpendingTimelineChart: React.FC<SpendingTimelineChartProps> = ({ expenses }) => {
  const [range, setRange] = useState<TimelineRange>('30d');
  const [hoveredPoint, setHoveredPoint] = useState<TimelineDataPoint | null>(null);

  const timelineData = useMemo(() => {
    return calculateSpendingTimeline(expenses, range);
  }, [expenses, range]);

  const maxAmount = useMemo(() => {
    if (timelineData.length === 0) return 1;
    return Math.max(...timelineData.map((d) => d.amount), 1);
  }, [timelineData]);

  const totalRangeSpend = useMemo(() => {
    return timelineData.reduce((sum, d) => sum + d.amount, 0);
  }, [timelineData]);

  const totalRangeCount = useMemo(() => {
    return timelineData.reduce((sum, d) => sum + d.count, 0);
  }, [timelineData]);

  return (
    <div className="bg-[#FFFDF9] border border-[#F1E4D6] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-subtle space-y-4">
      {/* Header with Title and Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1E4D6]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#E89838] uppercase tracking-[0.2em]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Actual Outlay Cadence</span>
          </div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-[#16162A]">
            Spending Timeline & Velocity
          </h3>
        </div>

        {/* Range Selector Pills */}
        <div className="flex items-center gap-1 bg-[#FFF8F0] p-1 rounded-xl border border-[#F1E4D6] self-start sm:self-auto">
          {(
            [
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((item) => {
            const isSelected = range === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-[#641F35] text-[#FFF8F0] shadow-xs'
                    : 'text-[#615163] hover:text-[#16162A]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Row for Current Window */}
      <div className="flex items-baseline justify-between text-xs text-[#615163]">
        <div>
          <span>Disbursed in window: </span>
          <strong className="text-sm font-serif font-bold text-[#641F35]">
            {formatINR(totalRangeSpend)}
          </strong>
          <span className="text-[#8C7A8E]"> ({totalRangeCount} payment{totalRangeCount === 1 ? '' : 's'})</span>
        </div>

        {hoveredPoint && (
          <div className="text-right animate-fade-in font-medium text-[#16162A]">
            <span>{hoveredPoint.label}: </span>
            <strong className="font-serif font-bold text-[#641F35]">
              {formatINR(hoveredPoint.amount)}
            </strong>
          </div>
        )}
      </div>

      {/* Timeline Visualization */}
      {timelineData.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center justify-center text-[#8C7A8E] space-y-1">
          <Calendar className="w-6 h-6 stroke-[1.5] text-[#D8CAB8]" />
          <p className="text-xs font-serif italic">No paid transactions in this time window.</p>
        </div>
      ) : (
        <div className="pt-2">
          {/* Architectural Bars Chart */}
          <div className="h-36 sm:h-44 flex items-end gap-1.5 sm:gap-2 px-1 pb-1 border-b border-[#F1E4D6] relative">
            {timelineData.map((point) => {
              const heightPct = Math.max(10, Math.round((point.amount / maxAmount) * 100));
              const isHovered = hoveredPoint?.date === point.date;

              return (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => setHoveredPoint(point)}
                >
                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute -top-10 z-20 bg-[#16162A] text-[#FFF8F0] px-2 py-1 rounded-lg text-[10px] font-sans whitespace-nowrap shadow-md pointer-events-none animate-fade-in">
                      <span className="font-bold">{point.label}</span>: {formatINR(point.amount)}
                    </div>
                  )}

                  {/* Architectural Bar */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      isHovered
                        ? 'bg-[#C93B2B] shadow-sm'
                        : 'bg-gradient-to-t from-[#641F35] to-[#E89838] opacity-85 group-hover:opacity-100'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis Date Labels */}
          <div className="flex justify-between text-[10px] text-[#8C7A8E] pt-2 px-1">
            <span>{timelineData[0]?.label}</span>
            {timelineData.length > 2 && (
              <span>{timelineData[Math.floor(timelineData.length / 2)]?.label}</span>
            )}
            <span>{timelineData[timelineData.length - 1]?.label}</span>
          </div>
        </div>
      )}
    </div>
  );
};
