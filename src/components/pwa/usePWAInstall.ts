"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = "cobuild_pwa_dismissed_at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function checkIsInstalledSnapshot() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

function subscribeInstalled(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    mql.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function checkIsIOSSnapshot() {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

const emptySubscribe = () => () => {};

export function usePWAInstall() {
  const isInstalled = useSyncExternalStore(
    subscribeInstalled,
    checkIsInstalledSnapshot,
    () => false
  );

  const isIOS = useSyncExternalStore(
    emptySubscribe,
    checkIsIOSSnapshot,
    () => false
  );

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [iosModalOpen, setIosModalOpen] = useState(false);

  // Check if user dismissed banner recently
  const checkIsDismissed = useCallback(() => {
    if (typeof window === "undefined") return true;
    const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!dismissedAt) return false;
    const parsed = parseInt(dismissedAt, 10);
    return Date.now() - parsed < DISMISS_COOLDOWN_MS;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isInstalled) return;

    // Show banner on iOS if not dismissed
    if (isIOS && !checkIsDismissed()) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Capture beforeinstallprompt event on Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      if (!checkIsDismissed()) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      try {
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      } catch {
        // ignore
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled, isIOS, checkIsDismissed]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstallable(false);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
      return choice.outcome;
    } catch (err) {
      console.error("Error invoking PWA install prompt:", err);
      return null;
    }
  }, [deferredPrompt]);

  const openPrompt = useCallback(async () => {
    if (isIOS) {
      setIosModalOpen(true);
      return;
    }
    if (deferredPrompt) {
      await promptInstall();
    }
  }, [isIOS, deferredPrompt, promptInstall]);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  }, []);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    showBanner,
    iosModalOpen,
    setIosModalOpen,
    openPrompt,
    promptInstall,
    dismissBanner,
  };
}
