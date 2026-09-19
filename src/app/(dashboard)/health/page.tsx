"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
  Alert,
  Stack,
  Skeleton,
  LinearProgress,
  Grid,
} from "@mui/material";
import {
  IconRefresh,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconActivity,
  IconListCheck,
} from "@tabler/icons-react";
import { HEALTH_JSON_URL } from "@/lib/constants";
import StatCard from "@/components/dashboard/StatCard";
import type { HealthCheckResult, HealthJsonResponse } from "@/types";

type StatusFilter = "all" | "ok" | "failed" | "warning";

function StatusChip({ status }: { status: HealthCheckResult["status"] }) {
  if (status === "ok") {
    return (
      <Chip
        icon={<IconCheck size={14} />}
        label="Ok"
        size="small"
        color="success"
        variant="outlined"
      />
    );
  }
  if (status === "failed" || status === "crashed") {
    return (
      <Chip
        icon={<IconX size={14} />}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        size="small"
        color="error"
        variant="outlined"
      />
    );
  }
  if (status === "warning") {
    return (
      <Chip
        icon={<IconAlertTriangle size={14} />}
        label="Warning"
        size="small"
        color="warning"
        variant="outlined"
      />
    );
  }
  return <Chip label="Skipped" size="small" variant="outlined" />;
}

function metaKeys(meta: Record<string, unknown> | undefined): number {
  return Object.keys(meta ?? {}).length;
}

export default function HealthPage() {
  const { data: session } = useSession();
  const token = (session as { apiToken?: string } | null)?.apiToken;

  const [data, setData] = useState<HealthJsonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(HEALTH_JSON_URL, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(res.statusText);
      setData((await res.json()) as HealthJsonResponse);
    } catch (err: any) {
      setError(err?.message || "Failed to load health");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const results: HealthCheckResult[] = data?.checkResults ?? [];
  const okCount = results.filter((r) => r.status === "ok").length;
  const failedCount = results.filter(
    (r) => r.status === "failed" || r.status === "crashed"
  ).length;
  const warningCount = results.filter((r) => r.status === "warning").length;
  const totalCount = results.length;
  const healthPercent =
    totalCount > 0 ? Math.round((okCount / totalCount) * 100) : 100;
  const finishedAt = data?.finishedAt
    ? new Date(data.finishedAt * 1000).toLocaleString()
    : "—";

  const tone: "success" | "warning" | "error" = error
    ? "error"
    : failedCount > 0
    ? "warning"
    : "success";

  const filteredResults =
    statusFilter === "all"
      ? results
      : statusFilter === "ok"
      ? results.filter((r) => r.status === "ok")
      : statusFilter === "failed"
      ? results.filter((r) => r.status === "failed" || r.status === "crashed")
      : results.filter((r) => r.status === "warning");

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      {/* ── Header ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{ mb: { xs: 2, sm: 2.5 } }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.5rem", sm: "1.85rem" },
              letterSpacing: "-0.02em",
            }}
          >
            System Health
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" }, mt: 0.25 }}
          >
            Live status of backend services and infrastructure checks
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <span>
            <IconButton
              onClick={fetchHealth}
              disabled={loading}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                flexShrink: 0,
                alignSelf: { xs: "flex-end", sm: "center" },
              }}
            >
              {loading ? <CircularProgress size={18} /> : <IconRefresh size={20} />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Status hero ── */}
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 2.5 },
          borderRadius: { xs: 2, sm: 2.5 },
          border: "1px solid",
          borderColor: (th) =>
            th.palette.mode === "dark"
              ? `${th.palette[tone].main}66`
              : `${th.palette[tone].main}59`,
          background: (th) =>
            th.palette.mode === "dark"
              ? `linear-gradient(135deg, ${th.palette[tone].main}1F, ${th.palette[tone].main}0A)`
              : `linear-gradient(135deg, ${th.palette[tone].main}1A, #FFFDF9)`,
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 4,
            bgcolor: (th) => th.palette[tone].main,
            opacity: 0.85,
          },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={{ xs: 1.5, sm: 2 }}
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: { xs: 44, sm: 52 },
                height: { xs: 44, sm: 52 },
                borderRadius: "50%",
                bgcolor: (th) => `${th.palette[tone].main}18`,
                color: (th) => `${th.palette[tone].main}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                "& svg": { width: { xs: 22, sm: 26 }, height: { xs: 22, sm: 26 } },
              }}
            >
              <IconActivity size={26} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              {loading ? (
                <>
                  <Skeleton variant="text" width={240} sx={{ width: { xs: 200, sm: 260 } }} />
                  <Skeleton variant="text" width={280} sx={{ width: { xs: 240, sm: 320 } }} />
                </>
              ) : (
                <>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: "1.1rem", sm: "1.3rem" },
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {error
                      ? "Health Data Unavailable"
                      : failedCount > 0
                      ? "Degraded Performance"
                      : "All Systems Operational"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.78rem", sm: "0.85rem" }, mt: 0.25 }}
                  >
                    {error
                      ? "Could not reach the health endpoint — check that the backend is running"
                      : `${okCount} of ${totalCount} checks passed · Last run ${finishedAt}`}
                  </Typography>
                </>
              )}
            </Box>
          </Stack>
          <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
            {loading ? (
              <Skeleton variant="rounded" width={72} sx={{ height: { xs: 28, sm: 36 } }} />
            ) : (
              <>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "1.5rem", sm: "1.85rem" },
                    letterSpacing: "-0.02em",
                    color: (th) => th.palette[tone].main,
                    lineHeight: 1.1,
                  }}
                >
                  {error ? "—" : `${healthPercent}%`}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, letterSpacing: "0.05em", fontSize: "0.68rem" }}
                >
                  HEALTH SCORE
                </Typography>
              </>
            )}
          </Stack>
        </Stack>
        {loading ? (
          <LinearProgress
            sx={{
              mt: 2,
              height: 6,
              borderRadius: 3,
              bgcolor: "action.hover",
              "& .MuiLinearProgress-bar": { borderRadius: 3 },
            }}
          />
        ) : (
          !error && (
            <LinearProgress
              variant="determinate"
              value={healthPercent}
              sx={{
                mt: 2,
                height: 6,
                borderRadius: 3,
                bgcolor: "action.hover",
                "& .MuiLinearProgress-bar": {
                  bgcolor: (th) => th.palette[tone].main,
                  borderRadius: 3,
                },
              }}
            />
          )
        )}
      </Paper>

      {/* ── Filter stat cards ── */}
      <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: 0.5 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Total Checks"
            value={loading ? null : error ? "—" : String(totalCount)}
            icon={<IconListCheck size={22} />}
            tone="primary"
            selected={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            failed={!!error}
            hint={error ? "unavailable" : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Passed"
            value={loading ? null : error ? "—" : String(okCount)}
            icon={<IconCheck size={22} />}
            tone="success"
            selected={statusFilter === "ok"}
            onClick={() => setStatusFilter((v) => (v === "ok" ? "all" : "ok"))}
            failed={!!error}
            hint={error ? "unavailable" : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Failed"
            value={loading ? null : error ? "—" : String(failedCount)}
            icon={<IconX size={22} />}
            tone="error"
            selected={statusFilter === "failed"}
            onClick={() => setStatusFilter((v) => (v === "failed" ? "all" : "failed"))}
            failed={!!error}
            hint={error ? "unavailable" : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Warnings"
            value={loading ? null : error ? "—" : String(warningCount)}
            icon={<IconAlertTriangle size={22} />}
            tone="warning"
            selected={statusFilter === "warning"}
            onClick={() => setStatusFilter((v) => (v === "warning" ? "all" : "warning"))}
            failed={!!error}
            hint={error ? "unavailable" : undefined}
          />
        </Grid>
      </Grid>

      {/* ── Checks list ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: { xs: 2, sm: 2.5 },
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {/* Mobile: compact card list */}
        <Box sx={{ display: { xs: "block", md: "none" }, p: { xs: 1.5, sm: 2 } }}>
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1.5,
                  mb: 1.5,
                }}
              >
                <Skeleton variant="text" width="55%" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="rounded" width={110} height={22} />
              </Box>
            ))
          ) : filteredResults.length === 0 ? (
            <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
              <IconActivity size={28} opacity={0.4} />
              <Typography color="text.secondary">
                {error
                  ? "Health data unavailable — try refreshing"
                  : statusFilter === "all"
                  ? "No check results"
                  : `No ${statusFilter} checks`}
              </Typography>
            </Stack>
          ) : (
            filteredResults.map((check) => (
              <Box
                key={check.name}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1.5,
                  mb: 1.5,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {check.label || check.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: "monospace", display: "block", mt: 0.25 }}
                    >
                      {check.name}
                    </Typography>
                  </Box>
                  <StatusChip status={check.status} />
                </Stack>
                {check.shortSummary && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {check.shortSummary}
                  </Typography>
                )}
                {check.notificationMessage && (
                  <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                    {check.notificationMessage}
                  </Typography>
                )}
                {metaKeys(check.meta) > 0 && (
                  <Box
                    component="pre"
                    sx={{
                      mt: 1,
                      mb: 0,
                      p: 1,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                      fontSize: "0.68rem",
                      color: "text.secondary",
                      overflow: "hidden",
                    }}
                  >
                    {JSON.stringify(check.meta)}
                  </Box>
                )}
              </Box>
            ))
          )}
        </Box>

        {/* Desktop: table */}
        <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell>Check</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Summary</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Meta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [0, 1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} sx={{ py: 1.75 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Skeleton variant="rounded" width={72} height={22} />
                        <Skeleton variant="text" width="28%" />
                        <Skeleton variant="rounded" width={54} height={22} />
                        <Skeleton variant="text" width="18%" />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Stack alignItems="center" spacing={1}>
                      <IconActivity size={28} opacity={0.4} />
                      <Typography color="text.secondary">
                        {error
                          ? "Health data unavailable — try refreshing"
                          : statusFilter === "all"
                          ? "No check results"
                          : `No ${statusFilter} checks`}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                filteredResults.map((check) => (
                  <TableRow key={check.name} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {check.label || check.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: "monospace", fontSize: "0.72rem" }}
                      >
                        {check.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={check.status} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {check.shortSummary || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={check.notificationMessage ? "error.main" : "text.secondary"}
                        sx={{ maxWidth: 260 }}
                      >
                        {check.notificationMessage || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {metaKeys(check.meta) > 0 ? (
                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            maxWidth: 300,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            fontFamily: "monospace",
                            fontSize: "0.7rem",
                            color: "text.secondary",
                          }}
                        >
                          {JSON.stringify(check.meta)}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
