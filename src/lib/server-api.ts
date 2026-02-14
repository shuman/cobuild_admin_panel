/**
 * Server-only API client for NextAuth and server components.
 * This file must NOT import next-auth/react or any client-only code.
 * Used by: auth.ts (Credentials authorize callback)
 */

import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8181/api";

export function serverApi(token?: string) {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    timeout: 30000,
  });
}
