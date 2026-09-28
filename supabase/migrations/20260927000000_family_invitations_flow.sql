-- ==============================================================================
-- WEDWISE PHASE 7: REAL FAMILY INVITATION FLOW MIGRATION
-- Migration: 20260927000000_family_invitations_flow.sql
-- ==============================================================================

-- 1. Add tracking columns to wedding_invitations
alter table public.wedding_invitations
  add column if not exists accepted_at timestamp with time zone,
  add column if not exists accepted_by uuid references auth.users(id) on delete set null;

-- Index for accepted_by lookups
create index if not exists idx_wedding_invitations_accepted_by
  on public.wedding_invitations(accepted_by);

-- 2. Security Definer: Public Invitation Preview by Token
-- Strictly safe metadata only. Does NOT expose the token or internal wedding financials/PII.
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

  -- Ensure role cannot be an illegal privilege
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

-- 3. Security Definer: Atomic & Idempotent Invitation Acceptance
-- Strictly transactional, locked with FOR UPDATE, prevents double-clicks,
-- enforces case-insensitive email match, guarantees OWNER cannot be granted.
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
  -- 1. Must be authenticated
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to accept an invitation.';
  end if;

  if p_token is null or trim(p_token) = '' then
    raise exception 'Invalid invitation token.';
  end if;

  -- 2. Resolve caller email securely
  v_caller_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_caller_email = '' then
    select lower(email) into v_caller_email from auth.users where id = v_user_id;
  end if;

  if v_caller_email is null or v_caller_email = '' then
    raise exception 'Unable to resolve authenticated user email.';
  end if;

  -- 3. Lock invitation row FOR UPDATE to guarantee atomicity & eliminate race conditions
  select * into v_inv
  from public.wedding_invitations
  where token = trim(p_token)
  for update;

  if not found then
    raise exception 'Invitation not found or invalid token.';
  end if;

  -- 4. Idempotency check: if already accepted by THIS user, return success cleanly
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

  -- 5. Revocation & non-pending status check
  if v_inv.status = 'Revoked' then
    raise exception 'This invitation was revoked by the wedding host.';
  end if;

  if v_inv.status != 'Pending' then
    raise exception 'This invitation is no longer active.';
  end if;

  -- 6. Expiry check
  if v_inv.expires_at < now() then
    update public.wedding_invitations
    set status = 'Expired', updated_at = now()
    where id = v_inv.id;
    raise exception 'This invitation has expired.';
  end if;

  -- 7. Email match check: authenticated email MUST match invited email
  if lower(trim(v_inv.email)) != v_caller_email then
    raise exception 'Email mismatch: This invitation was sent to % but you are signed in as %.', v_inv.email, v_caller_email;
  end if;

  -- 8. Privilege escalation guard: invitations can NEVER grant OWNER role
  if v_inv.role = 'OWNER' or v_inv.role not in ('FAMILY_ADMIN', 'CONTRIBUTOR', 'VIEWER') then
    raise exception 'Invalid invitation: Invitations cannot grant the OWNER role.';
  end if;

  -- 9. Resolve display name
  v_display_name := coalesce(
    nullif(trim(v_inv.display_name), ''),
    nullif(trim(auth.jwt() -> 'user_metadata' ->> 'full_name'), ''),
    split_part(v_caller_email, '@', 1)
  );

  -- 10. Atomic membership upsert into wedding_members
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

  -- 11. Mark invitation as accepted
  update public.wedding_invitations
  set
    status = 'Accepted',
    accepted_at = now(),
    accepted_by = v_user_id,
    updated_at = now()
  where id = v_inv.id;

  -- 12. Audit log into wedding_activity
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
