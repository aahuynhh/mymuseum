-- MyMuseum: owner-chosen museum cover thumbnail
-- Run once in the Supabase SQL editor (or `supabase db push`), after
-- 0001_init.sql through 0007.
--
-- Lets an owner pick which of their own uploaded artworks is used as a
-- museum's dashboard/explore thumbnail, instead of always defaulting to the
-- first artwork by display order (see server/museumsRepository.ts's
-- getCoverImageUrls, which now prefers this column and falls back to that
-- old first-by-display-order behavior when it's null).
--
-- `on delete set null` means removing the chosen artwork (EditArtworkRow's
-- Remove) automatically reverts the museum to the fallback behavior rather
-- than leaving a dangling reference -- no extra cleanup code needed.
alter table public.museums
  add column cover_artwork_id text references public.artworks(id) on delete set null;

-- No RLS changes needed: museums_update_own (0001_init.sql) already covers
-- any column on this table, including this one.
