"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import { HEALTH_JSON_URL } from "@/lib/constants";
import type {
  HealthCheckResult,
  HealthJsonResponse,
  TwoFAStatusResponse,
  UsersResponse,
} from "@/types";

const REFRESH_INTERVAL = 60_000;

/**
 * Live dashboard metrics via SWR.
 * - Keys include the API token; while the session is loading the key is null
 *   and hooks return no data (consumers render skeletons).
 * - Errors never throw; consumers get `error` and render "—" placeholders.
 */

/** Total row count for /admin/{users|projects} without fetching rows (limit=1). */
export function useAdminCount(kind: "users" | "projects") {
  const { data: session } = useSession();
  const token = session?.apiToken;

  const { data, error, isLoading } = useSWR<number, Error>(
    token ? ["admin-count", kind, token] : null,
    async () => {
      const res = await api.get<UsersResponse>(`/admin/${kind}`, {
        params: { page: 1, limit: 1 },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.count;
    },
    { refreshInterval: REFRESH_INTERVAL, keepPreviousData: true }
  );

  return { count: typeof data === "number" ? data : null, error: error ?? null, isLoading };
}

export interface HealthSummary {
  okCount: number;
  failedCount: number;
  total: number;
  failedChecks: HealthCheckResult[];
}

/** Laravel health JSON (lives outside the axios /api base). */
export function useHealthStatus() {
  const { data: session } = useSession();
  const token = session?.apiToken;

  const { data, error, isLoading } = useSWR<HealthSummary, Error>(
    token ? ["health-status", token] : null,
    async () => {
      const res = await fetch(HEALTH_JSON_URL, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Health endpoint returned ${res.status}`);
      const json = (await res.json()) as HealthJsonResponse;
      const results = json.checkResults ?? [];
      const failedChecks = results.filter(
        (r) => r.status === "failed" || r.status === "crashed"
      );
      return {
        okCount: results.length - failedChecks.length,
        failedCount: failedChecks.length,
        total: results.length,
        failedChecks,
      };
    },
    { refreshInterval: REFRESH_INTERVAL, keepPreviousData: true }
  );

  return { health: data ?? null, error: error ?? null, isLoading };
}

/** Whether the signed-in user has 2FA enabled. */
export function use2FAStatus() {
  const { data: session } = useSession();
  const token = session?.apiToken;

  const { data, error, isLoading } = useSWR<boolean, Error>(
    token ? ["2fa-status", token] : null,
    async () => {
      const res = await api.get<TwoFAStatusResponse>("/2fa/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.is_enabled;
    },
    { refreshInterval: REFRESH_INTERVAL, keepPreviousData: true }
  );

  return { isEnabled: typeof data === "boolean" ? data : null, error: error ?? null, isLoading };
}
