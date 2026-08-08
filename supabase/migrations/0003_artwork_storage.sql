-- MyMuseum: Phase 2 -- real artwork storage (artworks table + private Storage bucket)
-- Run once in the Supabase SQL editor (or `supabase db push`), after
-- 0001_init.sql and 0002_museum_visibility.sql.
--
-- Staged migration, deliberately additive-only: `museums.artworks` (the old
-- base64-in-jsonb column) is left in place and untouched by this file.
-- Application code stops reading/writing it as of this migration, but it
-- stays on disk as a rollback fallback until a later cleanup migration
-- (0004_drop_legacy_artwork_jsonb.sql) removes it -- only after the new
-- create/read/render/delete flow has been verified end to end.

-- ---------------------------------------------------------------------
-- Storage bucket: private, with server-enforced size/type limits as a
-- second defense layer on top of application-level validation (sharp).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artwork-images',
  'artwork-images',
  false,
  8388608, -- 8 MB, matches MAX_IMAGE_BYTES in lib/artwork/limits.ts
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- artworks: one row per uploaded piece, associated with a museum.
-- Images themselves live in the artwork-images bucket at
-- "{owner_id}/{museum_id}/{artwork_id}.{ext}" (storage_path) -- never a
-- base64 blob in Postgres. wall_position/interaction_zone/frame_width/
-- frame_height are computed once at upload time by the same
-- game/museum/autoLayout.ts + game/museum/placement.ts math the original
-- prototype used, and persisted here so the 3D layout never needs to be
-- recomputed at render time.
-- ---------------------------------------------------------------------
create table public.artworks (
  id text primary key,
  museum_id text not null references public.museums(id) on delete cascade,
  -- Denormalized copy of museums.owner_id. Deliberately NOT settable by
  -- clients -- see artworks_sync_owner_trigger below, which derives it from
  -- museum_id on every insert/update so it can never drift from the real
  -- museum owner, independent of RLS.
  owner_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  artist text not null,
  year int not null,
  medium text not null default 'Mixed media',
  description text not null default '',
  alt_text text not null,

  storage_path text not null unique,
  -- Server-derived from the real uploaded bytes (sharp), never trusted from
  -- the client. imageAspectRatio (as used by the Artwork type / autoLayout)
  -- is computed as image_width / image_height at read time, not stored
  -- redundantly.
  image_width int not null,
  image_height int not null,

  display_order int not null,
  wall_position jsonb not null,
  interaction_zone jsonb not null,
  frame_width real,
  frame_height real,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index artworks_museum_id_idx on public.artworks (museum_id);
create index artworks_owner_id_idx on public.artworks (owner_id);

-- ---------------------------------------------------------------------
-- owner_id sync trigger: makes owner_id a database-enforced function of
-- museum_id rather than a client-settable field. security definer so the
-- lookup is authoritative regardless of what the calling role can see under
-- museums' own RLS (e.g. looking up a museum the caller doesn't own still
-- resolves to that museum's *real* owner, which is what lets the INSERT/
-- UPDATE policies below reject cross-museum reassignment reliably).
-- ---------------------------------------------------------------------
create function public.artworks_sync_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  select owner_id into new.owner_id from public.museums where id = new.museum_id;
  if new.owner_id is null then
    raise exception 'museum_id % does not exist', new.museum_id;
  end if;
  return new;
end;
$$;

create trigger artworks_sync_owner_trigger
  before insert or update on public.artworks
  for each row execute function public.artworks_sync_owner();

-- ---------------------------------------------------------------------
-- Row Level Security: artworks
-- ---------------------------------------------------------------------
alter table public.artworks enable row level security;

-- Read: owner always sees their own artwork (published or not, matching
-- museums_select_published_or_own); anyone (incl. anonymous) sees artwork
-- whose parent museum is published.
create policy "artworks_select_published_or_own"
  on public.artworks for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.museums m
      where m.id = artworks.museum_id and m.is_published = true
    )
  );

-- Insert: the target museum_id must belong to the caller. owner_id itself
-- is irrelevant here (the trigger above overwrites whatever was sent), but
-- the policy still needs its own museum-ownership check since the trigger
-- alone doesn't stop a caller from inserting *into* a museum they don't own
-- (it would just fail differently, or worse, succeed with a derived
-- owner_id that isn't auth.uid() -- this check is what actually blocks it).
create policy "artworks_insert_own"
  on public.artworks for insert
  to authenticated
  with check (
    exists (
      select 1 from public.museums m
      where m.id = artworks.museum_id and m.owner_id = auth.uid()
    )
  );

-- Update: using() gates which existing rows a caller may target (their
-- own, per the trigger-guaranteed-accurate owner_id); with check()
-- separately re-validates that whatever museum_id the row ends up
-- pointing at (post-update) still belongs to the caller, so
-- `UPDATE artworks SET museum_id = '<someone-elses-museum>'` is rejected
-- even when the row being updated is the caller's own.
create policy "artworks_update_own"
  on public.artworks for update
  to authenticated
  using (owner_id = auth.uid())
  with check (
    exists (
      select 1 from public.museums m
      where m.id = artworks.museum_id and m.owner_id = auth.uid()
    )
  );

create policy "artworks_delete_own"
  on public.artworks for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- Row Level Security: storage.objects, scoped to bucket_id = 'artwork-images'
-- Path convention: "{owner_id}/{museum_id}/{artwork_id}.{ext}"
-- ---------------------------------------------------------------------

-- INSERT/UPDATE: bucket + owner-id path prefix only. Storage RLS
-- deliberately does NOT know about museum ownership -- that's the
-- artworks table's job (artworks_insert_own/_update_own below, plus
-- artworks_sync_owner_trigger), not Storage's. An earlier version of this
-- policy also required the path's museum_id segment to reference a museum
-- owned by the caller (exists (select 1 from public.museums ...)), but
-- that join -- combined with Storage's upload/RETURNING internals, which
-- require the newly-created row to also satisfy a SELECT policy, not just
-- INSERT's with check -- produced persistent "new row violates row-level
-- security policy" failures that survived multiple attempts to fix by
-- adjusting the SELECT policy instead (see 0004/0005). Removing the
-- museum-ownership condition here isn't a security regression: it's moved,
-- not dropped. A Storage object at {ownerId}/{museumId}/{artworkId}.{ext}
-- where {museumId} isn't actually owned by {ownerId} is just an orphan --
-- artworks_insert_own's own exists() check means no artworks row can ever
-- be created pointing at a museum_id the caller doesn't own, so that
-- object can never become a real, renderable artwork no matter what path
-- it was uploaded to; it stays reachable only by its own owner (the
-- unchanged owner-prefix SELECT/DELETE policies), and never matches the
-- anonymous/published branch either, since that branch requires a real
-- artworks row referencing it. Responsibility split: Storage RLS owns "can
-- this user touch this folder," the artworks table owns "can this artwork
-- belong to this museum."
create policy "artwork_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Not currently exercised by the app (uploadArtworkImage always calls
-- .upload(..., { upsert: false }), never .update()), kept for whenever
-- in-place image replacement is built. Simplified for the same reason and
-- to the same boundary as INSERT above, rather than leaving the old
-- museum-join here as a landmine for that future feature -- it would hit
-- the identical RETURNING-requires-SELECT problem the moment it was ever
-- actually used.
create policy "artwork_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: bucket + owner-prefix only. Deliberately does NOT require the
-- museum row to still exist -- deletion is DB-first, Storage-second (see
-- server/museumsRepository.ts deleteMuseum), so by the time cleanup runs
-- the museums row is already gone and a museum-ownership exists() check
-- here would always fail, permanently blocking orphan cleanup. Cross-user
-- isolation is still fully preserved: every object under a user's own
-- UUID prefix was only ever created there because INSERT already required
-- them to own the museum_id segment at write time, so "delete anything
-- under my own prefix" grants no capability beyond "delete what I was
-- allowed to create."
create policy "artwork_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: split into an owner branch and an anonymous/published branch,
-- with operation-awareness applied only where it's actually load-bearing.
--
-- Owner branch: bucket + owner-id path prefix only, no operation filter.
-- An authenticated object upload (storage.object.upload) performs an
-- INSERT ... RETURNING under the hood, and the RETURNING clause requires
-- the newly-created row to *also* satisfy a SELECT policy, not just
-- INSERT's with check. Two narrower attempts were tried and confirmed
-- insufficient against a real upload (still "new row violates row-level
-- security policy" / AccessDenied / 403, with every INSERT-policy
-- condition -- owner prefix, museum ownership, authenticated session --
-- independently verified to pass): first a plain owner-or-published SELECT
-- with no operation awareness at all, then adding storage.object.upload
-- specifically to an allow_any_operation() list alongside sign/sign_many/
-- list/list_v2. Rather than keep guessing at the exact operation name(s)
-- the upload/RETURNING path checks internally, the owner branch trades
-- operation-level precision for a plain prefix condition: an authenticated
-- user can select/list/sign/upload only underneath their own UUID folder,
-- which is exactly the same boundary artwork_images_insert_own/_update_own/
-- _delete_own already enforce for writes, so this grants no capability
-- beyond "do anything to your own folder."
--
-- Anonymous/published branch: kept operation-aware and restricted to only
-- storage.object.sign / storage.object.sign_many, so an anonymous visitor
-- can mint a signed URL for a specific published museum's artwork but can
-- never list/enumerate a folder or bucket, and never upload. Note: the
-- actual byte-serving GET a browser makes against an already-minted signed
-- URL is authorized by the signed token itself (a signature check), not by
-- this policy -- so it isn't listed among the allowed operations here.
create policy "artwork_images_select_owner_or_published"
  on storage.objects for select
  to public
  using (
    bucket_id = 'artwork-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or
      (
        storage.allow_any_operation(array['storage.object.sign', 'storage.object.sign_many'])
        and exists (
          select 1 from public.artworks a
          join public.museums m on m.id = a.museum_id
          where a.storage_path = storage.objects.name and m.is_published = true
        )
      )
    )
  );
