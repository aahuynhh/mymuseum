/**
 * Museum Mail limits shared by the composer UI and the API/repository
 * validation layer. There's no rate-limiting infrastructure (Redis/Upstash)
 * anywhere in this app -- these caps are enforced with a plain `count(*)`
 * time-window query in server/messagesRepository.ts before every insert,
 * the same "app-code enforces limits, DB enforces hard constraints" split
 * lib/artwork/limits.ts already uses. A stricter, unbypassable version of
 * the same ceiling also lives in messages_insert_own's RLS check
 * (supabase/migrations/0010_museum_mail.sql) -- these constants are the
 * friendlier, tighter limit ordinary traffic should actually hit first.
 */

/** 2000 mirrors the `messages_body_length` check constraint in
 * 0010_museum_mail.sql -- kept in sync by hand across SQL and TS, the same
 * documented tradeoff lib/artwork/limits.ts's MAX_TOTAL_REQUEST_BYTES vs.
 * server.mjs's own copy of that number already accepts. */
export const MAX_MESSAGE_BODY_LENGTH = 2000;

export const MAX_REPORT_REASON_LENGTH = 500;

export const RATE_LIMIT_WINDOW_MINUTES = 60;

/** Total messages (new threads + replies combined) a single sender may send
 * in the window above. RLS's own backstop is looser (30) so ordinary
 * traffic never actually reaches it -- see 0010_museum_mail.sql. */
export const RATE_LIMIT_MAX_SENDS_PER_WINDOW = 20;

/** Stricter cap on *new* threads specifically -- unsolicited first contact
 * is the higher-risk spam vector than replying inside a thread the other
 * person already opted into by receiving the first note. */
export const RATE_LIMIT_MAX_NEW_THREADS_PER_WINDOW = 8;
