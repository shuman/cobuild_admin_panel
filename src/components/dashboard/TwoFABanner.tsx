"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { IconArrowRight, IconShieldLock, IconX } from "@tabler/icons-react";
import { use2FAStatus } from "@/hooks/useDashboardStats";

const DISMISS_KEY = "dashboard:2fa-banner-dismissed";

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readDismissed(): string | null {
  try {
    return window.localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

/**
 * Nudge to enable 2FA. Renders ONLY when the status has settled as disabled
 * and the user hasn't dismissed it. Loading, fetch errors (unknown status),
 * enabled, and dismissed all render nothing — no SSR flash.
 */
export default function TwoFABanner() {
  const { isEnabled, isLoading, error } = use2FAStatus();
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const storedDismissed = useSyncExternalStore(
    subscribeStorage,
    readDismissed,
    () => null
  );
  const dismissed = sessionDismissed || storedDismissed === "1";

  if (isLoading || error || isEnabled !== false || dismissed) return null;

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Private mode etc.
    }
    setSessionDismissed(true);
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: { xs: 2, sm: 2.5 },
        position: "relative",
        overflow: "hidden",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        border: "1px solid",
        borderColor: (th) =>
          th.palette.mode === "dark"
            ? "rgba(255, 174, 31, 0.35)"
            : "rgba(255, 174, 31, 0.4)",
        background: (th) =>
          th.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(255, 174, 31, 0.12) 0%, rgba(255, 174, 31, 0.04) 100%)"
            : "linear-gradient(135deg, #FEF5E5 0%, #FFFDF9 100%)",
        boxShadow: (th) =>
          th.palette.mode === "dark"
            ? "0 4px 20px 0 rgba(0,0,0,0.3)"
            : "0 4px 16px 0 rgba(255, 174, 31, 0.1)",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 4,
          bgcolor: "warning.main",
        },
      }}
    >
      <CardContent
        sx={{
          p: { xs: "14px 16px", sm: "18px 24px" },
          "&:last-child": { pb: { xs: "14px", sm: "18px" } },
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={{ xs: 1.75, sm: 2 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 1.5, sm: 2 }}
            sx={{ minWidth: 0, flex: 1 }}
          >
            <Box
              sx={{
                width: { xs: 40, sm: 46 },
                height: { xs: 40, sm: 46 },
                borderRadius: 2,
                bgcolor: (th) =>
                  th.palette.mode === "dark"
                    ? "rgba(255, 174, 31, 0.2)"
                    : "rgba(255, 174, 31, 0.18)",
                color: "warning.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 0 12px rgba(255, 174, 31, 0.2)",
                "& svg": { width: { xs: 22, sm: 26 }, height: { xs: 22, sm: 26 } },
              }}
            >
              <IconShieldLock size={26} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: "text.primary",
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  lineHeight: 1.25,
                }}
              >
                Secure your SuperAdmin account
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  mt: 0.25,
                }}
              >
                Two-factor authentication is currently disabled. Protect your administrative
                privileges with TOTP authenticator.
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              width: { xs: "100%", sm: "auto" },
              justifyContent: { xs: "space-between", sm: "flex-end" },
              flexShrink: 0,
              pt: { xs: 0.5, sm: 0 },
            }}
          >
            <Button
              component={Link}
              href="/setup-2fa"
              variant="contained"
              color="warning"
              size="small"
              endIcon={<IconArrowRight size={16} />}
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.78rem", sm: "0.825rem" },
                px: { xs: 2, sm: 2.5 },
                py: "6px",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(255, 174, 31, 0.35)",
                },
              }}
            >
              Set up 2FA
            </Button>
            <IconButton
              aria-label="Dismiss reminder"
              onClick={handleDismiss}
              size="small"
              sx={{ color: "text.secondary" }}
            >
              <IconX size={18} />
            </IconButton>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
