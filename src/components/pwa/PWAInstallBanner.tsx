"use client";

import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import {
  IconDownload,
  IconX,
  IconShare,
  IconSquarePlus,
} from "@tabler/icons-react";
import { usePWA } from "./PWAContext";

export default function PWAInstallBanner() {
  const theme = useTheme();
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showBanner,
    iosModalOpen,
    setIosModalOpen,
    openPrompt,
    dismissBanner,
  } = usePWA();

  // If already installed, never render
  if (isInstalled) return null;

  // Banner is only displayed if showBanner is true and either installable or iOS
  const shouldDisplayBanner = showBanner && (isInstallable || isIOS);

  return (
    <>
      <Slide direction="up" in={shouldDisplayBanner} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: "fixed",
            bottom: { xs: 16, sm: 24 },
            left: { xs: 16, sm: 24 },
            right: { xs: 16, sm: "auto" },
            maxWidth: { xs: "calc(100% - 32px)", sm: 440 },
            zIndex: theme.zIndex.snackbar + 10,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 2,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              gap: 1.75,
              background:
                theme.palette.mode === "dark"
                  ? "rgba(31, 41, 55, 0.95)"
                  : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.12)"
                  : "rgba(0, 0, 0, 0.08)"
              }`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 10px 30px rgba(0, 0, 0, 0.5)"
                  : "0 10px 30px rgba(93, 135, 255, 0.15)",
            }}
          >
            {/* App Icon */}
            <Box
              sx={{
                width: 46,
                height: 46,
                minWidth: 46,
                borderRadius: 2.5,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ECF2FF",
              }}
            >
              <Image
                src="/android-chrome-192x192.png"
                alt="CoBuild SuperAdmin"
                width={46}
                height={46}
                style={{ objectFit: "cover" }}
              />
            </Box>

            {/* Text details */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{
                  lineHeight: 1.2,
                  color: theme.palette.text.primary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                CoBuild SuperAdmin
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  display: "block",
                  mt: 0.25,
                  lineHeight: 1.25,
                }}
              >
                {isIOS
                  ? "Install for fullscreen & quick access"
                  : "Install app for instant portal access"}
              </Typography>
            </Box>

            {/* Actions */}
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Button
                variant="contained"
                size="small"
                color="primary"
                onClick={openPrompt}
                startIcon={<IconDownload size={16} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  px: 1.5,
                  py: 0.6,
                  borderRadius: 2,
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(93, 135, 255, 0.3)",
                  },
                }}
              >
                {isIOS ? "How to" : "Install"}
              </Button>

              <IconButton
                size="small"
                aria-label="Dismiss banner"
                onClick={dismissBanner}
                sx={{
                  color: theme.palette.text.secondary,
                  p: 0.5,
                  "&:hover": {
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.06)",
                  },
                }}
              >
                <IconX size={18} />
              </IconButton>
            </Stack>
          </Paper>
        </Box>
      </Slide>

      {/* iOS Manual Installation Guide Dialog */}
      <Dialog
        open={iosModalOpen}
        onClose={() => setIosModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            backgroundColor:
              theme.palette.mode === "dark" ? "#1f2937" : "#ffffff",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ECF2FF",
              }}
            >
              <Image
                src="/apple-touch-icon.png"
                alt="CoBuild Icon"
                width={36}
                height={36}
              />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              Install on iOS
            </Typography>
          </Stack>
          <IconButton size="small" onClick={() => setIosModalOpen(false)}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Apple iOS Safari does not support one-click installation. Follow these 2 simple steps to install:
          </Typography>

          <Stack spacing={2}>
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  color: theme.palette.primary.main,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconShare size={24} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Step 1: Tap the Share button
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tap the Share icon at the bottom of your Safari browser window.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.03)",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  color: theme.palette.primary.main,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSquarePlus size={24} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Step 2: Tap &quot;Add to Home Screen&quot;
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Scroll down the share sheet and tap &quot;Add to Home Screen&quot;.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setIosModalOpen(false);
              dismissBanner();
            }}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
