"use client";

import React, { useState } from "react";
import {
  Grid,
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  IconUsers,
  IconBuildingSkyscraper,
  IconShieldLock,
  IconActivity,
  IconChevronRight,
  IconRefresh,
  IconDatabase,
  IconListCheck,
  IconShield,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import HealthWidget from "@/components/dashboard/HealthWidget";
import GreetingHero from "@/components/dashboard/GreetingHero";
import StatCard, { type StatTone } from "@/components/dashboard/StatCard";
import SecuritySnapshot from "@/components/dashboard/SecuritySnapshot";
import TwoFABanner from "@/components/dashboard/TwoFABanner";
import {
  useAdminCount,
  useHealthStatus,
  use2FAStatus,
} from "@/hooks/useDashboardStats";

interface QuickModule {
  title: string;
  description: string;
  icon: typeof IconUsers;
  tone: StatTone;
  href?: string;
  badge?: string;
}

const quickShortcuts = [
  { label: "Users Directory", href: "/users", icon: IconUsers },
  { label: "Active Projects", href: "/projects", icon: IconBuildingSkyscraper },
  { label: "User Types & Roles", href: "/project-user-types", icon: IconShield },
  { label: "Onboarding Rules", href: "/onboarding-steps", icon: IconListCheck },
  { label: "System Health", href: "/health", icon: IconActivity },
  { label: "Databases", href: "/databases", icon: IconDatabase },
];

export default function DashboardPage() {
  const users = useAdminCount("users");
  const projects = useAdminCount("projects");
  const { health, error: healthError } = useHealthStatus();
  const { isEnabled: twoFAEnabled, error: twoFAError } = use2FAStatus();
  const { mutate } = useSWRConfig();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate(
        (key) =>
          Array.isArray(key) &&
          (key[0] === "admin-count" ||
            key[0] === "health-status" ||
            key[0] === "2fa-status"),
        undefined,
        { revalidate: true }
      );
      toast.success("Metrics updated");
    } catch {
      toast.error("Failed to refresh metrics");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const usersValue = users.error
    ? "—"
    : users.count === null
      ? null
      : users.count.toLocaleString();
  const projectsValue = projects.error
    ? "—"
    : projects.count === null
      ? null
      : projects.count.toLocaleString();
  const healthValue = healthError
    ? "—"
    : health === null
      ? null
      : `${health.okCount}/${health.total} OK`;
  const healthTone: StatTone = health
    ? health.failedCount > 0
      ? "warning"
      : "success"
    : "primary";
  const twoFAValue = twoFAError
    ? "—"
    : twoFAEnabled === null
      ? null
      : twoFAEnabled
        ? "Enabled"
        : "Disabled";

  const quickModules: QuickModule[] = [
    {
      title: "User Management",
      description: "Manage platform superadmins, creators, and permissions",
      icon: IconUsers,
      tone: "primary",
      href: "/users",
      badge: usersValue ? `${usersValue} Users` : undefined,
    },
    {
      title: "Project Management",
      description: "Oversee active building projects, members, and budgets",
      icon: IconBuildingSkyscraper,
      tone: "secondary",
      href: "/projects",
      badge: projectsValue ? `${projectsValue} Projects` : undefined,
    },
    {
      title: "Onboarding Steps",
      description: "Configure mandatory onboarding workflow & checklist",
      icon: IconListCheck,
      tone: "info",
      href: "/onboarding-steps",
      badge: "Config",
    },
    {
      title: "Multi-Tenant Databases",
      description: "Inspect tenant database schemas, tables, and records",
      icon: IconDatabase,
      tone: "warning",
      href: "/databases",
      badge: "Tenants",
    },
  ];

  return (
    <Box sx={{ pb: 3, width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
      {/* Top Header Bar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{ mb: { xs: 2.5, sm: 3 }, width: "100%", maxWidth: "100%", minWidth: 0 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.5rem", sm: "1.85rem" },
              letterSpacing: "-0.02em",
              wordBreak: "break-word",
            }}
          >
            Dashboard
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" }, mt: 0.25 }}
          >
            Overview of platform activity, system health, and account security
          </Typography>
        </Box>

        {/* Action Controls */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            alignSelf: { xs: "stretch", sm: "auto" },
            justifyContent: { xs: "space-between", sm: "flex-end" },
            minWidth: 0,
          }}
        >
          {/* Environment Status Badge */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              borderRadius: 20,
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: "success.main",
                boxShadow: "0 0 6px #13deb9",
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, fontSize: "0.725rem", color: "text.primary" }}
            >
              Live Production
            </Typography>
          </Box>

          {/* Refresh Action */}
          <Tooltip title="Refresh live statistics">
            <IconButton
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="small"
              sx={{
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                p: "6px",
                flexShrink: 0,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  animation: isRefreshing ? "spin 0.8s linear infinite" : "none",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              >
                <IconRefresh size={18} />
              </Box>
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }} sx={{ width: "100%", maxWidth: "100%", minWidth: 0, m: 0 }}>
        {/* Greeting Hero Card */}
        <Grid size={{ xs: 12 }} sx={{ minWidth: 0, maxWidth: "100%", p: 0, mb: { xs: 1.5, sm: 2.5 } }}>
          <GreetingHero />
        </Grid>

        {/* Quick Shortcut Pills for Fast Navigation */}
        <Grid size={{ xs: 12 }} sx={{ minWidth: 0, maxWidth: "100%", overflow: "hidden", p: 0, mb: { xs: 1.5, sm: 2.5 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              overflowX: "auto",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              py: 0.5,
              WebkitOverflowScrolling: "touch",
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "text.secondary",
                fontSize: "0.68rem",
                mr: 0.5,
                flexShrink: 0,
                display: { xs: "none", sm: "block" },
              }}
            >
              Jump to:
            </Typography>
            {quickShortcuts.map((s) => {
              const Icon = s.icon;
              return (
                <Chip
                  key={s.label}
                  component={Link}
                  href={s.href}
                  clickable
                  icon={<Icon size={14} />}
                  label={s.label}
                  size="small"
                  variant="outlined"
                  sx={{
                    flexShrink: 0,
                    height: 28,
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    bgcolor: "background.paper",
                    borderColor: "divider",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "primary.light",
                      color: "primary.main",
                    },
                  }}
                />
              );
            })}
          </Box>
        </Grid>

        {/* 4 Live Stats Cards */}
        <Grid size={{ xs: 6, sm: 6, lg: 3 }} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <StatCard
            title="Total Users"
            value={usersValue}
            icon={<IconUsers size={22} />}
            tone="primary"
            href="/users"
            failed={!!users.error}
            hint={users.error ? "Backend unreachable" : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <StatCard
            title="Total Projects"
            value={projectsValue}
            icon={<IconBuildingSkyscraper size={22} />}
            tone="secondary"
            href="/projects"
            failed={!!projects.error}
            hint={projects.error ? "Backend unreachable" : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <StatCard
            title="System Health"
            value={healthValue}
            icon={<IconActivity size={22} />}
            tone={healthTone}
            href="/health"
            failed={!!healthError}
            hint={healthError ? "Health check down" : undefined}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <StatCard
            title="2FA Security"
            value={twoFAValue}
            icon={<IconShieldLock size={22} />}
            tone={twoFAEnabled === null ? "primary" : twoFAEnabled ? "success" : "warning"}
            href="/setup-2fa"
            failed={!!twoFAError}
            hint={twoFAError ? "2FA status down" : undefined}
          />
        </Grid>

        {/* 2FA Alert Banner (shows when disabled) */}
        <Grid size={{ xs: 12 }} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <TwoFABanner />
        </Grid>

        {/* Infrastructure & Security Section Header */}
        <Grid size={{ xs: 12 }} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: { xs: 1.5, sm: 2 } }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                }}
              >
                Platform Diagnostics & Security
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Live status of server daemons, queues, and SuperAdmin safeguards
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/health"
              size="small"
              endIcon={<IconChevronRight size={16} />}
              sx={{
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "none",
                display: { xs: "none", sm: "inline-flex" },
                flexShrink: 0,
              }}
            >
              Full Diagnostics
            </Button>
          </Stack>
        </Grid>

        {/* Health Widget & Security Snapshot */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <HealthWidget />
        </Grid>
        <Grid size={{ xs: 12, md: 5, lg: 4 }} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <SecuritySnapshot />
        </Grid>

        {/* Administrative Modules Header */}
        <Grid size={{ xs: 12 }} sx={{ minWidth: 0, maxWidth: "100%" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: { xs: 2, sm: 2.5 } }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                }}
              >
                Administrative Modules
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Direct access to core platform management tools
              </Typography>
            </Box>
          </Stack>
        </Grid>

        {/* Quick Access Module Cards */}
        {quickModules.map((link) => {
          const Icon = link.icon;
          const { href } = link;
          const isDisabled = !href;

          return (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={link.title} sx={{ minWidth: 0, maxWidth: "100%" }}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  boxSizing: "border-box",
                  borderRadius: { xs: 2, sm: 2.5 },
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: (th) =>
                    th.palette.mode === "dark"
                      ? "0 4px 20px 0 rgba(0,0,0,0.25)"
                      : "0 2px 10px 0 rgba(0,0,0,0.04)",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": isDisabled
                    ? {}
                    : {
                        transform: "translateY(-3px)",
                        borderColor: (th) => `${th.palette[link.tone]?.main || th.palette.primary.main}60`,
                        boxShadow: (th) =>
                          th.palette.mode === "dark"
                            ? "0 10px 24px -2px rgba(0,0,0,0.45)"
                            : `0 12px 28px -4px ${th.palette[link.tone]?.main || th.palette.primary.main}20`,
                        "& .module-arrow": {
                          transform: "translateX(4px)",
                          color: (th) => th.palette[link.tone]?.main || th.palette.primary.main,
                        },
                      },
                }}
              >
                <CardActionArea
                  component={isDisabled ? "div" : Link}
                  href={href || "#"}
                  disabled={isDisabled}
                  sx={{
                    height: "100%",
                    p: { xs: "16px", sm: "20px" },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    justifyContent: "space-between",
                  }}
                >
                  <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                    {/* Top Row: Icon + Badge */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1.5 }}
                    >
                      <Box
                        sx={(theme) => ({
                          width: { xs: 38, sm: 44 },
                          height: { xs: 38, sm: 44 },
                          borderRadius: 2,
                          bgcolor: `${theme.palette[link.tone].main}18`,
                          color: theme.palette[link.tone].main,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          "& svg": { width: { xs: 20, sm: 24 }, height: { xs: 20, sm: 24 } },
                        })}
                      >
                        <Icon size={24} />
                      </Box>

                      {link.badge ? (
                        <Chip
                          label={link.badge}
                          size="small"
                          sx={(theme) => ({
                            height: 22,
                            fontSize: "0.68rem",
                            fontWeight: 600,
                            bgcolor: `${theme.palette[link.tone].main}14`,
                            color: theme.palette[link.tone].main,
                            border: `1px solid ${theme.palette[link.tone].main}30`,
                          })}
                        />
                      ) : isDisabled ? (
                        <Chip
                          label="Coming soon"
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.65rem", height: 20 }}
                        />
                      ) : null}
                    </Stack>

                    {/* Title */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "0.95rem", sm: "1rem" },
                        lineHeight: 1.3,
                        mb: 0.5,
                      }}
                    >
                      {link.title}
                    </Typography>

                    {/* Description: 2-line clamp to avoid mobile overflow */}
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{
                        fontSize: { xs: "0.78rem", sm: "0.825rem" },
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.35,
                      }}
                    >
                      {link.description}
                    </Typography>
                  </CardContent>

                  {/* Footer Row */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ pt: 1.5, mt: 1.5, borderTop: "1px solid", borderColor: "divider" }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.72rem",
                        color: `${link.tone}.main`,
                      }}
                    >
                      Open Module
                    </Typography>
                    <Box
                      className="module-arrow"
                      sx={{
                        color: "text.secondary",
                        display: "flex",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <IconChevronRight size={17} />
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
