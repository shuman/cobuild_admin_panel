"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Skeleton,
  Button,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  IconShieldLock,
  IconShieldCheck,
  IconClock,
  IconMail,
  IconCopy,
  IconCheck,
  IconArrowRight,
  IconAlertTriangle,
} from "@tabler/icons-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type { User } from "@/types";
import { use2FAStatus } from "@/hooks/useDashboardStats";

export default function SecuritySnapshot() {
  const { data: session } = useSession();
  const user = session?.user as unknown as User | undefined;
  const { isEnabled, isLoading, error: twoFAError } = use2FAStatus();
  const [copied, setCopied] = useState(false);

  const isSecure = isEnabled === true;
  const userEmail = user?.email || "—";

  const handleCopyEmail = () => {
    if (!user?.email) return;
    navigator.clipboard.writeText(user.email);
    setCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
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
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: { xs: 2, sm: 2.5 } }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={(theme) => ({
                width: { xs: 38, sm: 46 },
                height: { xs: 38, sm: 46 },
                borderRadius: 2,
                bgcolor: isSecure
                  ? `${theme.palette.success.main}18`
                  : `${theme.palette.warning.main}18`,
                color: isSecure
                  ? theme.palette.success.main
                  : theme.palette.warning.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                "& svg": { width: { xs: 20, sm: 24 }, height: { xs: 20, sm: 24 } },
              })}
            >
              {isSecure ? <IconShieldCheck size={24} /> : <IconShieldLock size={24} />}
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
                Security Center
              </Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: { xs: "none", sm: "block" }, mt: 0.25 }}
              >
                Account protection & posture
              </Typography>
            </Box>
          </Stack>

          {/* Posture Badge */}
          {isLoading ? (
            <Skeleton variant="rounded" width={75} height={24} />
          ) : isSecure ? (
            <Chip
              size="small"
              icon={<IconShieldCheck size={14} />}
              label="Protected"
              color="success"
              variant="outlined"
              sx={{ height: 24, fontSize: "0.7rem", fontWeight: 600 }}
            />
          ) : (
            <Chip
              size="small"
              icon={<IconAlertTriangle size={14} />}
              label="Action Needed"
              color="warning"
              variant="outlined"
              sx={{ height: 24, fontSize: "0.7rem", fontWeight: 600 }}
            />
          )}
        </Stack>

        {/* Security Checklist / Attributes */}
        <Stack
          divider={<Divider flexItem sx={{ borderStyle: "dashed" }} />}
          spacing={{ xs: 1.5, sm: 2 }}
          sx={{ flexGrow: 1 }}
        >
          {/* 2FA Row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Two-Factor Auth
              </Typography>
              <Typography variant="caption" color="textSecondary">
                TOTP Authenticator
              </Typography>
            </Box>
            {twoFAError ? (
              <Chip label="Error" size="small" variant="outlined" color="error" />
            ) : isLoading || isEnabled === null ? (
              <Skeleton variant="rounded" width={68} height={24} />
            ) : isEnabled ? (
              <Chip
                label="Enabled"
                size="small"
                color="success"
                sx={{ height: 24, fontSize: "0.72rem", fontWeight: 600 }}
              />
            ) : (
              <Button
                component={Link}
                href="/setup-2fa"
                size="small"
                variant="outlined"
                color="warning"
                sx={{
                  height: 24,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  p: "2px 8px",
                  textTransform: "none",
                }}
              >
                Enable 2FA
              </Button>
            )}
          </Stack>

          {/* Session Policy */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ color: "text.secondary", display: "flex" }}>
                <IconClock size={16} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  Session Policy
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Single-session active
                </Typography>
              </Box>
            </Stack>
            <Chip
              label="30m Timeout"
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: "0.68rem" }}
            />
          </Stack>

          {/* Account Details */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <Box sx={{ color: "text.secondary", display: "flex" }}>
                <IconMail size={16} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500}>
                  Account
                </Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{
                    display: "block",
                    maxWidth: { xs: 150, sm: 180 },
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {userEmail}
                </Typography>
              </Box>
            </Stack>

            <Tooltip title={copied ? "Copied!" : "Copy email"}>
              <IconButton size="small" onClick={handleCopyEmail}>
                {copied ? <IconCheck size={16} color="#13DEB9" /> : <IconCopy size={16} />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Footer Action */}
        <Box sx={{ pt: 1.5, mt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button
            component={Link}
            href="/setup-2fa"
            fullWidth
            size="small"
            variant="text"
            endIcon={<IconArrowRight size={15} />}
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              justifyContent: "space-between",
              px: 1,
            }}
          >
            {isSecure ? "Review 2FA & Auth Settings" : "Complete Security Setup"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
