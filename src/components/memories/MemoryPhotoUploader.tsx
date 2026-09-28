import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWedding } from '../../context/WeddingContext';
import { memoryService, MAX_MEDIA_PER_MEMORY } from '../../services/memoryService';
import { MemoryMedia } from '../../types/memories';
import { validateImageFile } from '../../utils/imagePipeline';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  X,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

export interface PendingPhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'preparing' | 'uploading' | 'complete' | 'failed';
  statusText?: string;
  errorMessage?: string;
  uploadedMedia?: MemoryMedia;
}

interface MemoryPhotoUploaderProps {
  weddingId: string;
  memoryId?: string; // If provided, uploads directly to this memory
  existingCount?: number;
  onUploadSuccess?: (newMedia: MemoryMedia) => void;
  onQueueChange?: (items: PendingPhotoItem[]) => void;
  disabled?: boolean;
}

export const MemoryPhotoUploader: React.FC<MemoryPhotoUploaderProps> = ({
  weddingId,
  memoryId,
  existingCount = 0,
  onUploadSuccess,
  onQueueChange,
  disabled = false,
}) => {
  const { user, profile } = useAuth();
  const { userRole } = useWedding();

  const [queue, setQueue] = useState<PendingPhotoItem[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: 'info' | 'warning' | 'error';
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentTotal = existingCount + queue.filter((q) => q.status !== 'failed').length;
  const remainingSlots = Math.max(0, MAX_MEDIA_PER_MEMORY - currentTotal);

  // Sync queue state upward if needed
  useEffect(() => {
    if (onQueueChange) {
      onQueueChange(queue);
    }
  }, [queue, onQueueChange]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      queue.forEach((item) => {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {
          // ignore
        }
      });
    };
  }, []);

  // Upload a single queued item
  const uploadItem = useCallback(
    async (item: PendingPhotoItem, targetMemoryId: string) => {
      if (!user) return;

      const actorName = profile?.full_name || 'Family Member';
      const userContext = {
        userId: user.id,
        userRole,
        actorName,
      };

      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'preparing', statusText: 'Optimizing photo...' }
            : q
        )
      );

      try {
        const mediaRecord = await memoryService.uploadMemoryMedia(
          weddingId,
          targetMemoryId,
          item.file,
          userContext,
          {
            onProgress: (statusText) => {
              setQueue((prev) =>
                prev.map((q) =>
                  q.id === item.id ? { ...q, status: 'uploading', statusText } : q
                )
              );
            },
          }
        );

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'complete',
                  statusText: 'Archived',
                  uploadedMedia: mediaRecord,
                }
              : q
          )
        );

        if (onUploadSuccess) {
          onUploadSuccess(mediaRecord);
        }
      } catch (err: any) {
        console.error('Photo upload failed:', err);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'failed',
                  statusText: 'Upload failed',
                  errorMessage: err.message || 'Upload failed. Please try again.',
                }
              : q
          )
        );
      }
    },
    [user, profile, userRole, weddingId, onUploadSuccess]
  );

  // Handle newly selected files
  const handleFilesSelected = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      setFeedbackMessage(null);
      const incomingList = Array.from(files);

      if (remainingSlots <= 0) {
        setFeedbackMessage({
          text: `This memory already has ${MAX_MEDIA_PER_MEMORY} photos.`,
          type: 'warning',
        });
        return;
      }

      // Check slot limits
      let acceptedFiles = incomingList;
      if (incomingList.length > remainingSlots) {
        acceptedFiles = incomingList.slice(0, remainingSlots);
        setFeedbackMessage({
          text: `Only ${acceptedFiles.length} of ${incomingList.length} photos were accepted because a memory can hold up to ${MAX_MEDIA_PER_MEMORY} photos.`,
          type: 'info',
        });
      }

      const newItems: PendingPhotoItem[] = [];

      for (const file of acceptedFiles) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setFeedbackMessage({
            text: validation.error || `"${file.name}" could not be processed.`,
            type: 'error',
          });
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        const item: PendingPhotoItem = {
          id: 'queue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          file,
          previewUrl,
          status: 'idle',
        };
        newItems.push(item);
      }

      if (newItems.length > 0) {
        setQueue((prev) => [...prev, ...newItems]);

        // If a memoryId exists, start uploading immediately!
        if (memoryId) {
          newItems.forEach((item) => {
            uploadItem(item, memoryId);
          });
        }
      }

      // Reset file input value
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    },
    [disabled, remainingSlots, memoryId, uploadItem]
  );

  const handleRetry = (item: PendingPhotoItem) => {
    if (!memoryId) return;
    uploadItem(item, memoryId);
  };

  const handleRemove = (item: PendingPhotoItem) => {
    URL.revokeObjectURL(item.previewUrl);
    setQueue((prev) => prev.filter((q) => q.id !== item.id));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && remainingSlots > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && remainingSlots > 0 && e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled || remainingSlots <= 0}
        onChange={(e) => handleFilesSelected(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled || remainingSlots <= 0}
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {/* Upload Dropzone / Button Bar */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-5 sm:p-6 rounded-2xl border-2 border-dashed transition-all text-center select-none ${
          disabled || remainingSlots <= 0
            ? 'border-[#E8DFD5] bg-[#FAF4ED]/50 opacity-70 cursor-not-allowed'
            : isDragOver
            ? 'border-[#641F35] bg-[#FAF1F3] shadow-md'
            : 'border-[#D6B36A]/70 hover:border-[#641F35] bg-[#FFF8EE]/40 hover:bg-[#FFF8EE]/70'
        }`}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#E89838]/15 text-[#E89838] flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#E89838]" />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#641F35]/10 text-[#641F35] flex items-center justify-center">
              <Camera className="w-5 h-5 text-[#641F35]" />
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-[#1B1220]">
              {remainingSlots > 0
                ? 'Add Wedding Photographs'
                : `Memory Archive Full (${MAX_MEDIA_PER_MEMORY} Photos)`}
            </h4>
            <p className="text-xs text-[#615163] mt-1 font-serif italic">
              {remainingSlots > 0
                ? `JPEG, PNG, WebP or HEIC • ${remainingSlots} photo slot${
                    remainingSlots === 1 ? '' : 's'
                  } remaining`
                : 'Maximum 6 photos reached for this moment.'}
            </p>
          </div>

          {remainingSlots > 0 && !disabled && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-[#641F35] hover:bg-[#852C47] text-[#FFF7ED] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#E89838]" />
                <span>Choose Photos</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-4 py-2 rounded-xl border border-[#D6B36A] hover:bg-white text-[#1B1220] text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-[#641F35]" />
                <span>Take Photo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Informative Feedback Message */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start gap-2 border animate-fade-in ${
            feedbackMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : feedbackMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-[#FFF8EE] border-[#E89838]/40 text-[#29202A]'
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="leading-snug">{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="ml-auto p-0.5 hover:opacity-70 text-current"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Uploading Queue Display */}
      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8C7A8E] font-medium px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
              <span>
                {queue.filter((q) => q.status === 'complete').length} of {queue.length} photo
                {queue.length === 1 ? '' : 's'} preserved
              </span>
            </span>
            <span>Max 6 Photos</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {queue.map((item) => (
              <div
                key={item.id}
                className="relative rounded-2xl overflow-hidden border border-[#E8DFD5] bg-[#241B28] aspect-square flex flex-col justify-between p-2 shadow-xs group"
              >
                {/* Background Image Preview */}
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                {/* Top Status & Remove */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1 text-white">
                    {item.status === 'preparing' || item.status === 'uploading' ? (
                      <span className="inline-flex items-center gap-1 bg-amber-500/80 text-white px-1.5 py-0.5 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Uploading</span>
                      </span>
                    ) : item.status === 'complete' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-600/90 text-white px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    ) : item.status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 bg-rose-600/90 text-white px-1.5 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed</span>
                      </span>
                    ) : (
                      <span className="bg-black/50 text-[#FFF8F0] px-1.5 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </span>

                  {item.status !== 'uploading' && (
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      aria-label="Remove photo"
                      className="p-1 rounded-full bg-black/50 hover:bg-rose-700 text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Bottom Details & Retry */}
                <div className="relative z-10 space-y-1">
                  <p className="text-[10px] font-mono text-[#FFF8F0] truncate drop-shadow-xs">
                    {item.file.name}
                  </p>

                  {item.status === 'failed' && (
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-rose-300 font-medium">Failed</span>
                      <button
                        type="button"
                        onClick={() => handleRetry(item)}
                        className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white text-[#FFF8F0] hover:text-[#1B1220] text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}

                  {item.statusText && item.status !== 'failed' && item.status !== 'complete' && (
                    <p className="text-[9px] text-[#E89838] truncate font-medium">
                      {item.statusText}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
