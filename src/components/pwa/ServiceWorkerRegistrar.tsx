"use client";

import { useEffect } from "react";

/**
 * Registers the manual service worker (/public/sw.js) in production only.
 * Never registers in development — the SW would break Turbopack HMR by
 * caching or intercepting dev asset requests.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    const shouldRegister =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_ENABLE_SW_DEV === "true";

    if (!shouldRegister) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("ServiceWorker registration failed:", err);
          }
        });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
