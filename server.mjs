// Custom Next.js server that also hosts the Socket.IO multiplayer layer.
//
// Why Socket.IO + a custom Node server (see README "Multiplayer architecture"
// for the fuller rationale): it needs a single always-on process to hold
// each museum's live player roster in memory, which rules out serverless
// platforms like plain Vercel functions. A custom server keeps Next.js and
// the realtime layer in one deployable process, which is the simplest thing
// that reliably supports room-scoped presence, works well with Next's App
// Router, and is easy for one person to reason about and self-host (Render,
// Railway, Fly.io, or any VPS) alongside more managed alternatives like
// PartyKit or Colyseus.
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Must match MAX_TOTAL_REQUEST_BYTES in lib/artwork/limits.ts. Duplicated
// by hand rather than imported -- this file runs directly under Node,
// outside the Next.js/TypeScript build, the same reason sanitizeString/
// sanitizeVector3 below are reimplemented rather than shared with game/.
const MAX_UPLOAD_REQUEST_BYTES = 60 * 1024 * 1024; // 60 MB

/**
 * Cheap, spoofable fast path: rejects an obviously-oversized museum-upload
 * request via its Content-Length header before Next.js (and the real,
 * byte-counted streaming enforcement in app/api/museums/route.ts) ever
 * runs. Content-Length is client-supplied and can be absent or wrong, so
 * this is a defense-in-depth optimization, not the security boundary.
 */
function rejectOversizedUpload(req, res) {
  if (req.method !== "POST" || !req.url || !req.url.startsWith("/api/museums")) return false;
  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength <= MAX_UPLOAD_REQUEST_BYTES) return false;

  res.writeHead(413, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Upload is too large." }));
  return true;
}

// museumId -> Map<socketId, Player>
const rooms = new Map();

function getRoom(museumId) {
  let room = rooms.get(museumId);
  if (!room) {
    room = new Map();
    rooms.set(museumId, room);
  }
  return room;
}

function sanitizeString(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength);
}

function sanitizeVector3(value) {
  if (!value || typeof value !== "object") return { x: 0, y: 0, z: 0 };
  const clamp = (n) => (typeof n === "number" && Number.isFinite(n) ? Math.max(-100, Math.min(100, n)) : 0);
  return { x: clamp(value.x), y: clamp(value.y), z: clamp(value.z) };
}

/**
 * Removes any existing entry in `room` that belongs to the same browser
 * session (matched by client-generated sessionId) but a different socket
 * id, broadcasting player:left for it first. This is what makes
 * "reconnection doesn't duplicate players" actually true.
 */
function removeStaleSessionEntries(io, museumId, room, sessionId, currentSocketId) {
  for (const [socketId, player] of room) {
    if (socketId === currentSocketId) continue;
    if (player.sessionId !== sessionId) continue;
    room.delete(socketId);
    io.to(museumId).emit("player:left", { id: socketId });
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    if (rejectOversizedUpload(req, res)) return;
    handle(req, res);
  });
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || "*" },
  });

  io.on("connection", (socket) => {
    // Lets a page (e.g. the museum preview/share page) read the current
    // visitor count without joining the room as a player.
    socket.on("museum:peek", (museumId) => {
      const room = rooms.get(sanitizeString(museumId, 64));
      socket.emit("visitor:count", room ? room.size : 0);
    });

    socket.on("join", (payload) => {
      const museumId = sanitizeString(payload?.museumId, 64);
      const sessionId = sanitizeString(payload?.sessionId, 64);
      // A real client always sends its persistent per-browser sessionId.
      // Some environments open a couple of extra, incomplete handshake
      // attempts alongside the real one when Socket.IO is layered on a
      // custom Next.js server; those never carry a sessionId, so rejecting
      // joins without one keeps the room's roster accurate without ever
      // dropping a genuine visitor.
      if (!museumId || !sessionId) return;

      const player = {
        id: socket.id,
        sessionId,
        username: sanitizeString(payload?.username, 40) || "visitor",
        displayName: sanitizeString(payload?.displayName, 40) || "Visitor",
        avatarConfiguration: payload?.avatarConfiguration ?? {},
        position: sanitizeVector3(payload?.position),
        rotation: typeof payload?.rotation === "number" ? payload.rotation : 0,
        animationState: payload?.animationState === "walking" ? "walking" : "idle",
        museumId,
      };

      socket.data.museumId = museumId;
      socket.data.sessionId = sessionId;
      const room = getRoom(museumId);
      removeStaleSessionEntries(io, museumId, room, sessionId, socket.id);
      room.set(socket.id, player);
      socket.join(museumId);

      socket.emit("welcome", {
        selfId: socket.id,
        players: Array.from(room.values()).filter((p) => p.id !== socket.id),
      });
      socket.to(museumId).emit("player:joined", player);
      io.to(museumId).emit("visitor:count", room.size);
    });

    socket.on("transform", (payload) => {
      const museumId = socket.data.museumId;
      if (!museumId) return;
      const room = rooms.get(museumId);
      const player = room?.get(socket.id);
      if (!room || !player) return;

      player.position = sanitizeVector3(payload?.position);
      player.rotation = typeof payload?.rotation === "number" ? payload.rotation : player.rotation;
      player.animationState = payload?.animationState === "walking" ? "walking" : "idle";

      socket.to(museumId).emit("player:update", {
        id: socket.id,
        position: player.position,
        rotation: player.rotation,
        animationState: player.animationState,
      });
    });

    socket.on("disconnect", () => {
      const museumId = socket.data.museumId;
      if (!museumId) return;
      const room = rooms.get(museumId);
      if (!room) return;
      room.delete(socket.id);
      socket.to(museumId).emit("player:left", { id: socket.id });
      io.to(museumId).emit("visitor:count", room.size);
      if (room.size === 0) rooms.delete(museumId);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> MyMuseum ready on http://localhost:${port}`);
    });
});
