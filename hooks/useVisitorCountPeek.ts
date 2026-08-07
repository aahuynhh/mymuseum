"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

/** Reads a museum's live visitor count without joining the room as a player
 * -- used on the profile/preview page so browsing it doesn't itself count
 * as "being in" the museum. */
export function useVisitorCountPeek(museumId: string, fallback: number) {
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => socket.emit("museum:peek", museumId));
    socket.on("visitor:count", (value: number) => setCount(value));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [museumId]);

  return count;
}
