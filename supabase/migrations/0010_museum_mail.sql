-- MyMuseum: Museum Mail (async private messaging)
-- Run once in the Supabase SQL editor (or `supabase db push`), after
-- 0001_init.sql through 0009.
--
-- Adds a deliberately quiet, asynchronous messaging system -- signed-in
-- visitors can leave a private note for a museum's artist (optionally tied
-- to a specific artwork), and the artist can reply whenever. This is not
-- chat: there's no presence, no delivery/typing state, nothing live at all,
-- just rows in a table read on page load. See server/messagesRepository.ts
-- for how these are queried.

-- ---------------------------------------------------------------------
-- profiles: opt-out switch for incoming mail. Defaults to true so every
-- existing artist stays reachable exactly as they implicitly already were
-- before this feature existed -- the same "reachable by default, opt out
-- if you don't want it" lean museums.is_published's own default took
-- (0002_museum_visibility.sql). No RLS changes needed: profiles_select_all
-- and profiles_update_own (0001_init.sql) already cover any column on this
-- table, same precedent 0007_profile_bio_avatar.sql set.
-- ---------------------------------------------------------------------
alter table public.profiles
  add column accepts_messages boolean not null default true;

-- ---------------------------------------------------------------------
-- messages: one flat, self-threading table for every note and reply. A
-- thread's identity is its own root message -- the first message in a
-- conversation has thread_id = its own id; every reply is a new row whose
-- thread_id points back at that same root. There's no separate `threads`
-- table: that would just be a second RLS surface duplicating
-- sender_id/recipient_id, which are already implicit on every row here --
-- the same "denormalize instead of adding a join table" instinct
-- artworks.owner_id already uses (see 0003_artwork_storage.sql).
--
-- sender_id/recipient_id reference auth.users(id), not profiles.id, matching
-- museums.owner_id/artworks.owner_id's existing convention -- a message is
-- between two accounts; profiles is a separate app-level identity concept
-- that only happens to be 1:1 with auth.users today. There is no FK from
-- messages straight to profiles, same as museums/artworks -- resolving a
-- sender/recipient's username/display name is a separate JS-side join, the
-- same pattern getCreatorsByOwnerId already established.
--
-- id/thread_id are supplied by the app (crypto.randomUUID(), in
-- server/messagesRepository.ts), the same "app generates the primary key"
-- convention museums.id/artworks.id's slugs already use -- this sidesteps a
-- DB default trying to reference the row's own not-yet-assigned id for a
-- brand new thread.
--
-- museum_id/artwork_id are denormalized onto every row in a thread (not
-- just the root), so listing a user's threads never has to join back to a
-- root message to know what a thread is about.
--
-- report is two plain columns on the message itself, not a separate
-- message_reports table -- there's no moderation/admin UI to review reports
-- against yet anywhere in this app, so a second table would exist purely to
-- log rows nobody reads. Revisit as a real table once moderation tooling
-- exists.
-- ---------------------------------------------------------------------
create table public.messages (
  id uuid primary key,
  thread_id uuid not null references public.messages(id),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  museum_id text references public.museums(id) on delete set null,
  artwork_id text references public.artworks(id) on delete set null,
  body text not null,
  read_at timestamptz,
  reported_at timestamptz,
  report_reason text,
  created_at timestamptz not null default now(),
  constraint messages_no_self_message check (sender_id <> recipient_id),
  -- 2000 mirrors MAX_MESSAGE_BODY_LENGTH in lib/messages/limits.ts -- kept
  -- in sync by hand across SQL and TS, the same documented tradeoff
  -- lib/artwork/limits.ts's MAX_TOTAL_REQUEST_BYTES vs. server.mjs's own
  -- copy of that number already accepts.
  constraint messages_body_length check (char_length(body) > 0 and char_length(body) <= 2000)
);

-- Thread-detail fetch and the "latest message per thread" DISTINCT ON
-- query (server/messagesRepository.ts) both want exactly this order.
create index messages_thread_id_created_at_idx on public.messages (thread_id, created_at desc);
-- Sender-side lookups + the rate-limit COUNT(*) window query.
create index messages_sender_id_created_at_idx on public.messages (sender_id, created_at desc);
-- Recipient-side lookups (inbox listing's OR branch).
create index messages_recipient_id_created_at_idx on public.messages (recipient_id, created_at desc);
-- Partial index for the unread-dot check -- cheap since unread rows are a
-- small, shrinking fraction of the table.
create index messages_unread_idx on public.messages (recipient_id) where read_at is null;

-- ---------------------------------------------------------------------
-- message_blocks: who has blocked whom. A block is a hard stop on all
-- future contact from that person, checked inside messages_insert_own
-- below -- it is not just an inbox filter.
-- ---------------------------------------------------------------------
create table public.message_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint message_blocks_no_self_block check (blocker_id <> blocked_id),
  primary key (blocker_id, blocked_id)
);

-- ---------------------------------------------------------------------
-- Row Level Security. This app never uses a service-role client (see
-- lib/supabase/server.ts's header comment) -- RLS is the real enforcement
-- boundary for every safety control this feature has, not just app code in
-- server/messagesRepository.ts. That module's own pre-checks exist only to
-- return a friendly, specific error string; these policies are what
-- actually make each rule true no matter which door a request comes
-- through.
-- ---------------------------------------------------------------------
alter table public.messages enable row level security;
alter table public.message_blocks enable row level security;

-- Only the two participants of a message can ever read it. No policy
-- applies to the anon role at all (both policies below are `to
-- authenticated`), so an unauthenticated request returns zero rows --
-- "private by default" falls out of RLS's own default-deny behavior, no
-- explicit deny-all policy required.
create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

-- Which ROWS may be updated (must be a message you received) is enforced
-- here; which COLUMNS may change (only read_at for marking read, only
-- reported_at/report_reason for reporting) is enforced by
-- server/messagesRepository.ts's hand-built update payloads -- the same
-- division of labor updateMuseumMetadata's MuseumMetadataPatch already
-- uses.
create policy "messages_update_recipient"
  on public.messages for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- The insert policy is where all of this feature's safety controls
-- actually live: self-send, an artist's accepts_messages setting, blocking,
-- and a rate-limit ceiling.
create policy "messages_insert_own"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and sender_id <> recipient_id
    -- Blocking is a top-level AND (not nested inside either branch below),
    -- so it applies equally to a brand new thread and a reply into one
    -- already in progress.
    and not exists (
      select 1 from public.message_blocks b
      where b.blocker_id = recipient_id and b.blocked_id = sender_id
    )
    -- Loose backstop -- server/messagesRepository.ts's own pre-check uses a
    -- stricter, friendlier ceiling (lib/messages/limits.ts), so ordinary
    -- traffic should never actually reach this one; it only fires against
    -- direct-API abuse that skips the app layer entirely.
    and (
      select count(*) from public.messages m
      where m.sender_id = auth.uid() and m.created_at > now() - interval '1 hour'
    ) < 30
    and (
      (
        -- Starting a new thread: this row's own id must equal its
        -- thread_id, and the recipient must currently accept messages.
        thread_id = id
        and exists (
          select 1 from public.profiles p
          where p.id = recipient_id and p.accepts_messages = true
        )
      )
      or
      -- Replying inside an existing thread: that thread must already
      -- contain a row with this exact sender/recipient pair, in either
      -- order. accepts_messages is deliberately NOT re-checked here --
      -- disabling incoming messages only blocks new, unsolicited notes, it
      -- never severs a conversation already in progress, which is what
      -- keeps this feature genuinely bidirectional (a visitor who sent a
      -- note can still see and receive the artist's reply even after the
      -- artist later turns Museum Mail off).
      exists (
        select 1 from public.messages existing
        where existing.thread_id = messages.thread_id
          and (
            (existing.sender_id = sender_id and existing.recipient_id = recipient_id)
            or (existing.sender_id = recipient_id and existing.recipient_id = sender_id)
          )
      )
    )
  );

-- message_blocks: a user can see block relationships they created OR are
-- the target of. The "blocked_id = auth.uid()" half is not optional --
-- messages_insert_own's block-check subquery above runs as the SENDER, and
-- RLS on message_blocks applies to that access too. Without this half, a
-- sender's own view of message_blocks would never contain a row where
-- they're the one being blocked, so that subquery would find nothing and
-- the block would silently fail to be enforced.
create policy "message_blocks_select_participant"
  on public.message_blocks for select
  to authenticated
  using (blocker_id = auth.uid() or blocked_id = auth.uid());

create policy "message_blocks_insert_own"
  on public.message_blocks for insert
  to authenticated
  with check (blocker_id = auth.uid());

create policy "message_blocks_delete_own"
  on public.message_blocks for delete
  to authenticated
  using (blocker_id = auth.uid());
