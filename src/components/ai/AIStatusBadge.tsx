import React from 'react';
import { Sparkles, WifiOff, ShieldAlert, AlertTriangle } from 'lucide-react';
import { AIResponseStatus } from '../../types/ai';

interface AIStatusBadgeProps {
  source?: 'cloud' | 'offline';
  statusType?: AIResponseStatus;
  isError?: boolean;
  className?: string;
}

/**
 * AIStatusBadge — Indicator showing whether the response was synthesized
 * by Cloud AI, resolved by the local offline deterministic assistant,
 * or resulted from an authorization/service failure.
 */
export const AIStatusBadge: React.FC<AIStatusBadgeProps> = ({
  source = 'offline',
  statusType,
  isError = false,
  className = '',
}) => {
  // 1. Authorization / Workspace Security Error
  if (statusType === 'auth_error') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#C93B2B]/10 text-[#C93B2B] border border-[#C93B2B]/25 ${className}`}
        title="Wedding workspace authorization required"
      >
        <ShieldAlert className="w-2.5 h-2.5 text-[#C93B2B]" />
        <span>Access Denied</span>
      </span>
    );
  }

  // 2. Cloud Service Notice / Failure
  if (statusType === 'cloud_error' || isError) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#E89838]/15 text-[#9A5B18] border border-[#E89838]/30 ${className}`}
        title="Cloud AI assistant service notice"
      >
        <AlertTriangle className="w-2.5 h-2.5 text-[#E89838]" />
        <span>Service Notice</span>
      </span>
    );
  }

  // 3. Genuine Server-Side Cloud AI Response
  if (statusType === 'cloud' || source === 'cloud') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#2D5A43]/10 text-[#2D5A43] border border-[#2D5A43]/20 ${className}`}
        title="Synthesized using secure server-side Cloud AI"
      >
        <Sparkles className="w-2.5 h-2.5 text-[#2D5A43]" />
        <span>Cloud AI</span>
      </span>
    );
  }

  // 4. Genuine Local Offline Deterministic Assistant
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#8C7A8E]/10 text-[#615163] border border-[#8C7A8E]/25 ${className}`}
      title="Resolved securely by the local offline WedWise assistant"
    >
      <WifiOff className="w-2.5 h-2.5 text-[#8C7A8E]" />
      <span>Offline Assistant</span>
    </span>
  );
};
