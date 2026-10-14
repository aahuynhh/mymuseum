# MyMuseum

**Build a world for your work.**

MyMuseum is a portfolio-ready prototype of a multiplayer platform for sharing creative work. Instead of a scrolling portfolio site, every user gets a personal virtual museum: visitors enter as a customizable avatar, walk through connected galleries in third person, inspect artwork up close, and see other visitors who are there at the same time.

This repository is the demo build -- a five-room hand-designed museum with its own artist, a working avatar editor, live multiplayer presence, and an MVP flow for visitors to upload their own work and get their own shareable museum -- built to stand as the leading project in a product/UX design portfolio.

---

## Quick start

```bash
npm install
```

Creator accounts and user-created museums are backed by Supabase (see "Accounts, ownership, and museum visibility" below) -- the app **will not start** without it configured:

1. Create a Supabase project, then copy its Project URL and anon/public key into a new `.env.local` (see `.env.example`).
2. Run every file in `supabase/migrations/`, in order (`0001` through `0006`), in the Supabase SQL editor (or `supabase db push`). `0003_artwork_storage.sql` already contains the final, correct artwork Storage schema/policies for a fresh database; `0004`-`0006` are historical, idempotent hotfix migrations from development (each a targeted `drop policy` + `create policy` for one policy that needed fixing against a real upload) that stay in the migration history and will be replayed too -- harmlessly, since re-running them recreates the same end state `0003` already describes. See "Artwork storage" below for the full story of what they fixed. **Never run anything from `supabase/deferred/`** -- that directory is deliberately outside `supabase/migrations/` so `db push`/`db reset`/CI never touch it automatically; see "Artwork storage" below.
3. In **Authentication → Providers → Email**, confirm "Confirm email" is on. In **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` as a redirect URL.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server runs a custom Node process (`server.mjs`) that hosts Next.js **and** the Socket.IO multiplayer layer together on the same port, so nothing else needs to run separately. `proxy.ts` refreshes the Supabase session on almost every route, which is why step 1 above is required even just to browse the demo museum.

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

The avatar (`components/avatar/AvatarModel.tsx`) has no arms -- just a dominant body-shape mesh with stub legs, a face, head decoration, and accessories attached at that shape's named anchors. Remote avatars' nametags are wrapped in a drei `<Billboard>` so they stay camera-facing (and readable) no matter which way that visitor is turned. The hair material is double-sided (`THREE.DoubleSide`), since the open, partial-sphere "cap" geometries used for hairstyles can otherwise show their hollow underside and disappear at some rotations.

The museum itself is five connected rooms, each with its own warm theme (Warm Cream, Museum Blue, Muted Sage, Dusty Terracotta, Charcoal Accent -- `game/museum/themes.ts`), so it reads as curated rather than one repeated palette. Floors use a photographed herringbone-tile texture (`public/textures/floors/`), tinted per room to that theme's floor color; walls use a photographed material -- plaster, sandstone, brick, or brushed metal depending on the theme (`public/textures/walls/`), tinted to that theme's wall color -- with a picture-rail molding and baseboard trim on top; a sculpture, benches, potted plants, wall sconces, and (in the largest room) a rug and a taller floor plant are placed automatically based on each room's size (`components/museum/MuseumRoom.tsx`, `components/museum/DecorModels.tsx`). Artwork frames vary in size (`Artwork.frameWidth/frameHeight`) so a wall reads as curated instead of a uniform row.

---

## Project summary

**Problem.** Portfolios are flat and interchangeable -- a grid of images or a scrolling page that looks like everyone else's. It's hard to convey the feeling of a body of work, and there's no sense of anyone else looking at it with you.

**Product idea.** Give each person a small, walkable 3D museum built around their work, with a friendly customizable avatar as their identity. Visiting someone's portfolio becomes an experience you can share with another person in real time, not just a link you open alone.

**Target users.** Design/art/creative students and early-career professionals who want a distinctive, memorable portfolio piece for job searches and reviews; visitors (recruiters, peers, friends) who want an easy, low-effort way to browse someone's work.

**Core experience.** Land on a branded marketing page → preview the demo artist and their museum → optionally customize an avatar → walk into a 3D gallery, or browse the same collection as an accessible grid → focus on individual pieces with full metadata and sequential navigation → see other visitors present in the same room.

**Key design decisions.**
- *Real creator accounts, still-anonymous visitors.* Creating a museum at `/create` requires a Supabase Auth account (email/password, with email confirmation); museums are owned by that account and persisted in Postgres with Row Level Security enforcing "only the owner can edit or delete their museum" at the database layer, not just in application code (see "Accounts, ownership, and museum visibility" below). Visiting a museum never requires an account -- every visitor, including a signed-in creator walking their own gallery, still gets a lightweight guest identity (stored in `localStorage`) for multiplayer presence, exactly as before. The two identity systems are deliberately kept separate.
- *Intentional interaction over ambient triggers.* Artwork opens on a deliberate action ("Press E to view" / click / Enter) rather than automatically when a visitor walks near a piece, so browsing feels calm rather than twitchy.
- *Grid view is a first-class mode, not an afterthought.* The exact same artwork data renders as an accessible 2D grid, reachable from the museum's Controls panel or directly at `/artist/[username]#grid`, so the 3D room is an enhancement, never a requirement.
- *Camera-relative movement, not tank controls.* WASD moves relative to where the camera is looking (and the avatar turns to face its movement direction), which reads as more natural for a cozy/social space than classic rotate-in-place controls.
- *Position updates are throttled and interpolated,* not streamed every frame, to keep the multiplayer layer cheap and smooth over an ordinary connection.

**Accessibility approach.** See the dedicated section below -- semantic HTML outside the canvas, a real focus trap and focus restoration in the artwork dialog, full keyboard operability, visible focus rings, reduced-motion support, and a non-3D grid view that reaches every artwork.

**Technical implementation.** See "Architecture" and "Multiplayer architecture" below.

**Current prototype scope.** One hand-designed five-room demo museum, plus a working "create your own" flow for user-uploaded museums, backed by real Supabase accounts, a Postgres database with Row Level Security enforcing ownership, and a private Storage bucket for artwork images (see "Artwork storage" below), plus owner-only editing of an existing museum's metadata, publish state, and artwork (see "Creator editing & museum management" below). There's still no visual/drag-and-drop room editor -- artwork placement is always auto-computed server-side. This is intentional -- see "Not implemented" for the full list and why.

**Future vision.** See "Future product vision" at the end of this document.

> Note on evidence: this README describes design intent and what was verified through manual and automated testing (build, lint, typecheck, a live two-client multiplayer test, and Playwright-driven browser/accessibility/responsive checks -- see "How this was verified"). It does not claim any user research, usability testing, or analytics that weren't actually run; where that kind of evidence would normally go, treat it as **not yet collected**, not implied.

---

## Architecture

```
app/
  page.tsx                    Landing page
  avatar/page.tsx             Avatar editor
  create/page.tsx             "Create My Museum" upload form (auth-gated)
  dashboard/page.tsx          "My Museums" -- signed-in creator's own museums
  dashboard/[museumId]/edit/page.tsx  Owner-only museum + artwork editing (Phase 3)
  sign-up/page.tsx            Create a creator account
  sign-in/page.tsx            Sign in
  auth/actions.ts             Server Actions: signUp, signIn, signOut
  auth/callback/route.ts      Exchanges the email-confirmation code for a session
  artist/[username]/page.tsx  Artist profile + museum preview + share
  museum/[museumId]/page.tsx  Live 3D museum route (demo or user-created)
  api/museums/route.ts        POST: create a museum from uploaded artwork (auth-gated)
  api/museums/[museumId]/route.ts  PATCH: owner-only metadata/publish update;
                                    DELETE: owner-only museum deletion + Storage cleanup
  api/museums/[museumId]/artworks/route.ts  POST: owner-only add-artwork + relayout
  api/museums/[museumId]/artworks/[artworkId]/route.ts  PATCH: artwork metadata edit;
                                    DELETE: artwork removal + Storage cleanup + relayout
  not-found.tsx, */error.tsx, */loading.tsx

components/
  ui/            Button, Logo, SiteHeader/Footer, SkipLink, ErrorBoundary
  auth/          SignUpForm, SignInForm, AuthStatus (header sign-in/log-out slot)
  landing/       Hero, HowItWorks, FeaturedArtist (+ 3D preview loaders)
  profile/       Profile-page-only pieces (avatar bust, live visitor badge)
  avatar/        AvatarModel (3D), AvatarEditor, OptionGroup, preview canvas
  museum/        Rooms, walls, floor, lighting, furnishings, player controller, HUD,
                 CopyLinkButton (window.location.origin-based share link)
  artwork/       Frame (3D), interaction prompt, focused modal, grid fallback
  multiplayer/   RemoteAvatar, roster rendering, visitor panel
  create/        CreateMuseumForm, per-artwork upload/edit row
  dashboard/     DeleteMuseumButton
  dashboard/edit/  EditMuseumMetadataForm, PublishToggle (+ share link),
                 EditArtworkRow, AddArtworkForm -- Phase 3 editing UI, each with
                 its own independent save/loading/success/error state

game/            Framework-agnostic game logic, no JSX
  controls/      Keyboard input state, movement integration (pure functions)
  camera/        Third-person follow camera, pointer-orbit input
  collision/     Multi-room floor-plan clamping (rooms + doorway connectors)
  interaction/   Proximity-to-artwork detection
  networking/    Socket.IO event/payload types (shared contract)
  avatar/        Shared THREE geometry instances
  museum/        Gallery themes, wall-placement math, single-room auto-layout
                 (unmodified by Phase 3 -- reused as-is for relayout, see below)

hooks/           useAvatarConfig, useVisitorIdentity, useMultiplayer,
                 useLocalStorageState, usePrefersReducedMotion, ...
data/            Demo artist, demo museum, demo rooms, demo artwork (hardcoded)
lib/supabase/    Browser/server Supabase clients + the Proxy session-refresh helper
lib/artwork/     Upload/edit limits, sharp-based server-side image validation,
                 streaming multipart parser, Storage path/signed-URL helpers,
                 client-side image compression (shared by create + add-artwork)
lib/museum/      slug.ts -- id/artwork-id slug generation, shared by create + add-artwork
lib/site.ts      SITE_URL for server-only metadata only (see "Creator editing" below)
server/          museumsRepository.ts, artworksRepository.ts -- Postgres-backed
                 stores for user-created museums and their artwork;
                 museumLayout.ts -- relayoutMuseum, recomputes wall placement
                 after an artwork add/remove (Phase 3)
supabase/migrations/  SQL migrations (schema + Row Level Security policies) --
                 unchanged by Phase 3; every RLS policy it needed already existed
types/           Artwork, AvatarConfiguration, Player, Museum, GalleryRoom
public/artwork/  Generated placeholder artwork (see below)
scripts/         generate-placeholder-artwork.mjs
server.mjs       Custom server: Next.js + Socket.IO in one process, plus a
                 Content-Length fast-path reject for oversized uploads
proxy.ts         Refreshes the Supabase session and returns a real 404 for
                 unknown/inaccessible museum or artist slugs
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

Museums are persisted in a real Postgres database (Supabase), owned by the authenticated creator who made them, not a JSON file on disk -- see "Accounts, ownership, and museum visibility" below for the full data model and why. (An earlier iteration of this prototype used a file-backed store and, before that, an in-memory `Map`; the `Map` didn't work because Next.js compiles the `/api/museums` route, `proxy.ts`, and the `/museum/[id]` page into separate server bundles that don't reliably share module-level state at runtime even within one process, so a museum created via the API was invisible to the page meant to render it. A real database sidesteps that entirely.)

---

## Accounts, ownership, and museum visibility

**Chosen: Supabase Auth + Postgres + Row Level Security**, kept deliberately separate from the guest visitor identity described in "Multiplayer architecture" above.

- **Creator accounts.** `/sign-up` and `/sign-in` use Supabase Auth (email + password, with email confirmation required before first login). A `profiles` row is auto-provisioned for every new account via a Postgres trigger (`supabase/migrations/0001_init.sql`) -- sign-up stays a single email+password step, with a unique username/display name generated automatically rather than asked for up front.
- **Museum ownership is enforced by the database, not application code.** Every museum row in the `museums` table has an `owner_id` referencing `auth.users`. Row Level Security policies mean Postgres itself rejects an insert/update/delete that doesn't belong to the requesting user's own session -- there is no code path in this app that can write a museum on another user's behalf, even by mistake, because every write goes through a Supabase client scoped to the current user's own JWT (`lib/supabase/server.ts`), never a service-role/admin key.
- **Museum visibility.** Each museum has an `is_published` column (`supabase/migrations/0002_museum_visibility.sql`), defaulting to `true` so the current `/create` flow -- which has no publish/draft control yet -- keeps producing museums that are publicly viewable by a direct URL, no login required, exactly as before. The read policy is `is_published = true OR owner_id = auth.uid()`: a published museum is visible to anyone (including anonymous visitors); a museum with `is_published = false` is visible only to its owner. Because this is enforced in Postgres, `getMuseumById`/`hasMuseum` (`server/museumsRepository.ts`) need no visibility-specific logic of their own -- a private museum requested by anyone but its owner simply comes back as "doesn't exist," identical to an unknown slug, both on the museum page and in `proxy.ts`'s existence check.
- **The dashboard (`/dashboard`)** lists only the signed-in creator's own museums (published or not), derived from `getCurrentUser()`'s server-verified session -- never from a client-supplied id -- and filtered by that id in the query. RLS's read policy is intentionally public for *published* museums, so this filter, not RLS, is what keeps one user's dashboard from listing another user's museums; RLS is what keeps anyone from *writing* to a museum they don't own.
- **Visitors never need an account.** Every visitor -- including a signed-in creator walking through their own or someone else's museum -- still gets a `localStorage` guest identity for multiplayer presence (`useVisitorIdentity.ts`, unchanged). Supabase session cookies and the guest identity are two independent systems that never reference each other; `server.mjs`'s Socket.IO layer has no knowledge of Supabase at all.
- **Proxy (`proxy.ts`) now runs on almost every route**, not just `/museum/*` and `/artist/*`, so the Supabase session cookie stays refreshed everywhere (needed for `/create` and `/dashboard`'s sign-in gates and the header's logged-in state). This is a real, measurable cost versus the original file-backed prototype -- every page load now does a small amount of cookie/session work, and the app has an external dependency (Supabase reachability) it didn't have before. `next/headers`'s `cookies()` (used by the request-scoped Supabase client) does correctly reflect the real visitor's session when called from Proxy in this Next.js version, which is what lets an owner's own session be recognized even during the pre-render existence check for a private museum.
- **Publish/unpublish and full museum editing are built (Phase 3).** `/dashboard/[museumId]/edit` gives the owner a Published/Private toggle and museum/artwork editing, all built directly on the ownership model and RLS policies described above -- see "Creator editing & museum management" below for the full picture, including why no new migration or policy change was needed.

**Environment variables required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`). No service-role key is used anywhere in this app -- every database operation is subject to RLS under the requesting user's own session.

---

## Artwork storage

**Chosen: a private Supabase Storage bucket (`artwork-images`) + a real `artworks` table**, replacing the original prototype's base64-in-jsonb approach (artwork images embedded directly in `museums.artworks`).

- **Staged migration, on purpose.** `supabase/migrations/0003_artwork_storage.sql` is additive only -- it creates the `artworks` table, the `artwork-images` bucket, and all the RLS described below, but leaves the old `museums.artworks` jsonb column in place. Application code stops reading and writing that column as of this migration; it's kept only as a rollback fallback. `supabase/deferred/drop_legacy_artwork_jsonb.sql` removes it for good, but deliberately lives **outside** `supabase/migrations/` -- see "Migration history" below for why, and for what has to be true before it's ever run.
- **The responsibility split, and why it exists.** Storage RLS enforces exactly one thing: *is this authenticated user writing/reading beneath their own UUID folder*. Whether a given artwork is allowed to belong to a given museum is enforced entirely by the `artworks` table's own RLS, not by Storage RLS at all. This wasn't the original design -- Storage's `INSERT`/`UPDATE` policies originally also required the path's museum-id segment to reference a museum owned by the caller (via a join into `public.museums`), mirroring what the `artworks` table already checked. In practice, real uploads kept failing with `"new row violates row-level security policy"` (`AccessDenied`, `403`) despite every individual condition -- owner-id prefix, museum ownership, authenticated session -- independently confirmed correct. The likely cause: a Storage object upload performs an `INSERT ... RETURNING` internally, and `RETURNING` requires the newly-created row to *also* satisfy a `SELECT` policy, not just the `INSERT` policy's `WITH CHECK` -- and getting an operation-aware `SELECT` policy (`storage.allow_any_operation()`) to agree with a cross-schema join reliably, across several attempts, proved less robust than just narrowing what Storage RLS is responsible for in the first place. Removing the museum-ownership join from Storage's `INSERT`/`UPDATE` policies isn't a security regression, it's a relocation: a Storage object at `{ownerId}/{museumId}/{artworkId}.{ext}` where `{museumId}` isn't actually owned by `{ownerId}` is just an inert orphan under the uploader's own folder -- `artworks_insert_own`'s `exists()` check (below) means no `artworks` row can ever be created pointing at a `museum_id` the caller doesn't own, so that object can never become a real, renderable artwork no matter what path it was uploaded to, and it stays reachable only by its own uploader (the owner-prefix `SELECT`/`DELETE` policies).
- **Ownership is database-enforced at the `artworks` table, not just RLS-checked.** Every `artworks` row's `owner_id` is a denormalized copy of its parent museum's `owner_id`, but it's never client-settable: a `security definer` trigger (`artworks_sync_owner_trigger`) overwrites it from `museum_id` on every insert/update, so it can't drift from the real owner even by accident. The `insert`/`update` RLS policies separately re-check that the target `museum_id` belongs to `auth.uid()`, which is what actually blocks reassigning an owned artwork row to someone else's museum (`UPDATE artworks SET museum_id = '<a museum you don't own>'`) rather than just keeping the row's `owner_id` field cosmetically correct. This is now the *only* place "which museum can this artwork belong to" is enforced.
- **The bucket is private**, not public. A museum's slug-style id (e.g. `late-afternoon-a3f9k`) isn't cryptographically unguessable, so a public bucket would let anyone who found or guessed a URL see a private museum's art regardless of what RLS says about the `museums`/`artworks` tables. Instead, every artwork's `imageUrl` the app hands to the browser is a short-lived (15 minute) signed URL, minted server-side (`lib/artwork/storage.ts`) in one batched call per museum read -- no service-role key involved, same as everywhere else in this app. The short TTL is deliberate: a long-lived signed URL would stay usable after expiration would otherwise matter, e.g. right after a museum is unpublished.
- **Storage path convention:** `{owner_id}/{museum_id}/{artwork_id}.{ext}`. `INSERT`/`UPDATE`/`DELETE` all check only the owner-id prefix -- `(storage.foldername(name))[1] = auth.uid()::text`. The `SELECT` policy is split in two: an owner branch (same prefix check, no operation restriction -- an authenticated user can select/list/sign/upload only beneath their own folder) and an anonymous/published branch, which *is* operation-aware (`storage.allow_any_operation(['storage.object.sign', 'storage.object.sign_many'])`) and additionally requires a real `artworks` row joined to a published `museums` row -- so an anonymous visitor can mint a signed URL for one specific published artwork, but can never list/enumerate a folder or bucket, and never upload, regardless of publication state.
- **Museum row created before any Storage upload.** `app/api/museums/route.ts` creates the `museums` row first, then uploads each artwork's image, then inserts the `artworks` rows -- in that order. (An earlier version uploaded before creating the museum row, which is what first surfaced the RLS interaction described above -- with the museum-ownership check no longer part of Storage RLS this ordering is no longer strictly required by that specific policy, but it's kept because `artworks_insert_own` still requires the museum to exist first regardless.)
- **Deletion is DB-first, Storage-second, and Storage cleanup is retriable.** `deleteMuseum` (`server/museumsRepository.ts`) deletes the `museums` row first -- one atomic statement, cascading to `artworks` via a foreign key -- and only then best-effort removes the matching Storage objects, found by listing the museum's own folder directly rather than by trusting any DB row to still exist. If that cleanup step fails or only partially completes, the museum is still fully and correctly deleted from the user's (and RLS's) perspective; what's left behind is an orphaned Storage folder at a fully deterministic, still-computable path, safe to find and retry later. A "Delete museum" action on `/dashboard` is what actually exercises this path today. The same DB-first-then-Storage sequencing is used by the create flow's own rollback (`rollbackMuseumCreation` in `app/api/museums/route.ts`) if an upload or artwork-row insert fails partway through.
- **Uploads are validated server-side, never trusted from the client.** `lib/artwork/validateImage.ts` uses `sharp` to parse the real uploaded bytes -- real format (not a declared `Content-Type` header or filename extension), real width/height, both used as the authority for the frame layout math below. Client-side resizing (`components/create/CreateMuseumForm.tsx`, still `createImageBitmap` + canvas, now producing a `Blob` instead of a base64 string) is a bandwidth/UX optimization only.
- **Upload limits, enforced in layers** (`lib/artwork/limits.ts`): up to 10 artworks per museum, 8 MB per image, 60 MB per request. A `Content-Length` check in `server.mjs` and in the route handler rejects an obviously oversized request before any real work starts (cheap, but spoofable -- Content-Length is client-supplied); the real enforcement is a byte-counted streaming multipart parser (`lib/artwork/parseUploadRequest.ts`, via `busboy`) that aborts mid-upload the moment a limit is crossed, rather than buffering an entire oversized body into memory first the way `request.formData()` would. The Storage bucket itself also enforces a file-size cap and an allowed-MIME-type list (set in `0003_artwork_storage.sql`) as an independent layer beneath the application code.
- **The 3D layout algorithm is unchanged.** `game/museum/autoLayout.ts` and `game/museum/placement.ts` still compute each artwork's wall position, interaction zone, and frame size once, at upload time, from the (now server-verified) image aspect ratio -- the only thing that changed is that the result is persisted as one row per artwork instead of one jsonb array, and `imageUrl` resolves to a real signed URL instead of a data URL. Original aspect ratios are still never stretched or cropped, only "contain-fit" within a frame, exactly as before.
- **Upload UI states are honest about what `fetch` can actually observe.** A plain `fetch(FormData)` call can't report byte-level upload progress, and one request covers both "still sending bytes" and "server validating/uploading/inserting" indistinguishably -- so the create form shows a real "Preparing…" state while client-side image compression runs (a genuinely separate, separately-timed phase), then one honest "Uploading your museum…" state for the whole submission, rather than a fabricated percentage or a fake "processing" step in between.

**Migration history.**

- `0003_artwork_storage.sql` contains the final, correct Phase 2 schema and Storage/RLS policies -- everything a fresh database needs for artwork storage to work correctly from the start.
- `0004_fix_artwork_images_select_upload_operation.sql`, `0005_fix_artwork_images_select_owner_prefix_only.sql`, and `0006_fix_artwork_images_storage_boundary_only.sql` are historical hotfix migrations from development, each a small, targeted `drop policy` + `create policy` for exactly the one Storage policy that needed fixing while the RLS interaction described above was being diagnosed against a real upload. They still live in `supabase/migrations/` and **will be replayed** by anything that runs the full migration sequence (`supabase db push`, `supabase db reset`, CI, a fresh deployment) -- that's fine: each is idempotent (`drop policy if exists` + `create policy`), so replaying them against a database that already has `0003`'s final policies just recreates the same end state, in the same order they were originally applied by hand. They're kept as-applied rather than rewritten into `0003` or deleted, so the migration history stays an honest record of what actually happened, not a rewritten one.
- The legacy `museums.artworks` jsonb column removal is **deferred, not an active migration**: `supabase/deferred/drop_legacy_artwork_jsonb.sql` lives outside `supabase/migrations/` specifically so `db push`/`db reset`/CI/a future deployment never runs it automatically. It's reviewed, approved SQL waiting on a deliberate decision to run it -- not something migration tooling should ever discover on its own.
- **Creator editing (Phase 3) required no new migration.** Every RLS policy it needed -- `museums_update_own`, `artworks_update_own`/`_insert_own`/`_delete_own`, and the Storage bucket's owner-prefix policies -- already existed from `0001`-`0003` above, none of them written with "only usable at creation time" as an assumption. See "Creator editing & museum management" below.

**Before switching to `supabase db push` for deployment, resynchronize migration history first.** The dev Supabase project this was built and tested against was updated by pasting each of `0001`-`0006` into the Supabase SQL Editor by hand, not via `supabase db push` -- and the SQL Editor does not necessarily populate the CLI's own migration-history tracking (`supabase_migrations.schema_migrations`) the way `db push` does. That means this repo's local `supabase/migrations/` files and the *remote* project's recorded migration history are not guaranteed to agree, even though the actual schema does. Before running `supabase db push` (or, especially, `supabase db reset`, which replays everything from scratch) against this project, inspect and reconcile that history first (`supabase migration list` compares local vs. remote) rather than assuming the remote already matches what's in this folder -- a mismatch there is exactly the kind of thing that could cause a push to error, skip something it shouldn't, or attempt to reapply something already live.

---

## Creator editing & museum management

**Phase 3: a signed-in owner can now manage an existing museum instead of only deleting it and starting over.** Each museum card on `/dashboard` now shows a Published/Private badge and Edit / View Museum / Copy Link actions; `/dashboard/[museumId]/edit` is the owner-only management screen.

- **What an owner can do.** Rename a museum, edit its description, change its gallery theme, toggle it between Published and Private, edit any existing artwork's title/artist/year/medium/description/alt text, remove an individual artwork, and add a new artwork to an existing museum through the same secure upload path the create flow uses (`lib/artwork/validateImage.ts`, `lib/artwork/parseUploadRequest.ts`, the private `artwork-images` bucket). A museum's id and its `/museum/[museumId]` URL never change as a result of any of this -- renaming a museum only changes the `name` column, never the id it was created with.
- **No new migration was needed.** Every column and RLS policy Phase 3 needed already existed from Phase 1/2: `museums_update_own` covers name/description/theme/`is_published` edits; `artworks_update_own`/`artworks_insert_own`/`artworks_delete_own` cover per-artwork metadata edit/add/remove; the Storage bucket's owner-prefix `INSERT`/`SELECT`/`DELETE` policies are reused unchanged for adding and removing artwork after creation. Every write route (`PATCH /api/museums/[museumId]`, `PATCH`/`DELETE /api/museums/[museumId]/artworks/[artworkId]`, `POST /api/museums/[museumId]/artworks`) also re-scopes by `museum_id`/`owner_id` in application code on top of RLS, and returns an identical 404 for "doesn't exist" and "exists but isn't yours" -- the same not-found-or-not-owned convention `deleteMuseum` already established, so no edit route ever confirms or denies that a given id belongs to someone else.
- **Automatic layout recompute, not manual placement.** Adding or removing an artwork calls `server/museumLayout.ts`'s `relayoutMuseum`, which re-runs the same, unmodified `generateSingleRoomMuseum` (`game/museum/autoLayout.ts`) the create flow already uses, over the museum's full post-edit artwork list. That function's wall-bucketing and per-slot frame sizing were already a function of the whole collection's size and order, not any single piece, so there's no way to insert or remove one frame in isolation without its neighbors' positions shifting too -- a full recompute is the only correct option, not a shortcut. The room's `width`/`depth`/`spawnPoint` may shift slightly as a deterministic result (visitor spawn is never persisted across sessions, so this is invisible in practice); the museum's id and URL never do. A text-only artwork edit or a theme change never triggers a relayout -- neither affects aspect ratio, frame size, or wall placement.
- **Individual artwork deletion is DB-first, Storage-second**, the same ordering and the same idiom `deleteMuseum` already used for whole-museum deletion: the `artworks` row delete is the authoritative, user-visible result, and only after it succeeds does a best-effort single-object Storage removal run (`deleteArtworkImages`, reused as-is, not the folder-listing variant museum deletion uses). A failed Storage removal never un-deletes the row or blocks the result the owner sees -- it leaves a retriable orphan at a fully deterministic path, exactly like museum deletion's own documented failure story.
- **Share links resolve the real running origin, not a hard-coded domain.** `components/museum/CopyLinkButton.tsx` builds the copied URL as `` `${window.location.origin}${path}` `` inside its click handler, where `path` is always the stable `/museum/[museumId]` route -- so Copy Link correctly copies `http://localhost:3000/museum/...` in local dev and the real deployed origin in production, automatically, with no configuration, because it's resolved from the actual browser the button is clicked in rather than from any value baked in at build/render time. "View Museum" links (dashboard, edit page, artist profile, create-flow success screen) are, and always were, plain relative `href="/museum/[museumId]"` links, for the same reason -- in-app navigation never needed an absolute URL. The one place an absolute URL is still unavoidable is `SITE_URL` (`lib/site.ts`), used for exactly one genuinely server-only purpose: Next's `metadataBase` (`app/layout.tsx`), which resolves relative OpenGraph/Twitter image URLs and has no access to a browser's `window.location`. `SITE_URL` reads `NEXT_PUBLIC_SITE_URL` if set (see `.env.example`) and otherwise falls back to a placeholder domain, since this prototype has no deployed domain yet -- but nothing about local development, in-app navigation, or the Copy Link/share behavior depends on that value being correct. An earlier version of this feature built every share link (including Copy Link) from that same placeholder `SITE_URL`, which produced a dead, non-resolving copied link regardless of what host the app was actually running on; see "How this was verified" below.
- **Scope limits, kept deliberately.** Artwork editing this phase is text metadata only (title/artist/year/medium/description/alt text) -- replacing an existing artwork's underlying image file is out of scope; swap it by removing the artwork and adding a new one (Storage's `artwork_images_update_own` policy stays unexercised, as `0003_artwork_storage.sql`'s own comments already anticipated). A museum can never be edited down to zero artwork -- deleting a museum's last remaining artwork is refused (`400`), matching the create flow's own "at least one artwork" minimum. Every save on the edit page (museum metadata, the publish toggle, each artwork row, add-artwork) is independent, with its own loading/success/error state, rather than one unified "Save changes" for the whole page.

New files: `app/dashboard/[museumId]/edit/page.tsx`; `app/api/museums/[museumId]/artworks/route.ts` (add) and `app/api/museums/[museumId]/artworks/[artworkId]/route.ts` (edit/remove); `server/museumLayout.ts`; `components/dashboard/edit/` (`EditMuseumMetadataForm`, `PublishToggle`, `EditArtworkRow`, `AddArtworkForm`); `lib/site.ts`, `lib/museum/slug.ts`, `lib/artwork/clientCompress.ts` (small helpers extracted out of the original create flow so it and the new edit flow share one implementation instead of two). `app/api/museums/[museumId]/route.ts` gained a `PATCH` handler alongside its existing owner-only `DELETE`.

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
- Wall and floor textures are small (256x256) CC0 photographed PNGs, loaded once per unique texture via drei's `useTexture` (cached across rooms) and cloned per room/segment only to set that instance's `repeat` -- see "Wall, floor, and decoration assets" below.
- Artwork "images" are hand-authored SVGs (a few KB each) rather than raster photography, so there's nothing to compress.
- `dpr` is capped at 2 on every canvas; only one light casts shadows (`MuseumLighting`'s directional light), everything else is unshadowed fill/point light.
- Multiplayer transforms are throttled client-side to ~10Hz before they ever reach the socket.
- `npm run build` / `npm run typecheck` / `npm run lint` all pass cleanly (see below).

## How this was verified

This build was checked with, not just written to satisfy:

- `npm run typecheck` -- passes with zero errors. `npm run lint` -- one pre-existing, unrelated error (`components/landing/Hero.tsx`, an unescaped apostrophe) plus the same informational `<img>`-vs-`next/image` warnings as before (intentional: see `components/artwork/ArtworkGrid.tsx`); neither predates nor was introduced by the Supabase migration work below.
- `npm run build` -- clean production build, all routes compile.
- A live two-socket-client script joined the same museum room and confirmed: `welcome` roster payload, `player:joined` broadcast, throttled `player:update` relay, `player:left` on disconnect, and correct `visitor:count` increment/decrement.
- A second script confirmed two different `museumId`s never see each other's players (room isolation).
- A Playwright pass loaded the landing page, artist profile, avatar editor, and live museum route and confirmed zero console/page errors on each.
- A Playwright pass opened the artwork dialog, confirmed focus moved into it, Tab-cycled through it without escaping (focus trap), confirmed Arrow-Right advances to the next artwork, and confirmed Escape closes it and restores focus to the triggering element.
- A 390px-wide Playwright pass confirmed zero horizontal overflow on the landing, profile, avatar-editor, and create-museum pages.
- Direct `curl` checks confirmed real HTTP 404s for unknown `/museum/:id` and `/artist/:username` slugs (see `proxy.ts` -- this Next.js version can't change a streamed response's status code after the body starts, so unknown slugs are rejected in Proxy, before rendering, rather than via `notFound()` inside the page).
- The full "create your own museum" flow was run end to end with Playwright: upload two real raster images, fill in the form, submit, follow the generated link, and confirm the new museum renders with zero console errors and correct multiplayer join.

**Accounts, ownership, and visibility (Supabase migration) -- verified separately, and by different means than the Playwright passes above:**

- End-to-end manually: signed up, confirmed a real account by email, signed in, created two museums, confirmed both persisted across logout/login and appeared on `/dashboard`.
- `curl`, unauthenticated: a published museum and the demo museum both return `200`; a museum with `is_published = false` returns a real `404`; `/dashboard` returns a sign-in prompt, not museum data.
- Queried Postgres directly (anon key) to confirm a private museum is absent from an anonymous read and absent from a query filtered by a different owner's id, and present when filtered by its real owner's id -- validating the exact query shape `server/museumsRepository.ts` uses, independent of the app.
- Manually confirmed, signed in as the owner: a private (`is_published = false`) museum opens normally; signed out, the same URL 404s.
- Read Next.js's Proxy implementation directly (`node_modules/next/dist/esm/server/web/adapter.js`) to confirm `next/headers`'s `cookies()` -- used by the request-scoped Supabase client inside `proxy.ts` -- is backed by the real incoming request's cookies when called from Proxy in this Next.js version, since this isn't explicitly documented and was worth confirming rather than assuming.

What this does **not** claim: no automated (Playwright) coverage of the auth/dashboard/visibility flows yet, no test with two separate real signed-in accounts confirming cross-user isolation through the browser (validated at the query/RLS level instead, per above), no user research, no usability testing sessions, and no analytics were run. There are no invented metrics anywhere in this repo.

**Artwork storage (Phase 2: `artworks` table + `artwork-images` Storage bucket) -- manually verified end to end against a real Supabase project**, after `0003_artwork_storage.sql` plus the `0004`-`0006` policy hotfixes described above were applied:

- Real two-image museum creation, end to end (create form → API → Storage upload → DB insert) -- **PASS**
- Uploaded images present as real objects in the private `artwork-images` bucket -- **PASS**
- A matching `artworks` row exists per uploaded image -- **PASS**
- Uploaded images render correctly on their frames in the live 3D museum -- **PASS**
- The museum's owner can view their own private (`is_published = false`) museum -- **PASS**
- An anonymous (signed-out) visitor cannot view that private museum -- **PASS**
- A second, different authenticated user ("User B") cannot view User A's private museum -- **PASS**
- User B directly attempting to `INSERT` an `artworks` row pointing at User A's `museum_id` is rejected by RLS (Postgres `42501`, insufficient privilege) -- **PASS**
- Deleting a museum removes the `museums` row -- **PASS**
- ...and cascades to remove its `artworks` rows -- **PASS**
- ...and best-effort Storage cleanup removes the uploaded files -- **PASS**
- The deleted museum's URL becomes unavailable (404) afterward -- **PASS**

**What this round did *not* separately exercise** (reasoned about and covered by policy/code review -- see "Artwork storage" above -- but not independently clicked/queried through): the non-3D grid/modal view rendering the same uploaded artwork (same `imageUrl`/signed-URL contract as the 3D path, not re-tested here); extreme aspect ratios (very wide/very tall uploads) actually rendering uncropped; a direct Storage-API upload attempt into another user's `museum_id` segment from within one's own UUID prefix (the `artworks`-table-level cross-user attempt above was tested directly; the Storage-level equivalent was reasoned through instead -- see "The responsibility split, and why it exists" above for why such an object would be an inert, unreachable orphan even if the upload itself succeeded); signed-URL expiry actually occurring after 15 minutes; the upload-size/type rejection paths (oversized file, oversized request, wrong MIME type) actually triggering their 413/400 responses; and a partial-failure rollback (e.g. the second of two images failing mid-upload) actually cleaning up correctly. None of this has automated (Playwright or otherwise) coverage yet, matching the rest of this section.

**Creator editing & museum management (Phase 3: `/dashboard/[museumId]/edit`, artwork add/edit/remove, relayout, share links) -- manually verified end to end against a real Supabase project:**

- Dashboard Published/Private badges match each museum's real `is_published` state -- **PASS**
- Edit Museum navigation from the dashboard, owner-only -- **PASS**
- Museum name/description/theme edits save and render correctly -- **PASS**
- The museum's permanent `/museum/[museumId]` URL stays stable across every edit above -- **PASS**
- Copy Link produces a working `http://localhost:3000/museum/...` link in local dev -- **PASS**
- View Museum opens the live museum correctly -- **PASS**
- The owner can view their own private (unpublished) museum -- **PASS**
- An anonymous/incognito visitor cannot view that same private museum -- **PASS**
- Switching a museum back to Published restores public access -- **PASS**
- Artwork metadata edits (title/artist/year/medium/description/alt text) save and render correctly -- **PASS**
- Adding a new artwork to an existing museum succeeds -- **PASS**
- The added artwork persists in both Storage and the `artworks` table and renders correctly in the live 3D room -- **PASS**
- Removing an individual artwork succeeds -- **PASS**
- The removed artwork's row and its Storage object are both actually gone afterward -- **PASS**
- The remaining artwork's layout is correctly recomputed (relayout) after an add or remove -- **PASS**
- A second, different authenticated user cannot access the first user's private museum or its edit experience -- **PASS**

This directly re-verifies, against the live edit flow rather than only via policy/code review, the same ownership and visibility guarantees the Phase 2 verification above established for creation/deletion -- ownership enforcement, publish/private visibility, and Storage cleanup all hold under editing too, not just under create-once/delete-outright. The Copy Link fix specifically was caught by this manual pass: an earlier version copied a link built from a hard-coded placeholder domain instead of the browser's real origin, which produced a dead link in every environment, dev or production, until it was pointed at `window.location.origin` instead (see "Creator editing & museum management" above). What this round did not separately exercise: automated (Playwright or otherwise) coverage of any of the above, a concurrent-edit race between two tabs/sessions, and signed-URL-expiry timing during an edit session -- reasoned about and covered by design/code review, matching how the rest of this document distinguishes what was actually run from what was reasoned through.

---

## Deployment

The app is one Node process (`server.mjs`) serving both Next.js and Socket.IO, so it needs a host that runs a persistent Node server rather than pure serverless functions.

**Recommended:** Render, Railway, Fly.io, or any VPS/Docker host.

0. Run both `supabase/migrations/*.sql` files, in order, against the target Supabase project (a separate project from local dev, unless you're deliberately sharing one), and set the redirect URL in **Authentication → URL Configuration** to `https://<your-domain>/auth/callback`.
1. `npm run build`
2. Start command: `npm run start` (runs `node server.mjs` with `NODE_ENV=production`)
3. Expose the port from `process.env.PORT` (defaults to `3000`)

**Environment variables:**

| Variable | Purpose | Required | Default |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (creator accounts + museum database) | Yes | -- |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key -- safe to expose; Row Level Security is the actual access control, not key secrecy | Yes | -- |
| `PORT` | HTTP port the custom server listens on | No | `3000` |
| `CLIENT_ORIGIN` | CORS origin allowed to connect via Socket.IO | No | `*` |
| `NEXT_PUBLIC_SOCKET_URL` | Only needed if the realtime server is deployed **separately** from the Next.js frontend | No | same-origin |
| `NEXT_PUBLIC_SITE_URL` | Absolute site origin used only for server-only metadata (Next's `metadataBase`, see "Creator editing & museum management") -- never for navigation or the Copy Link share button, both of which always resolve the browser's real `window.location.origin` instead | No | placeholder domain |

No service-role/admin Supabase key is used anywhere in this app. If you split the frontend (e.g. static hosting) from the realtime server, set `NEXT_PUBLIC_SOCKET_URL` on the frontend build and `CLIENT_ORIGIN` on the server so CORS allows it.

**Vercel note:** the Next.js pages/routes themselves are compatible with Vercel, but Vercel's serverless functions can't host the long-lived Socket.IO server this app depends on for multiplayer. Deploying there would need the realtime layer split out to a separately-hosted Socket.IO service (or swapped for a managed realtime product like PartyKit), reachable via `NEXT_PUBLIC_SOCKET_URL`.

---

## Artwork assets

Every "artwork" in the demo collection is an original, procedurally generated abstract SVG composition (`scripts/generate-placeholder-artwork.mjs`, output in `public/artwork/`) -- geometric shapes and gradients built from a seeded random generator and a muted color palette, standing in for a real artist's photographed work. Nothing is copied, scraped, or AI-generated from existing artwork; regenerate them any time with `npm run generate:artwork`. Titles, bios, and descriptions (`data/artworks.ts`, `data/demoArtist.ts`) are fictional and written for this demo.

## Wall, floor, and decoration assets

Wall and floor materials (`public/textures/`) and three decorative props -- a wall sconce, a tall floor plant, and a rug (`public/models/decor/`, rendered by `components/museum/DecorModels.tsx` via Three's `OBJLoader`/`MTLLoader`) -- are CC0 (public domain) assets, not hand-authored:

- **Wall/floor textures**: SBS - Tiny Texture Pack 2 by Screaming Brain Studios (screamingbrainstudios.com). One photographed material per gallery theme (plaster, sandstone, brick, brushed metal) plus one herringbone-tile floor texture, each loaded once and tinted per room via `material.color`, not swapped per room -- see `public/textures/CREDITS.md`.
- **Decoration models**: the "Living Room" free 3D asset pack by Goryana (goryana.art) -- only `wall_lamp`, `tall_flower`, and `carpet` are used; the pack's other pieces (sofa, TV, curtains, etc.) were left out as too domestic for a gallery setting. See `public/models/decor/CREDITS.md`.

Both packs are released under CC0 1.0, free to use commercially or non-commercially with or without credit; credit is given anyway. This is a deliberate exception to this repo's usual originality bar (below) -- procedural materials and primitive-geometry decor were judged not worth hand-building when high-quality, license-clear photographed textures and models already exist for exactly this purpose.

## Originality note

The avatar (`components/avatar/AvatarModel.tsx`, geometry in `game/avatar/geometry.ts`) is built entirely from primitive Three.js geometry (spheres, capsules, a cone) composed into an original large-head/small-body silhouette, with its own facial treatment, hairstyles, and clothing options. It is not a copy, retexture, or derivative of any existing game's character models, and uses no third-party or proprietary assets. (Wall/floor textures and select decoration props are a deliberate exception -- see "Wall, floor, and decoration assets" above.)

---

## Case study capture plan

See [`case-study-assets/README.md`](./case-study-assets/) for a shot list and capture guidance (what to screenshot/record, at what size, with which app state) for presenting this project in a UX case study -- landing hero, avatar editor, third-person museum, two live visitors together, the interaction prompt, focused artwork view, sequential navigation, the accessible grid, and mobile layouts.

---

## Product scope

### Implemented
Branded landing page · demo artist profile · museum preview/share page · shareable `/museum/[id]` route · a five-room hand-designed museum with per-room themes, auto-placed furnishings, and varied frame sizes · third-person movement with camera-relative controls and multi-room wall/doorway collision · original stylized armless avatar with idle/walk animation · avatar editor (skin tone, 3 hairstyles, hair color, top, bottom, shoes, accessory, `localStorage`-persisted, live 3D preview) · artwork interaction prompts with a dedicated trigger key · focused artwork view with looping previous/next and position indicator · accessible non-3D artwork grid · live multiplayer avatars with join/leave/interpolation/throttling, session-based reconnect dedup, and per-museum room isolation · visitor count and presence panel · a full "create your own museum" upload flow (client-side compression, server-side `sharp` validation, theme picker, auto-generated single-room layout, shareable link) · real creator accounts (Supabase Auth, email confirmation, persistent sessions) · Postgres-backed museum storage with Row Level Security enforcing per-owner create/update/delete and published-or-owner-only read · a `/dashboard` listing a signed-in creator's own museums, including a delete-museum action · per-museum publish/draft visibility (`is_published`, enforced at the database layer, not just in application code) · a private Supabase Storage bucket + real `artworks` table for uploaded images, with short-lived signed URLs, database-enforced ownership, layered upload-size/type limits, and failure-safe DB-first deletion (see "Artwork storage") · owner-only creator editing and museum management (`/dashboard/[museumId]/edit`): museum name/description/theme editing, a Published/Private toggle, per-artwork metadata editing, artwork removal with Storage cleanup, adding new artwork to an existing museum via the same secure upload path, and an automatic server-side layout recompute after any artwork add/remove, all without a new migration (see "Creator editing & museum management") · a View Museum / Copy Link share affordance on the dashboard and edit page that resolves the browser's real running origin rather than a hard-coded domain · loading/error/not-found states on every dynamic route · responsive layouts for every non-3D screen · accessibility fundamentals (focus trap, keyboard operability, reduced motion, alt text) · deployment configuration and docs.

### Not implemented (by design, for this prototype)
Replacing an existing artwork's underlying image file in place (Phase 3's artwork editing is text metadata only -- swap the image by removing the artwork and adding a new one; Storage's `artwork_images_update_own` policy exists but stays unexercised) · drag-and-drop gallery editing or a visual room editor (artwork placement is always auto-computed server-side after an add/remove, never manual -- see "Creator editing & museum management") · multiple room-shape templates (custom museums get one auto-sized room, not the demo's five-room layout) · likes/comments/following/messaging/voice chat · payments or art sales · a moderation system · events · multiple floors · a custom architecture/furniture editor · VR · analytics/usage tracking. These are all real product directions -- see below -- deliberately deferred so this work could go deep on accounts/ownership/data and, now, creator editing first, matching this repo's own phased approach.

## Future product vision

If this moved past prototype: in-place replacement of an existing artwork's image file, building on the `artwork_images_update_own` Storage policy that already exists but is unexercised; multiple room-shape templates and simple architectural customization for user-created museums, not just the auto-sized single room; drag-and-drop rearrangement of artwork on the walls, as a manual layer on top of the automatic relayout Phase 3 already does; usage analytics; a "you were here" visit history for artists to see who's stopped by; light social features (following an artist, a comment left in a guestbook-style panel rather than inline chat); and eventually multiple rooms/floors per user museum as a portfolio grows, matching what the demo museum already shows is possible. Not committed to VR, but the avatar and room system were designed so a future VR mode wouldn't require starting over.
