import React from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';

interface AIClarificationOptionsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

/**
 * AIClarificationOptions — Rendered when a user query is ambiguous (e.g. "How much is pending?").
 * Allows the user to select the exact intended wedding domain without guessing.
 */
export const AIClarificationOptions: React.FC<AIClarificationOptionsProps> = ({
  options,
  onSelect,
  disabled = false,
}) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-[#F1E4D6]/80 animate-fade-in" role="group" aria-label="Clarification options">
      <div className="flex items-center gap-1.5 text-xs font-serif italic text-[#8C7A8E] mb-2.5">
        <HelpCircle className="w-3.5 h-3.5 text-[#E89838]" />
        <span>Please clarify which wedding domain you'd like to check:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(opt)}
            className="group px-3 py-1.5 rounded-xl bg-[#FAF4ED] hover:bg-[#5A1224] text-[#5A1224] hover:text-[#FFF7ED] border border-[#E89838]/40 hover:border-[#5A1224] text-xs font-medium transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 shadow-sm"
          >
            <span>{opt}</span>
            <ArrowRight className="w-3 h-3 text-[#E89838] group-hover:text-[#FFF7ED] group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
};
