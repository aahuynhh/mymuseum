"use client";

import { useEffect, useRef } from "react";
import { MAX_PITCH, MIN_PITCH, type OrbitState } from "./thirdPersonCamera";

const YAW_SENSITIVITY = 0.006;
const PITCH_SENSITIVITY = 0.004;

/** Lets the visitor drag the pointer across the canvas to orbit the follow camera. */
export function usePointerOrbit(
  domElement: HTMLElement | null,
  enabled: boolean,
  initialYaw = 0
) {
  const orbitRef = useRef<OrbitState>({ yaw: initialYaw, pitch: 0.12 });
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!domElement) return;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (!enabledRef.current) return;
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || !enabledRef.current) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      orbitRef.current.yaw -= dx * YAW_SENSITIVITY;
      orbitRef.current.pitch = Math.min(
        MAX_PITCH,
        Math.max(MIN_PITCH, orbitRef.current.pitch - dy * PITCH_SENSITIVITY)
      );
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (domElement.hasPointerCapture(event.pointerId)) {
        domElement.releasePointerCapture(event.pointerId);
      }
    };

    domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [domElement]);

  return orbitRef;
}
