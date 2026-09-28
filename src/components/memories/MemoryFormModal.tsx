import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import {
  WeddingMemory,
  CreateMemoryFormData,
  MemoryMilestonePhase,
  MemoryVisibility,
  MemoryMedia,
} from '../../types/memories';
import {
  X,
  Calendar,
  Sparkles,
  MapPin,
  Lock,
  Globe,
  Tag,
  UserPlus,
  Users,
  Image as ImageIcon,
  AlertCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { MemoryPhotoUploader, PendingPhotoItem } from './MemoryPhotoUploader';
import { useSignedMediaUrl } from '../../hooks/useSignedMediaUrl';
import { StoryPolisherModal } from './StoryPolisherModal';

interface MemoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  memoryToEdit?: WeddingMemory | null;
  initialEventId?: string | null;
}

const MILESTONE_PHASES: { value: MemoryMilestonePhase; label: string; desc: string }[] = [
  { value: 'Pre-Wedding', label: 'Pre-Wedding', desc: 'Engagements, roka, card invites, preparations' },
  { value: 'Ceremony', label: 'Ceremony', desc: 'Haldi, Mehendi, Sangeet, Pooja, rituals' },
  { value: 'Wedding Day', label: 'Wedding Day', desc: 'Baraat, Varmala, Pheras, Bidaai' },
  { value: 'Reception', label: 'Reception', desc: 'Dinner banquet, toasts, cake, dancing' },
  { value: 'Post-Wedding', label: 'Post-Wedding', desc: 'Grihapravesh, honeymoon, thank-yous' },
];

const ExistingMediaThumbnail: React.FC<{
  media: MemoryMedia;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}> = ({ media, onDelete, isDeleting }) => {
  const { url } = useSignedMediaUrl(media.thumbnail_path || media.storage_path);
  return (
    <div className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-[#E8DFD5] bg-[#FAF4ED] flex-shrink-0 shadow-xs">
      {url ? (
        <img
          src={url}
          alt="Memory photograph"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#8C7A8E]">
          <ImageIcon className="w-5 h-5 opacity-40" />
        </div>
      )}
      <button
        type="button"
        onClick={() => onDelete(media.id)}
        disabled={isDeleting}
        aria-label="Remove photo"
        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-700 transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50"
        title="Remove photo"
      >
        {isDeleting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Trash2 className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};

export const MemoryFormModal: React.FC<MemoryFormModalProps> = ({
  isOpen,
  onClose,
  memoryToEdit,
  initialEventId,
}) => {
  const {
    wedding,
    events,
    guests,
    addMemory,
    updateMemory,
    uploadMemoryMedia,
    deleteMemoryMedia,
  } = useWedding();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [storyCaption, setStoryCaption] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  const [eventId, setEventId] = useState<string | null>(null);
  const [milestonePhase, setMilestonePhase] = useState<MemoryMilestonePhase>('Ceremony');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<MemoryVisibility>('PUBLIC_FAMILY');
  const [peopleTags, setPeopleTags] = useState<
    Array<{
      guest_id?: string | null;
      custom_name?: string | null;
      relationship_tag?: string | null;
    }>
  >([]);

  // Local helper states for adding people tags
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [customPersonName, setCustomPersonName] = useState('');
  const [personRelationship, setPersonRelationship] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Phase 9.5 media states
  const [existingMedia, setExistingMedia] = useState<MemoryMedia[]>([]);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhotoItem[]>([]);
  const [showStoryPolisher, setShowStoryPolisher] = useState(false);

  // Pre-fill fields on open or edit
  useEffect(() => {
    if (!isOpen) return;

    if (memoryToEdit) {
      setTitle(memoryToEdit.title);
      setStoryCaption(memoryToEdit.story_caption || '');
      setMemoryDate(memoryToEdit.memory_date);
      setEventId(memoryToEdit.event_id || null);
      setMilestonePhase(memoryToEdit.milestone_phase);
      setLocation(memoryToEdit.location || '');
      setVisibility(memoryToEdit.visibility);
      setPeopleTags(
        (memoryToEdit.people_tags || []).map((t) => ({
          guest_id: t.guest_id || null,
          custom_name: t.custom_name || null,
          relationship_tag: t.relationship_tag || null,
        }))
      );
      setExistingMedia(memoryToEdit.media || []);
      setPendingPhotos([]);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const matchedEvent = events.find((e) => e.id === initialEventId);
      setTitle('');
      setStoryCaption('');
      setMemoryDate(matchedEvent?.date || wedding?.wedding_date || today);
      setEventId(initialEventId || null);
      setMilestonePhase(matchedEvent?.event_type === 'Reception' ? 'Reception' : 'Ceremony');
      setLocation(matchedEvent?.venue || '');
      setVisibility('PUBLIC_FAMILY');
      setPeopleTags([]);
      setExistingMedia([]);
      setPendingPhotos([]);
    }
    setFormError(null);
    setSubmitStatus('');
  }, [isOpen, memoryToEdit, initialEventId, events, wedding]);

  // Handle event selection change
  const handleEventChange = (selectedId: string) => {
    if (!selectedId) {
      setEventId(null);
      return;
    }
    setEventId(selectedId);
    const chosenEvent = events.find((e) => e.id === selectedId);
    if (chosenEvent) {
      if (chosenEvent.date) setMemoryDate(chosenEvent.date);
      if (chosenEvent.venue && !location) setLocation(chosenEvent.venue);
      if (chosenEvent.event_type === 'Reception') {
        setMilestonePhase('Reception');
      } else if (chosenEvent.event_type.toLowerCase().includes('wedding')) {
        setMilestonePhase('Wedding Day');
      } else {
        setMilestonePhase('Ceremony');
      }
    }
  };

  // Add guest tag
  const handleAddGuestTag = () => {
    if (!selectedGuestId) return;
    if (peopleTags.some((t) => t.guest_id === selectedGuestId)) {
      showToast('Guest already tagged in this memory.', 'info');
      setSelectedGuestId('');
      return;
    }
    setPeopleTags((prev) => [
      ...prev,
      {
        guest_id: selectedGuestId,
        custom_name: null,
        relationship_tag: personRelationship.trim() || null,
      },
    ]);
    setSelectedGuestId('');
    setPersonRelationship('');
  };

  // Add custom person tag
  const handleAddCustomPersonTag = () => {
    const trimmed = customPersonName.trim();
    if (!trimmed) return;
    if (
      peopleTags.some(
        (t) => t.custom_name?.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      showToast('Person already added.', 'info');
      setCustomPersonName('');
      return;
    }
    setPeopleTags((prev) => [
      ...prev,
      {
        guest_id: null,
        custom_name: trimmed,
        relationship_tag: personRelationship.trim() || null,
      },
    ]);
    setCustomPersonName('');
    setPersonRelationship('');
  };

  const handleRemoveTag = (index: number) => {
    setPeopleTags((prev) => prev.filter((_, i) => i !== index));
  };

  // Resolve display name for a tag
  const getTagDisplayName = (tag: {
    guest_id?: string | null;
    custom_name?: string | null;
  }) => {
    if (tag.custom_name) return tag.custom_name;
    if (tag.guest_id) {
      const g = guests.find((item) => item.id === tag.guest_id);
      return g ? g.full_name : 'Guest';
    }
    return 'Family';
  };

  const handleDeleteExistingMedia = async (mediaId: string) => {
    if (!window.confirm('Are you sure you want to remove this photograph from the memory?')) return;
    setDeletingMediaId(mediaId);
    try {
      await deleteMemoryMedia(mediaId);
      setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
      showToast('Photo removed from memory.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove photo.', 'error');
    } finally {
      setDeletingMediaId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a memory title.');
      return;
    }
    if (!memoryDate) {
      setFormError('Please select a memory date.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: CreateMemoryFormData = {
      title: title.trim(),
      story_caption: storyCaption.trim() || undefined,
      memory_date: memoryDate,
      milestone_phase: milestonePhase,
      event_id: eventId || null,
      location: location.trim() || null,
      visibility,
      people_tags: peopleTags,
    };

    try {
      if (memoryToEdit) {
        await updateMemory(memoryToEdit.id, payload);
        showToast('Memory updated beautifully! ✨', 'success');
      } else {
        setSubmitStatus('Preserving memory record...');
        const newMem = await addMemory(payload);

        // Upload queued photos if any
        if (pendingPhotos.length > 0) {
          let uploadedCount = 0;
          let failedCount = 0;
          for (let i = 0; i < pendingPhotos.length; i++) {
            const photo = pendingPhotos[i];
            setSubmitStatus(`Archiving photograph ${i + 1} of ${pendingPhotos.length}...`);
            try {
              await uploadMemoryMedia(newMem.id, photo.file);
              uploadedCount++;
            } catch (err) {
              console.error(`Failed to upload photo ${photo.file.name}:`, err);
              failedCount++;
            }
          }
          if (failedCount > 0) {
            showToast(
              `Memory preserved, but ${failedCount} photo(s) could not be uploaded.`,
              'error'
            );
          } else {
            showToast(
              `Memory preserved with ${uploadedCount} photograph${uploadedCount === 1 ? '' : 's'}! 💍`,
              'success'
            );
          }
        } else {
          showToast('Memory preserved in your wedding story! 💍', 'success');
        }
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save memory:', err);
      setFormError(err.message || 'Failed to save memory. Please check permissions.');
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        role="dialog"
      aria-modal="true"
      aria-labelledby="memory-form-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FFFDF9] border border-[#F1E4D6] rounded-3xl shadow-modal overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-[#F1E4D6] flex items-center justify-between bg-gradient-to-r from-[#FFF8F0] to-[#FFFDF9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#641F35]/10 text-[#641F35] flex items-center justify-center border border-[#641F35]/20">
              <Sparkles className="w-5 h-5 text-[#E89838]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-[#E86A5B]">
                {memoryToEdit ? 'Edit Archived Memory' : 'Preserve A Moment'}
              </span>
              <h2
                id="memory-form-modal-title"
                className="text-xl sm:text-2xl font-serif font-bold text-[#29202A]"
              >
                {memoryToEdit ? 'Update Memory Details' : 'New Wedding Memory'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="p-2 rounded-full hover:bg-[#F1E4D6]/50 text-[#8C7A8E] hover:text-[#29202A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Title */}
          <div>
            <label className="block text-xs font-bold text-[#29202A] uppercase tracking-wider mb-1.5">
              Memory Title <span className="text-[#E86A5B]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ring Exchange Under the Starlit Mandap"
              className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E8DFD5] focus:border-[#641F35] focus:ring-2 focus:ring-[#641F35]/10 text-sm text-[#29202A] placeholder-[#B5A8B8] transition-all font-medium"
            />
          </div>

          {/* 2. Story / Caption */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#29202A] uppercase tracking-wider">
                The Story / Personal Note
              </label>
              {storyCaption.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowStoryPolisher(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#E89838]/15 hover:bg-[#E89838]/25 text-[#852C47] text-xs font-bold transition-all active:scale-95"
                  title="Polish this story with AI"
                >
                  <Sparkles className="w-3 h-3 text-[#E89838]" />
                  <span>Polish Story</span>
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={storyCaption}
              onChange={(e) => setStoryCaption(e.target.value)}
              placeholder="Share the laughter, the blessing, or the little detail that made this moment unforgettable..."
              className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E8DFD5] focus:border-[#641F35] focus:ring-2 focus:ring-[#641F35]/10 text-sm text-[#29202A] placeholder-[#B5A8B8] transition-all font-serif italic"
            />
          </div>

          {/* 3. Date & Ceremony Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#29202A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D6B36A]" />
                <span>Memory Date</span> <span className="text-[#E86A5B]">*</span>
              </label>
              <input
                type="date"
                required
                value={memoryDate}
                onChange={(e) => setMemoryDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFD5] focus:border-[#641F35] text-sm text-[#29202A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#29202A] uppercase tracking-wider mb-1.5">
                Linked Ceremony / Event
              </label>
              <select
                value={eventId || ''}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFD5] focus:border-[#641F35] text-sm text-[#29202A]"
              >
                <option value="">-- No specific ceremony (General) --</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.event_name} ({evt.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Milestone Phase & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#29202A] uppercase tracking-wider mb-1.5">
                Milestone Phase
              </label>
              <select
                value={milestonePhase}
                onChange={(e) => setMilestonePhase(e.target.value as MemoryMilestonePhase)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFD5] focus:border-[#641F35] text-sm text-[#29202A]"
              >
                {MILESTONE_PHASES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#29202A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D6B36A]" />
                <span>Venue / Location</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Royal Courtyard, Fairmont"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#E8DFD5] focus:border-[#641F35] text-sm text-[#29202A]"
              />
            </div>
          </div>

          {/* 5. Visibility Selection */}
          <div className="space-y-2 pt-2 border-t border-[#F1E4D6]/80">
            <label className="block text-xs font-bold text-[#29202A] uppercase tracking-wider">
              Family Visibility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                  visibility === 'PUBLIC_FAMILY'
                    ? 'border-[#641F35] bg-[#FAF1F3] text-[#641F35] shadow-xs'
                    : 'border-[#E8DFD5] bg-white hover:border-[#B5A8B8]'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="PUBLIC_FAMILY"
                  checked={visibility === 'PUBLIC_FAMILY'}
                  onChange={() => setVisibility('PUBLIC_FAMILY')}
                  className="mt-1 text-[#641F35] focus:ring-[#641F35]"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Globe className="w-3.5 h-3.5 text-[#2D5A43]" />
                    <span>Public Family</span>
                  </div>
                  <p className="text-[11px] text-[#615163] mt-0.5 leading-snug">
                    Visible to all members invited to this wedding workspace.
                  </p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-3 transition-all ${
                  visibility === 'CORE_FAMILY_ONLY'
                    ? 'border-[#641F35] bg-[#FAF1F3] text-[#641F35] shadow-xs'
                    : 'border-[#E8DFD5] bg-white hover:border-[#B5A8B8]'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="CORE_FAMILY_ONLY"
                  checked={visibility === 'CORE_FAMILY_ONLY'}
                  onChange={() => setVisibility('CORE_FAMILY_ONLY')}
                  className="mt-1 text-[#641F35] focus:ring-[#641F35]"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5 text-[#E86A5B]" />
                    <span>Core Family Only</span>
                  </div>
                  <p className="text-[11px] text-[#615163] mt-0.5 leading-snug">
                    Strictly restricted to Wedding Owners & Family Admins.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 6. People Tags */}
          <div className="space-y-3 pt-2 border-t border-[#F1E4D6]/80">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#29202A] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#D6B36A]" />
                <span>Tagged Family & Guests</span>
              </label>
              <span className="text-[11px] text-[#8C7A8E]">
                {peopleTags.length} tagged
              </span>
            </div>

            {/* Existing Tagged Pills */}
            {peopleTags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-[#FFF7ED] border border-[#F1E4D6]">
                {peopleTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8DFD5] text-xs font-medium text-[#29202A] shadow-xs"
                  >
                    <Tag className="w-3 h-3 text-[#D6B36A]" />
                    <span>{getTagDisplayName(tag)}</span>
                    {tag.relationship_tag && (
                      <span className="text-[10px] text-[#8C7A8E] italic">
                        ({tag.relationship_tag})
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="ml-1 text-[#8C7A8E] hover:text-[#E86A5B] transition-colors"
                      title="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag Adders: Guest Picker & Custom Person */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Select Existing Guest */}
              <div className="p-3 bg-white border border-[#E8DFD5] rounded-2xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A8E] block">
                  Tag Wedding Guest
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedGuestId}
                    onChange={(e) => setSelectedGuestId(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8DFD5] text-xs text-[#29202A]"
                  >
                    <option value="">-- Choose guest --</option>
                    {guests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.full_name} ({g.family_group})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddGuestTag}
                    disabled={!selectedGuestId}
                    className="px-3 py-1.5 rounded-xl bg-[#641F35] text-[#FFF7ED] text-xs font-semibold disabled:opacity-40 hover:bg-[#852C47] transition-all"
                  >
                    Tag
                  </button>
                </div>
              </div>

              {/* Add Custom Person */}
              <div className="p-3 bg-white border border-[#E8DFD5] rounded-2xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A8E] block">
                  Or Custom Family / Person Name
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customPersonName}
                    onChange={(e) => setCustomPersonName(e.target.value)}
                    placeholder="e.g. Dadi, Pandit Ji"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8DFD5] text-xs text-[#29202A]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomPersonTag}
                    disabled={!customPersonName.trim()}
                    className="px-3 py-1.5 rounded-xl bg-[#641F35] text-[#FFF7ED] text-xs font-semibold disabled:opacity-40 hover:bg-[#852C47] transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Photographs & Scanned Artifacts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#615163] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#D6B36A]" />
                <span>Photographs & Scanned Artifacts (Max 6)</span>
              </label>
              <span className="text-xs text-[#8C7A8E]">
                {existingMedia.length + (memoryToEdit ? 0 : pendingPhotos.length)} of 6 photos
              </span>
            </div>

            {/* Existing media previews if editing */}
            {existingMedia.length > 0 && (
              <div className="p-3.5 bg-white border border-[#E8DFD5] rounded-2xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A8E] block">
                  Attached Photos ({existingMedia.length})
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {existingMedia.map((m) => (
                    <ExistingMediaThumbnail
                      key={m.id}
                      media={m}
                      onDelete={handleDeleteExistingMedia}
                      isDeleting={deletingMediaId === m.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Uploader component (if slots remain) */}
            {existingMedia.length < 6 ? (
              <MemoryPhotoUploader
                weddingId={wedding?.id || 'demo-wedding'}
                memoryId={memoryToEdit ? memoryToEdit.id : undefined}
                existingCount={existingMedia.length}
                onUploadSuccess={(newMedia) => {
                  setExistingMedia((prev) => [...prev, newMedia]);
                }}
                onQueueChange={(items) => {
                  setPendingPhotos(items);
                }}
                disabled={isSubmitting}
              />
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-[#D6B36A] bg-[#FFF8EE]/60 text-center">
                <p className="text-xs text-[#615163] font-serif italic">
                  Maximum 6 photos reached for this memory. Remove an existing photo to upload another.
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-[#F1E4D6] bg-[#FFF8F0] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-2xl border border-[#E8DFD5] text-xs font-bold text-[#615163] hover:bg-white hover:text-[#29202A] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-2xl bg-[#641F35] hover:bg-[#852C47] text-[#FFF7ED] text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{submitStatus || 'Saving...'}</span>
              </span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
                <span>{memoryToEdit ? 'Save Changes' : 'Preserve Memory'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>

    {/* Story Polisher Comparison & Review Modal (Phase 9.7) */}
    <StoryPolisherModal
      isOpen={showStoryPolisher}
      onClose={() => setShowStoryPolisher(false)}
      originalStory={storyCaption}
      onApplyPolished={(polished) => {
        setStoryCaption(polished);
        showToast('Polished story applied! ✨', 'info');
      }}
      memoryTitle={title}
      milestone={milestonePhase}
      ceremonyName={events.find((e) => e.id === eventId)?.event_name}
      weddingId={wedding?.id}
    />
  </>,
  document.body
);
};
