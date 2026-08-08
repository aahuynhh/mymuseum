-- MyMuseum: Phase 2 hotfix #3 -- drop the museum-ownership exists() check
-- from the Storage INSERT/UPDATE policies entirely. 0004 and 0005 each
-- tried to fix artwork_images_select_owner_or_published (adding
-- storage.object.upload to its allow_any_operation() list, then dropping
-- operation-awareness from its owner branch) and real uploads still failed
-- with "new row violates row-level security policy" / AccessDenied / 403,
-- despite every condition -- owner-id path prefix, museum ownership,
-- authenticated session -- independently confirmed correct via diagnostic
-- logging (including storage.foldername() itself parsing both path
-- segments correctly).
--
-- Run this against any database that already has 0003/0004/0005 applied
-- (i.e. dev). A fresh install running 0001-0003 in order gets the
-- corrected policies directly from the updated 0003_artwork_storage.sql
-- and does not need this file, 0004, or 0005; running it there too is
-- harmless (drop-if-exists + recreate). 0004 and 0005 are left as-is, not
-- rewritten -- they already ran against the dev database, and this
-- migration supersedes their INSERT/UPDATE-adjacent reasoning outright
-- rather than editing history. (0004/0005 only ever touched the SELECT
-- policy, never INSERT/UPDATE -- this is the first migration to change
-- those.)
--
-- New responsibility split, going forward: Storage RLS enforces only
-- "correct bucket, authenticated user writing beneath their own UUID
-- prefix." Whether an artwork can actually reference a given museum is
-- enforced entirely by the artworks table's own RLS
-- (artworks_insert_own/_update_own, 0003_artwork_storage.sql) plus
-- artworks_sync_owner_trigger, which are both unchanged by this migration.
-- This isn't a security regression, it's a relocation: a Storage object at
-- {ownerId}/{museumId}/{artworkId}.{ext} where {museumId} isn't actually
-- owned by {ownerId} is just an orphan under the uploader's own folder --
-- artworks_insert_own's exists() check means no artworks row can ever be
-- created pointing at a museum_id the caller doesn't own, so that object
-- can never become a real, renderable artwork regardless of what path it
-- was uploaded to, and it stays reachable only by its own owner (the
-- unchanged owner-prefix SELECT/DELETE policies) -- it can never match the
-- anonymous/published SELECT branch either, since that branch requires a
-- real artworks row referencing the exact storage_path.

drop policy if exists "artwork_images_insert_own" on storage.objects;
drop policy if exists "artwork_images_update_own" on storage.objects;

create policy "artwork_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'artwork-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Not currently exercised by the app (uploadArtworkImage always calls
-- .upload(..., { upsert: false }), never .update()), kept for whenever
-- in-place image replacement is built, and simplified to the same
-- boundary as INSERT above rather than left as a landmine for that future
-- feature -- it would hit the identical RETURNING-requires-SELECT problem
-- the moment it was ever actually used.
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
