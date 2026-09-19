"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import {
  IconClock,
  IconCalendar,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import type { User } from "@/types";

/** Human-friendly "last sign-in" label: today / yesterday / locale datetime. */
export function formatLastLogin(value: string | null | undefined): string {
  if (!value) return "First sign-in";
  const last = new Date(value);
  if (Number.isNaN(last.getTime())) return "";
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.floor(
    (startOfDay(new Date()) - startOfDay(last)) / 86_400_000
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return last.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SA";
  const initials = parts.slice(0, 2).map((p) => p[0]).join("");
  return initials.toUpperCase();
}

const emptySubscribe = () => () => {};

export default function GreetingHero() {
  const { data: session } = useSession();
  const user = session?.user as unknown as User | undefined;
  const fullName = user?.name || "SuperAdmin";
  const firstName = fullName.split(/\s+/)[0];

  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const now = isClient ? new Date() : null;
  const [photoOk, setPhotoOk] = useState(true);

  const greeting = now ? `${greetingFor(now)}, ${firstName}` : "Welcome back";
  const dateLine = now
    ? now.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "CoBuild SuperAdmin";

  const photoUrl =
    user?.photo_path && /^https?:\/\//.test(user.photo_path) && photoOk
      ? user.photo_path
      : null;

  const lastLoginLabel = formatLastLogin(user?.last_login_at);

  return (
    <Card
      elevation={0}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: { xs: 2.5, sm: 3 },
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #3f68e0 45%, ${theme.palette.secondary.main} 100%)`,
        color: "#fff",
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
            : "0 10px 30px -5px rgba(93, 135, 255, 0.35)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
      }}
    >
      {/* Decorative ambient blurred shapes */}
      <Box
        sx={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -60,
          left: "30%",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(73,190,255,0.3) 0%, rgba(73,190,255,0) 70%)",
          pointerEvents: "none",
        }}
      />

      <CardContent
        sx={{
          position: "relative",
          zIndex: 1,
          p: { xs: "16px", sm: "24px", md: "28px" },
          "&:last-child": { pb: { xs: "16px", sm: "24px", md: "28px" } },
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={{ xs: 2, md: 3 }}
          sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
        >
          {/* Main User Info */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 1.75, sm: 2.5 }}
            sx={{ width: "100%", maxWidth: { md: "70%" }, minWidth: 0 }}
          >
            <Avatar
              src={photoUrl ?? undefined}
              imgProps={{ onError: () => setPhotoOk(false) }}
              alt={fullName}
              sx={{
                width: { xs: 52, sm: 64, md: 70 },
                height: { xs: 52, sm: 64, md: 70 },
                fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.65rem" },
                fontWeight: 700,
                bgcolor: "rgba(255, 255, 255, 0.22)",
                color: "#fff",
                border: "2.5px solid rgba(255, 255, 255, 0.5)",
                boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.15)",
                flexShrink: 0,
              }}
            >
              {initialsOf(fullName)}
            </Avatar>

            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              {/* Badge row */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 0.5, flexWrap: "wrap", gap: 0.5 }}
              >
                <Chip
                  size="small"
                  icon={<IconShieldCheck size={14} color="#fff" />}
                  label="SuperAdmin"
                  sx={{
                    height: 22,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    bgcolor: "rgba(255, 255, 255, 0.22)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.35)",
                    "& .MuiChip-icon": { color: "#fff" },
                  }}
                />
                <Chip
                  size="small"
                  icon={<IconSparkles size={13} color="#fff" />}
                  label="All Systems Live"
                  sx={{
                    height: 22,
                    fontSize: "0.68rem",
                    fontWeight: 500,
                    bgcolor: "rgba(19, 222, 185, 0.25)",
                    color: "#fff",
                    border: "1px solid rgba(19, 222, 185, 0.4)",
                    display: { xs: "none", sm: "inline-flex" },
                  }}
                />
              </Stack>

              {/* Greeting */}
              <Typography
                variant="h4"
                sx={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: { xs: "1.25rem", sm: "1.45rem", md: "1.7rem" },
                  lineHeight: 1.25,
                  letterSpacing: "-0.01em",
                }}
              >
                {greeting}
              </Typography>

              {/* Meta details: date & last login */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={{ xs: 1.25, sm: 2 }}
                sx={{
                  mt: 0.75,
                  flexWrap: "wrap",
                  rowGap: 0.5,
                  color: "rgba(255, 255, 255, 0.88)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    fontSize: { xs: "0.75rem", sm: "0.825rem" },
                  }}
                >
                  <IconCalendar size={15} style={{ opacity: 0.9 }} />
                  <span>{dateLine}</span>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    fontSize: { xs: "0.75rem", sm: "0.825rem" },
                    opacity: 0.9,
                  }}
                >
                  <IconClock size={15} style={{ opacity: 0.9 }} />
                  <span>Sign-in: {lastLoginLabel}</span>
                </Box>
              </Stack>
            </Box>
          </Stack>

          {/* Desktop right-side session & security pill */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 1,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                p: "10px 16px",
                borderRadius: 2,
                bgcolor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                textAlign: "right",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-end">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "#13deb9",
                    boxShadow: "0 0 8px #13deb9",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: "#fff", fontWeight: 600, letterSpacing: "0.02em" }}
                >
                  SuperAdmin Session Active
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "0.725rem",
                  mt: 0.25,
                }}
              >
                Inactivity Protection: 30 mins
              </Typography>
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
