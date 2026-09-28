import React from 'react';
import { Sparkles } from 'lucide-react';

export const SUGGESTED_QUERIES = [
  'How much have we spent?',
  'How much budget is left?',
  'Which vendors are pending?',
  'How many guests are confirmed?',
  'Show recent memories',
  'Show Mehendi memories',
  'What happened during Sangeet?',
  'Who is tagged in recent memories?',
  'What ceremonies are coming up?',
  'What tasks are overdue?',
  'How many rooms are needed?',
  'What pickups are pending?',
];

interface AISuggestionChipsProps {
  onSelect: (query: string) => void;
  disabled?: boolean;
  className?: string;
  limit?: number;
}

/**
 * AISuggestionChips — Reusable list of pre-configured inquiry chips.
 * Supports horizontal scrolling on mobile viewports and wrapped rows on desktop.
 */
export const AISuggestionChips: React.FC<AISuggestionChipsProps> = ({
  onSelect,
  disabled = false,
  className = '',
  limit,
}) => {
  const queries = limit ? SUGGESTED_QUERIES.slice(0, limit) : SUGGESTED_QUERIES;

  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 select-none ${className}`}
      role="region"
      aria-label="Suggested wedding queries"
    >
      {queries.map((query) => (
        <button
          key={query}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(query)}
          className="flex-shrink-0 text-left px-3.5 py-1.5 rounded-full text-xs font-medium text-[#5A1224] bg-white/90 hover:bg-[#FFF8F0] border border-[#E89838]/35 hover:border-[#E89838] shadow-sm hover:shadow active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
        >
          <Sparkles className="w-3 h-3 text-[#E89838] flex-shrink-0" />
          <span className="whitespace-nowrap">{query}</span>
        </button>
      ))}
    </div>
  );
};
