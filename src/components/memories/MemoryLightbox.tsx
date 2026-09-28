import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MemoryMedia } from '../../types/memories';
import { useMemoryMediaSignedUrls } from '../../hooks/useSignedMediaUrl';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';

interface MemoryLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  media: MemoryMedia[];
  initialIndex?: number;
  memoryTitle?: string;
}

export const MemoryLightbox: React.FC<MemoryLightboxProps> = ({
  isOpen,
  onClose,
  media,
  initialIndex = 0,
  memoryTitle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const { urlsMap, isLoading: urlsLoading } = useMemoryMediaSignedUrls(media);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handleNext = useCallback(() => {
    if (!media || media.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }, [media]);

  const handlePrev = useCallback(() => {
    if (!media || media.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media]);

  // Keyboard navigation: Escape, ArrowLeft, ArrowRight
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !media || media.length === 0 || typeof document === 'undefined') return null;

  const currentItem = media[currentIndex] || media[0];
  const isImage = currentItem.media_type === 'image';

  const lightboxContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={memoryTitle ? `Photos from ${memoryTitle}` : 'Memory Media Preview'}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-between bg-[#100C14]/95 backdrop-blur-md p-4 sm:p-6 select-none animate-fade-in"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="w-full flex items-center justify-between text-[#FFF8F0] z-10 max-w-6xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          {memoryTitle && (
            <h3 className="font-serif font-bold text-base sm:text-lg text-[#FFF8F0] truncate max-w-xs sm:max-w-md">
              {memoryTitle}
            </h3>
          )}
          <span className="text-xs text-[#E89838] tracking-widest uppercase font-mono mt-0.5">
            {currentIndex + 1} of {media.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Lightbox"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FFF8F0] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E89838]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewport */}
      <div
        className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        {media.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous photo"
            className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-[#FFF8F0] border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-[#E89838] active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Media Content */}
        <div className="flex flex-col items-center justify-center max-h-[75vh] sm:max-h-[80vh] w-full">
          {isImage ? (
            (() => {
              const currentFullUrl = urlsMap[currentItem.id]?.full || currentItem.storage_path;
              const isDirect =
                currentFullUrl &&
                (currentFullUrl.startsWith('http') ||
                  currentFullUrl.startsWith('blob:') ||
                  currentFullUrl.startsWith('data:'));

              if (isDirect) {
                return (
                  <img
                    src={currentFullUrl}
                    alt={memoryTitle || 'Wedding memory photo'}
                    className="max-h-[75vh] sm:max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-all"
                  />
                );
              }

              if (urlsLoading) {
                return (
                  <div className="w-80 sm:w-96 h-72 sm:h-80 rounded-2xl bg-[#241B28] border border-[#E89838]/30 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
                    <Loader2 className="w-8 h-8 text-[#E89838] animate-spin mb-3" />
                    <span className="text-xs text-[#FFF8F0] font-serif">
                      Retrieving archival photograph...
                    </span>
                  </div>
                );
              }

              return (
                // Editorial Placeholder for mock or pending storage files
                <div className="w-80 sm:w-96 h-72 sm:h-80 rounded-2xl bg-gradient-to-br from-[#241B28] to-[#3A2234] border border-[#E89838]/30 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-[#E89838]/15 border border-[#E89838]/40 flex items-center justify-center text-[#E89838] mb-4">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-[#FFF8F0]">
                    Archived Wedding Photograph
                  </h4>
                  <p className="text-xs text-[#E8DFD5]/80 mt-2 font-mono">
                    {currentItem.storage_path.split('/').pop() || 'memory-image.webp'}
                  </p>
                  <span className="text-[11px] text-[#E89838] mt-3 uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full bg-[#E89838]/10 border border-[#E89838]/20">
                    {currentItem.mime_type} • {Math.round(currentItem.file_size / 1024)} KB
                  </span>
                </div>
              );
            })()
          ) : (
            // Document Placeholder
            <div className="w-80 sm:w-96 h-72 sm:h-80 rounded-2xl bg-[#241B28] border border-[#D6B36A]/40 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#D6B36A]/15 border border-[#D6B36A]/40 flex items-center justify-center text-[#D6B36A] mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-serif font-bold text-lg text-[#FFF8F0]">
                Archived Wedding Document
              </h4>
              <p className="text-xs text-[#E8DFD5]/80 mt-2 font-mono">
                {currentItem.storage_path.split('/').pop() || 'document.pdf'}
              </p>
              <span className="text-[11px] text-[#D6B36A] mt-3 uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full bg-[#D6B36A]/10 border border-[#D6B36A]/20">
                {currentItem.mime_type} • {Math.round(currentItem.file_size / 1024)} KB
              </span>
            </div>
          )}
        </div>

        {/* Next Button */}
        {media.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photo"
            className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-[#FFF8F0] border border-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-[#E89838] active:scale-95"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple photos) */}
      {media.length > 1 && (
        <div
          className="flex items-center gap-2 overflow-x-auto py-2 px-4 max-w-md mx-auto scrollbar-none z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {media.map((item, index) => {
            const thumbUrl =
              urlsMap[item.id]?.thumb ||
              urlsMap[item.id]?.full ||
              item.thumbnail_path ||
              item.storage_path;
            const hasThumbUrl =
              thumbUrl &&
              (thumbUrl.startsWith('http') ||
                thumbUrl.startsWith('blob:') ||
                thumbUrl.startsWith('data:'));

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 relative ${
                  index === currentIndex
                    ? 'border-[#E89838] scale-105 shadow-md'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                {hasThumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2B1B2D] flex items-center justify-center text-[10px] text-[#FFF8F0] font-mono">
                    {index + 1}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return createPortal(lightboxContent, document.body);
};
