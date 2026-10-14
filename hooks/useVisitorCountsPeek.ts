"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

/** Batched sibling of useVisitorCountPeek for pages rendering many museums
 * at once (e.g. /explore) -- one socket connection covering the whole list
 * instead of one per card. Returns a museumId -> live visitor count map;
 * ids not yet reported by the server are simply absent. */
export function useVisitorCountsPeek(museumIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = museumIds.join(",");

  useEffect(() => {
    if (museumIds.length === 0) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => socket.emit("museums:peek", museumIds));
    socket.on("visitor:counts", (value: Record<string, number>) => setCounts(value));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is museumIds' stable identity
  }, [key]);

  return counts;
}
