"use client";

import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { IconArrowUpRight } from "@tabler/icons-react";
import Link from "next/link";

export type StatTone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";

interface StatCardProps {
  title: string;
  /** Formatted value; null while loading (renders skeleton) or on error (renders "—"). */
  value: string | null;
  icon: React.ReactNode;
  tone?: StatTone;
  /** When provided the whole card navigates client-side. */
  href?: string;
  /** When provided the whole card acts as a button (e.g. filter toggle). */
  onClick?: () => void;
  /** Renders the card highlighted (e.g. active filter). */
  selected?: boolean;
  /** True when the backing request failed — dims the card slightly. */
  failed?: boolean;
  /** Small line under the value (e.g. error hint). */
  hint?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  tone = "primary",
  href,
  onClick,
  selected = false,
  failed = false,
  hint,
}: StatCardProps) {
  const theme = useTheme();
  const toneColor = theme.palette[tone]?.main || theme.palette.primary.main;

  const content = (
    <CardContent
      sx={{
        p: { xs: "12px 10px", sm: "20px 22px" },
        "&:last-child": { pb: { xs: "12px", sm: "20px" } },
        height: "100%",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Top Header: Title & Icon */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: { xs: 1.5, sm: 2 } }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "text.secondary",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.25,
            }}
          >
            {title}
          </Typography>
        </Box>

        <Box
          sx={{
            width: { xs: 34, sm: 42 },
            height: { xs: 34, sm: 42 },
            borderRadius: 2,
            bgcolor: `${toneColor}18`,
            color: toneColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "transform 0.2s ease",
            "& svg": {
              width: { xs: 18, sm: 22 },
              height: { xs: 18, sm: 22 },
            },
          }}
        >
          {icon}
        </Box>
      </Stack>

      {/* Main Metric Value */}
      <Box sx={{ mt: "auto", minWidth: 0, maxWidth: "100%", width: "100%" }}>
        {value === null ? (
          <Skeleton
            variant="rounded"
            width="65%"
            sx={{ height: { xs: 26, sm: 34 } }}
          />
        ) : (
          <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ minWidth: 0, width: "100%" }}>
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontSize: { xs: "1.15rem", sm: "1.45rem", md: "1.6rem" },
                fontWeight: 700,
                color: failed ? "text.secondary" : "text.primary",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {value}
            </Typography>

            {href && !failed && (
              <Box
                className="stat-card-arrow"
                sx={{
                  color: "text.secondary",
                  opacity: 0.5,
                  transition: "all 0.2s ease",
                  display: { xs: "none", sm: "flex" },
                }}
              >
                <IconArrowUpRight size={16} />
              </Box>
            )}
          </Stack>
        )}

        {hint ? (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 0.5,
              fontSize: { xs: "0.68rem", sm: "0.75rem" },
              color: failed ? "error.main" : "text.secondary",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {hint}
          </Typography>
        ) : (
          <Box sx={{ height: { xs: 4, sm: 6 } }} />
        )}
      </Box>
    </CardContent>
  );

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        opacity: failed ? 0.85 : 1,
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
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        // Subtle tone accent bar at top
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          bgcolor: toneColor,
          opacity: 0.85,
        },
        ...(selected && {
          borderColor: `${toneColor}80`,
          bgcolor: `${toneColor}0A`,
        }),
        "&:hover": failed
          ? {}
          : {
              transform: "translateY(-3px)",
              boxShadow: (th) =>
                th.palette.mode === "dark"
                  ? "0 10px 24px -2px rgba(0,0,0,0.45)"
                  : `0 12px 28px -4px ${toneColor}24`,
              borderColor: `${toneColor}60`,
              "& .stat-card-arrow": {
                opacity: 1,
                color: toneColor,
                transform: "translate(2px, -2px)",
              },
            },
      }}
    >
      {href ? (
        <CardActionArea
          component={Link}
          href={href}
          sx={{
            height: "100%",
            color: "inherit",
            textDecoration: "none",
            display: "block",
          }}
        >
          {content}
        </CardActionArea>
      ) : onClick ? (
        <CardActionArea
          onClick={onClick}
          sx={{ height: "100%", color: "inherit", textAlign: "left", display: "block" }}
        >
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}
