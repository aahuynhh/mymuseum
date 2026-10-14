import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { getThreadMessages, markThreadRead, sendReplyMessage } from "@/server/messagesRepository";
import { MAX_MESSAGE_BODY_LENGTH } from "@/lib/messages/limits";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** Signed-in-only. Fetches one thread's full message history, scoped to
 * the current user via RLS (a thread they're not part of comes back as
 * "not found," identical to an unknown id). Marks every unread message
 * addressed to them as read as a side effect of viewing it. */
export async function GET(_request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const thread = await getThreadMessages(threadId, user.id);
  if (!thread) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  await markThreadRead(threadId, user.id);

  return NextResponse.json({ thread });
}

/** Signed-in-only. Replies into an existing thread -- the recipient is
 * resolved server-side as the thread's other participant (see
 * sendReplyMessage), never trusted from the request body. */
export async function POST(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;

  const replyBody = isString(payload.body) ? payload.body.trim().slice(0, MAX_MESSAGE_BODY_LENGTH) : "";
  if (!replyBody) {
    return NextResponse.json({ error: "Write a reply before sending." }, { status: 400 });
  }

  const result = await sendReplyMessage({ senderId: user.id, threadId, body: replyBody });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, threadId: result.threadId }, { status: 201 });
}
