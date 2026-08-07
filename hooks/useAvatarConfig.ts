"use client";

import { useLocalStorageState } from "./useLocalStorageState";
import { DEFAULT_AVATAR_CONFIGURATION } from "@/types/avatar";
import type { AvatarConfiguration } from "@/types";

const STORAGE_KEY = "mymuseum.avatarConfiguration";

export function useAvatarConfig() {
  const { value, setValue, hydrated } = useLocalStorageState<AvatarConfiguration>(
    STORAGE_KEY,
    DEFAULT_AVATAR_CONFIGURATION
  );

  return { avatarConfig: value, setAvatarConfig: setValue, hydrated };
}
