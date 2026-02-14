"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { IconActivity, IconCheck, IconX, IconArrowRight } from "@tabler/icons-react";
import { HEALTH_JSON_URL } from "@/lib/constants";
import type { HealthCheckResult, HealthJsonResponse } from "@/types";

export default function HealthWidget() {
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
      .catch(() => setError("Unavailable"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <Card elevation={9} sx={{ height: "100%" }}>
        <CardContent sx={{ p: "24px", display: "flex", justifyContent: "center", minHeight: 180 }}>
          <CircularProgress size={32} />
        </CardContent>
      </Card>
    );
  }

  const results: HealthCheckResult[] = data?.checkResults ?? [];
  const okCount = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status === "failed" || r.status === "crashed");
  const total = results.length;

  return (
    <Card
      elevation={9}
      sx={{
        height: "100%",
        cursor: "default",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: (theme) => theme.shadows[16],
        },
      }}
    >
      <CardContent sx={{ p: "24px" }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            backgroundColor: "#FFAE1F15",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <IconActivity size={24} color="#FFAE1F" />
        </Box>
        <Typography variant="h6" gutterBottom>
          System Health
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Backend checks: Database, Redis, Disk, Horizon, Debug
        </Typography>

        {error ? (
          <Chip label={error} size="small" color="error" variant="outlined" />
        ) : (
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                icon={<IconCheck size={14} />}
                label={`${okCount}/${total} OK`}
                size="small"
                color={failed.length > 0 ? "warning" : "success"}
                variant="outlined"
              />
              {failed.length > 0 && (
                <Chip
                  icon={<IconX size={14} />}
                  label={`${failed.length} failed`}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}
            </Stack>
            {failed.length > 0 && (
              <List dense disablePadding sx={{ mt: 0.5 }}>
                {failed.slice(0, 3).map((check) => (
                  <ListItem key={check.name} disableGutters sx={{ py: 0, minHeight: 28 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <IconX size={16} color="#d32f2f" />
                    </ListItemIcon>
                    <ListItemText
                      primary={check.label || check.name}
                      secondary={check.shortSummary}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Stack>
        )}

        <Button
          component={Link}
          href="/health"
          size="small"
          endIcon={<IconArrowRight size={16} />}
          sx={{ mt: 2, px: 0 }}
        >
          View full report
        </Button>
      </CardContent>
    </Card>
  );
}
