-- MyMuseum: creator profile bio + avatar
-- Run once in the Supabase SQL editor (or `supabase db push`), after
-- 0001_init.sql through 0006.
--
-- Adds the fields needed for a real, editable public artist profile --
-- previously `profiles` only carried username/display_name (0001_init.sql).
-- No RLS changes needed: profiles_select_all (public read) and
-- profiles_update_own (self-write, from 0001_init.sql) already cover any
-- column on this table, including these two.
--
-- avatar_configuration's default matches DEFAULT_AVATAR_CONFIGURATION in
-- types/avatar.ts exactly, so every existing profile (and every future one,
-- via handle_new_user's trigger insert, which doesn't set this column) gets
-- a valid, ready-to-render avatar with no null-handling needed anywhere in
-- the app.
alter table public.profiles
  add column bio text not null default '',
  add column avatar_configuration jsonb not null default '{
    "skinTone": "honey",
    "hairStyle": "curly-bob",
    "hairColor": "chestnut",
    "top": "sunset-sweater",
    "bottom": "wide-trousers",
    "shoes": "canvas-sneakers",
    "accessory": "round-glasses"
  }'::jsonb;
