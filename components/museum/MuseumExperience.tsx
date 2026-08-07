"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence } from "framer-motion";
import * as THREE from "three";
import type { Museum } from "@/types";
import { useAvatarConfig } from "@/hooks/useAvatarConfig";
import { useVisitorIdentity } from "@/hooks/useVisitorIdentity";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { useAmbientAudio } from "@/hooks/useAmbientAudio";
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
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const SPAWN_ROTATION = Math.PI;

export function MuseumExperience({ museum, exitHref }: { museum: Museum; exitHref: string }) {
  const { avatarConfig, hydrated: avatarHydrated } = useAvatarConfig();
  const { identity, hydrated: identityHydrated } = useVisitorIdentity();

  const [nearbyArtworkId, setNearbyArtworkId] = useState<string | null>(null);
  const [focusedArtworkId, setFocusedArtworkId] = useState<string | null>(null);
  const [gridView, setGridView] = useState(false);
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
      />

      {gridView ? (
        <div className="h-full overflow-y-auto px-4 py-24 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <h1 className="font-display text-3xl text-ink">{museum.name}</h1>
            <p className="mt-2 max-w-xl text-sm text-ink-muted">
              Browsing the full collection as an accessible grid -- no 3D navigation required.
            </p>
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
              gl={{ antialias: true }}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}
