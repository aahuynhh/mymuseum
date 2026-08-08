-- MyMuseum: Phase 2 hotfix #2 -- artwork_images_select_owner_or_published's
-- owner branch still blocked real uploads even after 0004 added
-- storage.object.upload to its allow_any_operation() list.
--
-- Run this against any database that already has 0004 applied (i.e. dev).
-- A fresh install running 0001-0003 in order gets the corrected policy
-- directly from the updated 0003_artwork_storage.sql and does not need
-- this file or 0004; running it there too is harmless (drop-if-exists +
-- recreate). 0004 itself is left as-is, not rewritten -- it already ran
-- against the dev database, and this migration supersedes its owner
-- branch outright rather than editing history.
--
-- Root cause (continued from 0004): a Storage object upload performs an
-- INSERT ... RETURNING under the hood, and RETURNING requires the
-- newly-created row to also satisfy a SELECT policy. Adding
-- storage.object.upload to the owner branch's allow_any_operation() list
-- (0004) was still not enough -- the upload kept failing with "new row
-- violates row-level security policy" / AccessDenied / 403, despite every
-- INSERT-policy condition (owner-id path prefix, museum ownership,
-- authenticated session) independently confirmed to pass via diagnostic
-- logging. Rather than keep guessing at which exact operation name(s) the
-- upload/RETURNING path checks internally, the owner branch now drops
-- operation-awareness entirely: bucket_id + owner-id path prefix is the
-- only condition. An authenticated user can select/list/sign/upload only
-- underneath their own UUID folder -- the same boundary
-- artwork_images_insert_own/_update_own/_delete_own already enforce for
-- writes, so this grants no capability beyond "do anything to your own
-- folder." The anonymous/published branch is unchanged: still
-- operation-aware, still restricted to sign/sign_many only, so anonymous
-- visitors still cannot list, upload, or reach private museum artwork.

drop policy if exists "artwork_images_select_owner_or_published" on storage.objects;

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
