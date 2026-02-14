/**
 * Client-side API client. Use in "use client" components only.
 * - 401 / 403 (TOKEN_SECURITY_VIOLATION) → force signOut and redirect to /login
 */

import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8181/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

let isLoggingOut = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window === "undefined") return Promise.reject(error);

    const status = error.response?.status;
    const isUnauth =
      status === 401 ||
      (status === 403 &&
        error.response?.data?.code === "TOKEN_SECURITY_VIOLATION");

    if (isUnauth) {
      const url = String(error.config?.url || "");
      if (url.includes("/2fa/") || url.includes("/login")) return Promise.reject(error);

      if (!isLoggingOut) {
        isLoggingOut = true;
        try {
          const { signOut } = await import("next-auth/react");
          await signOut({ callbackUrl: "/login", redirect: true });
        } catch {
          window.location.href = "/login";
        } finally {
          isLoggingOut = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
