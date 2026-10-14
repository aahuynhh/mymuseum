"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { NoteComposerModal } from "@/components/messages/NoteComposerModal";

/** "Message" entry point on an artist's public profile page -- the
 * profile-level counterpart to the in-museum "Leave a note"/"Message the
 * artist" entry points (ControlsHint, ArtworkModal). Opens the same shared
 * composer, targeted directly at the artist rather than at a museum. Only
 * rendered by the caller when the viewer isn't the artist themselves and
 * the artist currently accepts messages; signed-out visitors still see it
 * and get a sign-in prompt inside the composer, same as the in-museum
 * entry points. */
export function MessageArtistButton({
  recipientId,
  recipientName,
  currentUserId,
}: {
  recipientId: string;
  recipientName: string;
  currentUserId: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Message
      </Button>
      <AnimatePresence>
        {open && (
          <NoteComposerModal
            key="note-composer"
            target={{ type: "profile", recipientId, recipientName }}
            currentUserId={currentUserId}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
