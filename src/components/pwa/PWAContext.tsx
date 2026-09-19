"use client";

import React, { createContext, useContext } from "react";
import { usePWAInstall } from "./usePWAInstall";

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  showBanner: boolean;
  iosModalOpen: boolean;
  setIosModalOpen: (open: boolean) => void;
  openPrompt: () => Promise<void>;
  promptInstall: () => Promise<"accepted" | "dismissed" | null>;
  dismissBanner: () => void;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  showBanner: false,
  iosModalOpen: false,
  setIosModalOpen: () => {},
  openPrompt: async () => {},
  promptInstall: async () => null,
  dismissBanner: () => {},
});

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const pwa = usePWAInstall();

  return <PWAContext.Provider value={pwa}>{children}</PWAContext.Provider>;
}

export const usePWA = () => useContext(PWAContext);
