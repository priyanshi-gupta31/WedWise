import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, RotateCcw, AlertCircle, Info, Loader2 } from 'lucide-react';
import { askWedWise } from '../../services/askWedWise';

interface StoryPolisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalStory: string;
  onApplyPolished: (polishedStory: string) => void;
  memoryTitle?: string;
  milestone?: string;
  ceremonyName?: string;
  weddingId?: string;
}

/**
 * StoryPolisherModal — Phase 9.7 AI Story Polisher
 *
 * Provides a beautiful, mobile-first side-by-side / stacked comparison between
 * the user's original memory text and the AI-polished version.
 *
 * CRITICAL INVARIANT:
 * The AI NEVER automatically overwrites the original story.
 * The original story is strictly preserved unless the user explicitly taps "Use Polished Version".
 */
export const StoryPolisherModal: React.FC<StoryPolisherModalProps> = ({
  isOpen,
  onClose,
  originalStory,
  onApplyPolished,
  memoryTitle,
  milestone,
  ceremonyName,
  weddingId,
}) => {
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishedStory, setPolishedStory] = useState<string | null>(null);
  const [source, setSource] = useState<'cloud' | 'offline' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Trigger story polishing when modal is opened
  useEffect(() => {
    if (!isOpen || !originalStory.trim()) return;

    let isMounted = true;
    setIsPolishing(true);
    setError(null);
    setPolishedStory(null);
    setSource(null);

    askWedWise
      .polishStory({
        story: originalStory,
        memoryTitle,
        milestone,
        ceremonyName,
        weddingId,
      })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.polishedText) {
          setPolishedStory(res.polishedText);
          setSource(res.source);
        } else {
          setError(res.error || "I couldn't polish this story right now. Your original story is unchanged.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "I couldn't polish this story right now. Your original story is unchanged.");
      })
      .finally(() => {
        if (isMounted) setIsPolishing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, originalStory, memoryTitle, milestone, ceremonyName, weddingId]);

  // Handle ESC key to dismiss
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

  const handleUsePolished = () => {
    if (polishedStory) {
      onApplyPolished(polishedStory);
      onClose();
    }
  };

  const handleRetry = () => {
    setIsPolishing(true);
    setError(null);
    askWedWise
      .polishStory({
        story: originalStory,
        memoryTitle,
        milestone,
        ceremonyName,
        weddingId,
      })
      .then((res) => {
        if (res.success && res.polishedText) {
          setPolishedStory(res.polishedText);
          setSource(res.source);
        } else {
          setError(res.error || "I couldn't polish this story right now. Your original story is unchanged.");
        }
      })
      .catch((err) => {
        setError(err.message || "I couldn't polish this story right now. Your original story is unchanged.");
      })
      .finally(() => {
        setIsPolishing(false);
      });
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-polisher-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in text-[#29202A]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FFFDF9] border border-[#F1E4D6] rounded-3xl shadow-modal overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F1E4D6] flex items-center justify-between bg-gradient-to-r from-[#FFF8F0] to-[#FFFDF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#852C47] to-[#2B1B2D] flex items-center justify-center text-[#E89838] shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="story-polisher-title" className="text-base font-serif font-bold text-[#1B1220]">
                  WedWise Story Polisher
                </h3>
                {source && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      source === 'cloud'
                        ? 'bg-[#E89838]/15 border-[#E89838]/30 text-[#852C47]'
                        : 'bg-[#EAF3EC] border-[#2D5A43]/20 text-[#2D5A43]'
                    }`}
                  >
                    {source === 'cloud' ? (
                      <>
                        <Sparkles className="w-2.5 h-2.5 text-[#E89838]" />
                        <span>WedWise AI</span>
                      </>
                    ) : (
                      <>
                        <Info className="w-2.5 h-2.5 text-[#2D5A43]" />
                        <span>Offline Preview</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8C7A8E]">
                Enhancing readability and warmth while preserving your authentic facts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Story Polisher"
            className="p-2 rounded-full hover:bg-[#F1E4D6]/50 text-[#8C7A8E] hover:text-[#29202A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Stacked Comparison (Mobile-Friendly & Tablet/Desktop Responsive) */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* 1. Original Story */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8C7A8E] uppercase tracking-wider">
                Original Story
              </span>
              <span className="text-[11px] text-[#8C7A8E] italic">Your authentic words</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF4ED] border border-[#E8DFD5] text-[#29202A] text-sm font-serif italic leading-relaxed">
              "{originalStory}"
            </div>
          </div>

          {/* 2. Polished Story or Loading / Error State */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#852C47] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
                <span>Polished Version</span>
              </span>
              {source === 'cloud' && (
                <span className="text-[11px] text-[#E89838] font-medium">Refined by Gemini</span>
              )}
            </div>

            {isPolishing ? (
              <div className="p-6 rounded-2xl bg-[#FFF8F0]/70 border border-[#F1E4D6] flex flex-col items-center justify-center gap-2.5 text-center py-8">
                <Loader2 className="w-6 h-6 text-[#E89838] animate-spin" />
                <p className="text-xs font-serif italic text-[#8C7A8E]">
                  WedWise is polishing your story with poetic warmth…
                </p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-2 text-xs font-bold underline text-rose-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Try again</span>
                  </button>
                </div>
              </div>
            ) : polishedStory ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF8F0] to-[#FFFBF5] border border-[#E89838]/40 text-[#1B1220] text-sm sm:text-base font-serif italic leading-relaxed shadow-xs">
                "{polishedStory}"
              </div>
            ) : null}
          </div>

          {/* Note on factual integrity */}
          <div className="text-[11px] text-[#8C7A8E] flex items-center gap-1.5 pt-1">
            <Check className="w-3.5 h-3.5 text-[#2D5A43] flex-shrink-0" />
            <span>Facts, names, dates, and locations remain untouched. You choose what to save.</span>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 border-t border-[#F1E4D6] bg-[#FFF8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#852C47] text-xs font-bold text-[#615163] hover:text-[#1B1220] transition-colors"
          >
            Keep Original
          </button>

          <div className="flex items-center gap-2">
            {error && (
              <button
                type="button"
                onClick={handleRetry}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#FFFDF9] border border-[#E89838]/40 text-[#852C47] text-xs font-bold hover:bg-[#FFF8F0] transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}

            <button
              type="button"
              disabled={isPolishing || !polishedStory}
              onClick={handleUsePolished}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#852C47] to-[#5A1224] hover:from-[#641F35] hover:to-[#4A0E1C] text-[#FFF7ED] text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#E89838]" />
              <span>Use Polished Version</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
