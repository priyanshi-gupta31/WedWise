import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  WeddingMemory,
  MemoryMedia,
  MemoryPeopleTag,
  CreateMemoryFormData,
  MemoryVisibility,
  MemoryMilestonePhase,
  MemoryMediaType,
} from '../types/memories';
import { WeddingRole } from '../types/collaboration';
import { checkPermission } from '../utils/permissions';
import { localStore } from './localStore';
import { activityService } from './activityService';
import { processWeddingPhoto, validateImageFile } from '../utils/imagePipeline';

export const MAX_MEDIA_PER_MEMORY = 6;
export const MEMORY_STORAGE_BUCKET = 'wedding-memories';

export const VALID_MILESTONE_PHASES: MemoryMilestonePhase[] = [
  'Pre-Wedding',
  'Ceremony',
  'Wedding Day',
  'Reception',
  'Post-Wedding',
];

export const VALID_VISIBILITIES: MemoryVisibility[] = [
  'PUBLIC_FAMILY',
  'CORE_FAMILY_ONLY',
];

export const ALLOWED_MEDIA_TYPES: MemoryMediaType[] = ['image', 'document'];

export const ALLOWED_MIME_TYPES: string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
];

export interface GetMemoriesOptions {
  eventId?: string;
  visibility?: MemoryVisibility;
  taggedGuestId?: string;
  limit?: number;
  offset?: number;
  userRole?: WeddingRole;
  userId?: string;
}

export interface UserContext {
  userId: string;
  userRole: WeddingRole;
  actorName?: string;
}

function shouldUseSupabase(weddingId: string): boolean {
  return Boolean(
    isSupabaseConfigured &&
    supabase &&
    weddingId &&
    !weddingId.startsWith('local-')
  );
}

export const memoryService = {
  // -------------------------------------------------------------
  // READ OPERATIONS
  // -------------------------------------------------------------

  /**
   * Retrieves memories for the active wedding, respecting visibility & RBAC rules.
   */
  async getMemories(
    weddingId: string,
    options?: GetMemoriesOptions
  ): Promise<WeddingMemory[]> {
    if (!weddingId) return [];

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        let query = supabase
          .from('wedding_memories')
          .select(`
            *,
            media:memory_media(*),
            people_tags:memory_people_tags(*),
            event:wedding_events(id, event_name, event_type, date)
          `)
          .eq('wedding_id', weddingId)
          .order('memory_date', { ascending: false });

        if (options?.eventId) {
          query = query.eq('event_id', options.eventId);
        }
        if (options?.visibility) {
          query = query.eq('visibility', options.visibility);
        }
        if (options?.offset !== undefined && options?.limit !== undefined) {
          query = query.range(options.offset, options.offset + options.limit - 1);
        } else if (options?.limit !== undefined) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) throw error;

        let memories = (data || []) as WeddingMemory[];

        // Sort attached media by sort_order
        memories = memories.map((m) => ({
          ...m,
          media: (m.media || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
        }));

        // Role-based visibility check (defense-in-depth along with Supabase RLS)
        if (options?.userRole === 'VIEWER' || options?.userRole === 'CONTRIBUTOR') {
          memories = memories.filter(
            (m) =>
              m.visibility === 'PUBLIC_FAMILY' ||
              (options?.userId && m.created_by === options.userId)
          );
        }

        // Filter by tagged guest if requested
        if (options?.taggedGuestId) {
          memories = memories.filter((m) =>
            m.people_tags?.some((t) => t.guest_id === options.taggedGuestId)
          );
        }

        // Resolve guest_name for people tags
        const guestIds = new Set<string>();
        memories.forEach((m) => {
          m.people_tags?.forEach((t) => {
            if (t.guest_id) guestIds.add(t.guest_id);
          });
        });

        if (guestIds.size > 0) {
          const { data: guests } = await supabase
            .from('wedding_guests')
            .select('id, full_name')
            .in('id', Array.from(guestIds));

          if (guests) {
            const guestMap = new Map(guests.map((g) => [g.id, g.full_name]));
            memories.forEach((m) => {
              m.people_tags?.forEach((t) => {
                if (t.guest_id && guestMap.has(t.guest_id)) {
                  t.guest_name = guestMap.get(t.guest_id);
                } else if (!t.guest_name) {
                  t.guest_name = t.custom_name;
                }
              });
            });
          }
        }

        return memories;
      } catch (err) {
        console.warn('Supabase getMemories error, falling back to localStore:', err);
      }
    }

    // LocalStore / Demo mode fallback
    let localList = localStore.getMemories(weddingId);

    if (options?.eventId) {
      localList = localList.filter((m) => m.event_id === options.eventId);
    }
    if (options?.visibility) {
      localList = localList.filter((m) => m.visibility === options.visibility);
    }
    if (options?.taggedGuestId) {
      localList = localList.filter((m) =>
        m.people_tags?.some((t) => t.guest_id === options.taggedGuestId)
      );
    }

    // Enforce role-based visibility in local store
    if (options?.userRole === 'VIEWER' || options?.userRole === 'CONTRIBUTOR') {
      localList = localList.filter(
        (m) =>
          m.visibility === 'PUBLIC_FAMILY' ||
          (options?.userId && m.created_by === options.userId)
      );
    }

    // Pagination
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const start = options?.offset || 0;
      const end = options?.limit !== undefined ? start + options.limit : undefined;
      localList = localList.slice(start, end);
    }

    return localList;
  },

  /**
   * Fetches a single memory by ID, ensuring workspace scoping and visibility restrictions.
   */
  async getMemory(
    memoryId: string,
    weddingId: string,
    userContext?: { userRole?: WeddingRole; userId?: string }
  ): Promise<WeddingMemory | null> {
    if (!memoryId || !weddingId) return null;

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_memories')
          .select(`
            *,
            media:memory_media(*),
            people_tags:memory_people_tags(*),
            event:wedding_events(id, event_name, event_type, date)
          `)
          .eq('id', memoryId)
          .eq('wedding_id', weddingId)
          .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const memory = data as WeddingMemory;

        // Sort media
        if (memory.media) {
          memory.media.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }

        // Visibility check
        if (
          memory.visibility === 'CORE_FAMILY_ONLY' &&
          (userContext?.userRole === 'VIEWER' || userContext?.userRole === 'CONTRIBUTOR')
        ) {
          if (!userContext?.userId || memory.created_by !== userContext.userId) {
            return null;
          }
        }

        // Resolve people tags
        if (memory.people_tags && memory.people_tags.length > 0) {
          const guestIds = memory.people_tags
            .map((t) => t.guest_id)
            .filter(Boolean) as string[];
          if (guestIds.length > 0) {
            const { data: guests } = await supabase
              .from('wedding_guests')
              .select('id, full_name')
              .in('id', guestIds);
            if (guests) {
              const map = new Map(guests.map((g) => [g.id, g.full_name]));
              memory.people_tags.forEach((t) => {
                if (t.guest_id && map.has(t.guest_id)) {
                  t.guest_name = map.get(t.guest_id);
                } else if (!t.guest_name) {
                  t.guest_name = t.custom_name;
                }
              });
            }
          }
        }

        return memory;
      } catch (err) {
        console.warn('Supabase getMemory error, falling back to localStore:', err);
      }
    }

    const localMemory = localStore.getMemory(memoryId);
    if (!localMemory || localMemory.wedding_id !== weddingId) return null;

    if (
      localMemory.visibility === 'CORE_FAMILY_ONLY' &&
      (userContext?.userRole === 'VIEWER' || userContext?.userRole === 'CONTRIBUTOR')
    ) {
      if (!userContext?.userId || localMemory.created_by !== userContext.userId) {
        return null;
      }
    }

    return localMemory;
  },

  async getMemoriesByEvent(
    weddingId: string,
    eventId: string,
    userContext?: { userRole?: WeddingRole; userId?: string }
  ): Promise<WeddingMemory[]> {
    return this.getMemories(weddingId, { eventId, ...userContext });
  },

  async getMemoriesByVisibility(
    weddingId: string,
    visibility: MemoryVisibility,
    userContext?: { userRole?: WeddingRole; userId?: string }
  ): Promise<WeddingMemory[]> {
    return this.getMemories(weddingId, { visibility, ...userContext });
  },

  async getRecentMemories(
    weddingId: string,
    limit: number = 5,
    userContext?: { userRole?: WeddingRole; userId?: string }
  ): Promise<WeddingMemory[]> {
    return this.getMemories(weddingId, { limit, ...userContext });
  },

  async getMemoriesByTaggedPerson(
    weddingId: string,
    guestId: string,
    userContext?: { userRole?: WeddingRole; userId?: string }
  ): Promise<WeddingMemory[]> {
    return this.getMemories(weddingId, { taggedGuestId: guestId, ...userContext });
  },

  // -------------------------------------------------------------
  // CREATE OPERATIONS
  // -------------------------------------------------------------

  /**
   * Preserves a new wedding memory. Enforces permissions, validation, and cross-wedding isolation.
   */
  async createMemory(
    weddingId: string,
    data: CreateMemoryFormData,
    userContext: UserContext
  ): Promise<WeddingMemory> {
    if (!weddingId) {
      throw new Error('wedding_id is required.');
    }

    // Permission Check
    if (!checkPermission(userContext.userRole, 'CREATE_MEMORY')) {
      throw new Error('Unauthorized: You do not have permission to create memories.');
    }

    // Validation
    if (!data.title || !data.title.trim()) {
      throw new Error('Memory title is required.');
    }
    if (!data.memory_date) {
      throw new Error('Memory date is required.');
    }
    if (!data.milestone_phase || !VALID_MILESTONE_PHASES.includes(data.milestone_phase)) {
      throw new Error(`Invalid milestone phase. Must be one of: ${VALID_MILESTONE_PHASES.join(', ')}`);
    }
    if (!data.visibility || !VALID_VISIBILITIES.includes(data.visibility)) {
      throw new Error(`Invalid visibility level. Must be one of: ${VALID_VISIBILITIES.join(', ')}`);
    }

    // Cross-wedding Event validation
    if (data.event_id) {
      const eventBelongs = await this.verifyEventBelongsToWedding(data.event_id, weddingId);
      if (!eventBelongs) {
        throw new Error('Invalid event or event belongs to another wedding.');
      }
    }

    // Cross-wedding Guest validation
    if (data.people_tags && data.people_tags.length > 0) {
      for (const tag of data.people_tags) {
        if (tag.guest_id) {
          const guestBelongs = await this.verifyGuestBelongsToWedding(tag.guest_id, weddingId);
          if (!guestBelongs) {
            throw new Error('Invalid guest or guest belongs to another wedding.');
          }
        }
      }
    }

    let createdMemory: WeddingMemory | null = null;

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const payload = {
          wedding_id: weddingId,
          event_id: data.event_id || null,
          title: data.title.trim(),
          story_caption: data.story_caption ? data.story_caption.trim() : null,
          memory_date: data.memory_date,
          milestone_phase: data.milestone_phase,
          location: data.location ? data.location.trim() : null,
          visibility: data.visibility,
          created_by: userContext.userId || null,
        };

        const { data: inserted, error: insErr } = await supabase
          .from('wedding_memories')
          .insert(payload)
          .select()
          .single();

        if (insErr) throw insErr;

        // Insert people tags
        if (data.people_tags && data.people_tags.length > 0) {
          const validTags = data.people_tags
            .filter((t) => t.guest_id || (t.custom_name && t.custom_name.trim()))
            .map((t) => ({
              memory_id: inserted.id,
              wedding_id: weddingId,
              guest_id: t.guest_id || null,
              custom_name: t.custom_name ? t.custom_name.trim() : null,
              relationship_tag: t.relationship_tag ? t.relationship_tag.trim() : null,
            }));

          if (validTags.length > 0) {
            const { error: tagErr } = await supabase
              .from('memory_people_tags')
              .insert(validTags);
            if (tagErr) console.warn('Supabase memory_people_tags insert error:', tagErr);
          }
        }

        createdMemory = await this.getMemory(inserted.id, weddingId, userContext);
      } catch (err) {
        console.warn('Supabase createMemory error, attempting localStore fallback:', err);
      }
    }

    if (!createdMemory) {
      const localAdded = localStore.addMemory({
        wedding_id: weddingId,
        event_id: data.event_id || null,
        title: data.title.trim(),
        story_caption: data.story_caption ? data.story_caption.trim() : null,
        memory_date: data.memory_date,
        milestone_phase: data.milestone_phase,
        location: data.location ? data.location.trim() : null,
        visibility: data.visibility,
        created_by: userContext.userId || null,
      });

      if (data.people_tags && data.people_tags.length > 0) {
        for (const t of data.people_tags) {
          if (t.guest_id || (t.custom_name && t.custom_name.trim())) {
            localStore.addMemoryPeopleTag({
              memory_id: localAdded.id,
              wedding_id: weddingId,
              guest_id: t.guest_id || null,
              custom_name: t.custom_name ? t.custom_name.trim() : null,
              relationship_tag: t.relationship_tag ? t.relationship_tag.trim() : null,
            });
          }
        }
      }

      createdMemory = localStore.getMemory(localAdded.id);
    }

    if (!createdMemory) {
      throw new Error('Failed to create wedding memory.');
    }

    // Activity logging
    await activityService
      .logActivity({
        wedding_id: weddingId,
        actor_user_id: userContext.userId,
        actor_name: userContext.actorName || 'Family Member',
        actor_role: userContext.userRole,
        action: 'created',
        entity_type: 'memory',
        entity_id: createdMemory.id,
        entity_title: createdMemory.title,
        metadata: {
          details: `Preserved "${createdMemory.title}" (${createdMemory.milestone_phase})`,
        },
      })
      .catch((err) => console.warn('Supabase log memory creation activity error:', err));

    return createdMemory;
  },

  // -------------------------------------------------------------
  // UPDATE OPERATIONS
  // -------------------------------------------------------------

  /**
   * Updates an existing memory. Enforces author vs admin privileges and field immutability.
   */
  async updateMemory(
    memoryId: string,
    weddingId: string,
    updates: Partial<CreateMemoryFormData>,
    userContext: UserContext
  ): Promise<WeddingMemory | null> {
    if (!memoryId || !weddingId) return null;

    const existing = await this.getMemory(memoryId, weddingId, userContext);
    if (!existing || existing.wedding_id !== weddingId) {
      throw new Error('Memory not found or does not belong to this wedding.');
    }

    // Authorization check
    const isManager = checkPermission(userContext.userRole, 'MANAGE_MEMORIES');
    const isAuthor = existing.created_by === userContext.userId;

    if (!isManager && !(userContext.userRole === 'CONTRIBUTOR' && isAuthor)) {
      if (userContext.userRole === 'VIEWER') {
        throw new Error('Unauthorized: Viewers cannot edit memories.');
      }
      throw new Error('Unauthorized: Contributors can only edit their own memories.');
    }

    // Validation
    if (updates.title !== undefined && !updates.title.trim()) {
      throw new Error('Memory title cannot be empty.');
    }
    if (updates.milestone_phase !== undefined && !VALID_MILESTONE_PHASES.includes(updates.milestone_phase)) {
      throw new Error(`Invalid milestone phase. Must be one of: ${VALID_MILESTONE_PHASES.join(', ')}`);
    }
    if (updates.visibility !== undefined && !VALID_VISIBILITIES.includes(updates.visibility)) {
      throw new Error(`Invalid visibility level. Must be one of: ${VALID_VISIBILITIES.join(', ')}`);
    }

    // Cross-wedding verification
    if (updates.event_id) {
      const eventBelongs = await this.verifyEventBelongsToWedding(updates.event_id, weddingId);
      if (!eventBelongs) {
        throw new Error('Invalid event or event belongs to another wedding.');
      }
    }
    if (updates.people_tags && updates.people_tags.length > 0) {
      for (const tag of updates.people_tags) {
        if (tag.guest_id) {
          const guestBelongs = await this.verifyGuestBelongsToWedding(tag.guest_id, weddingId);
          if (!guestBelongs) {
            throw new Error('Invalid guest or guest belongs to another wedding.');
          }
        }
      }
    }

    let updatedMemory: WeddingMemory | null = null;

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const dbUpdates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
        if (updates.story_caption !== undefined) {
          dbUpdates.story_caption = updates.story_caption ? updates.story_caption.trim() : null;
        }
        if (updates.memory_date !== undefined) dbUpdates.memory_date = updates.memory_date;
        if (updates.milestone_phase !== undefined) dbUpdates.milestone_phase = updates.milestone_phase;
        if (updates.location !== undefined) {
          dbUpdates.location = updates.location ? updates.location.trim() : null;
        }
        if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
        if (updates.event_id !== undefined) dbUpdates.event_id = updates.event_id || null;

        const { error: updErr } = await supabase
          .from('wedding_memories')
          .update(dbUpdates)
          .eq('id', memoryId)
          .eq('wedding_id', weddingId);

        if (updErr) throw updErr;

        // Synchronize people tags if explicitly passed
        if (updates.people_tags !== undefined) {
          await supabase.from('memory_people_tags').delete().eq('memory_id', memoryId);

          const validTags = updates.people_tags
            .filter((t) => t.guest_id || (t.custom_name && t.custom_name.trim()))
            .map((t) => ({
              memory_id: memoryId,
              wedding_id: weddingId,
              guest_id: t.guest_id || null,
              custom_name: t.custom_name ? t.custom_name.trim() : null,
              relationship_tag: t.relationship_tag ? t.relationship_tag.trim() : null,
            }));

          if (validTags.length > 0) {
            await supabase.from('memory_people_tags').insert(validTags);
          }
        }

        updatedMemory = await this.getMemory(memoryId, weddingId, userContext);
      } catch (err) {
        console.warn('Supabase updateMemory error, falling back to localStore:', err);
      }
    }

    if (!updatedMemory) {
      const localUpdates: Partial<WeddingMemory> = {};
      if (updates.title !== undefined) localUpdates.title = updates.title.trim();
      if (updates.story_caption !== undefined) {
        localUpdates.story_caption = updates.story_caption ? updates.story_caption.trim() : null;
      }
      if (updates.memory_date !== undefined) localUpdates.memory_date = updates.memory_date;
      if (updates.milestone_phase !== undefined) localUpdates.milestone_phase = updates.milestone_phase;
      if (updates.location !== undefined) {
        localUpdates.location = updates.location ? updates.location.trim() : null;
      }
      if (updates.visibility !== undefined) localUpdates.visibility = updates.visibility;
      if (updates.event_id !== undefined) localUpdates.event_id = updates.event_id || null;

      localStore.updateMemory(memoryId, localUpdates);

      if (updates.people_tags !== undefined) {
        const existingTags = localStore.getMemoryPeopleTags(memoryId, weddingId);
        for (const t of existingTags) {
          localStore.deleteMemoryPeopleTag(t.id);
        }
        for (const t of updates.people_tags) {
          if (t.guest_id || (t.custom_name && t.custom_name.trim())) {
            localStore.addMemoryPeopleTag({
              memory_id: memoryId,
              wedding_id: weddingId,
              guest_id: t.guest_id || null,
              custom_name: t.custom_name ? t.custom_name.trim() : null,
              relationship_tag: t.relationship_tag ? t.relationship_tag.trim() : null,
            });
          }
        }
      }

      updatedMemory = localStore.getMemory(memoryId);
    }

    if (updatedMemory) {
      const visibilityChanged = updates.visibility && updates.visibility !== existing.visibility;
      await activityService
        .logActivity({
          wedding_id: weddingId,
          actor_user_id: userContext.userId,
          actor_name: userContext.actorName || 'Family Member',
          actor_role: userContext.userRole,
          action: 'updated',
          entity_type: 'memory',
          entity_id: memoryId,
          entity_title: updatedMemory.title,
          metadata: {
            details: visibilityChanged
              ? `Updated visibility to ${updatedMemory.visibility}`
              : `Updated memory details`,
          },
        })
        .catch(console.warn);
    }

    return updatedMemory;
  },

  // -------------------------------------------------------------
  // DELETE OPERATIONS
  // -------------------------------------------------------------

  /**
   * Deletes a memory safely, ensuring metadata cascades and permissions are respected.
   */
  async deleteMemory(
    memoryId: string,
    weddingId: string,
    userContext: UserContext
  ): Promise<boolean> {
    if (!memoryId || !weddingId) return false;

    const existing = await this.getMemory(memoryId, weddingId, userContext);
    if (!existing || existing.wedding_id !== weddingId) {
      throw new Error('Memory not found.');
    }

    // Authorization check
    const isManager = checkPermission(userContext.userRole, 'MANAGE_MEMORIES');
    const isAuthor = existing.created_by === userContext.userId;

    if (!isManager && !(userContext.userRole === 'CONTRIBUTOR' && isAuthor)) {
      if (userContext.userRole === 'VIEWER') {
        throw new Error('Unauthorized: Viewers cannot delete memories.');
      }
      throw new Error('Unauthorized: Contributors can only delete their own memories.');
    }

    let deleted = false;

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const { error } = await supabase
          .from('wedding_memories')
          .delete()
          .eq('id', memoryId)
          .eq('wedding_id', weddingId);

        if (error) throw error;
        deleted = true;
      } catch (err) {
        console.warn('Supabase deleteMemory error, using local fallback:', err);
      }
    }

    if (!deleted) {
      deleted = localStore.deleteMemory(memoryId);
    }

    if (deleted) {
      await activityService
        .logActivity({
          wedding_id: weddingId,
          actor_user_id: userContext.userId,
          actor_name: userContext.actorName || 'Family Member',
          actor_role: userContext.userRole,
          action: 'deleted',
          entity_type: 'memory',
          entity_id: memoryId,
          entity_title: existing.title,
          metadata: {
            details: `Removed memory "${existing.title}"`,
          },
        })
        .catch(console.warn);
    }

    return deleted;
  },

  // -------------------------------------------------------------
  // CROSS-WEDDING INTEGRITY HELPERS
  // -------------------------------------------------------------

  async verifyEventBelongsToWedding(eventId: string, weddingId: string): Promise<boolean> {
    if (!eventId || !weddingId) return false;

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_events')
          .select('id, wedding_id')
          .eq('id', eventId)
          .maybeSingle();

        if (!error && data) {
          return data.wedding_id === weddingId;
        }
      } catch (err) {
        console.warn('Supabase event verification error, falling back to local:', err);
      }
    }

    const events = localStore.getEvents(weddingId);
    return events.some((e) => e.id === eventId);
  },

  async verifyGuestBelongsToWedding(guestId: string, weddingId: string): Promise<boolean> {
    if (!guestId || !weddingId) return false;

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_guests')
          .select('id, wedding_id')
          .eq('id', guestId)
          .maybeSingle();

        if (!error && data) {
          return data.wedding_id === weddingId;
        }
      } catch (err) {
        console.warn('Supabase guest verification error, falling back to local:', err);
      }
    }

    const guests = localStore.getGuests(weddingId);
    return guests.some((g) => g.id === guestId);
  },

  // -------------------------------------------------------------
  // PEOPLE TAGS OPERATIONS
  // -------------------------------------------------------------

  async addPeopleTag(
    memoryId: string,
    weddingId: string,
    tagData: {
      guest_id?: string | null;
      custom_name?: string | null;
      relationship_tag?: string | null;
    },
    userContext: {
      userId: string;
      userRole: WeddingRole;
    }
  ): Promise<MemoryPeopleTag> {
    const memory = await this.getMemory(memoryId, weddingId, userContext);
    if (!memory || memory.wedding_id !== weddingId) {
      throw new Error('Memory not found or does not belong to this wedding.');
    }

    const isManager = checkPermission(userContext.userRole, 'MANAGE_MEMORIES');
    const isAuthor = memory.created_by === userContext.userId;
    if (!isManager && !(userContext.userRole === 'CONTRIBUTOR' && isAuthor)) {
      throw new Error('Unauthorized: Only memory author or wedding admin can tag people.');
    }

    const trimmedCustom = tagData.custom_name ? tagData.custom_name.trim() : null;
    if (!tagData.guest_id && !trimmedCustom) {
      throw new Error('A tag must have either a guest_id or a custom_name.');
    }

    if (tagData.guest_id) {
      const guestBelongs = await this.verifyGuestBelongsToWedding(tagData.guest_id, weddingId);
      if (!guestBelongs) {
        throw new Error('Invalid guest or guest belongs to another wedding.');
      }
    }

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const { data, error } = await supabase
          .from('memory_people_tags')
          .insert({
            memory_id: memoryId,
            wedding_id: weddingId,
            guest_id: tagData.guest_id || null,
            custom_name: trimmedCustom,
            relationship_tag: tagData.relationship_tag ? tagData.relationship_tag.trim() : null,
          })
          .select()
          .single();

        if (error) throw error;

        let guestName = trimmedCustom;
        if (tagData.guest_id) {
          const { data: g } = await supabase
            .from('wedding_guests')
            .select('full_name')
            .eq('id', tagData.guest_id)
            .maybeSingle();
          if (g) guestName = g.full_name;
        }

        return {
          ...data,
          guest_name: guestName,
        } as MemoryPeopleTag;
      } catch (err) {
        console.warn('Supabase addPeopleTag error, falling back to localStore:', err);
      }
    }

    return localStore.addMemoryPeopleTag({
      memory_id: memoryId,
      wedding_id: weddingId,
      guest_id: tagData.guest_id || null,
      custom_name: trimmedCustom,
      relationship_tag: tagData.relationship_tag ? tagData.relationship_tag.trim() : null,
    });
  },

  async removePeopleTag(
    tagId: string,
    weddingId: string,
    userContext: {
      userId: string;
      userRole: WeddingRole;
    }
  ): Promise<boolean> {
    if (!tagId || !weddingId) return false;

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const { data: tag, error: fetchErr } = await supabase
          .from('memory_people_tags')
          .select('*, memory:wedding_memories(created_by, wedding_id)')
          .eq('id', tagId)
          .eq('wedding_id', weddingId)
          .maybeSingle();

        if (fetchErr || !tag) throw new Error('Tag not found.');

        const isManager = checkPermission(userContext.userRole, 'MANAGE_MEMORIES');
        const isAuthor = tag.memory?.created_by === userContext.userId;

        if (!isManager && !(userContext.userRole === 'CONTRIBUTOR' && isAuthor)) {
          throw new Error('Unauthorized to remove tag.');
        }

        const { error } = await supabase
          .from('memory_people_tags')
          .delete()
          .eq('id', tagId)
          .eq('wedding_id', weddingId);

        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Supabase removePeopleTag error, falling back to localStore:', err);
      }
    }

    return localStore.deleteMemoryPeopleTag(tagId);
  },

  async getPeopleTags(memoryId: string, weddingId: string): Promise<MemoryPeopleTag[]> {
    if (!memoryId || !weddingId) return [];

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const { data, error } = await supabase
          .from('memory_people_tags')
          .select('*')
          .eq('memory_id', memoryId)
          .eq('wedding_id', weddingId);

        if (!error && data) {
          const tags = data as MemoryPeopleTag[];
          const guestIds = tags.map((t) => t.guest_id).filter(Boolean) as string[];
          if (guestIds.length > 0) {
            const { data: guests } = await supabase
              .from('wedding_guests')
              .select('id, full_name')
              .in('id', guestIds);
            if (guests) {
              const map = new Map(guests.map((g) => [g.id, g.full_name]));
              tags.forEach((t) => {
                if (t.guest_id && map.has(t.guest_id)) {
                  t.guest_name = map.get(t.guest_id);
                } else if (!t.guest_name) {
                  t.guest_name = t.custom_name;
                }
              });
            }
          }
          return tags;
        }
      } catch (err) {
        console.warn('Supabase getPeopleTags error, falling back to localStore:', err);
      }
    }

    return localStore.getMemoryPeopleTags(memoryId, weddingId);
  },

  // -------------------------------------------------------------
  // MEDIA METADATA CRUD
  // -------------------------------------------------------------

  async addMediaRecord(
    memoryId: string,
    weddingId: string,
    mediaData: {
      storage_path: string;
      media_type: MemoryMediaType;
      mime_type: string;
      file_size: number;
      width?: number | null;
      height?: number | null;
      sort_order?: number;
      thumbnail_path?: string | null;
    },
    userContext: {
      userId: string;
      userRole: WeddingRole;
    }
  ): Promise<MemoryMedia> {
    const memory = await this.getMemory(memoryId, weddingId, userContext);
    if (!memory || memory.wedding_id !== weddingId) {
      throw new Error('Memory not found or does not belong to this wedding.');
    }

    const isManager = checkPermission(userContext.userRole, 'MANAGE_MEMORIES');
    const isAuthor = memory.created_by === userContext.userId;
    if (!isManager && !(userContext.userRole === 'CONTRIBUTOR' && isAuthor)) {
      throw new Error('Unauthorized: Only memory author or wedding admin can attach media metadata.');
    }

    if (!mediaData.storage_path || !mediaData.storage_path.trim()) {
      throw new Error('storage_path is required.');
    }
    if (!mediaData.file_size || mediaData.file_size <= 0) {
      throw new Error('file_size must be greater than zero.');
    }
    if (!mediaData.media_type || !ALLOWED_MEDIA_TYPES.includes(mediaData.media_type)) {
      throw new Error(`Invalid media_type. Must be one of: ${ALLOWED_MEDIA_TYPES.join(', ')}`);
    }
    if (!mediaData.mime_type || !ALLOWED_MIME_TYPES.includes(mediaData.mime_type)) {
      throw new Error(`Invalid or unsupported mime_type: ${mediaData.mime_type}`);
    }

    const payload = {
      memory_id: memoryId,
      wedding_id: weddingId,
      storage_path: mediaData.storage_path.trim(),
      thumbnail_path: mediaData.thumbnail_path || null,
      media_type: mediaData.media_type,
      mime_type: mediaData.mime_type,
      width: mediaData.width || null,
      height: mediaData.height || null,
      file_size: mediaData.file_size,
      sort_order: mediaData.sort_order !== undefined ? mediaData.sort_order : 0,
    };

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const { data, error } = await supabase
          .from('memory_media')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return data as MemoryMedia;
      } catch (err) {
        console.warn('Supabase addMediaRecord error, falling back to localStore:', err);
      }
    }

    return localStore.addMemoryMedia(payload);
  },

  async deleteMediaRecord(
    mediaId: string,
    weddingId: string,
    userContext: {
      userId: string;
      userRole: WeddingRole;
    }
  ): Promise<boolean> {
    if (!mediaId || !weddingId) return false;

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const { data: media, error: fetchErr } = await supabase
          .from('memory_media')
          .select('*, memory:wedding_memories(created_by, wedding_id)')
          .eq('id', mediaId)
          .eq('wedding_id', weddingId)
          .maybeSingle();

        if (fetchErr || !media) throw new Error('Media not found.');

        const isManager = checkPermission(userContext.userRole, 'MANAGE_MEMORIES');
        const isAuthor = media.memory?.created_by === userContext.userId;

        if (!isManager && !(userContext.userRole === 'CONTRIBUTOR' && isAuthor)) {
          throw new Error('Unauthorized to delete media record.');
        }

        const { error } = await supabase
          .from('memory_media')
          .delete()
          .eq('id', mediaId)
          .eq('wedding_id', weddingId);

        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Supabase deleteMediaRecord error, falling back to localStore:', err);
      }
    }

    return localStore.deleteMemoryMedia(mediaId);
  },

  async getMediaRecords(memoryId: string, weddingId: string): Promise<MemoryMedia[]> {
    if (!memoryId || !weddingId) return [];

    if (shouldUseSupabase(weddingId) && supabase) {
      try {
        const { data, error } = await supabase
          .from('memory_media')
          .select('*')
          .eq('memory_id', memoryId)
          .eq('wedding_id', weddingId)
          .order('sort_order', { ascending: true });

        if (!error && data) {
          return data as MemoryMedia[];
        }
      } catch (err) {
        console.warn('Supabase getMediaRecords error, falling back to localStore:', err);
      }
    }

    return localStore.getMemoryMedia(memoryId, weddingId);
  },

  // -------------------------------------------------------------
  // PHASE 9.5: MEDIA UPLOAD & COMPRESSION PIPELINE
  // -------------------------------------------------------------

  /**
   * Generates a signed URL for secure private storage access.
   * Caches signed URLs client-side to prevent redundant requests.
   */
  async getSignedMediaUrl(storagePath?: string | null, expiresInSeconds = 3600): Promise<string | null> {
    if (!storagePath) return null;

    // Direct web / blob / data URLs need no signing
    if (
      storagePath.startsWith('http://') ||
      storagePath.startsWith('https://') ||
      storagePath.startsWith('blob:') ||
      storagePath.startsWith('data:')
    ) {
      return storagePath;
    }

    // Check memory cache
    const now = Date.now();
    const cached = signedUrlCache.get(storagePath);
    if (cached && cached.expiresAt > now + 60 * 1000) {
      return cached.url;
    }

    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase.storage
        .from(MEMORY_STORAGE_BUCKET)
        .createSignedUrl(storagePath, expiresInSeconds);

      if (error || !data?.signedUrl) {
        console.warn(`Failed to generate signed URL for "${storagePath}":`, error);
        return null;
      }

      signedUrlCache.set(storagePath, {
        url: data.signedUrl,
        expiresAt: now + expiresInSeconds * 1000,
      });

      return data.signedUrl;
    } catch (err) {
      console.warn(`Error generating signed URL for "${storagePath}":`, err);
      return null;
    }
  },

  /**
   * Generates multiple signed URLs in batch.
   */
  async getSignedMediaUrls(storagePaths: string[], expiresInSeconds = 3600): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    if (!storagePaths || storagePaths.length === 0) return result;

    const uncachedPaths: string[] = [];
    const now = Date.now();

    for (const path of storagePaths) {
      if (!path) continue;
      if (
        path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('blob:') ||
        path.startsWith('data:')
      ) {
        result[path] = path;
      } else {
        const cached = signedUrlCache.get(path);
        if (cached && cached.expiresAt > now + 60 * 1000) {
          result[path] = cached.url;
        } else {
          uncachedPaths.push(path);
        }
      }
    }

    if (uncachedPaths.length === 0 || !isSupabaseConfigured || !supabase) {
      return result;
    }

    try {
      const { data, error } = await supabase.storage
        .from(MEMORY_STORAGE_BUCKET)
        .createSignedUrls(uncachedPaths, expiresInSeconds);

      if (!error && data) {
        data.forEach((item) => {
          if (item.signedUrl && item.path) {
            signedUrlCache.set(item.path, {
              url: item.signedUrl,
              expiresAt: now + expiresInSeconds * 1000,
            });
            result[item.path] = item.signedUrl;
          }
        });
      }
    } catch (err) {
      console.warn('Batch signed URLs error:', err);
    }

    return result;
  },

  /**
   * Clears the signed URL memory cache.
   */
  clearSignedUrlCache() {
    signedUrlCache.clear();
  },

  /**
   * High-Level Photo Upload Pipeline.
   *
   * Flow:
   * 1. Validate permissions and target memory ownership.
   * 2. Enforce 6 media items limit.
   * 3. Validate image format & size.
   * 4. Client-side decode & WebP compression (Full + Thumbnail).
   * 5. Upload both full & thumb objects to private Supabase Storage.
   * 6. Insert metadata into memory_media table.
   * 7. Clean up storage objects if metadata insertion fails.
   */
  async uploadMemoryMedia(
    weddingId: string,
    memoryId: string,
    file: File,
    userContext: UserContext,
    options?: {
      sortOrder?: number;
      onProgress?: (status: string) => void;
    }
  ): Promise<MemoryMedia> {
    if (!weddingId || !memoryId || !file) {
      throw new Error('Missing required upload parameters.');
    }

    // 1. Verify memory exists and belongs to active wedding
    const memory = await this.getMemory(memoryId, weddingId, userContext);
    if (!memory || memory.wedding_id !== weddingId) {
      throw new Error('Memory not found or does not belong to this wedding.');
    }

    // 2. Authorization check
    const isManager = checkPermission(userContext.userRole, 'MANAGE_MEMORIES');
    const isAuthor = memory.created_by === userContext.userId;
    const canUpload = checkPermission(userContext.userRole, 'CREATE_MEMORY') && (isManager || isAuthor);

    if (!canUpload) {
      if (userContext.userRole === 'VIEWER') {
        throw new Error('Unauthorized: Viewers cannot upload photos.');
      }
      throw new Error('Unauthorized: You do not have permission to add photos to this memory.');
    }

    // 3. Enforce maximum 6 media items limit
    const existingMedia = await this.getMediaRecords(memoryId, weddingId);
    if (existingMedia.length >= MAX_MEDIA_PER_MEMORY) {
      throw new Error(`This memory already has ${MAX_MEDIA_PER_MEMORY} photos.`);
    }

    // 4. Validate file format and size
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid photo file.');
    }

    // 5. Client-Side Image Processing
    options?.onProgress?.('Compressing photo for archival display...');
    const processed = await processWeddingPhoto(file);

    // 6. Generate UUIDs for storage path
    const fileUuid =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    const fullPath = `${weddingId}/${memoryId}/full/${fileUuid}.webp`;
    const thumbPath = `${weddingId}/${memoryId}/thumb/${fileUuid}.webp`;

    // 7. Supabase Storage Upload
    if (shouldUseSupabase(weddingId) && supabase) {
      let uploadedFull = false;
      let uploadedThumb = false;

      try {
        options?.onProgress?.('Uploading photo to secure wedding vault...');
        const { error: fullErr } = await supabase.storage
          .from(MEMORY_STORAGE_BUCKET)
          .upload(fullPath, processed.fullBlob, {
            contentType: processed.fullMimeType,
            upsert: false,
          });

        if (fullErr) {
          throw new Error(`Storage error: ${fullErr.message}`);
        }
        uploadedFull = true;

        options?.onProgress?.('Uploading mobile thumbnail...');
        const { error: thumbErr } = await supabase.storage
          .from(MEMORY_STORAGE_BUCKET)
          .upload(thumbPath, processed.thumbBlob, {
            contentType: processed.thumbMimeType,
            upsert: false,
          });

        if (thumbErr) {
          throw new Error(`Thumbnail storage error: ${thumbErr.message}`);
        }
        uploadedThumb = true;

        options?.onProgress?.('Preserving photograph details...');
        const mediaRecord = await this.addMediaRecord(
          memoryId,
          weddingId,
          {
            storage_path: fullPath,
            thumbnail_path: thumbPath,
            media_type: 'image',
            mime_type: processed.fullMimeType,
            width: processed.fullWidth,
            height: processed.fullHeight,
            file_size: processed.fullSize,
            sort_order: options?.sortOrder ?? existingMedia.length,
          },
          userContext
        );

        // Pre-cache the signed URLs for immediate display
        await this.getSignedMediaUrl(fullPath);
        await this.getSignedMediaUrl(thumbPath);

        // Log activity
        await activityService
          .logActivity({
            wedding_id: weddingId,
            actor_user_id: userContext.userId,
            actor_name: userContext.actorName || 'Family Member',
            actor_role: userContext.userRole,
            action: 'updated',
            entity_type: 'memory',
            entity_id: memoryId,
            entity_title: memory.title,
            metadata: {
              details: `Added photograph to "${memory.title}"`,
            },
          })
          .catch(console.warn);

        return mediaRecord;
      } catch (err: any) {
        // Safe Cleanup: avoid orphaned storage files if thumbnail or metadata fails
        if (uploadedFull || uploadedThumb) {
          const toRemove: string[] = [];
          if (uploadedFull) toRemove.push(fullPath);
          if (uploadedThumb) toRemove.push(thumbPath);
          await supabase.storage.from(MEMORY_STORAGE_BUCKET).remove(toRemove).catch(console.warn);
        }

        console.error('Storage upload pipeline failure:', err);
        throw new Error(err.message || "Couldn't save this photo. Your original photo is still safe.");
      }
    }

    // 8. Local Preview / Demo Mode Fallback
    const localFullUrl = URL.createObjectURL(processed.fullBlob);
    const localThumbUrl = URL.createObjectURL(processed.thumbBlob);

    const mediaRecord = localStore.addMemoryMedia({
      memory_id: memoryId,
      wedding_id: weddingId,
      storage_path: localFullUrl,
      thumbnail_path: localThumbUrl,
      media_type: 'image',
      mime_type: processed.fullMimeType,
      width: processed.fullWidth,
      height: processed.fullHeight,
      file_size: processed.fullSize,
      sort_order: options?.sortOrder ?? existingMedia.length,
    });

    return mediaRecord;
  },

  /**
   * Completely deletes a media item from both storage and database.
   */
  async deleteMedia(
    mediaId: string,
    weddingId: string,
    userContext: UserContext
  ): Promise<boolean> {
    if (!mediaId || !weddingId) return false;

    // 1. Fetch media record to inspect storage paths
    let mediaItem: MemoryMedia | null = null;
    if (shouldUseSupabase(weddingId) && supabase) {
      const { data } = await supabase
        .from('memory_media')
        .select('*, memory:wedding_memories(created_by, wedding_id)')
        .eq('id', mediaId)
        .eq('wedding_id', weddingId)
        .maybeSingle();
      if (data) mediaItem = data as MemoryMedia;
    } else {
      const allLocal = localStore.getMemoryMedia(undefined, weddingId);
      mediaItem = allLocal.find((m) => m.id === mediaId) || null;
    }

    if (!mediaItem) {
      throw new Error('Media item not found.');
    }

    // 2. Remove files from Supabase Storage if remote
    if (shouldUseSupabase(weddingId) && supabase) {
      const pathsToRemove: string[] = [];
      if (
        mediaItem.storage_path &&
        !mediaItem.storage_path.startsWith('http') &&
        !mediaItem.storage_path.startsWith('blob:') &&
        !mediaItem.storage_path.startsWith('data:')
      ) {
        pathsToRemove.push(mediaItem.storage_path);
      }
      if (
        mediaItem.thumbnail_path &&
        !mediaItem.thumbnail_path.startsWith('http') &&
        !mediaItem.thumbnail_path.startsWith('blob:') &&
        !mediaItem.thumbnail_path.startsWith('data:')
      ) {
        pathsToRemove.push(mediaItem.thumbnail_path);
      }

      if (pathsToRemove.length > 0) {
        await supabase.storage.from(MEMORY_STORAGE_BUCKET).remove(pathsToRemove).catch(console.warn);
      }

      // Purge cache
      if (mediaItem.storage_path) signedUrlCache.delete(mediaItem.storage_path);
      if (mediaItem.thumbnail_path) signedUrlCache.delete(mediaItem.thumbnail_path);
    }

    // 3. Delete database record
    return this.deleteMediaRecord(mediaId, weddingId, userContext);
  },
};

// In-memory cache for temporary signed URLs
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

