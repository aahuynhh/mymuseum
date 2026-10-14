-- MyMuseum: fix avatar_configuration rows missing "expression"
-- Run once in the Supabase SQL editor (or `supabase db push`), after 0010.
--
-- 0009_avatar_shape_redesign.sql set the column default and backfilled every
-- existing row to a shape that never included "expression" (see
-- types/avatar.ts's AvatarConfiguration / EXPRESSION_OPTIONS, added after
-- that migration was written). PATCH /api/profile validates that field is
-- present (app/api/profile/route.ts's isValidAvatarConfiguration), so any
-- profile still missing it fails to save with "Invalid avatar configuration."
alter table public.profiles
  alter column avatar_configuration set default '{
    "bodyShape": "rounded-cube",
    "skinTone": "citrus",
    "hairStyle": "tuft",
    "hairColor": "chestnut",
    "top": "sunset-sweater",
    "bottom": "wide-trousers",
    "shoes": "canvas-sneakers",
    "accessory": "round-glasses",
    "expression": "standard"
  }'::jsonb;

update public.profiles
set avatar_configuration = avatar_configuration || '{"expression": "standard"}'::jsonb
where not (avatar_configuration ? 'expression');
