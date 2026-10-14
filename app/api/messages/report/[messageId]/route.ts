import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { reportMessage } from "@/server/messagesRepository";
import { MAX_REPORT_REASON_LENGTH } from "@/lib/messages/limits";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** Signed-in-only, recipient-only. Flags a message for review -- there's no
 * moderation queue/admin UI to route this to yet, but the flag is captured
 * now (reported_at/report_reason on the row itself) so it's not lost.
 *
 * Lives at /api/messages/report/[messageId] rather than
 * /api/messages/[messageId]/report -- Next.js requires every dynamic
 * segment at the same path level to share one slug name, and
 * app/api/messages/[threadId]/route.ts already claims that level with a
 * different name. Nesting the static "report" segment first avoids the
 * collision. */
export async function POST(request: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let reason = "";
  try {
    const body = await request.json();
    if (typeof body === "object" && body !== null && isString((body as Record<string, unknown>).reason)) {
      reason = (body as Record<string, unknown>).reason as string;
    }
  } catch {
    // No body, or not valid JSON -- reporting with no reason is fine.
  }
  reason = reason.trim().slice(0, MAX_REPORT_REASON_LENGTH);

  const ok = await reportMessage(messageId, user.id, reason);
  if (!ok) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
