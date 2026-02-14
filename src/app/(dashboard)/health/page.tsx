"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  Alert,
  Button,
  Stack,
} from "@mui/material";
import { IconArrowLeft, IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react";
import { HEALTH_JSON_URL } from "@/lib/constants";
import type { HealthCheckResult, HealthJsonResponse } from "@/types";

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
        label={status}
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
  return (
    <Chip label={status} size="small" variant="outlined" />
  );
}

export default function HealthPage() {
  const { data: session } = useSession();
  const token = (session as { apiToken?: string } | null)?.apiToken;

  const [data, setData] = useState<HealthJsonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(HEALTH_JSON_URL, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((json) => setData(json as HealthJsonResponse))
      .catch((err) => setError(err.message || "Failed to load health"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={320}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box>
        <Button
          component={Link}
          href="/"
          startIcon={<IconArrowLeft size={18} />}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Alert severity="error">{error || "Health data unavailable"}</Alert>
      </Box>
    );
  }

  const results: HealthCheckResult[] = data.checkResults ?? [];
  const okCount = results.filter((r) => r.status === "ok").length;
  const failedCount = results.filter((r) => r.status === "failed" || r.status === "crashed").length;
  const finishedAt = data.finishedAt
    ? new Date(data.finishedAt * 1000).toLocaleString()
    : "—";

  return (
    <Box>
      <Button
        component={Link}
        href="/"
        startIcon={<IconArrowLeft size={18} />}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          System Health
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Last run: {finishedAt}
        </Typography>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Chip
            label={`${okCount} OK`}
            color="success"
            variant="outlined"
            size="medium"
          />
          {failedCount > 0 && (
            <Chip
              label={`${failedCount} Failed`}
              color="error"
              variant="outlined"
              size="medium"
            />
          )}
        </Stack>
      </Paper>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Check</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Summary</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Meta</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No check results</Typography>
                </TableCell>
              </TableRow>
            ) : (
              results.map((check) => (
                <TableRow key={check.name} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {check.label || check.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={check.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{check.shortSummary}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={check.notificationMessage ? "error.main" : "text.secondary"}
                    >
                      {check.notificationMessage || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                        maxWidth: 280,
                        fontFamily: "monospace",
                        fontSize: "0.7rem",
                      }}
                    >
                      {Object.keys(check.meta ?? {}).length > 0
                        ? JSON.stringify(check.meta)
                        : "—"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
