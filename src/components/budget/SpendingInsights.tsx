import React from 'react';
import { SpendingInsight } from '../../utils/insights';
import { Sparkles, AlertCircle, AlertTriangle, Heart } from 'lucide-react';

interface SpendingInsightsProps {
  insights: SpendingInsight[];
}

export const SpendingInsights: React.FC<SpendingInsightsProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-8 shadow-card">
      <div className="mb-4">
        <span className="text-[10px] sm:text-[11px] font-bold text-[#E86A5B] uppercase tracking-[0.2em] block mb-1">
          Wedding Companion
        </span>
        <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#29202A]">
          Wedding Notes & Advice
        </h4>
        <p className="text-xs text-[#615163]">
          Personal reminders and financial pacing notes for your celebration
        </p>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          let badgeClass = 'bg-[#FFF7ED] border-[#F1E4D6] text-[#29202A]';
          let icon = <Heart className="w-4 h-4 text-[#E86A5B] flex-shrink-0 mt-0.5" />;

          if (insight.type === 'critical') {
            badgeClass = 'bg-[#FAF1F3] border-[#E8C5CD] text-[#641F35]';
            icon = <AlertCircle className="w-4 h-4 text-[#641F35] flex-shrink-0 mt-0.5" />;
          } else if (insight.type === 'warning') {
            badgeClass = 'bg-[#FAF4E6] border-[#D6B36A]/40 text-[#B8944B]';
            icon = <AlertTriangle className="w-4 h-4 text-[#D6B36A] flex-shrink-0 mt-0.5" />;
          } else if (insight.type === 'success') {
            badgeClass = 'bg-[#E6EAE3] border-[#CAD4C4] text-[#5D6B53]';
            icon = <Sparkles className="w-4 h-4 text-[#87957D] flex-shrink-0 mt-0.5" />;
          }

          return (
            <div
              key={insight.id}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${badgeClass}`}
            >
              {icon}
              <div className="flex-1">
                <span className="font-serif font-bold text-sm block mb-0.5">
                  {insight.type === 'success' ? '✨ You’re right on track' : insight.title}
                </span>
                <span className="opacity-90 font-sans text-xs sm:text-sm">
                  {insight.message}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
