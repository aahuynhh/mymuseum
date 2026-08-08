-- MyMuseum: Phase 2 hotfix -- artwork_images_select_owner_or_published was
-- missing storage.object.upload in its owner branch.
--
-- Run this against any database that already has 0003_artwork_storage.sql
-- applied (i.e. dev). A fresh install running 0001-0003 in order gets the
-- corrected policy directly from the updated 0003_artwork_storage.sql and
-- does not need this file, but running it there too is harmless (drop-if-
-- exists + recreate).
--
-- Root cause: a plain Storage object upload (storage.object.upload, which
-- artwork_images_insert_own's WITH CHECK governs) performs an
-- INSERT ... RETURNING under the hood, and the RETURNING clause requires
-- the newly-created storage.objects row to also satisfy a SELECT policy --
-- not just INSERT's WITH CHECK. The owner branch of
-- artwork_images_select_owner_or_published only allowed
-- sign/sign_many/list/list_v2, never upload, so every real upload was
-- rejected with "new row violates row-level security policy" (AccessDenied,
-- 403) despite every INSERT-policy condition (owner-id path prefix, museum
-- ownership, authenticated session) independently confirmed to pass.
--
-- This migration only touches that one SELECT policy. The bucket,
-- artworks table, owner-sync trigger, and every INSERT/UPDATE/DELETE
-- Storage policy are untouched -- do not re-run 0003 to "fix" this, it will
-- fail on the already-existing bucket/table/trigger.

drop policy if exists "artwork_images_select_owner_or_published" on storage.objects;

create policy "artwork_images_select_owner_or_published"
  on storage.objects for select
  to public
  using (
    bucket_id = 'artwork-images'
    and (
      (
        -- Owner: upload, mint signed URLs for their own artwork, and list
        -- their own folder (the latter needed by deleteArtworkFolder's
        -- cleanup step, including for orphans left after their museum row
        -- is gone -- this condition depends only on the path prefix
        -- matching auth.uid(), never on a museum row existing).
        (storage.foldername(name))[1] = auth.uid()::text
        and storage.allow_any_operation(array[
          'storage.object.upload',
          'storage.object.sign',
          'storage.object.sign_many',
          'storage.object.list',
          'storage.object.list_v2'
        ])
      )
      or
      (
        -- Anyone, including anonymous visitors, can mint a signed URL for a
        -- specific published museum's artwork -- but 'upload'/'list'/
        -- 'list_v2' are deliberately excluded here: anonymous visitors
        -- should only ever be able to sign published artwork, never upload
        -- or enumerate a folder/bucket.
        storage.allow_any_operation(array['storage.object.sign', 'storage.object.sign_many'])
        and exists (
          select 1 from public.artworks a
          join public.museums m on m.id = a.museum_id
          where a.storage_path = storage.objects.name and m.is_published = true
        )
      )
    )
  );
