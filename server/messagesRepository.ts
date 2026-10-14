import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseServerClient } from "@/server/museumsRepository";
import { artworkExistsInMuseum } from "@/server/artworksRepository";
import { getAcceptsMessages } from "@/server/profilesRepository";
import {
  RATE_LIMIT_WINDOW_MINUTES,
  RATE_LIMIT_MAX_SENDS_PER_WINDOW,
  RATE_LIMIT_MAX_NEW_THREADS_PER_WINDOW,
} from "@/lib/messages/limits";

/**
 * Postgres-backed store for Museum Mail (supabase/migrations/0010_museum_mail.sql).
 * Every call goes through a request-scoped Supabase client on the caller's
 * own session, so RLS -- not this module -- is the real enforcement
 * boundary for who can read/send what. The pre-checks here (self-send,
 * accepts_messages, blocking, rate limit) exist only to turn a rejection
 * into a specific, friendly error string instead of a raw PostgREST error;
 * see 0010_museum_mail.sql's messages_insert_own policy for the actual,
 * unbypassable backstop behind each one.
 *
 * `messages` is a single flat, self-threading table -- a thread's identity
 * is its own root message (thread_id = that row's own id), so "list
 * threads" and "fetch one thread" both work off thread_id alone with no
 * separate `threads` table to join through.
 */

export type SendMessageResult = { ok: true; threadId: string } | { ok: false; error: string };

interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  recipient_id: string;
  museum_id: string | null;
  artwork_id: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
  reported_at: string | null;
}

/** Batched profiles(id) -> {username, displayName} lookup, the same shape
 * museumsRepository.ts's (private) getCreatorsByOwnerId already uses --
 * duplicated here rather than imported since that helper isn't exported,
 * and messages/museums resolve creators for different reasons. */
async function getProfilesById(
  supabase: SupabaseServerClient,
  ids: string[]
): Promise<Map<string, { username: string; displayName: string }>> {
  const result = new Map<string, { username: string; displayName: string }>();
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return result;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", uniqueIds);
  if (error || !data) return result;

  for (const row of data) {
    result.set(row.id, { username: row.username, displayName: row.display_name });
  }
  return result;
}

/** Returns a friendly error string if `senderId` has hit the rate limit,
 * or `null` if they're clear to send. Fetches just the sender's own
 * messages in the current window (id, thread_id) and checks both the
 * overall-sends cap and, for a new thread, the tighter new-threads cap in
 * memory -- PostgREST has no column-to-column ("thread_id = id") filter,
 * so "is this row a thread root" can't be expressed as a query filter
 * directly. Fails open (returns null) if the check itself errors, so a
 * transient read failure never blocks someone from sending. */
async function checkRateLimit(
  supabase: SupabaseServerClient,
  senderId: string,
  isNewThread: boolean
): Promise<string | null> {
  const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
  const { data, error } = await supabase
    .from("messages")
    .select("id, thread_id")
    .eq("sender_id", senderId)
    .gte("created_at", cutoff);

  if (error) {
    console.error("[messages] failed to check rate limit:", error.message, senderId);
    return null;
  }

  if (data.length >= RATE_LIMIT_MAX_SENDS_PER_WINDOW) {
    return "You're sending notes too quickly. Try again in a bit.";
  }
  if (isNewThread) {
    const newThreadCount = data.filter((row) => row.thread_id === row.id).length;
    if (newThreadCount >= RATE_LIMIT_MAX_NEW_THREADS_PER_WINDOW) {
      return "You've started a lot of new conversations recently. Try again in a bit.";
    }
  }
  return null;
}

/**
 * Starts a new thread from a museum's viewer. Never trusts a client-
 * supplied recipient id -- recipientId is resolved server-side from
 * museums.owner_id, through the same RLS-scoped read every museum page
 * already uses, so a sender can only reach an artist via a museum they're
 * actually allowed to see (published, or their own).
 */
export async function sendNewThreadMessage(input: {
  senderId: string;
  museumId: string;
  artworkId?: string | null;
  body: string;
}): Promise<SendMessageResult> {
  const supabase = await createClient();

  const { data: museum, error: museumError } = await supabase
    .from("museums")
    .select("owner_id")
    .eq("id", input.museumId)
    .maybeSingle();
  if (museumError || !museum) return { ok: false, error: "Museum not found." };

  const recipientId = museum.owner_id;
  if (recipientId === input.senderId) {
    return { ok: false, error: "You can't send a note about your own museum." };
  }

  if (input.artworkId) {
    const belongs = await artworkExistsInMuseum(input.artworkId, input.museumId);
    if (!belongs) return { ok: false, error: "That artwork couldn't be found." };
  }

  const accepts = await getAcceptsMessages(recipientId);
  if (!accepts) {
    return { ok: false, error: "This artist isn't accepting messages right now." };
  }

  if (await isBlocked(recipientId, input.senderId)) {
    return { ok: false, error: "This note couldn't be delivered right now." };
  }

  const rateLimitError = await checkRateLimit(supabase, input.senderId, true);
  if (rateLimitError) return { ok: false, error: rateLimitError };

  const id = randomUUID();
  const { error } = await supabase.from("messages").insert({
    id,
    thread_id: id,
    sender_id: input.senderId,
    recipient_id: recipientId,
    museum_id: input.museumId,
    artwork_id: input.artworkId ?? null,
    body: input.body,
  });

  if (error) {
    console.error("[messages] failed to send new thread message:", error.message, input.senderId);
    return { ok: false, error: "Couldn't send your note. Please try again." };
  }

  return { ok: true, threadId: id };
}

/**
 * Starts a new thread from an artist's public profile page, with no museum
 * or artwork context -- museum_id/artwork_id land as null on the row, which
 * the schema and messages_insert_own policy already treat as optional (see
 * 0010_museum_mail.sql). Unlike sendNewThreadMessage, recipientId comes
 * straight from the client (it's just the profile page the sender is
 * already looking at, not a value read out of a museum's owner_id), but
 * it's still verified against `profiles` before use rather than trusted
 * outright, so a nonexistent id fails with a friendly error instead of an
 * FK violation.
 */
export async function sendNewThreadMessageToRecipient(input: {
  senderId: string;
  recipientId: string;
  body: string;
}): Promise<SendMessageResult> {
  const supabase = await createClient();

  if (input.recipientId === input.senderId) {
    return { ok: false, error: "You can't send a note to yourself." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", input.recipientId)
    .maybeSingle();
  if (profileError || !profile) return { ok: false, error: "That artist couldn't be found." };

  const accepts = await getAcceptsMessages(input.recipientId);
  if (!accepts) {
    return { ok: false, error: "This artist isn't accepting messages right now." };
  }

  if (await isBlocked(input.recipientId, input.senderId)) {
    return { ok: false, error: "This note couldn't be delivered right now." };
  }

  const rateLimitError = await checkRateLimit(supabase, input.senderId, true);
  if (rateLimitError) return { ok: false, error: rateLimitError };

  const id = randomUUID();
  const { error } = await supabase.from("messages").insert({
    id,
    thread_id: id,
    sender_id: input.senderId,
    recipient_id: input.recipientId,
    museum_id: null,
    artwork_id: null,
    body: input.body,
  });

  if (error) {
    console.error("[messages] failed to send profile message:", error.message, input.senderId);
    return { ok: false, error: "Couldn't send your note. Please try again." };
  }

  return { ok: true, threadId: id };
}

/**
 * Replies into an existing thread. recipientId is resolved server-side as
 * "whichever of the thread's two participants isn't senderId," read off
 * any existing row in the thread (RLS already scopes this read to threads
 * the sender actually participates in -- a thread they're not part of
 * comes back indistinguishable from "doesn't exist"). accepts_messages is
 * deliberately NOT re-checked here: disabling incoming messages blocks new,
 * unsolicited notes, never a conversation already in progress.
 */
export async function sendReplyMessage(input: {
  senderId: string;
  threadId: string;
  body: string;
}): Promise<SendMessageResult> {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("messages")
    .select("sender_id, recipient_id, museum_id, artwork_id")
    .eq("thread_id", input.threadId)
    .limit(1)
    .maybeSingle();

  if (existingError || !existing) return { ok: false, error: "Conversation not found." };

  const recipientId = existing.sender_id === input.senderId ? existing.recipient_id : existing.sender_id;
  if (recipientId === input.senderId) {
    return { ok: false, error: "Couldn't send your reply." };
  }

  if (await isBlocked(recipientId, input.senderId)) {
    return { ok: false, error: "This note couldn't be delivered right now." };
  }

  const rateLimitError = await checkRateLimit(supabase, input.senderId, false);
  if (rateLimitError) return { ok: false, error: rateLimitError };

  const id = randomUUID();
  const { error } = await supabase.from("messages").insert({
    id,
    thread_id: input.threadId,
    sender_id: input.senderId,
    recipient_id: recipientId,
    museum_id: existing.museum_id,
    artwork_id: existing.artwork_id,
    body: input.body,
  });

  if (error) {
    console.error("[messages] failed to send reply message:", error.message, input.senderId);
    return { ok: false, error: "Couldn't send your reply. Please try again." };
  }

  return { ok: true, threadId: input.threadId };
}

export interface ThreadSummary {
  threadId: string;
  otherParticipant: { id: string; username: string; displayName: string };
  museum: { id: string; name: string } | null;
  artwork: { id: string; title: string } | null;
  lastMessage: { body: string; senderId: string; createdAt: string };
  unreadCount: number;
}

/**
 * Inbox listing -- one row per thread the user participates in as either
 * sender or recipient, newest activity first. PostgREST/the JS client has
 * no DISTINCT ON, so this fetches every message the user is party to
 * (already sorted thread-then-newest-first) and reduces it to one row per
 * thread in memory -- the same "one query + JS-side reduction" shape
 * getCoverImageUrls/getCreatorsByOwnerId already use elsewhere.
 */
export async function listThreadsForUser(userId: string): Promise<ThreadSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("id, thread_id, sender_id, recipient_id, museum_id, artwork_id, body, read_at, created_at")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("thread_id", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const latestByThread = new Map<string, MessageRow>();
  const unreadCountByThread = new Map<string, number>();
  for (const row of data as MessageRow[]) {
    if (!latestByThread.has(row.thread_id)) {
      latestByThread.set(row.thread_id, row);
    }
    if (row.recipient_id === userId && row.read_at === null) {
      unreadCountByThread.set(row.thread_id, (unreadCountByThread.get(row.thread_id) ?? 0) + 1);
    }
  }

  const threads = [...latestByThread.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  if (threads.length === 0) return [];

  const otherIds = threads.map((t) => (t.sender_id === userId ? t.recipient_id : t.sender_id));
  const museumIds = [...new Set(threads.map((t) => t.museum_id).filter((id): id is string => id !== null))];
  const artworkIds = [...new Set(threads.map((t) => t.artwork_id).filter((id): id is string => id !== null))];

  const [profiles, museumsResult, artworksResult] = await Promise.all([
    getProfilesById(supabase, otherIds),
    museumIds.length
      ? supabase.from("museums").select("id, name").in("id", museumIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    artworkIds.length
      ? supabase.from("artworks").select("id, title").in("id", artworkIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const museumById = new Map((museumsResult.data ?? []).map((m) => [m.id, m]));
  const artworkById = new Map((artworksResult.data ?? []).map((a) => [a.id, a]));

  return threads.map((t) => {
    const otherId = t.sender_id === userId ? t.recipient_id : t.sender_id;
    const profile = profiles.get(otherId);
    const museum = t.museum_id ? museumById.get(t.museum_id) : undefined;
    const artwork = t.artwork_id ? artworkById.get(t.artwork_id) : undefined;
    return {
      threadId: t.thread_id,
      otherParticipant: {
        id: otherId,
        username: profile?.username ?? "unknown",
        displayName: profile?.displayName ?? "Unknown user",
      },
      museum: museum ? { id: museum.id, name: museum.name } : null,
      artwork: artwork ? { id: artwork.id, title: artwork.title } : null,
      lastMessage: { body: t.body, senderId: t.sender_id, createdAt: t.created_at },
      unreadCount: unreadCountByThread.get(t.thread_id) ?? 0,
    };
  });
}

export interface ThreadMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  reportedAt: string | null;
}

export interface ThreadDetail {
  threadId: string;
  otherParticipant: { id: string; username: string; displayName: string };
  museum: { id: string; name: string } | null;
  artwork: { id: string; title: string } | null;
  messages: ThreadMessage[];
}

/**
 * Full chronological message list for one thread. RLS scopes the read to
 * rows the caller is a participant in; if that leaves zero rows (thread
 * doesn't exist, or the caller isn't part of it), or if the returned rows
 * somehow don't include the caller (defensive, shouldn't happen given RLS),
 * this returns `null` -- the same not-found-or-not-owned convention used
 * throughout server/museumsRepository.ts.
 */
export async function getThreadMessages(threadId: string, userId: string): Promise<ThreadDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, museum_id, artwork_id, body, created_at, reported_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return null;

  const isParticipant = data.some((m) => m.sender_id === userId || m.recipient_id === userId);
  if (!isParticipant) return null;

  const first = data[0];
  const otherId = first.sender_id === userId ? first.recipient_id : first.sender_id;

  const [profiles, museumResult, artworkResult] = await Promise.all([
    getProfilesById(supabase, [otherId]),
    first.museum_id
      ? supabase.from("museums").select("id, name").eq("id", first.museum_id).maybeSingle()
      : Promise.resolve({ data: null as { id: string; name: string } | null }),
    first.artwork_id
      ? supabase.from("artworks").select("id, title").eq("id", first.artwork_id).maybeSingle()
      : Promise.resolve({ data: null as { id: string; title: string } | null }),
  ]);

  const profile = profiles.get(otherId);

  return {
    threadId,
    otherParticipant: {
      id: otherId,
      username: profile?.username ?? "unknown",
      displayName: profile?.displayName ?? "Unknown user",
    },
    museum: museumResult.data ? { id: museumResult.data.id, name: museumResult.data.name } : null,
    artwork: artworkResult.data ? { id: artworkResult.data.id, title: artworkResult.data.title } : null,
    messages: data.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      body: m.body,
      createdAt: m.created_at,
      reportedAt: m.reported_at,
    })),
  };
}

/** Marks every unread message in this thread addressed to `userId` as
 * read. Idempotent -- safe to call on every thread-detail page view
 * regardless of whether there's anything unread. */
export async function markThreadRead(threadId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .eq("recipient_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("[messages] failed to mark thread read:", error.message, threadId);
  }
}

/** Recipient-only. Returns `false` if `messageId` isn't found or `userId`
 * isn't its recipient (not-found-or-not-owned, same convention as
 * updateArtworkMetadata). Calling this again on an already-reported
 * message just refreshes the reason/timestamp -- there's no moderation
 * queue reading these yet, so there's nothing for a second report to
 * conflict with. */
export async function reportMessage(messageId: string, userId: string, reason: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .update({ reported_at: new Date().toISOString(), report_reason: reason || null })
    .eq("id", messageId)
    .eq("recipient_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[messages] failed to report message:", error.message, messageId);
  }
  return !error && data !== null;
}

export async function blockSender(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("message_blocks")
    .upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: "blocker_id,blocked_id" });

  if (error) {
    console.error("[messages] failed to block sender:", error.message, blockerId, blockedId);
    return false;
  }
  return true;
}

export async function unblockSender(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("message_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);

  if (error) {
    console.error("[messages] failed to unblock sender:", error.message, blockerId, blockedId);
    return false;
  }
  return true;
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message_blocks")
    .select("blocker_id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  return !error && data !== null;
}
