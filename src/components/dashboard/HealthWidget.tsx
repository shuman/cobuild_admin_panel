"use client";

import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Skeleton,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Grid,
} from "@mui/material";
import {
  IconActivity,
  IconCheck,
  IconX,
  IconArrowRight,
  IconDatabase,
  IconServer,
  IconCpu,
  IconFolder,
} from "@tabler/icons-react";
import Link from "next/link";
import { useHealthStatus } from "@/hooks/useDashboardStats";

const subsystems = [
  { name: "Database", icon: IconDatabase, desc: "MySQL / Postgre" },
  { name: "Redis Cache", icon: IconServer, desc: "Key-Value Store" },
  { name: "Horizon Queue", icon: IconCpu, desc: "Background Jobs" },
  { name: "Storage Disk", icon: IconFolder, desc: "Local / S3 Storage" },
];

export default function HealthWidget() {
  const { health, error, isLoading } = useHealthStatus();

  const isDegraded = !!health && health.failedCount > 0;
  const healthPercent = health && health.total > 0
    ? Math.round((health.okCount / health.total) * 100)
    : 100;

  const toneColor = error
    ? "#FA896B"
    : isDegraded
    ? "#FFAE1F"
    : "#13DEB9";

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: { xs: 2, sm: 2.5 },
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        position: "relative",
        overflow: "hidden",
        boxShadow: (th) =>
          th.palette.mode === "dark"
            ? "0 4px 20px 0 rgba(0,0,0,0.25)"
            : "0 2px 10px 0 rgba(0,0,0,0.04)",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: (th) =>
            th.palette.mode === "dark"
              ? "0 8px 28px 0 rgba(0,0,0,0.35)"
              : "0 8px 24px 0 rgba(145, 158, 171, 0.12)",
        },
      }}
    >
      <CardContent
        sx={{
          p: { xs: "16px", sm: "24px" },
          "&:last-child": { pb: { xs: "16px", sm: "24px" } },
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header with Title & Pulse Status */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: { xs: 2, sm: 2.5 } }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: { xs: 38, sm: 46 },
                height: { xs: 38, sm: 46 },
                borderRadius: 2,
                bgcolor: `${toneColor}18`,
                color: toneColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                "& svg": { width: { xs: 20, sm: 24 }, height: { xs: 20, sm: 24 } },
              }}
            >
              <IconActivity size={24} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1rem", sm: "1.125rem" },
                  lineHeight: 1.2,
                }}
              >
                System Infrastructure
              </Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: { xs: "none", sm: "block" }, mt: 0.25 }}
              >
                Core backend services & daemon monitoring
              </Typography>
            </Box>
          </Stack>

          {/* Live Status Pill */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: { xs: 1, sm: 1.5 },
              py: 0.5,
              borderRadius: 10,
              bgcolor: `${toneColor}15`,
              border: `1px solid ${toneColor}35`,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: toneColor,
                boxShadow: `0 0 8px ${toneColor}`,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: toneColor,
                fontSize: { xs: "0.68rem", sm: "0.75rem" },
              }}
            >
              {error ? "Offline" : isDegraded ? "Degraded" : "Operational"}
            </Typography>
          </Box>
        </Stack>

        {/* Content body */}
        <Box sx={{ flexGrow: 1 }}>
          {error ? (
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: "error.light",
                color: "error.main",
                border: "1px solid",
                borderColor: "error.main",
                mb: 2,
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                Health Endpoint Unreachable
              </Typography>
              <Typography variant="caption" sx={{ display: "block", mt: 0.5, opacity: 0.9 }}>
                Unable to contact the backend service monitoring check. Please ensure
                Laravel backend is running.
              </Typography>
            </Box>
          ) : !health || isLoading ? (
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Skeleton variant="rounded" width="100%" height={28} />
              <Skeleton variant="rounded" width="100%" height={64} />
            </Stack>
          ) : (
            <Box sx={{ mb: 2 }}>
              {/* Score & Progress */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}
              >
                <Typography variant="body2" color="textSecondary">
                  Health Check Score
                </Typography>
                <Chip
                  icon={<IconCheck size={13} />}
                  label={`${health.okCount} / ${health.total} Passed (${healthPercent}%)`}
                  size="small"
                  color={health.failedCount > 0 ? "warning" : "success"}
                  variant="outlined"
                  sx={{ height: 24, fontSize: "0.72rem", fontWeight: 600, maxWidth: "100%" }}
                />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={healthPercent}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "action.hover",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: toneColor,
                    borderRadius: 3,
                  },
                }}
              />

              {/* Subsystems Micro-grid using CSS Grid */}
              <Box
                sx={{
                  mt: 1.75,
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                  gap: 1,
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                {subsystems.map((sub) => {
                  const Icon = sub.icon;
                  return (
                    <Box
                      key={sub.name}
                      sx={{
                        p: { xs: 1, sm: 1.25 },
                        borderRadius: 2,
                        bgcolor: "action.hover",
                        border: "1px solid",
                        borderColor: "divider",
                        textAlign: "left",
                        height: "100%",
                        minWidth: 0,
                        overflow: "hidden",
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5, minWidth: 0 }}>
                        <Box sx={{ color: "text.secondary", display: "flex", flexShrink: 0 }}>
                          <Icon size={16} />
                        </Box>
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          sx={{
                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            minWidth: 0,
                          }}
                        >
                          {sub.name}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{
                          fontSize: "0.68rem",
                          display: "block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          minWidth: 0,
                        }}
                      >
                        {sub.desc}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Failed Checks List (if any) */}
              {health.failedChecks.length > 0 && (
                <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: "error.light" }}>
                  <Typography variant="caption" fontWeight={600} color="error.main">
                    Issues Detected ({health.failedChecks.length})
                  </Typography>
                  <List dense disablePadding sx={{ mt: 0.5 }}>
                    {health.failedChecks.slice(0, 2).map((check) => (
                      <ListItem key={check.name} disableGutters sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <IconX size={15} color="#d32f2f" />
                        </ListItemIcon>
                        <ListItemText
                          primary={check.label || check.name}
                          secondary={check.shortSummary}
                          primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                          secondaryTypographyProps={{ variant: "caption" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Footer Action */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Typography variant="caption" color="textSecondary">
            Updated live every 60s
          </Typography>
          <Button
            component={Link}
            href="/health"
            size="small"
            endIcon={<IconArrowRight size={15} />}
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              p: "4px 8px",
            }}
          >
            Full Health Report
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
