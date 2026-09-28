// ==============================================================================
// WEDWISE: Phase 9.1 Memories & Moments Types
// ==============================================================================

export type MemoryVisibility = 'PUBLIC_FAMILY' | 'CORE_FAMILY_ONLY';

export type MemoryMilestonePhase =
  | 'Pre-Wedding'
  | 'Ceremony'
  | 'Wedding Day'
  | 'Reception'
  | 'Post-Wedding';

export type MemoryMediaType = 'image' | 'document';

export interface WeddingMemory {
  id: string;
  wedding_id: string;
  event_id?: string | null;
  title: string;
  story_caption?: string | null;
  memory_date: string;
  milestone_phase: MemoryMilestonePhase;
  location?: string | null;
  visibility: MemoryVisibility;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Enriched relations (optional when joined)
  media?: MemoryMedia[];
  people_tags?: MemoryPeopleTag[];
  event?: {
    id: string;
    event_name: string;
    event_type: string;
    date: string;
  } | null;
  author_name?: string | null;
}

export interface MemoryMedia {
  id: string;
  memory_id: string;
  wedding_id: string;
  storage_path: string;
  thumbnail_path?: string | null;
  media_type: MemoryMediaType;
  mime_type: string;
  width?: number | null;
  height?: number | null;
  file_size: number;
  sort_order: number;
  created_at: string;
}

export interface MemoryPeopleTag {
  id: string;
  memory_id: string;
  wedding_id: string;
  guest_id?: string | null;
  custom_name?: string | null;
  relationship_tag?: string | null;
  created_at: string;
  guest_name?: string | null;
}

export interface CreateMemoryFormData {
  title: string;
  story_caption?: string;
  memory_date: string;
  milestone_phase: MemoryMilestonePhase;
  event_id?: string | null;
  location?: string | null;
  visibility: MemoryVisibility;
  people_tags?: Array<{
    guest_id?: string | null;
    custom_name?: string | null;
    relationship_tag?: string | null;
  }>;
}

export interface MediaUploadPayload {
  file: File;
  media_type: MemoryMediaType;
  sort_order?: number;
}
