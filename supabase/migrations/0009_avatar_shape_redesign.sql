-- MyMuseum: geometric shape-character avatar redesign
-- Run once in the Supabase SQL editor (or `supabase db push`), after
-- 0001_init.sql through 0008.
--
-- Avatars moved from small humanoid figures to geometric shape-characters
-- (see types/avatar.ts, components/avatar/AvatarModel.tsx). Field *names* on
-- avatar_configuration are unchanged (skinTone/hairStyle/top/bottom/shoes
-- still exist), but their meaning and valid values changed:
--   - a new required `bodyShape` field selects the character's silhouette
--   - skinTone now holds a body-color palette value (was a skin-tone palette)
--   - hairStyle now holds a head-decoration value (was a human hairstyle)
--   - "beret" moved from the accessory enum to the hairStyle enum
-- This updates the column default for new rows and backfills every existing
-- row to the new DEFAULT_AVATAR_CONFIGURATION shape (types/avatar.ts) rather
-- than attempting a lossy field-by-field remap of old values that no longer
-- have equivalents (e.g. "porcelain" skin tone has no corresponding body color).
alter table public.profiles
  alter column avatar_configuration set default '{
    "bodyShape": "rounded-cube",
    "skinTone": "citrus",
    "hairStyle": "tuft",
    "hairColor": "chestnut",
    "top": "sunset-sweater",
    "bottom": "wide-trousers",
    "shoes": "canvas-sneakers",
    "accessory": "round-glasses"
  }'::jsonb;

update public.profiles
set avatar_configuration = '{
  "bodyShape": "rounded-cube",
  "skinTone": "citrus",
  "hairStyle": "tuft",
  "hairColor": "chestnut",
  "top": "sunset-sweater",
  "bottom": "wide-trousers",
  "shoes": "canvas-sneakers",
  "accessory": "round-glasses"
}'::jsonb
where not (avatar_configuration ? 'bodyShape');
