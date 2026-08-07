# MyMuseum

**Build a world for your work.**

MyMuseum is a portfolio-ready prototype of a multiplayer platform for sharing creative work. Instead of a scrolling portfolio site, every user gets a personal virtual museum: visitors enter as a customizable avatar, walk through connected galleries in third person, inspect artwork up close, and see other visitors who are there at the same time.

This repository is the demo build -- a five-room hand-designed museum with its own artist, a working avatar editor, live multiplayer presence, and an MVP flow for visitors to upload their own work and get their own shareable museum -- built to stand as the leading project in a product/UX design portfolio.

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server runs a custom Node process (`server.mjs`) that hosts Next.js **and** the Socket.IO multiplayer layer together on the same port, so nothing else needs to run separately.

To see multiplayer in action: open `/museum/demo-artist` in two browser windows side by side. Each window spawns a separate avatar; moving in one updates the other in real time.

### Other scripts

```bash
npm run build          # production build
npm run start           # run the production build (same custom server)
npm run lint            # ESLint
npm run typecheck       # TypeScript, no emit
npm run generate:artwork  # regenerate the placeholder artwork SVGs
```

---

## Visual identity

The interface uses a warm, gallery-inspired palette rather than a typical SaaS/startup one -- Warm Linen and Antique Ivory surfaces, Rich Espresso text, and a single Terracotta accent, with the artwork itself left as the most colorful thing on any screen. Tokens live in `app/globals.css` (`--color-*`, `--shadow-*`, `--ease-*`) and are consumed as Tailwind utilities (`bg-canvas`, `text-ink-muted`, `shadow-warm-md`, etc.) so every component draws from the same palette, shadow scale, and easing curve instead of inventing its own.

`framer-motion` is used deliberately, not decoratively: the focused-artwork dialog and its backdrop animate in/out via `AnimatePresence` (impossible to do cleanly with CSS alone once a component unmounts), buttons get a subtle hover/press response, and the museum's floating panels (Controls, visitor list) animate open/closed. `MotionProvider` (wrapping the app in `app/layout.tsx`) sets framer-motion's `reducedMotion="user"` globally, because the CSS `prefers-reduced-motion` rule in `globals.css` only catches native CSS transitions/animations, not framer-motion's JS-driven ones.

The avatar (`components/avatar/AvatarModel.tsx`) was tuned for a softer, more collectible-toy silhouette -- rounded shoulder caps, a short blob-like torso instead of a visible pill/capsule, a tapered arm chain (shoulder → upper arm → elbow → forearm → cuff → hand) instead of one uniform tube, a subtle collar ring for dimensional clothing, and slightly oversized hands, feet, and eyes for warmth. Remote avatars' nametags are wrapped in a drei `<Billboard>` so they stay camera-facing (and readable) no matter which way that visitor is turned. The hair material is double-sided (`THREE.DoubleSide`), since the open, partial-sphere "cap" geometries used for hairstyles can otherwise show their hollow underside and disappear at some rotations.

The museum itself is five connected rooms, each with its own warm theme (Warm Cream, Museum Blue, Muted Sage, Dusty Terracotta, Charcoal Accent -- `game/museum/themes.ts`), so it reads as curated rather than one repeated palette. Floors use a procedurally-painted herringbone parquet texture; walls get a picture-rail molding and baseboard trim; a sculpture, benches, and potted plants are placed automatically based on each room's size (`components/museum/MuseumRoom.tsx`). Artwork frames vary in size (`Artwork.frameWidth/frameHeight`) so a wall reads as curated instead of a uniform row.

---

## Project summary

**Problem.** Portfolios are flat and interchangeable -- a grid of images or a scrolling page that looks like everyone else's. It's hard to convey the feeling of a body of work, and there's no sense of anyone else looking at it with you.

**Product idea.** Give each person a small, walkable 3D museum built around their work, with a friendly customizable avatar as their identity. Visiting someone's portfolio becomes an experience you can share with another person in real time, not just a link you open alone.

**Target users.** Design/art/creative students and early-career professionals who want a distinctive, memorable portfolio piece for job searches and reviews; visitors (recruiters, peers, friends) who want an easy, low-effort way to browse someone's work.

**Core experience.** Land on a branded marketing page → preview the demo artist and their museum → optionally customize an avatar → walk into a 3D gallery, or browse the same collection as an accessible grid → focus on individual pieces with full metadata and sequential navigation → see other visitors present in the same room.

**Key design decisions.**
- *One account type, no auth.* Anyone can create a museum at `/create` and get a shareable link, but there's no registration or login gating it -- a lightweight local guest identity (stored in `localStorage`) stands in for a real account, and created museums live in a file rather than a real database (see "Not implemented" below). That kept the prototype focused on the interaction and spatial-design problem rather than backend plumbing, while still proving the full create → share → visit loop works.
- *Intentional interaction over ambient triggers.* Artwork opens on a deliberate action ("Press E to view" / click / Enter) rather than automatically when a visitor walks near a piece, so browsing feels calm rather than twitchy.
- *Grid view is a first-class mode, not an afterthought.* The exact same artwork data renders as an accessible 2D grid, reachable from the museum's Controls panel or directly at `/artist/[username]#grid`, so the 3D room is an enhancement, never a requirement.
- *Camera-relative movement, not tank controls.* WASD moves relative to where the camera is looking (and the avatar turns to face its movement direction), which reads as more natural for a cozy/social space than classic rotate-in-place controls.
- *Position updates are throttled and interpolated,* not streamed every frame, to keep the multiplayer layer cheap and smooth over an ordinary connection.

**Accessibility approach.** See the dedicated section below -- semantic HTML outside the canvas, a real focus trap and focus restoration in the artwork dialog, full keyboard operability, visible focus rings, reduced-motion support, and a non-3D grid view that reaches every artwork.

**Technical implementation.** See "Architecture" and "Multiplayer architecture" below.

**Current prototype scope.** One hand-designed five-room demo museum, plus a working "create your own" flow for user-uploaded museums backed by a local file rather than a real database, and no accounts/auth. This is intentional -- see "Not implemented" for the full list and why.

**Future vision.** See "Future product vision" at the end of this document.

> Note on evidence: this README describes design intent and what was verified through manual and automated testing (build, lint, typecheck, a live two-client multiplayer test, and Playwright-driven browser/accessibility/responsive checks -- see "How this was verified"). It does not claim any user research, usability testing, or analytics that weren't actually run; where that kind of evidence would normally go, treat it as **not yet collected**, not implied.

---

## Architecture

```
app/
  page.tsx                    Landing page
  avatar/page.tsx             Avatar editor
  create/page.tsx             "Create My Museum" upload form
  artist/[username]/page.tsx  Artist profile + museum preview + share
  museum/[museumId]/page.tsx  Live 3D museum route (demo or user-created)
  api/museums/route.ts        POST: create a museum from uploaded artwork
  not-found.tsx, */error.tsx, */loading.tsx

components/
  ui/            Button, Logo, SiteHeader/Footer, SkipLink, ErrorBoundary
  landing/       Hero, HowItWorks, FeaturedArtist (+ 3D preview loaders)
  profile/       Profile-page-only pieces (avatar bust, live visitor badge)
  avatar/        AvatarModel (3D), AvatarEditor, OptionGroup, preview canvas
  museum/        Rooms, walls, floor, lighting, furnishings, player controller, HUD
  artwork/       Frame (3D), interaction prompt, focused modal, grid fallback
  multiplayer/   RemoteAvatar, roster rendering, visitor panel
  create/        CreateMuseumForm, per-artwork upload/edit row

game/            Framework-agnostic game logic, no JSX
  controls/      Keyboard input state, movement integration (pure functions)
  camera/        Third-person follow camera, pointer-orbit input
  collision/     Multi-room floor-plan clamping (rooms + doorway connectors)
  interaction/   Proximity-to-artwork detection
  networking/    Socket.IO event/payload types (shared contract)
  avatar/        Shared THREE geometry instances
  museum/        Gallery themes, wall-placement math, single-room auto-layout

hooks/           useAvatarConfig, useVisitorIdentity, useMultiplayer,
                 useLocalStorageState, usePrefersReducedMotion, ...
data/            Demo artist, demo museum, demo rooms, demo artwork (hardcoded)
server/          museumStore.ts -- file-backed store for user-created museums
types/           Artwork, AvatarConfiguration, Player, Museum, GalleryRoom
public/artwork/  Generated placeholder artwork (see below)
scripts/         generate-placeholder-artwork.mjs
server.mjs       Custom server: Next.js + Socket.IO in one process
proxy.ts         Returns a real 404 for unknown museum/artist slugs
```

Game logic (movement math, camera math, collision, proximity) is written as plain functions in `game/` with no React or Three.js scene-graph dependency beyond `THREE.Vector3` math, and is unit-testable in isolation. The React/R3F components in `components/museum` and `components/avatar` are the only things that call `useFrame` and mutate the scene graph -- they're the glue, not the logic.

---

## Multiplayer architecture

**Chosen: Socket.IO, on a custom Node server that also serves Next.js.**

Reasoning: each museum room needs a small amount of authoritative, always-on server state (who's in the room, where they are) that a purely serverless/edge deployment can't hold between requests. Of the options considered:

- **PartyKit / Colyseus** are purpose-built for this and would be a fine choice, but both add an external platform/account and a second deployment target for a prototype of this scope.
- **Supabase Realtime** would work, but pulls in a hosted backend service for what is, here, pure ephemeral presence data with no need for persistence.
- **Socket.IO + a custom Node server** needs no external account, runs as a single deployable process, has by far the most prior art/community support for "beginner-maintainable," and deploys anywhere that runs a long-lived Node process (Render, Railway, Fly.io, a VPS, a Docker container).

The trade-off: it does **not** run on purely serverless platforms (plain Vercel functions, static hosts) because it needs one process holding room state in memory. See "Deployment" below.

**Protocol** (`game/networking/protocol.ts`): `join` (once, on connect/reconnect) → server replies `welcome` with the current roster and broadcasts `player:joined` to everyone else. Movement streams as throttled `transform` events (~10Hz, see `PlayerController`'s `EMIT_INTERVAL`) relayed as `player:update`. Disconnect emits `player:left`. A separate `museum:peek` lets the profile/preview page read a live visitor count without joining the room as a player. Every event is scoped to a Socket.IO room keyed by `museumId`, so museums never share visitors (verified -- see below).

**Client-side smoothing**: remote players' positions/rotations are written into a plain `Map` (not React state) at network rate, and each `RemoteAvatar` interpolates toward the latest value every render frame inside its own `useFrame` -- so 10Hz network updates never look like 10Hz motion, and incoming traffic never triggers a React re-render.

**A real bug found and fixed during development:** with this Next.js version's custom-server setup, a single browser tab's one Socket.IO connection occasionally arrived at the server as two or three separate `connection` events (confirmed with the browser's own WebSocket devtools showing exactly one socket, while the server logged three) -- each one, if left unfiltered, added its own duplicate "visitor" to the room. The fix wasn't chasing the exact transport-level cause further; it was making "reconnection doesn't duplicate players" (an explicit requirement) actually true regardless of cause: every client now sends a `sessionId` generated once and persisted in `localStorage`, and the server (`server.mjs`) drops any join that arrives without one and removes a room's prior entry for the same `sessionId` before adding the new one. Verified with a live two-tab test (`1 visitor → 2 → 1` across join and leave) after the fix.

---

## Museum floor plans and user-created museums

The **demo museum** (`data/rooms.ts`, `data/museum.ts`) is a hand-designed floor plan: an Entrance Hall opens through a doorway into a large Main Gallery, which branches to a West Wing, an East Wing, and a charcoal Far Room at the end -- five rooms, each an independent themed box (`GalleryRoom`) with its own `openings` (gaps in specific walls, not full walls) connecting it to its neighbors. Movement/camera collision (`game/collision/roomBounds.ts`) clamps the player into whichever room rectangle currently contains them, plus a set of small `openingConnectors` rectangles that bridge each doorway so crossing a threshold stays smooth.

**Creating your own museum** (`/create`) is a real MVP, not a mock: upload a few images, give each a title/artist/description, pick one of the five gallery themes, and submit. Images are resized and re-encoded to JPEG client-side (`components/create/CreateMuseumForm.tsx`, via `createImageBitmap` + canvas) before upload, capping payload size. The server (`app/api/museums/route.ts`) validates the request, auto-generates a single well-proportioned room sized to the artwork count (`game/museum/autoLayout.ts`, reusing the same wall-placement math the demo museum's data was authored with -- `game/museum/placement.ts`), and saves it. The resulting museum is played through the exact same `MuseumExperience` component as the demo -- multiplayer, artwork interaction, and the accessible grid all work identically.

There's no database: `server/museumStore.ts` is a small JSON file on disk (`.mymuseum-data/`, gitignored). An initial version used an in-memory `Map`, which turned out not to work -- Next.js compiles the `/api/museums` route, `proxy.ts`, and the `/museum/[id]` page into separate server bundles that don't reliably share module-level state at runtime even within one process, so a museum created via the API was invisible to the page meant to render it. A file survives that; it's an intentionally lightweight stand-in for a real database, matching this prototype's scope, not a claim of production readiness.

---

## Accessibility

- Semantic HTML and real focus outlines (`:focus-visible`) everywhere outside the WebGL canvas.
- The focused artwork view is a true dialog: `role="dialog"` + `aria-modal`, a manual focus trap (Tab/Shift+Tab cycle within it), focus moves to it on open and is restored to the triggering element on close, and Escape closes it.
- Every interactive control has a visible label or an `sr-only` accessible name; icons (←/→/✕) are never the only cue.
- `/artist/[username]#grid` (also reachable from the museum's Controls panel) is a complete, non-3D way to browse every artwork with the same metadata and the same focused-view dialog -- nothing in the collection is 3D-only.
- `prefers-reduced-motion` is respected: global CSS collapses transition/animation durations, and camera auto-rotate / avatar idle-bob in the preview canvases are explicitly disabled when the user has that preference (movement inside the live museum itself is treated as core interaction feedback, not decorative motion, and is left on).
- Artwork images carry curator-style `altText`, distinct from the display title/description.
- Skip-to-content link on every page.

## Responsive behavior

The 3D museum is desktop-first (keyboard + mouse-drag controls) but every other screen -- landing, profile, avatar editor, artwork grid, focused artwork dialog -- is fully responsive and was checked at a 390px mobile width with no horizontal overflow. On a touch device, the museum's Controls panel exposes "Switch to accessible grid view" as the recommended way to browse the collection; the 3D room itself doesn't yet have on-screen touch joysticks (see "Not implemented").

## Performance

- Every avatar (local, remote, and the ones in the landing-page preview) shares one set of `THREE.BufferGeometry` instances (`game/avatar/geometry.ts`); only materials vary per avatar.
- Heavy 3D routes (`MuseumExperience`, the landing hero, the profile avatar bust) are loaded with `next/dynamic(..., { ssr: false })` behind a small `"use client"` loader, so they never block or fail server rendering and only download once actually needed.
- The floor texture is a small procedurally-painted canvas texture generated once per mount, not an image asset.
- Artwork "images" are hand-authored SVGs (a few KB each) rather than raster photography, so there's nothing to compress.
- `dpr` is capped at 2 on every canvas; only one light casts shadows (`MuseumLighting`'s directional light), everything else is unshadowed fill/point light.
- Multiplayer transforms are throttled client-side to ~10Hz before they ever reach the socket.
- `npm run build` / `npm run typecheck` / `npm run lint` all pass cleanly (see below).

## How this was verified

This build was checked with, not just written to satisfy:

- `npm run typecheck` and `npm run lint` -- both pass with zero errors (a few informational `<img>`-vs-`next/image` warnings remain, intentional: see `components/artwork/ArtworkGrid.tsx`).
- `npm run build` -- clean production build, all four routes compile (two static, two dynamic).
- A live two-socket-client script joined the same museum room and confirmed: `welcome` roster payload, `player:joined` broadcast, throttled `player:update` relay, `player:left` on disconnect, and correct `visitor:count` increment/decrement.
- A second script confirmed two different `museumId`s never see each other's players (room isolation).
- A Playwright pass loaded the landing page, artist profile, avatar editor, and live museum route and confirmed zero console/page errors on each.
- A Playwright pass opened the artwork dialog, confirmed focus moved into it, Tab-cycled through it without escaping (focus trap), confirmed Arrow-Right advances to the next artwork, and confirmed Escape closes it and restores focus to the triggering element.
- A 390px-wide Playwright pass confirmed zero horizontal overflow on the landing, profile, avatar-editor, and create-museum pages.
- Direct `curl` checks confirmed real HTTP 404s for unknown `/museum/:id` and `/artist/:username` slugs (see `proxy.ts` -- this Next.js version can't change a streamed response's status code after the body starts, so unknown slugs are rejected in Proxy, before rendering, rather than via `notFound()` inside the page).
- The full "create your own museum" flow was run end to end with Playwright: upload two real raster images, fill in the form, submit, follow the generated link, and confirm the new museum renders with zero console errors and correct multiplayer join.

What this does **not** claim: no user research, no usability testing sessions, and no analytics were run. There are no invented metrics anywhere in this repo.

---

## Deployment

The app is one Node process (`server.mjs`) serving both Next.js and Socket.IO, so it needs a host that runs a persistent Node server rather than pure serverless functions.

**Recommended:** Render, Railway, Fly.io, or any VPS/Docker host.

1. `npm run build`
2. Start command: `npm run start` (runs `node server.mjs` with `NODE_ENV=production`)
3. Expose the port from `process.env.PORT` (defaults to `3000`)

**Environment variables** (all optional):

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | HTTP port the custom server listens on | `3000` |
| `CLIENT_ORIGIN` | CORS origin allowed to connect via Socket.IO | `*` |
| `NEXT_PUBLIC_SOCKET_URL` | Only needed if the realtime server is deployed **separately** from the Next.js frontend | same-origin |

No secrets are required or committed. If you split the frontend (e.g. static hosting) from the realtime server, set `NEXT_PUBLIC_SOCKET_URL` on the frontend build and `CLIENT_ORIGIN` on the server so CORS allows it.

**Vercel note:** the Next.js pages/routes themselves are compatible with Vercel, but Vercel's serverless functions can't host the long-lived Socket.IO server this app depends on for multiplayer. Deploying there would need the realtime layer split out to a separately-hosted Socket.IO service (or swapped for a managed realtime product like PartyKit), reachable via `NEXT_PUBLIC_SOCKET_URL`.

---

## Artwork assets

Every "artwork" in the demo collection is an original, procedurally generated abstract SVG composition (`scripts/generate-placeholder-artwork.mjs`, output in `public/artwork/`) -- geometric shapes and gradients built from a seeded random generator and a muted color palette, standing in for a real artist's photographed work. Nothing is copied, scraped, or AI-generated from existing artwork; regenerate them any time with `npm run generate:artwork`. Titles, bios, and descriptions (`data/artworks.ts`, `data/demoArtist.ts`) are fictional and written for this demo.

## Originality note

The avatar (`components/avatar/AvatarModel.tsx`, geometry in `game/avatar/geometry.ts`) is built entirely from primitive Three.js geometry (spheres, capsules, a cone) composed into an original large-head/small-body silhouette, with its own facial treatment, hairstyles, and clothing options. It is not a copy, retexture, or derivative of any existing game's character models, and uses no third-party or proprietary assets.

---

## Case study capture plan

See [`case-study-assets/README.md`](./case-study-assets/) for a shot list and capture guidance (what to screenshot/record, at what size, with which app state) for presenting this project in a UX case study -- landing hero, avatar editor, third-person museum, two live visitors together, the interaction prompt, focused artwork view, sequential navigation, the accessible grid, and mobile layouts.

---

## Product scope

### Implemented
Branded landing page · demo artist profile · museum preview/share page · shareable `/museum/[id]` route · a five-room hand-designed museum with per-room themes, auto-placed furnishings, and varied frame sizes · third-person movement with camera-relative controls and multi-room wall/doorway collision · original stylized avatar with idle/walk animation and a tapered, jointed arm chain · avatar editor (skin tone, 3 hairstyles, hair color, top, bottom, shoes, accessory, `localStorage`-persisted, live 3D preview) · artwork interaction prompts with a dedicated trigger key · focused artwork view with looping previous/next and position indicator · accessible non-3D artwork grid · live multiplayer avatars with join/leave/interpolation/throttling, session-based reconnect dedup, and per-museum room isolation · visitor count and presence panel · a full "create your own museum" upload flow (image compression, theme picker, auto-generated single-room layout, shareable link) with a lightweight file-backed store · loading/error/not-found states on every dynamic route · responsive layouts for every non-3D screen · accessibility fundamentals (focus trap, keyboard operability, reduced motion, alt text) · deployment configuration and docs.

### Not implemented (by design, for this prototype)
Full registration/password auth · a production database (museums created via `/create` are saved to a local JSON file, not a real DB -- see "Museum floor plans and user-created museums" above) · drag-and-drop gallery editing or a visual room editor · multiple room-shape templates (custom museums get one auto-sized room, not the demo's five-room layout) · likes/comments/following/messaging/voice chat · payments or art sales · a moderation system · events · multiple floors · a custom architecture/furniture editor · VR · analytics dashboards. These are all real product directions -- see below -- deliberately deferred so this prototype could go deep on the spatial-portfolio interaction instead of wide on account/backend features.

## Future product vision

If this moved past prototype: real accounts and museum ownership tied to `/create` museums (so they survive more than one server's lifetime, with a real database instead of a JSON file); multiple room-shape templates and simple architectural customization for user-created museums, not just the auto-sized single room; drag-and-drop rearrangement of artwork on the walls; a "you were here" visit history for artists to see who's stopped by; light social features (following an artist, a comment left in a guestbook-style panel rather than inline chat); and eventually multiple rooms/floors per user museum as a portfolio grows, matching what the demo museum already shows is possible. Not committed to VR, but the avatar and room system were designed so a future VR mode wouldn't require starting over.
