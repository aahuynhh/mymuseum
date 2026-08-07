-- MyMuseum: museum visibility (published/draft)
-- Run once in the Supabase SQL editor (or `supabase db push`), after 0001_init.sql.
--
-- Adds the smallest field needed to distinguish public museums from private
-- ones, and tightens the read policy accordingly. Defaults to `true` so
-- every museum created by the current /create flow (which has no
-- publish/unpublish control yet) keeps behaving exactly as it does today --
-- publicly viewable by a direct URL, no login required.

alter table public.museums
  add column is_published boolean not null default true;

drop policy "museums_select_all" on public.museums;

-- Anyone can read a published museum. A non-published (draft/private)
-- museum is only readable by its owner -- auth.uid() is null for an
-- anonymous request, and owner_id = null is never true, so anonymous
-- visitors and other signed-in users alike are excluded from a museum
-- that isn't theirs and isn't published.
create policy "museums_select_published_or_own"
  on public.museums for select
  using (is_published = true or owner_id = auth.uid());

-- museums_insert_own / museums_update_own / museums_delete_own (from
-- 0001_init.sql) are unchanged -- only the owner could ever write a museum,
-- which already satisfies "only the owner can update/delete a museum."
