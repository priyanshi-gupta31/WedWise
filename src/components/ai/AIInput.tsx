import React, { useRef, useEffect } from 'react';
import { Send, ArrowUp } from 'lucide-react';
import { MAX_QUERY_LENGTH } from '../../services/aiGateway';

interface AIInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

/**
 * AIInput — Bottom pinned message input for Ask WedWise.
 * Handles desktop Enter submission, Shift+Enter multi-line text,
 * mobile virtual keyboard safety, and 500-character constraint indicators.
 */
export const AIInput: React.FC<AIInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height up to 120px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  const isOverLimit = value.length > MAX_QUERY_LENGTH;
  const canSubmit = value.trim().length > 0 && !isLoading && !disabled && !isOverLimit;

  return (
    <div className="w-full bg-[#FFFBF5] border-t border-[#F1E4D6] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] select-none">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit();
        }}
        className="relative flex items-end gap-2 bg-white border border-[#E89838]/40 focus-within:border-[#5A1224] focus-within:ring-2 focus-within:ring-[#5A1224]/10 rounded-2xl p-2 transition-all shadow-xs"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          placeholder="Ask about your wedding…"
          maxLength={MAX_QUERY_LENGTH + 10} // Allow slight overflow to show friendly validation
          className="flex-1 max-h-[120px] bg-transparent text-sm text-[#1B1220] placeholder-[#8C7A8E] resize-none focus:outline-none px-2 py-1 leading-relaxed selection:bg-[#E89838] selection:text-[#5A1224] disabled:opacity-50"
          aria-label="Ask about your wedding"
        />

        {/* Action Controls: Character Count & Send Button */}
        <div className="flex items-center gap-2 flex-shrink-0 pb-0.5">
          {value.length > 350 && (
            <span
              className={`text-[10px] font-mono font-medium ${
                isOverLimit ? 'text-[#C93B2B] font-bold' : 'text-[#8C7A8E]'
              }`}
            >
              {value.length}/{MAX_QUERY_LENGTH}
            </span>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            aria-label="Send inquiry"
            className="w-8 h-8 rounded-xl bg-[#5A1224] hover:bg-[#400B18] text-[#FFF7ED] flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-xs"
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5] text-[#E89838]" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
