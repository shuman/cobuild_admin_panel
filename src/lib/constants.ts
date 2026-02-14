export const APP_NAME = "CoBuild Manager — SuperAdmin";
export const APP_DESCRIPTION = "SuperAdmin Portal for CoBuild Manager";

// Session timeout in seconds (30 minutes)
export const SESSION_MAX_AGE = 30 * 60;

// API base URL
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8181/api";

// Health endpoint (backend root, not under /api)
export const HEALTH_JSON_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8181/api").replace(
    /\/api\/?$/,
    ""
  ) + "/health/json";
