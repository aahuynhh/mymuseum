"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  TransformPayload,
} from "@/game/networking/protocol";
import type { AvatarConfiguration, Player, Vector3Tuple } from "@/types";

/** "solo" means the realtime server was never reachable (e.g. a serverless
 *  deployment with no Socket.IO host) -- the museum still works, just without
 *  other visitors. Socket.IO keeps retrying in the background, so it can still
 *  flip to "connected" later. */
export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "solo";

interface UseMultiplayerOptions {
  museumId: string;
  username: string;
  displayName: string;
  sessionId: string;
  avatarConfiguration: AvatarConfiguration;
  spawnPoint: Vector3Tuple;
  spawnRotation: number;
}

/** Latest transforms for remote players, keyed by id. Updated outside React state
 *  (at ~10Hz) so incoming network traffic never forces a React re-render --
 *  RemoteAvatar components read it directly inside their own render loop. */
export type RemoteTransformMap = Map<string, TransformPayload>;

export function useMultiplayer({
  museumId,
  username,
  displayName,
  sessionId,
  avatarConfiguration,
  spawnPoint,
  spawnRotation,
}: UseMultiplayerOptions) {
  const [roster, setRoster] = useState<Player[]>([]);
  const [visitorCount, setVisitorCount] = useState(1);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const remoteTransforms = useRef<RemoteTransformMap>(new Map());
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  const identity = useRef({ username, displayName, sessionId, avatarConfiguration });
  useEffect(() => {
    identity.current = { username, displayName, sessionId, avatarConfiguration };
  }, [username, displayName, sessionId, avatarConfiguration]);

  useEffect(() => {
    // Defaults to same-origin (the custom server hosts Next.js and Socket.IO
    // together). Set NEXT_PUBLIC_SOCKET_URL if the realtime server is deployed
    // separately from the Next.js frontend.
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || undefined,
      // Give up on a hanging handshake after 8s (default 20s) so the visitor
      // panel settles on "Solo visit" instead of "Connecting…"; retries continue.
      { transports: ["websocket", "polling"], timeout: 8000 }
    );
    socketRef.current = socket;
    const transforms = remoteTransforms.current;
    let hasConnected = false;

    socket.on("connect", () => {
      hasConnected = true;
      setStatus("connected");
      socket.emit("join", {
        museumId,
        username: identity.current.username,
        displayName: identity.current.displayName,
        sessionId: identity.current.sessionId,
        avatarConfiguration: identity.current.avatarConfiguration,
        position: spawnPoint,
        rotation: spawnRotation,
        animationState: "idle",
      });
    });

    socket.on("welcome", (data) => {
      setRoster(data.players);
      transforms.clear();
      for (const player of data.players) {
        transforms.set(player.id, {
          position: player.position,
          rotation: player.rotation,
          animationState: player.animationState,
        });
      }
    });

    socket.on("player:joined", (player) => {
      setRoster((prev) => (prev.some((p) => p.id === player.id) ? prev : [...prev, player]));
      transforms.set(player.id, {
        position: player.position,
        rotation: player.rotation,
        animationState: player.animationState,
      });
    });

    socket.on("player:update", (data) => {
      transforms.set(data.id, {
        position: data.position,
        rotation: data.rotation,
        animationState: data.animationState,
      });
    });

    socket.on("player:left", ({ id }) => {
      setRoster((prev) => prev.filter((p) => p.id !== id));
      transforms.delete(id);
    });

    socket.on("visitor:count", (count) => {
      setVisitorCount(count);
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
    });

    // A failed first attempt means there's no realtime server to reach, so stop
    // showing "Connecting…" forever. After a real connection drops, failed
    // retries keep the "Reconnecting…" state instead.
    socket.on("connect_error", () => {
      setStatus(hasConnected ? "disconnected" : "solo");
    });

    socket.io.on("reconnect", () => {
      setStatus("connecting");
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      transforms.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [museumId]);

  const sendTransform = useCallback((transform: TransformPayload) => {
    socketRef.current?.emit("transform", transform);
  }, []);

  return useMemo(
    () => ({ roster, visitorCount, status, remoteTransforms, sendTransform }),
    [roster, visitorCount, status, sendTransform]
  );
}
