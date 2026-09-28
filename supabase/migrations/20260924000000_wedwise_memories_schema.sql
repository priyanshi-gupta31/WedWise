-- ==============================================================================
-- WEDWISE: Phase 9.1 Database & Storage Foundation
-- Wedding Memories & Moments Schema, Private Storage Bucket & RLS Policies
-- ==============================================================================

-- 1. WEDDING MEMORIES TABLE
create table if not exists public.wedding_memories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  event_id uuid references public.wedding_events(id) on delete set null,
  title text not null,
  story_caption text,
  memory_date date not null,
  milestone_phase text not null default 'Ceremony' check (milestone_phase in ('Pre-Wedding', 'Ceremony', 'Wedding Day', 'Reception', 'Post-Wedding')),
  location text,
  visibility text not null default 'PUBLIC_FAMILY' check (visibility in ('PUBLIC_FAMILY', 'CORE_FAMILY_ONLY')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wedding_memories enable row level security;

create index if not exists idx_memories_wedding_date on public.wedding_memories(wedding_id, memory_date desc);
create index if not exists idx_memories_wedding_event on public.wedding_memories(wedding_id, event_id);
create index if not exists idx_memories_created_by on public.wedding_memories(created_by);

-- 2. MEMORY MEDIA TABLE (Photos & Scanned Documents)
create table if not exists public.memory_media (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid references public.wedding_memories(id) on delete cascade not null,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  storage_path text not null,
  thumbnail_path text,
  media_type text not null default 'image' check (media_type in ('image', 'document')),
  mime_type text not null,
  width integer,
  height integer,
  file_size integer not null check (file_size > 0),
  sort_order integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.memory_media enable row level security;

create index if not exists idx_media_memory_sort on public.memory_media(memory_id, sort_order asc);
create index if not exists idx_media_wedding on public.memory_media(wedding_id);

-- 3. MEMORY PEOPLE TAGS TABLE
create table if not exists public.memory_people_tags (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid references public.wedding_memories(id) on delete cascade not null,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  guest_id uuid references public.wedding_guests(id) on delete cascade,
  custom_name text,
  relationship_tag text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  check (guest_id is not null or custom_name is not null)
);

alter table public.memory_people_tags enable row level security;

create index if not exists idx_tags_memory on public.memory_people_tags(memory_id);
create index if not exists idx_tags_wedding_guest on public.memory_people_tags(wedding_id, guest_id);

-- ==============================================================================
-- 4. RLS POLICIES FOR WEDDING MEMORIES
-- ==============================================================================

-- Select: Members can view memories based on visibility level
create policy "Members can view memories"
  on public.wedding_memories for select
  using (
    public.is_wedding_member(wedding_id)
    and (
      visibility = 'PUBLIC_FAMILY'
      or public.is_wedding_member(wedding_id, 'FAMILY_ADMIN')
      or created_by = auth.uid()
    )
  );

-- Insert: Contributors and Admins can create memories
create policy "Contributors and Admins can create memories"
  on public.wedding_memories for insert
  with check (
    public.is_wedding_member(wedding_id, 'CONTRIBUTOR')
    and (created_by is null or auth.uid() = created_by)
  );

-- Update: Admins or the author can update their memories
create policy "Authors and Admins can update memories"
  on public.wedding_memories for update
  using (
    public.is_wedding_member(wedding_id, 'FAMILY_ADMIN')
    or (public.is_wedding_member(wedding_id, 'CONTRIBUTOR') and created_by = auth.uid())
  )
  with check (
    public.is_wedding_member(wedding_id, 'FAMILY_ADMIN')
    or (public.is_wedding_member(wedding_id, 'CONTRIBUTOR') and created_by = auth.uid())
  );

-- Delete: Admins or the author can delete their memories
create policy "Authors and Admins can delete memories"
  on public.wedding_memories for delete
  using (
    public.is_wedding_member(wedding_id, 'FAMILY_ADMIN')
    or (public.is_wedding_member(wedding_id, 'CONTRIBUTOR') and created_by = auth.uid())
  );

-- ==============================================================================
-- 5. RLS POLICIES FOR MEMORY MEDIA
-- ==============================================================================

-- Select: Members who can view the parent memory can view its media
create policy "Members can view memory media"
  on public.memory_media for select
  using (
    exists (
      select 1 from public.wedding_memories wm
      where wm.id = memory_media.memory_id
        and public.is_wedding_member(wm.wedding_id)
        and (
          wm.visibility = 'PUBLIC_FAMILY'
          or public.is_wedding_member(wm.wedding_id, 'FAMILY_ADMIN')
          or wm.created_by = auth.uid()
        )
    )
  );

-- Insert: Contributors and Admins who own or manage the parent memory can attach media
create policy "Contributors and Admins can insert memory media"
  on public.memory_media for insert
  with check (
    exists (
      select 1 from public.wedding_memories wm
      where wm.id = memory_media.memory_id
        and (
          public.is_wedding_member(wm.wedding_id, 'FAMILY_ADMIN')
          or (public.is_wedding_member(wm.wedding_id, 'CONTRIBUTOR') and wm.created_by = auth.uid())
        )
    )
  );

-- Update: Authors and Admins can update media metadata
create policy "Authors and Admins can update memory media"
  on public.memory_media for update
  using (
    exists (
      select 1 from public.wedding_memories wm
      where wm.id = memory_media.memory_id
        and (
          public.is_wedding_member(wm.wedding_id, 'FAMILY_ADMIN')
          or (public.is_wedding_member(wm.wedding_id, 'CONTRIBUTOR') and wm.created_by = auth.uid())
        )
    )
  );

-- Delete: Authors and Admins can delete media
create policy "Authors and Admins can delete memory media"
  on public.memory_media for delete
  using (
    exists (
      select 1 from public.wedding_memories wm
      where wm.id = memory_media.memory_id
        and (
          public.is_wedding_member(wm.wedding_id, 'FAMILY_ADMIN')
          or (public.is_wedding_member(wm.wedding_id, 'CONTRIBUTOR') and wm.created_by = auth.uid())
        )
    )
  );

-- ==============================================================================
-- 6. RLS POLICIES FOR MEMORY PEOPLE TAGS
-- ==============================================================================

-- Select: Members who can view the parent memory can view people tags
create policy "Members can view memory people tags"
  on public.memory_people_tags for select
  using (
    exists (
      select 1 from public.wedding_memories wm
      where wm.id = memory_people_tags.memory_id
        and public.is_wedding_member(wm.wedding_id)
        and (
          wm.visibility = 'PUBLIC_FAMILY'
          or public.is_wedding_member(wm.wedding_id, 'FAMILY_ADMIN')
          or wm.created_by = auth.uid()
        )
    )
  );

-- Insert: Authors and Admins can tag people
create policy "Authors and Admins can insert memory people tags"
  on public.memory_people_tags for insert
  with check (
    exists (
      select 1 from public.wedding_memories wm
      where wm.id = memory_people_tags.memory_id
        and (
          public.is_wedding_member(wm.wedding_id, 'FAMILY_ADMIN')
          or (public.is_wedding_member(wm.wedding_id, 'CONTRIBUTOR') and wm.created_by = auth.uid())
        )
    )
  );

-- Update: Authors and Admins can update tags
create policy "Authors and Admins can update memory people tags"
  on public.memory_people_tags for update
  using (
    exists (
      select 1 from public.wedding_memories wm
      where wm.id = memory_people_tags.memory_id
        and (
          public.is_wedding_member(wm.wedding_id, 'FAMILY_ADMIN')
          or (public.is_wedding_member(wm.wedding_id, 'CONTRIBUTOR') and wm.created_by = auth.uid())
        )
    )
  );

-- Delete: Authors and Admins can delete tags
create policy "Authors and Admins can delete memory people tags"
  on public.memory_people_tags for delete
  using (
    exists (
      select 1 from public.wedding_memories wm
      where wm.id = memory_people_tags.memory_id
        and (
          public.is_wedding_member(wm.wedding_id, 'FAMILY_ADMIN')
          or (public.is_wedding_member(wm.wedding_id, 'CONTRIBUTOR') and wm.created_by = auth.uid())
        )
    )
  );

-- ==============================================================================
-- 7. PRIVATE SUPABASE STORAGE BUCKET: wedding-memories
-- ==============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedding-memories',
  'wedding-memories',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

-- Storage Policies for wedding-memories

-- Read: Wedding members can download memory media belonging to their wedding
create policy "Wedding members can read memory storage objects"
  on storage.objects for select
  using (
    bucket_id = 'wedding-memories'
    and auth.role() = 'authenticated'
    and (name ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/')
    and public.is_wedding_member((split_part(name, '/', 1))::uuid)
  );

-- Insert: Contributors and Admins can upload memory media to their wedding's folder
create policy "Contributors and Admins can upload memory storage objects"
  on storage.objects for insert
  with check (
    bucket_id = 'wedding-memories'
    and auth.role() = 'authenticated'
    and (name ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/')
    and public.is_wedding_member((split_part(name, '/', 1))::uuid, 'CONTRIBUTOR')
  );

-- Update: Contributors and Admins can update memory media in their wedding's folder
create policy "Contributors and Admins can update memory storage objects"
  on storage.objects for update
  using (
    bucket_id = 'wedding-memories'
    and auth.role() = 'authenticated'
    and (name ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/')
    and public.is_wedding_member((split_part(name, '/', 1))::uuid, 'CONTRIBUTOR')
  );

-- Delete: Contributors and Admins can delete memory media from their wedding's folder
create policy "Admins and Contributors can delete memory storage objects"
  on storage.objects for delete
  using (
    bucket_id = 'wedding-memories'
    and auth.role() = 'authenticated'
    and (name ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/')
    and public.is_wedding_member((split_part(name, '/', 1))::uuid, 'CONTRIBUTOR')
  );

-- ==============================================================================
-- 8. POSTGREST SCHEMA PERMISSIONS
-- ==============================================================================

grant all privileges on public.wedding_memories to postgres, anon, authenticated, service_role;
grant all privileges on public.memory_media to postgres, anon, authenticated, service_role;
grant all privileges on public.memory_people_tags to postgres, anon, authenticated, service_role;
