import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WeddingMemory, MemoryMedia } from '../../types/memories';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import { useMemoryMediaSignedUrls } from '../../hooks/useSignedMediaUrl';
import { MemoryPhotoUploader } from './MemoryPhotoUploader';
import { MemoryLightbox } from './MemoryLightbox';
import { StoryPolisherModal } from './StoryPolisherModal';
import {
  X,
  Calendar,
  MapPin,
  Sparkles,
  Tag,
  Lock,
  Globe,
  Edit2,
  Trash2,
  Image as ImageIcon,
  FileText,
  User,
  Users,
  Plus,
  Upload,
  ArrowRight,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface MemoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: WeddingMemory | null;
  onEdit: (memory: WeddingMemory) => void;
  onDelete: (memory: WeddingMemory) => void;
  onNavigateToEvent?: (eventId: string) => void;
}

export const MemoryDetailsModal: React.FC<MemoryDetailsModalProps> = ({
  isOpen,
  onClose,
  memory,
  onEdit,
  onDelete,
  onNavigateToEvent,
}) => {
  const { user } = useAuth();
  const { userRole, can, deleteMemoryMedia, refreshMemories, wedding, updateMemory } = useWedding();
  const { showToast } = useToast();

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MemoryMedia | null>(null);
  const [localMediaList, setLocalMediaList] = useState<MemoryMedia[]>(memory?.media || []);
  const [showStoryPolisher, setShowStoryPolisher] = useState(false);
  const [currentStory, setCurrentStory] = useState(memory?.story_caption || '');

  useEffect(() => {
    if (memory?.media) {
      setLocalMediaList(memory.media);
    } else {
      setLocalMediaList([]);
    }
    setCurrentStory(memory?.story_caption || '');
  }, [memory?.media, memory?.story_caption, isOpen]);

  const handleApplyPolishedStory = async (polishedText: string) => {
    if (!memory) return;
    try {
      await updateMemory(memory.id, { story_caption: polishedText });
      setCurrentStory(polishedText);
      showToast('Story polished and updated beautifully! ✨', 'success');
      await refreshMemories();
    } catch (err: any) {
      showToast(err.message || 'Failed to update memory story.', 'error');
    }
  };

  const { urlsMap } = useMemoryMediaSignedUrls(localMediaList);

  if (!isOpen || !memory) return null;

  // Authorization: Can edit/delete if MANAGE_MEMORIES or if author
  const isManager = can('MANAGE_MEMORIES');
  const isAuthor = user?.id && memory.created_by === user.id;
  const canMutate = isManager || (userRole === 'CONTRIBUTOR' && isAuthor);

  const peopleList = memory.people_tags || [];

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDeleteConfirmed = () => {
    setShowDeleteConfirm(false);
    onDelete(memory);
  };

  const handleConfirmDeleteMedia = async () => {
    if (!mediaToDelete) return;
    try {
      await deleteMemoryMedia(mediaToDelete.id);
      setLocalMediaList((prev) => prev.filter((m) => m.id !== mediaToDelete.id));
      setMediaToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete media:', err);
    }
  };

  const handleUploadSuccess = (newMedia: MemoryMedia) => {
    setLocalMediaList((prev) => [...prev, newMedia]);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-details-title"
        className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl bg-[#FFFDF9] border border-[#F1E4D6] rounded-3xl shadow-modal overflow-hidden my-auto max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="px-6 sm:px-8 py-5 border-b border-[#F1E4D6] flex items-center justify-between bg-gradient-to-r from-[#FFF8F0] to-[#FFFDF9]">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#E89838]/15 border border-[#E89838]/30 text-[#852C47] text-[10px] font-bold uppercase tracking-wider">
                {memory.milestone_phase}
              </span>
              {memory.visibility === 'CORE_FAMILY_ONLY' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF1F3] border border-[#641F35]/20 text-[#641F35] text-[10px] font-semibold">
                  <Lock className="w-3 h-3 text-[#E86A5B]" />
                  <span>Core Family</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAF3EC] border border-[#2D5A43]/20 text-[#2D5A43] text-[10px] font-semibold">
                  <Globe className="w-3 h-3 text-[#2D5A43]" />
                  <span>Public Family</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="p-2 rounded-full hover:bg-[#F1E4D6]/50 text-[#8C7A8E] hover:text-[#29202A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Title & Metadata */}
            <div>
              <h1
                id="memory-details-title"
                className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1220] tracking-tight leading-snug"
              >
                {memory.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs text-[#8C7A8E] font-medium">
                <span className="flex items-center gap-1.5 text-[#29202A]">
                  <Calendar className="w-3.5 h-3.5 text-[#D6B36A]" />
                  <span className="font-semibold">{memory.memory_date}</span>
                </span>

                {memory.event && (
                  onNavigateToEvent ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToEvent(memory.event!.id);
                      }}
                      title={`View ${memory.event.event_name} ceremony details`}
                      className="flex items-center gap-1.5 text-[#641F35] bg-[#FAF1F3] hover:bg-[#F3E1E7] px-2.5 py-0.5 rounded-full border border-[#641F35]/20 font-semibold transition-all cursor-pointer group shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3 text-[#E89838] group-hover:rotate-12 transition-transform" />
                      <span>{memory.event.event_name}</span>
                      <ArrowRight className="w-3 h-3 text-[#641F35]/70 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[#641F35] bg-[#FAF1F3] px-2.5 py-0.5 rounded-full border border-[#641F35]/15 font-semibold">
                      <Sparkles className="w-3 h-3 text-[#E89838]" />
                      <span>{memory.event.event_name}</span>
                    </span>
                  )
                )}

                {memory.location && (
                  <span className="flex items-center gap-1 text-[#615163]">
                    <MapPin className="w-3.5 h-3.5 text-[#D6B36A]" />
                    <span>{memory.location}</span>
                  </span>
                )}

                {memory.author_name && (
                  <span className="flex items-center gap-1 text-[#8C7A8E] italic">
                    <User className="w-3 h-3" />
                    <span>Preserved by {memory.author_name}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Story / Caption */}
            {currentStory && (
              <div className="relative p-5 sm:p-6 rounded-2xl bg-[#FFF8F0]/70 border border-[#F1E4D6] space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl font-serif text-[#D6B36A]/40 select-none leading-none">
                    “
                  </span>
                  {canMutate && (
                    <button
                      type="button"
                      onClick={() => setShowStoryPolisher(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-[#FFF8F0] text-[#852C47] text-xs font-bold border border-[#E89838]/30 hover:border-[#E89838] shadow-2xs transition-all active:scale-95 z-20 flex-shrink-0"
                      title="Polish story with AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
                      <span>Polish Story</span>
                    </button>
                  )}
                </div>
                <p className="font-serif italic text-base sm:text-lg text-[#29202A] leading-relaxed relative z-10 pl-3">
                  {currentStory}
                </p>
              </div>
            )}

            {/* Tagged People */}
            {peopleList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#F1E4D6]/70">
                <h4 className="text-xs font-bold text-[#29202A] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#D6B36A]" />
                  <span>Cherished Family & Guests</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {peopleList.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8DFD5] text-xs font-medium text-[#29202A] shadow-xs"
                    >
                      <Tag className="w-3 h-3 text-[#D6B36A]" />
                      <span>{tag.guest_name || tag.custom_name}</span>
                      {tag.relationship_tag && (
                        <span className="text-[10px] text-[#8C7A8E] italic">
                          ({tag.relationship_tag})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Media Gallery / Previews */}
            <div className="space-y-3 pt-2 border-t border-[#F1E4D6]/70">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#29202A] uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#D6B36A]" />
                  <span>Archived Photographs & Documents</span>
                </h4>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#8C7A8E]">
                    {localMediaList.length} of 6 photos
                  </span>

                  {canMutate && localMediaList.length < 6 && (
                    <button
                      type="button"
                      onClick={() => setShowUploadZone((prev) => !prev)}
                      className="px-2.5 py-1 rounded-xl bg-[#641F35]/10 hover:bg-[#641F35] text-[#641F35] hover:text-[#FFF7ED] text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#E89838]" />
                      <span>{showUploadZone ? 'Close' : 'Add Photos'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Zone when toggled */}
              {showUploadZone && canMutate && (
                <div className="p-4 rounded-2xl bg-[#FFF8EE]/60 border border-[#D6B36A]/40 mb-3 animate-fade-in">
                  <MemoryPhotoUploader
                    weddingId={memory.wedding_id}
                    memoryId={memory.id}
                    existingCount={localMediaList.length}
                    onUploadSuccess={handleUploadSuccess}
                  />
                </div>
              )}

              {localMediaList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {localMediaList.map((media, idx) => {
                    const thumbUrl =
                      urlsMap[media.id]?.thumb ||
                      urlsMap[media.id]?.full ||
                      media.thumbnail_path ||
                      media.storage_path;
                    const isDirect =
                      thumbUrl &&
                      (thumbUrl.startsWith('http') ||
                        thumbUrl.startsWith('blob:') ||
                        thumbUrl.startsWith('data:'));

                    return (
                      <div
                        key={media.id}
                        className="group relative h-28 sm:h-36 rounded-2xl overflow-hidden border border-[#E8DFD5] hover:border-[#641F35] bg-[#2B1B2D] text-left transition-all shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenLightbox(idx)}
                          className="w-full h-full text-left focus:outline-none focus:ring-2 focus:ring-[#641F35]"
                        >
                          {isDirect ? (
                            <img
                              src={thumbUrl}
                              alt={memory.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-[#2D1B28] to-[#1E1424]">
                              {media.media_type === 'image' ? (
                                <ImageIcon className="w-6 h-6 text-[#E89838] mb-1.5 group-hover:scale-110 transition-transform" />
                              ) : (
                                <FileText className="w-6 h-6 text-[#D6B36A] mb-1.5 group-hover:scale-110 transition-transform" />
                              )}
                              <span className="text-[10px] text-[#FFF8F0] font-mono truncate w-full px-1">
                                {media.storage_path.split('/').pop()}
                              </span>
                              <span className="text-[9px] text-[#E89838] uppercase tracking-wider font-semibold mt-1">
                                {media.media_type}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="px-2 py-1 rounded-md bg-black/60 text-[#FFF8F0] text-[10px] font-semibold">
                              View
                            </span>
                          </div>
                        </button>

                        {/* Delete Single Photo Button */}
                        {canMutate && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMediaToDelete(media);
                            }}
                            title="Remove photo"
                            aria-label="Remove photo"
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-700 text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-dashed border-[#F1E4D6] text-center">
                  <p className="text-xs text-[#8C7A8E] font-serif italic">
                    "No photos or documents attached yet. Future snapshots and scans will be framed here."
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-[#F1E4D6] bg-[#FFF8F0] flex items-center justify-between">
            <div>
              {canMutate && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 rounded-xl text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete Memory</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {canMutate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(memory);
                  }}
                  className="px-4 py-2 rounded-2xl bg-white border border-[#E8DFD5] hover:border-[#641F35] text-xs font-bold text-[#641F35] flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#D6B36A]" />
                  <span>Edit</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-2xl bg-[#641F35] hover:bg-[#852C47] text-[#FFF7ED] text-xs font-bold transition-all shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirmed}
        title="Delete this wedding memory?"
        message={`Are you sure you want to permanently delete "${memory.title}"? Any attached media references will also be removed from the archive.`}
        confirmText="Delete Memory"
        isDestructive={true}
      />

      {/* Delete Single Photo Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(mediaToDelete)}
        onClose={() => setMediaToDelete(null)}
        onConfirm={handleConfirmDeleteMedia}
        title="Delete this photograph?"
        message="Are you sure you want to permanently remove this photo from your wedding archive? The storage files will also be erased."
        confirmText="Delete Photo"
        isDestructive={true}
      />

      {/* Lightbox Component */}
      <MemoryLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        media={localMediaList}
        initialIndex={lightboxIndex}
        memoryTitle={memory.title}
      />

      {/* Story Polisher Comparison & Review Modal (Phase 9.7) */}
      <StoryPolisherModal
        isOpen={showStoryPolisher}
        onClose={() => setShowStoryPolisher(false)}
        originalStory={currentStory}
        onApplyPolished={handleApplyPolishedStory}
        memoryTitle={memory.title}
        milestone={memory.milestone_phase}
        ceremonyName={memory.event?.event_name}
        weddingId={wedding?.id}
      />
    </>,
    document.body
  );
};
