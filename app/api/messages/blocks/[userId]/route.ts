import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { blockSender, unblockSender } from "@/server/messagesRepository";

/** Signed-in-only. Blocks future Museum Mail from `userId` -- doesn't touch
 * or hide any existing message history, only prevents new sends (enforced
 * for real by message_blocks + messages_insert_own's RLS check, see
 * supabase/migrations/0010_museum_mail.sql). */
export async function POST(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (userId === user.id) {
    return NextResponse.json({ error: "You can't block yourself." }, { status: 400 });
  }

  const ok = await blockSender(user.id, userId);
  if (!ok) {
    return NextResponse.json({ error: "Couldn't block this sender." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const ok = await unblockSender(user.id, userId);
  if (!ok) {
    return NextResponse.json({ error: "Couldn't unblock this sender." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
