-- MyMuseum: profiles + museums + RLS
-- Run once in the Supabase SQL editor (or `supabase db push`).

-- ---------------------------------------------------------------------
-- profiles: one row per authenticated creator, auto-created on signup
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-provision a profile row when a new auth user is created, so signup
-- stays a single email+password step -- a unique username/display name is
-- generated from the email's local part.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]+', '-', 'g'));
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    base_username || '-' || substr(md5(random()::text), 1, 5), -- guarantees uniqueness
    initcap(replace(base_username, '-', ' '))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- museums: one row per user-created museum. Shape mirrors the existing
-- Museum type (types/museum.ts). Artwork images stay embedded as base64
-- data URLs inside `artworks` for now -- this migration moves the store,
-- not the image encoding (that's a later phase).
-- ---------------------------------------------------------------------
create table public.museums (
  id text primary key,              -- existing slug scheme, e.g. "late-afternoon-a3f9k"
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  theme text not null,
  spawn_point jsonb not null,
  rooms jsonb not null,
  opening_connectors jsonb not null,
  artworks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index museums_owner_id_idx on public.museums (owner_id);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.museums enable row level security;

-- profiles: public read, self-only update. No insert policy -- rows are
-- only created by the security-definer trigger above, so clients can
-- never insert directly.
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- museums: anyone (including anonymous visitors) can read any museum.
create policy "museums_select_all"
  on public.museums for select
  using (true);

-- authenticated users can create a museum, but only with their own id as
-- owner_id -- this is what makes ownership real instead of cosmetic.
create policy "museums_insert_own"
  on public.museums for insert
  to authenticated
  with check (owner_id = auth.uid());

-- only the owner can update their museum (future editing UI relies on this)
create policy "museums_update_own"
  on public.museums for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- only the owner can delete their museum
create policy "museums_delete_own"
  on public.museums for delete
  to authenticated
  using (owner_id = auth.uid());
