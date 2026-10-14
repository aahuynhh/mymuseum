"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence } from "framer-motion";
import * as THREE from "three";
import type { AvatarConfiguration, Museum } from "@/types";
import { useAvatarConfig } from "@/hooks/useAvatarConfig";
import { useVisitorIdentity } from "@/hooks/useVisitorIdentity";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
import { usePrefersCoarsePointer } from "@/hooks/usePrefersCoarsePointer";
import { MuseumRoom } from "./MuseumRoom";
import { MuseumLighting } from "./MuseumLighting";
import { PlayerController } from "./PlayerController";
import { MuseumLoadingScreen } from "./MuseumLoadingScreen";
import { ControlsHint } from "./ControlsHint";
import { MultiplayerAvatars } from "@/components/multiplayer/MultiplayerAvatars";
import { VisitorPanel } from "@/components/multiplayer/VisitorPanel";
import { InteractionPrompt } from "@/components/artwork/InteractionPrompt";
import { ArtworkModal } from "@/components/artwork/ArtworkModal";
import { ArtworkGrid } from "@/components/artwork/ArtworkGrid";
import { NoteComposerModal } from "@/components/messages/NoteComposerModal";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Button } from "@/components/ui/Button";

const SPAWN_ROTATION = Math.PI;

export function MuseumExperience({
  museum,
  exitHref,
  accountAvatarConfig,
  currentUserId,
  acceptsMessages,
}: {
  museum: Museum;
  exitHref: string;
  /** The signed-in visitor's saved account avatar, fetched server-side
   * (app/museum/[museumId]/page.tsx). Takes priority over the local-storage
   * guest avatar below -- null for signed-out visitors, who fall back to it. */
  accountAvatarConfig: AvatarConfiguration | null;
  /** The signed-in visitor's user id, or null if signed out -- only used to
   * hide Museum Mail's entry points from a museum's own owner (messaging
   * yourself makes no sense). Signed-out visitors still see the entry
   * points; the composer itself prompts them to sign in. */
  currentUserId: string | null;
  /** Whether this museum's owner currently accepts Museum Mail. When
   * false, "Leave a note"/"Message the artist" don't render at all. */
  acceptsMessages: boolean;
}) {
  const { avatarConfig: guestAvatarConfig, hydrated: guestAvatarHydrated } = useAvatarConfig();
  const avatarConfig = accountAvatarConfig ?? guestAvatarConfig;
  const avatarHydrated = accountAvatarConfig !== null || guestAvatarHydrated;
  const { identity, hydrated: identityHydrated } = useVisitorIdentity();

  const [nearbyArtworkId, setNearbyArtworkId] = useState<string | null>(null);
  const [focusedArtworkId, setFocusedArtworkId] = useState<string | null>(null);
  const [composerContext, setComposerContext] = useState<{ artworkId: string | null } | null>(null);
  const canMessageArtist = currentUserId !== museum.ownerId && acceptsMessages;
  // Touch-primary visitors default into the accessible grid view rather
  // than a 3D room they have no on-screen controls to navigate (see
  // PlayerController -- touch support isn't implemented yet). This only
  // decides the *initial* view; MuseumExperience is loaded with
  // next/dynamic(..., { ssr: false }), so reading matchMedia synchronously
  // here on first render can never cause a hydration mismatch. Desktop
  // visitors are unaffected and still land in the 3D room as before.
  const prefersCoarsePointer = usePrefersCoarsePointer();
  const [gridView, setGridView] = useState(prefersCoarsePointer);
  const { playing: musicPlaying, toggle: toggleMusic } = useAmbientAudio("/audio/gallery-theme.mp3");

  const { roster, visitorCount, status, remoteTransforms, sendTransform } = useMultiplayer({
    museumId: museum.id,
    username: identity.username,
    displayName: identity.displayName,
    sessionId: identity.sessionId,
    avatarConfiguration: avatarConfig,
    spawnPoint: museum.spawnPoint,
    spawnRotation: SPAWN_ROTATION,
  });

  const dpr = useMemo(() => (typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1), []);

  const controlsEnabled = focusedArtworkId === null && !gridView;
  const nearbyArtwork = nearbyArtworkId
    ? museum.artworks.find((a) => a.id === nearbyArtworkId) ?? null
    : null;

  useEffect(() => {
    if (!controlsEnabled || !nearbyArtworkId) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === "KeyE" || event.code === "Enter") {
        event.preventDefault();
        setFocusedArtworkId(nearbyArtworkId);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [controlsEnabled, nearbyArtworkId]);

  if (!avatarHydrated || !identityHydrated) {
    return <MuseumLoadingScreen museumName={museum.name} />;
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-canvas-deep">
      <VisitorPanel
        visitorCount={visitorCount}
        roster={roster}
        status={status}
        localDisplayName={identity.displayName}
      />
      <ControlsHint
        onToggleGridView={() => setGridView((v) => !v)}
        gridViewActive={gridView}
        musicPlaying={musicPlaying}
        onToggleMusic={toggleMusic}
        exitHref={exitHref}
        exitLabel="Exit museum"
        onLeaveNote={canMessageArtist ? () => setComposerContext({ artworkId: null }) : null}
      />

      {gridView ? (
        <div className="h-full overflow-y-auto px-4 py-24 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl text-ink">{museum.name}</h1>
                <p className="mt-2 max-w-xl text-sm text-ink-muted">
                  Browsing the full collection as an accessible grid -- no 3D navigation required.
                </p>
              </div>
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <Button type="button" variant="secondary" onClick={() => setGridView(false)}>
                  Enter 3D Gallery
                </Button>
                {prefersCoarsePointer && (
                  <p className="max-w-[16rem] text-xs text-ink-muted sm:text-right">
                    The 3D gallery is best experienced with a keyboard.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-8">
              <ArtworkGrid artworks={museum.artworks} onSelect={setFocusedArtworkId} />
            </div>
          </div>
        </div>
      ) : (
        <ErrorBoundary
          fallbackTitle="The museum couldn't load"
          fallbackDescription="Something went wrong rendering the 3D gallery. You can reload, or switch to the accessible grid view from the Controls panel."
        >
          <Suspense fallback={<MuseumLoadingScreen museumName={museum.name} />}>
            <Canvas
              shadows
              dpr={dpr}
              gl={{ antialias: true, toneMappingExposure: 1.3 }}
              camera={{ fov: 55, near: 0.1, far: 80 }}
              onCreated={({ scene }) => {
                scene.fog = new THREE.Fog("#2f2620", 24, 46);
              }}
            >
              <color attach="background" args={["#2f2620"]} />
              <MuseumLighting rooms={museum.rooms} />
              <MuseumRoom museum={museum} activeArtworkId={focusedArtworkId ?? nearbyArtworkId} />
              <MultiplayerAvatars roster={roster} transforms={remoteTransforms.current} />
              <PlayerController
                museum={museum}
                avatarConfig={avatarConfig}
                spawnPoint={museum.spawnPoint}
                controlsEnabled={controlsEnabled}
                onNearbyArtworkChange={setNearbyArtworkId}
                onTransformUpdate={sendTransform}
              />
            </Canvas>
          </Suspense>
        </ErrorBoundary>
      )}

      <AnimatePresence>
        {!gridView && nearbyArtwork && !focusedArtworkId && (
          <InteractionPrompt
            key="interaction-prompt"
            artwork={nearbyArtwork}
            onActivate={() => setFocusedArtworkId(nearbyArtwork.id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {focusedArtworkId && (
          <ArtworkModal
            key="artwork-modal"
            artworks={museum.artworks}
            activeId={focusedArtworkId}
            onClose={() => setFocusedArtworkId(null)}
            onNavigate={setFocusedArtworkId}
            canMessageArtist={canMessageArtist}
            onMessageArtist={() => setComposerContext({ artworkId: focusedArtworkId })}
          />
        )}
      </AnimatePresence>

      {composerContext && (
        <NoteComposerModal
          target={{
            type: "museum",
            museumId: museum.id,
            museumName: museum.name,
            artworkId: composerContext.artworkId,
            artworkTitle: composerContext.artworkId
              ? museum.artworks.find((a) => a.id === composerContext.artworkId)?.title ?? null
              : null,
          }}
          currentUserId={currentUserId}
          onClose={() => setComposerContext(null)}
        />
      )}
    </div>
  );
}
