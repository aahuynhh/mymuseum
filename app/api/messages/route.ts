import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  sendNewThreadMessage,
  sendNewThreadMessageToRecipient,
  listThreadsForUser,
} from "@/server/messagesRepository";
import { MAX_MESSAGE_BODY_LENGTH } from "@/lib/messages/limits";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** Signed-in-only. Starts a new Museum Mail thread either from a museum's
 * viewer (`museumId`, required in that case, plus optional `artworkId` --
 * the actual recipient is resolved server-side from the museum's owner, see
 * sendNewThreadMessage) or from an artist's public profile page
 * (`recipientId` directly, see sendNewThreadMessageToRecipient). Exactly
 * one of the two must be present; `museumId` wins if a request somehow sent
 * both. */
export async function POST(request: Request) {
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

  const noteBody = isString(payload.body) ? payload.body.trim().slice(0, MAX_MESSAGE_BODY_LENGTH) : "";
  if (!noteBody) {
    return NextResponse.json({ error: "Write a note before sending." }, { status: 400 });
  }

  const result = isString(payload.museumId) && payload.museumId
    ? await sendNewThreadMessage({
        senderId: user.id,
        museumId: payload.museumId,
        artworkId: isString(payload.artworkId) && payload.artworkId ? payload.artworkId : null,
        body: noteBody,
      })
    : isString(payload.recipientId) && payload.recipientId
      ? await sendNewThreadMessageToRecipient({
          senderId: user.id,
          recipientId: payload.recipientId,
          body: noteBody,
        })
      : null;

  if (result === null) {
    return NextResponse.json({ error: "A museum or recipient is required." }, { status: 400 });
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, threadId: result.threadId }, { status: 201 });
}

/** Signed-in-only. Lists every Museum Mail thread the current user
 * participates in (as sender or recipient), newest activity first. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const threads = await listThreadsForUser(user.id);
  return NextResponse.json({ threads });
}
