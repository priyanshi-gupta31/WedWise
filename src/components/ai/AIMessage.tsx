import React from 'react';
import { AIToolGroundingMetadata, AIResponseStatus } from '../../types/ai';
import { AIStatusBadge } from './AIStatusBadge';
import { AIClarificationOptions } from './AIClarificationOptions';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: 'cloud' | 'offline';
  statusType?: AIResponseStatus;
  toolUsed?: string | null;
  grounding?: AIToolGroundingMetadata | null;
  needsClarification?: boolean;
  clarificationOptions?: string[];
  isError?: boolean;
  timestamp: string;
}

interface AIMessageProps {
  message: ChatMessage;
  onSelectClarification: (option: string) => void;
  onRetry?: () => void;
}

/**
 * AIMessage — Renders an individual message turn in the Ask WedWise conversational stream.
 * Distinguishes user inquiries from grounded assistant responses with status badges,
 * grounding verification, and interactive clarification buttons.
 */
export const AIMessage: React.FC<AIMessageProps> = ({
  message,
  onSelectClarification,
  onRetry,
}) => {
  const isUser = message.sender === 'user';

  // 1. User Inquiry Bubble
  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in" role="log" aria-label="User inquiry">
        <div className="max-w-[85%] sm:max-w-[78%] bg-[#2B1B2D] text-[#FFF7ED] rounded-2xl rounded-br-sm px-4 py-3 shadow-md border border-[#3D2540]">
          <p className="text-sm font-sans whitespace-pre-wrap leading-relaxed selection:bg-[#E89838] selection:text-[#2B1B2D]">
            {message.text}
          </p>
        </div>
      </div>
    );
  }

  // 2. Assistant Response Bubble
  return (
    <div className="flex justify-start animate-fade-in" role="log" aria-label="Assistant response">
      <div className="max-w-[92%] sm:max-w-[85%] bg-white border border-[#F1E4D6] rounded-2xl rounded-bl-sm p-4 sm:p-5 shadow-sm text-[#1B1220]">
        {/* Assistant Header: Brand Avatar & Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#F8EFE4]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#5A1224] flex items-center justify-center text-[10px] text-[#E89838] font-serif font-bold shadow-xs">
              W
            </div>
            <span className="text-xs font-serif font-bold text-[#5A1224] tracking-wide">
              WedWise
            </span>
          </div>

          <AIStatusBadge
            source={message.source || 'offline'}
            statusType={message.statusType}
            isError={message.isError}
          />
        </div>

        {/* Message Body */}
        {message.isError ? (
          <div className="py-1">
            <div className="flex items-center gap-2 text-xs font-medium text-[#C93B2B] mb-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{message.text}</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 px-3 py-1.5 rounded-lg bg-[#FAF4ED] hover:bg-[#F3EDE2] text-xs font-medium text-[#5A1224] border border-[#E89838]/40 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-[#E89838]" />
                <span>Try again</span>
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm font-sans whitespace-pre-wrap leading-relaxed text-[#2B1B2D]">
            {message.text}
          </div>
        )}

        {/* Interactive Clarification Options (if query was ambiguous) */}
        {message.needsClarification && message.clarificationOptions && (
          <AIClarificationOptions
            options={message.clarificationOptions}
            onSelect={onSelectClarification}
          />
        )}

        {/* Grounding Verification Badge */}
        {message.grounding?.source && !message.isError && (
          <div className="mt-3 pt-2.5 border-t border-[#F8EFE4] flex items-center gap-1.5 text-[11px] font-sans text-[#2D5A43]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2D5A43] flex-shrink-0" />
            <span className="font-medium tracking-tight">{message.grounding.source}</span>
          </div>
        )}
      </div>
    </div>
  );
};
