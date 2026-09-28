-- ==============================================================================
-- WEDWISE: Canonical Production Database Schema & Row Level Security (RLS)
-- Covers Phases 1 through 8.5
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE (Linked with Supabase Auth)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ==============================================================================
-- 2. WEDDINGS TABLE
-- ==============================================================================
create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade not null,
  wedding_name text not null,
  bride_name text not null,
  groom_name text not null,
  wedding_date date not null,
  total_budget numeric(14, 2) not null default 0 check (total_budget >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.weddings enable row level security;

-- ==============================================================================
-- 3. WEDDING MEMBERS TABLE (Phase 7 RBAC)
-- ==============================================================================
create table if not exists public.wedding_members (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('OWNER', 'FAMILY_ADMIN', 'CONTRIBUTOR', 'VIEWER')),
  display_name text not null,
  email text not null,
  avatar_url text,
  relationship_title text,
  status text not null default 'Accepted' check (status in ('Pending', 'Accepted', 'Declined', 'Revoked')),
  invited_at timestamp with time zone,
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (wedding_id, user_id)
);

alter table public.wedding_members enable row level security;

-- ==============================================================================
-- 4. SECURITY DEFINER HELPER FUNCTION (is_wedding_member)
-- ==============================================================================
create or replace function public.is_wedding_member(p_wedding_id uuid, p_role text default null)
returns boolean security definer as $$
  select exists (
    select 1 from public.wedding_members
    where wedding_id = p_wedding_id
      and user_id = auth.uid()
      and status = 'Accepted'
      and (
        p_role is null
        or (p_role = 'OWNER' and role = 'OWNER')
        or (p_role = 'FAMILY_ADMIN' and role in ('OWNER', 'FAMILY_ADMIN'))
        or (p_role = 'CONTRIBUTOR' and role in ('OWNER', 'FAMILY_ADMIN', 'CONTRIBUTOR'))
        or (p_role = 'VIEWER' and role in ('OWNER', 'FAMILY_ADMIN', 'CONTRIBUTOR', 'VIEWER'))
      )
  )
  or exists (
    select 1 from public.weddings
    where id = p_wedding_id
      and owner_id = auth.uid()
  );
$$ language sql stable;

-- RLS Policies for weddings
create policy "Members and owners can view weddings"
  on public.weddings for select
  using (owner_id = auth.uid() or public.is_wedding_member(id));

create policy "Users can create their own weddings"
  on public.weddings for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their weddings"
  on public.weddings for update
  using (owner_id = auth.uid() or public.is_wedding_member(id, 'OWNER'))
  with check (owner_id = auth.uid() or public.is_wedding_member(id, 'OWNER'));

create policy "Owners can delete their weddings"
  on public.weddings for delete
  using (owner_id = auth.uid() or public.is_wedding_member(id, 'OWNER'));

-- RLS Policies for wedding_members
create policy "Members can view members in their weddings"
  on public.wedding_members for select
  using (public.is_wedding_member(wedding_id));

create policy "Owners and Admins can insert members"
  on public.wedding_members for insert
  with check (
    public.is_wedding_member(wedding_id, 'FAMILY_ADMIN')
    or not exists (select 1 from public.wedding_members wm where wm.wedding_id = wedding_members.wedding_id)
  );

create policy "Owners can update members"
  on public.wedding_members for update
  using (public.is_wedding_member(wedding_id, 'OWNER'))
  with check (public.is_wedding_member(wedding_id, 'OWNER'));

create policy "Owners and Admins can delete non-owner members"
  on public.wedding_members for delete
  using (
    public.is_wedding_member(wedding_id, 'FAMILY_ADMIN')
    and role != 'OWNER'
  );

-- ==============================================================================
-- 5. WEDDING INVITATIONS TABLE (Phase 7)
-- ==============================================================================
create table if not exists public.wedding_invitations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  email text not null,
  role text not null check (role in ('FAMILY_ADMIN', 'CONTRIBUTOR', 'VIEWER')),
  display_name text,
  relationship_title text,
  invited_by uuid references auth.users(id) on delete cascade not null,
  invited_by_name text,
  message text,
  status text not null default 'Pending' check (status in ('Pending', 'Accepted', 'Declined', 'Revoked', 'Expired')),
  token text not null unique,
  expires_at timestamp with time zone not null,
  accepted_at timestamp with time zone,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wedding_invitations enable row level security;

create policy "Members can view invitations for their wedding"
  on public.wedding_invitations for select
  using (public.is_wedding_member(wedding_id));

create policy "Owners and Admins can create invitations"
  on public.wedding_invitations for insert
  with check (public.is_wedding_member(wedding_id, 'FAMILY_ADMIN'));

create policy "Owners and Admins can update/revoke invitations"
  on public.wedding_invitations for update
  using (public.is_wedding_member(wedding_id, 'FAMILY_ADMIN'));

-- Functions for secure invitation preview and atomic acceptance
create or replace function public.get_invitation_by_token(p_token text)
returns json
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_inv record;
  v_wedding_name text;
  v_is_expired boolean;
  v_status text;
begin
  if p_token is null or trim(p_token) = '' then
    return null;
  end if;

  select i.id, i.wedding_id, i.email, i.role, i.display_name, i.relationship_title,
         i.invited_by_name, i.message, i.status, i.expires_at, i.created_at,
         w.wedding_name, w.bride_name, w.groom_name, w.wedding_date
  into v_inv
  from public.wedding_invitations i
  left join public.weddings w on w.id = i.wedding_id
  where i.token = trim(p_token);

  if not found then
    return null;
  end if;

  v_is_expired := (v_inv.expires_at < now());
  v_status := v_inv.status;
  if v_status = 'Pending' and v_is_expired then
    v_status := 'Expired';
  end if;

  if v_inv.role not in ('FAMILY_ADMIN', 'CONTRIBUTOR', 'VIEWER') then
    v_inv.role := 'VIEWER';
  end if;

  return json_build_object(
    'id', v_inv.id,
    'wedding_id', v_inv.wedding_id,
    'wedding_name', coalesce(v_inv.wedding_name, 'Wedding Celebration'),
    'bride_name', v_inv.bride_name,
    'groom_name', v_inv.groom_name,
    'wedding_date', v_inv.wedding_date,
    'message', v_inv.message,
    'email', v_inv.email,
    'role', v_inv.role,
    'display_name', v_inv.display_name,
    'relationship_title', v_inv.relationship_title,
    'invited_by_name', v_inv.invited_by_name,
    'status', v_status,
    'expires_at', v_inv.expires_at,
    'is_expired', v_is_expired,
    'created_at', v_inv.created_at
  );
end;
$$;

revoke all on function public.get_invitation_by_token(text) from public;
grant execute on function public.get_invitation_by_token(text) to anon, authenticated, service_role;

create or replace function public.accept_wedding_invitation(p_token text)
returns json
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid;
  v_caller_email text;
  v_inv record;
  v_display_name text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to accept an invitation.';
  end if;

  if p_token is null or trim(p_token) = '' then
    raise exception 'Invalid invitation token.';
  end if;

  v_caller_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_caller_email = '' then
    select lower(email) into v_caller_email from auth.users where id = v_user_id;
  end if;

  if v_caller_email is null or v_caller_email = '' then
    raise exception 'Unable to resolve authenticated user email.';
  end if;

  select * into v_inv
  from public.wedding_invitations
  where token = trim(p_token)
  for update;

  if not found then
    raise exception 'Invitation not found or invalid token.';
  end if;

  if v_inv.status = 'Accepted' then
    if v_inv.accepted_by = v_user_id then
      return json_build_object(
        'success', true,
        'wedding_id', v_inv.wedding_id,
        'role', v_inv.role,
        'display_name', coalesce(v_inv.display_name, split_part(v_caller_email, '@', 1)),
        'message', 'Invitation already accepted.'
      );
    else
      raise exception 'This invitation has already been accepted by another user.';
    end if;
  end if;

  if v_inv.status = 'Revoked' then
    raise exception 'This invitation was revoked by the wedding host.';
  end if;

  if v_inv.status != 'Pending' then
    raise exception 'This invitation is no longer active.';
  end if;

  if v_inv.expires_at < now() then
    update public.wedding_invitations
    set status = 'Expired', updated_at = now()
    where id = v_inv.id;
    raise exception 'This invitation has expired.';
  end if;

  if lower(trim(v_inv.email)) != v_caller_email then
    raise exception 'Email mismatch: This invitation was sent to % but you are signed in as %.', v_inv.email, v_caller_email;
  end if;

  if v_inv.role = 'OWNER' or v_inv.role not in ('FAMILY_ADMIN', 'CONTRIBUTOR', 'VIEWER') then
    raise exception 'Invalid invitation: Invitations cannot grant the OWNER role.';
  end if;

  v_display_name := coalesce(
    nullif(trim(v_inv.display_name), ''),
    nullif(trim(auth.jwt() -> 'user_metadata' ->> 'full_name'), ''),
    split_part(v_caller_email, '@', 1)
  );

  insert into public.wedding_members (
    wedding_id,
    user_id,
    role,
    display_name,
    email,
    relationship_title,
    status,
    joined_at,
    created_at,
    updated_at
  )
  values (
    v_inv.wedding_id,
    v_user_id,
    v_inv.role,
    v_display_name,
    v_caller_email,
    v_inv.relationship_title,
    'Accepted',
    now(),
    now(),
    now()
  )
  on conflict (wedding_id, user_id) do update set
    role = excluded.role,
    status = 'Accepted',
    display_name = coalesce(excluded.display_name, wedding_members.display_name),
    relationship_title = coalesce(excluded.relationship_title, wedding_members.relationship_title),
    joined_at = coalesce(wedding_members.joined_at, now()),
    updated_at = now();

  update public.wedding_invitations
  set
    status = 'Accepted',
    accepted_at = now(),
    accepted_by = v_user_id,
    updated_at = now()
  where id = v_inv.id;

  insert into public.wedding_activity (
    wedding_id,
    actor_user_id,
    actor_name,
    actor_role,
    action,
    entity_type,
    entity_id,
    entity_title,
    metadata,
    created_at
  )
  values (
    v_inv.wedding_id,
    v_user_id,
    v_display_name,
    v_inv.role,
    'joined',
    'member',
    v_user_id::text,
    v_display_name,
    json_build_object('role', v_inv.role, 'relationship', v_inv.relationship_title),
    now()
  );

  return json_build_object(
    'success', true,
    'wedding_id', v_inv.wedding_id,
    'role', v_inv.role,
    'display_name', v_display_name
  );
end;
$$;

revoke all on function public.accept_wedding_invitation(text) from public, anon;
grant execute on function public.accept_wedding_invitation(text) to authenticated, service_role;

-- ==============================================================================
-- 6. WEDDING ACTIVITY LOG TABLE (Phase 7)
-- ==============================================================================
create table if not exists public.wedding_activity (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text not null,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  entity_title text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wedding_activity enable row level security;

create policy "Members can view activity log for their wedding"
  on public.wedding_activity for select
  using (public.is_wedding_member(wedding_id));

create policy "Members can record activity in their wedding"
  on public.wedding_activity for insert
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

-- ==============================================================================
-- 7. EXPENSE CATEGORIES TABLE
-- ==============================================================================
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  icon text not null default 'Tag',
  budget_limit numeric(14, 2) not null default 0 check (budget_limit >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.expense_categories enable row level security;

create policy "Members can view expense categories for their wedding"
  on public.expense_categories for select
  using (public.is_wedding_member(wedding_id));

create policy "Owners and Admins can manage expense categories"
  on public.expense_categories for all
  using (public.is_wedding_member(wedding_id, 'FAMILY_ADMIN'))
  with check (public.is_wedding_member(wedding_id, 'FAMILY_ADMIN'));

-- ==============================================================================
-- 8. WEDDING EVENTS TABLE
-- ==============================================================================
create table if not exists public.wedding_events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  event_name text not null,
  event_type text not null,
  date date not null,
  start_time text,
  end_time text,
  venue text,
  description text,
  expected_guests integer,
  budget_allocation numeric(14, 2) default 0,
  status text not null default 'Upcoming' check (status in ('Upcoming', 'Today', 'Completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wedding_events enable row level security;

create policy "Members can view events for their wedding"
  on public.wedding_events for select
  using (public.is_wedding_member(wedding_id));

create policy "Contributors and Admins can manage events"
  on public.wedding_events for all
  using (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'))
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

-- ==============================================================================
-- 9. WEDDING TASKS TABLE
-- ==============================================================================
create table if not exists public.wedding_tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  event_id uuid references public.wedding_events(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  assigned_to text,
  priority text not null default 'Normal' check (priority in ('Normal', 'Important', 'Urgent')),
  status text not null default 'Todo' check (status in ('Todo', 'In Progress', 'Completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wedding_tasks enable row level security;

create policy "Members can view tasks for their wedding"
  on public.wedding_tasks for select
  using (public.is_wedding_member(wedding_id));

create policy "Contributors and Admins can manage tasks"
  on public.wedding_tasks for all
  using (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'))
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

-- ==============================================================================
-- 10. WEDDING GUESTS TABLE
-- ==============================================================================
create table if not exists public.wedding_guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  full_name text not null,
  phone text,
  email text,
  family_group text not null default 'Relatives',
  wedding_side text not null default 'Bride' check (wedding_side in ('Bride', 'Groom', 'Both', 'Other')),
  accompanying_members integer not null default 0,
  adults_count integer,
  children_count integer,
  rsvp_status text not null default 'Invited' check (rsvp_status in ('Invited', 'Awaiting Response', 'Confirmed', 'Maybe', 'Declined')),
  food_preference text,
  accommodation_required boolean not null default false,
  transport_required boolean not null default false,
  notes text,
  invited_events text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wedding_guests enable row level security;

create policy "Members can view guests for their wedding"
  on public.wedding_guests for select
  using (public.is_wedding_member(wedding_id));

create policy "Contributors and Admins can insert and update guests"
  on public.wedding_guests for insert
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

create policy "Contributors and Admins can update guests"
  on public.wedding_guests for update
  using (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'))
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

create policy "Owners and Admins can delete guests"
  on public.wedding_guests for delete
  using (public.is_wedding_member(wedding_id, 'FAMILY_ADMIN'));

-- ==============================================================================
-- 11. GUEST ACCOMMODATIONS TABLE
-- ==============================================================================
create table if not exists public.guest_accommodations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  guest_id uuid references public.wedding_guests(id) on delete cascade not null,
  hotel_name text not null,
  room_number text,
  room_type text,
  check_in_date date not null,
  check_out_date date not null,
  occupants_count integer not null default 1,
  payment_status text not null default 'Complimentary' check (payment_status in ('Paid', 'Pending', 'Complimentary')),
  status text not null default 'Assigned' check (status in ('Requested', 'Assigned', 'Checked In', 'Checked Out')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.guest_accommodations enable row level security;

create policy "Members can view accommodations for their wedding"
  on public.guest_accommodations for select
  using (public.is_wedding_member(wedding_id));

create policy "Contributors and Admins can manage accommodations"
  on public.guest_accommodations for all
  using (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'))
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

-- ==============================================================================
-- 12. GUEST TRANSPORTS TABLE
-- ==============================================================================
create table if not exists public.guest_transports (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  guest_id uuid references public.wedding_guests(id) on delete cascade not null,
  transport_type text not null check (transport_type in ('Pickup', 'Drop', 'Custom')),
  pickup_location text not null,
  destination text not null,
  date date not null,
  time text not null,
  driver_name text,
  driver_phone text,
  vehicle_details text,
  status text not null default 'Planned' check (status in ('Planned', 'Confirmed', 'Completed', 'Cancelled')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.guest_transports enable row level security;

create policy "Members can view transports for their wedding"
  on public.guest_transports for select
  using (public.is_wedding_member(wedding_id));

create policy "Contributors and Admins can manage transports"
  on public.guest_transports for all
  using (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'))
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

-- ==============================================================================
-- 13. WEDDING VENDORS TABLE (Phase 6)
-- ==============================================================================
create table if not exists public.wedding_vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  category text not null,
  event_id uuid references public.wedding_events(id) on delete set null,
  contact_person text,
  phone text,
  email text,
  address text,
  status text not null default 'Contacted' check (status in ('Contacted', 'Shortlisted', 'In Negotiation', 'Booked', 'Completed', 'Cancelled')),
  agreed_amount numeric(14, 2) not null default 0 check (agreed_amount >= 0),
  paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
  remaining_amount numeric(14, 2) not null default 0 check (remaining_amount >= 0),
  follow_up_date date,
  payment_due_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wedding_vendors enable row level security;

create policy "Members can view vendors for their wedding"
  on public.wedding_vendors for select
  using (public.is_wedding_member(wedding_id));

create policy "Contributors and Admins can insert and update vendors"
  on public.wedding_vendors for insert
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

create policy "Contributors and Admins can update vendors"
  on public.wedding_vendors for update
  using (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'))
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

create policy "Owners and Admins can delete vendors"
  on public.wedding_vendors for delete
  using (public.is_wedding_member(wedding_id, 'FAMILY_ADMIN'));

-- ==============================================================================
-- 14. VENDOR PAYMENTS TABLE (Phase 6, 1-to-1 Idempotent with Expenses)
-- ==============================================================================
create table if not exists public.vendor_payments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  vendor_id uuid references public.wedding_vendors(id) on delete cascade not null,
  amount numeric(14, 2) not null check (amount > 0),
  payment_date date not null default current_date,
  paid_by text not null default 'Family',
  payment_method text not null default 'Bank Transfer',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vendor_payments enable row level security;

create policy "Members can view vendor payments for their wedding"
  on public.vendor_payments for select
  using (public.is_wedding_member(wedding_id));

create policy "Contributors and Admins can insert and update vendor payments"
  on public.vendor_payments for insert
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

create policy "Contributors and Admins can update vendor payments"
  on public.vendor_payments for update
  using (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'))
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

create policy "Owners and Admins can delete vendor payments"
  on public.vendor_payments for delete
  using (public.is_wedding_member(wedding_id, 'FAMILY_ADMIN'));

-- ==============================================================================
-- 15. VENDOR DOCUMENTS TABLE (Phase 6)
-- ==============================================================================
create table if not exists public.vendor_documents (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  vendor_id uuid references public.wedding_vendors(id) on delete cascade not null,
  title text not null,
  document_type text not null default 'Contract' check (document_type in ('Contract', 'Invoice', 'Receipt', 'Estimate / Quote', 'Brief / Notes')),
  file_url text,
  uploaded_date date not null default current_date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vendor_documents enable row level security;

create policy "Members can view vendor documents for their wedding"
  on public.vendor_documents for select
  using (public.is_wedding_member(wedding_id));

create policy "Contributors and Admins can manage vendor documents"
  on public.vendor_documents for all
  using (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'))
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

-- ==============================================================================
-- 16. EXPENSES TABLE (Phase 1, with Phase 6 Vendor and Event Links)
-- ==============================================================================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  category_id uuid references public.expense_categories(id) on delete set null,
  event_id uuid references public.wedding_events(id) on delete set null,
  vendor_id uuid references public.wedding_vendors(id) on delete set null,
  vendor_payment_id uuid references public.vendor_payments(id) on delete set null,
  expense_name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  paid_by text not null,
  payment_method text not null check (payment_method in ('Cash', 'UPI', 'Card', 'Bank Transfer', 'Other')),
  payment_status text not null default 'Paid' check (payment_status in ('Paid', 'Pending')),
  expense_date date not null default current_date,
  notes text,
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add reciprocal foreign key on vendor_payments to expenses
alter table public.vendor_payments add column if not exists expense_id uuid references public.expenses(id) on delete set null;

alter table public.expenses enable row level security;

create policy "Members can view expenses for their wedding"
  on public.expenses for select
  using (public.is_wedding_member(wedding_id));

create policy "Contributors and Admins can insert expenses"
  on public.expenses for insert
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

create policy "Contributors and Admins can update expenses"
  on public.expenses for update
  using (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'))
  with check (public.is_wedding_member(wedding_id, 'CONTRIBUTOR'));

create policy "Owners and Admins can delete expenses"
  on public.expenses for delete
  using (public.is_wedding_member(wedding_id, 'FAMILY_ADMIN'));

-- ==============================================================================
-- 17. PERFORMANCE INDICES
-- ==============================================================================
create index if not exists idx_weddings_owner on public.weddings(owner_id);
create index if not exists idx_wedding_members_user_wedding on public.wedding_members(user_id, wedding_id);
create index if not exists idx_wedding_invitations_token on public.wedding_invitations(token);
create index if not exists idx_wedding_activity_wedding on public.wedding_activity(wedding_id, created_at desc);
create index if not exists idx_expenses_wedding on public.expenses(wedding_id);
create index if not exists idx_expenses_category on public.expenses(category_id);
create index if not exists idx_expenses_vendor_payment on public.expenses(vendor_payment_id);
create index if not exists idx_wedding_vendors_wedding on public.wedding_vendors(wedding_id);
create index if not exists idx_vendor_payments_vendor on public.vendor_payments(vendor_id);
create index if not exists idx_wedding_guests_wedding on public.wedding_guests(wedding_id);
create index if not exists idx_wedding_events_wedding on public.wedding_events(wedding_id);
create index if not exists idx_wedding_tasks_wedding on public.wedding_tasks(wedding_id);

-- ==============================================================================
-- 18. AUTOMATIC TRIGGERS & FUNCTIONS
-- ==============================================================================

-- Trigger: Default Categories on New Wedding
create or replace function public.seed_default_wedding_categories()
returns trigger as $$
begin
  insert into public.expense_categories (wedding_id, name, icon, budget_limit)
  values
    (new.id, 'Venue', 'Building', 0),
    (new.id, 'Catering', 'UtensilsCrossed', 0),
    (new.id, 'Decoration', 'Sparkles', 0),
    (new.id, 'Photography', 'Camera', 0),
    (new.id, 'Videography', 'Video', 0),
    (new.id, 'Clothing', 'Shirt', 0),
    (new.id, 'Jewellery', 'Gem', 0),
    (new.id, 'Makeup', 'Sparkle', 0),
    (new.id, 'Music / DJ', 'Music', 0),
    (new.id, 'Invitations', 'Mail', 0),
    (new.id, 'Transportation', 'Car', 0),
    (new.id, 'Accommodation', 'Hotel', 0),
    (new.id, 'Gifts', 'Gift', 0),
    (new.id, 'Miscellaneous', 'MoreHorizontal', 0);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_seed_default_wedding_categories on public.weddings;
create trigger tr_seed_default_wedding_categories
  after insert on public.weddings
  for each row
  execute function public.seed_default_wedding_categories();

-- Trigger: Profile Creation on Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Wedding Planner'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: Auto-register Wedding Creator as OWNER in wedding_members
create or replace function public.handle_new_wedding_owner()
returns trigger as $$
begin
  insert into public.wedding_members (wedding_id, user_id, role, display_name, email, status)
  select
    new.id,
    new.owner_id,
    'OWNER',
    coalesce(p.full_name, 'Wedding Owner'),
    coalesce(p.email, 'owner@wedwise.local'),
    'Accepted'
  from (select 1) _
  left join public.profiles p on p.id = new.owner_id
  on conflict (wedding_id, user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_new_wedding_owner on public.weddings;
create trigger tr_new_wedding_owner
  after insert on public.weddings
  for each row
  execute function public.handle_new_wedding_owner();

-- ==============================================================================
-- 19. IDEMPOTENT BACKFILL / MIGRATION FOR EXISTING WEDDINGS
-- ==============================================================================
insert into public.wedding_members (wedding_id, user_id, role, display_name, email, status)
select 
  w.id,
  w.owner_id,
  'OWNER',
  coalesce(p.full_name, 'Wedding Owner'),
  coalesce(p.email, 'owner@wedwise.local'),
  'Accepted'
from public.weddings w
left join public.profiles p on p.id = w.owner_id
on conflict (wedding_id, user_id) do nothing;
