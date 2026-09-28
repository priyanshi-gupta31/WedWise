import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import { askWedWise } from '../../services/askWedWise';
import { AIMessage, ChatMessage } from './AIMessage';
import { AIInput } from './AIInput';
import { AISuggestionChips } from './AISuggestionChips';
import { WeddingSeal } from '../common/WeddingSeal';

interface AskWedWiseProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId?: string;
}

/**
 * AskWedWise — Polished, mobile-first conversational AI interface for WedWise.
 * Opens as a full-height conversational bottom sheet on mobile (360px–412px)
 * and an elegant slide-over panel on desktop, preserving the underlying wedding world.
 *
 * Exclusively communicates through askWedWise.ts; zero direct communication with Gemini.
 */
export const AskWedWise: React.FC<AskWedWiseProps> = ({ isOpen, onClose, weddingId }) => {
  const { user } = useAuth();
  const { wedding, isLoading: weddingLoading } = useWedding();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const targetWeddingId = weddingId || wedding?.id;

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Handle ESC key to dismiss panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const query = (queryText || inputText).trim();
    if (!query || isLoading) return;

    // Guard: If authenticated with Supabase, ensure workspace has hydrated
    if (user && !user.id.startsWith('local-')) {
      if (weddingLoading) {
        const waitMsgId = `wait-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: waitMsgId,
            sender: 'assistant',
            text: 'Your wedding workspace is still loading. Please wait a moment and try again.',
            source: 'cloud',
            statusType: 'cloud_error',
            isError: true,
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }
      if (!targetWeddingId) {
        const noWedMsgId = `nowed-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: noWedMsgId,
            sender: 'assistant',
            text: 'No active wedding workspace found. Please set up or select a wedding first.',
            source: 'cloud',
            statusType: 'auth_error',
            isError: true,
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }
    }

    const userMessageId = `usr-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText('');
    setIsLoading(true);
    setLastQuery(query);

    try {
      const response = await askWedWise.ask(
        {
          query,
          weddingId: targetWeddingId,
        },
        user?.id
      );

      const assistantMsgId = `ast-${Date.now()}`;
      const newAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: response.text,
        source: response.source,
        statusType: response.statusType || (response.source === 'cloud' ? 'cloud' : 'offline'),
        toolUsed: response.toolUsed,
        grounding: response.grounding,
        needsClarification: response.needsClarification,
        clarificationOptions: response.clarificationOptions,
        isError: Boolean(response.error),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
    } catch (err: any) {
      const errorMsgId = `err-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          sender: 'assistant',
          text: "I couldn't check that right now. Please try again.",
          source: 'offline',
          statusType: 'cloud_error',
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastQuery) {
      handleSend(lastQuery);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const drawerContent = (
    <div className="fixed inset-0 z-[60] overflow-hidden select-none" role="dialog" aria-modal="true" aria-labelledby="ask-wedwise-title">
      {/* 1. Backdrop Overlay (Desktop & Mobile) */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Conversational Container: Mobile Full-Height Panel / Desktop Right Slide-Over */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 w-full sm:max-w-md lg:max-w-[450px] bg-[#FFFBF5] shadow-2xl flex flex-col border-l border-[#F1E4D6] animate-slide-left z-[60] text-[#1B1220]"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 bg-[#FFF8F0] border-b border-[#F1E4D6] shadow-2xs flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5A1224] to-[#2B1B2D] flex items-center justify-center text-[#E89838] shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 id="ask-wedwise-title" className="text-base font-serif font-bold text-[#5A1224] tracking-tight">
                  Ask WedWise
                </h2>
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E89838]/15 text-[#5A1224] border border-[#E89838]/30">
                  Read-Only
                </span>
              </div>
              <p className="text-[11px] font-sans text-[#8C7A8E]">
                Your wedding data, at a question away.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Ask WedWise"
            className="p-2 rounded-xl text-[#8C7A8E] hover:text-[#1B1220] hover:bg-[#FAF4ED] transition-colors focus:outline-none focus:ring-2 focus:ring-[#5A1224]"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Conversation Stream (Independently Scrollable) */}
        <div
          className="flex-1 overflow-y-auto px-4 py-5 space-y-4 font-sans select-text selection:bg-[#E89838] selection:text-[#5A1224]"
          aria-live="polite"
        >
          {/* Welcome State when no conversation history exists */}
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 animate-fade-in select-none">
              <div className="w-16 h-16 rounded-full bg-[#FAF4ED] border border-[#E89838]/30 flex items-center justify-center text-[#5A1224] mb-4 shadow-sm">
                <WeddingSeal size="sm" />
              </div>


              <h3 className="text-lg font-serif font-bold text-[#5A1224] mb-2 tracking-tight">
                Ask anything about your wedding
              </h3>

              <p className="text-xs text-[#615163] max-w-xs leading-relaxed mb-6">
                I can help you understand your budget, expenses, vendors, guests, ceremonies, tasks, rooms, transport, and recent activity.
              </p>

              {/* Suggested Question Chips in Welcome State */}
              <div className="w-full text-left">
                <span className="text-[11px] font-serif font-semibold tracking-wider text-[#8C7A8E] uppercase block mb-2 px-1">
                  Suggested Questions
                </span>
                <div className="flex flex-col gap-2">
                  <AISuggestionChips
                    onSelect={(query) => handleSend(query)}
                    disabled={isLoading}
                    className="flex-col !items-stretch gap-2 !overflow-visible"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center gap-1.5 text-[11px] text-[#8C7A8E]">
                <Shield className="w-3.5 h-3.5 text-[#2D5A43]" />
                <span>Read-only assistant • Your private wedding data</span>
              </div>
            </div>
          ) : (
            // Message Turns
            messages.map((msg) => (
              <AIMessage
                key={msg.id}
                message={msg}
                onSelectClarification={(opt) => handleSend(opt)}
                onRetry={handleRetry}
              />
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in" aria-busy="true">
              <div className="bg-white border border-[#F1E4D6] rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E89838] animate-ping" />
                <span className="text-xs font-serif italic text-[#8C7A8E]">
                  WedWise is checking your wedding data…
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips (when conversation has started) */}
        {messages.length > 0 && !isLoading && (
          <div className="px-4 py-1.5 bg-[#FFF8F0]/70 border-t border-[#F1E4D6]/60">
            <AISuggestionChips
              onSelect={(query) => handleSend(query)}
              disabled={isLoading}
              limit={4}
            />
          </div>
        )}

        {/* Bottom Pinned Input */}
        <AIInput
          value={inputText}
          onChange={setInputText}
          onSubmit={() => handleSend()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};
