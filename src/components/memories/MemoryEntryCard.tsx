import React from 'react';
import { WeddingMemory } from '../../types/memories';
import { useSignedMediaUrl } from '../../hooks/useSignedMediaUrl';
import {
  Calendar,
  Sparkles,
  MapPin,
  Lock,
  Tag,
  Image as ImageIcon,
  User,
  ChevronRight,
} from 'lucide-react';

interface MemoryEntryCardProps {
  memory: WeddingMemory;
  onClick: () => void;
}

export const MemoryEntryCard: React.FC<MemoryEntryCardProps> = ({ memory, onClick }) => {
  const mediaCount = (memory.media || []).length;
  const peopleCount = (memory.people_tags || []).length;
  const firstMedia = memory.media && memory.media.length > 0 ? memory.media[0] : null;

  const targetPath = firstMedia ? firstMedia.thumbnail_path || firstMedia.storage_path : null;
  const { url: signedThumbnailUrl } = useSignedMediaUrl(targetPath);

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative bg-[#FFFDF9] border border-[#F1E4D6] hover:border-[#641F35]/40 rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-card transition-all duration-300 text-left cursor-pointer overflow-hidden flex flex-col justify-between"
      aria-label={`View memory: ${memory.title}`}
    >
      {/* Decorative top-right archival corner flourish */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#E89838]/8 via-transparent to-transparent pointer-events-none rounded-tr-3xl" />

      <div>
        {/* Header Row: Date, Ceremony, Visibility */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#F1E4D6]/70">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#8C7A8E]">
              <Calendar className="w-3.5 h-3.5 text-[#D6B36A]" />
              <span>{memory.memory_date}</span>
            </span>

            {memory.event && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF1F3] border border-[#641F35]/15 text-[#641F35] text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-[#E89838]" />
                <span>{memory.event.event_name}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {memory.visibility === 'CORE_FAMILY_ONLY' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF1F3] border border-[#641F35]/20 text-[#641F35] text-[10px] font-semibold">
                <Lock className="w-3 h-3 text-[#E86A5B]" />
                <span>Core Family</span>
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A8E] bg-[#FFF7ED] px-2 py-0.5 rounded-md border border-[#F1E4D6]">
              {memory.milestone_phase}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#1B1220] group-hover:text-[#641F35] transition-colors leading-snug">
          {memory.title}
        </h3>

        {/* Story / Caption preview */}
        {memory.story_caption && (
          <p className="mt-2.5 text-xs sm:text-sm text-[#4A3B4E] font-serif italic line-clamp-2 leading-relaxed">
            "{memory.story_caption}"
          </p>
        )}

        {/* Media Thumbnail strip preview if media exists */}
        {firstMedia && (
          <div className="mt-4 flex items-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#241B28] border border-[#E8DFD5] flex-shrink-0 relative">
              {signedThumbnailUrl ? (
                <img
                  src={signedThumbnailUrl}
                  alt={memory.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 bg-gradient-to-br from-[#2D1B28] to-[#1E1424]">
                  <ImageIcon className="w-4 h-4 text-[#E89838] mb-0.5" />
                  <span className="text-[8px] text-[#FFF8F0] uppercase font-mono">
                    {firstMedia.media_type}
                  </span>
                </div>
              )}
            </div>

            <div className="text-xs text-[#8C7A8E]">
              <span className="font-semibold text-[#29202A] block">
                {mediaCount} {mediaCount === 1 ? 'archived image' : 'archived images'}
              </span>
              <span className="text-[11px] text-[#8C7A8E]">Click to view in lightbox</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer: People tags & Author & Arrow */}
      <div className="mt-5 pt-3 border-t border-[#F1E4D6]/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {memory.people_tags && memory.people_tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#E8DFD5] text-[11px] text-[#29202A] font-medium"
            >
              <Tag className="w-2.5 h-2.5 text-[#D6B36A]" />
              <span>{tag.guest_name || tag.custom_name}</span>
            </span>
          ))}

          {peopleCount > 3 && (
            <span className="text-[10px] text-[#8C7A8E] font-medium">
              +{peopleCount - 3} more
            </span>
          )}

          {memory.author_name && (
            <span className="text-[11px] text-[#8C7A8E] italic ml-1 flex items-center gap-1">
              <User className="w-2.5 h-2.5" />
              <span>{memory.author_name}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-[#641F35] group-hover:translate-x-0.5 transition-transform">
          <span>Read story</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </article>
  );
};
