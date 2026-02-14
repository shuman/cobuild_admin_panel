"use client";
import React from "react";
import { Grid, Box, Typography, Card, CardContent, Stack, Chip } from "@mui/material";
import {
  IconUsers,
  IconBuildingSkyscraper,
  IconShieldLock,
  IconActivity,
  IconCheck,
  IconArrowRight,
} from "@tabler/icons-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DashboardCard from "@/components/shared/DashboardCard";
import HealthWidget from "@/components/dashboard/HealthWidget";

const quickLinks = [
  {
    title: "User Management",
    description: "Manage all platform users, roles, and permissions",
    icon: IconUsers,
    color: "#5D87FF",
    href: "/users",
  },
  {
    title: "Project Management",
    description: "Oversee all projects, members, and activities",
    icon: IconBuildingSkyscraper,
    color: "#49BEFF",
    href: "/projects",
  },
  {
    title: "Security Center",
    description: "Monitor login attempts, blocked IPs, and security events",
    icon: IconShieldLock,
    color: "#13DEB9",
    href: "#",
    disabled: true,
  },
  {
    title: "System Health",
    description: "Server monitoring, queue status, and performance metrics",
    icon: IconActivity,
    color: "#FFAE1F",
    href: "/health",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <Box>
      {/* Welcome Section */}
      <DashboardCard>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              backgroundColor: "success.light",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconCheck size={28} color="#13DEB9" />
          </Box>
          <Box>
            <Typography variant="h4" gutterBottom>
              Welcome back, {session?.user?.name || "SuperAdmin"}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              CoBuild Manager SuperAdmin Portal is operational. All systems are running normally.
            </Typography>
          </Box>
        </Stack>
      </DashboardCard>

      {/* Health widget */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        System Health
      </Typography>
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <HealthWidget />
        </Grid>
      </Grid>

      {/* Quick Links */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Quick Access
      </Typography>
      <Grid container spacing={3}>
        {quickLinks.map((link) => {
          const Icon = link.icon;
          const isDisabled = "disabled" in link && link.disabled;
          const card = (
            <Card
              component={isDisabled ? "div" : Link}
              href={isDisabled ? undefined : link.href}
              elevation={9}
              sx={{
                height: "100%",
                cursor: isDisabled ? "default" : "pointer",
                transition: "all 0.2s",
                opacity: isDisabled ? 0.8 : 1,
                textDecoration: "none",
                color: "inherit",
                "&:hover": isDisabled
                  ? {}
                  : {
                      transform: "translateY(-2px)",
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
                    backgroundColor: `${link.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <Icon size={24} color={link.color} />
                </Box>
                <Typography variant="h6" gutterBottom>
                  {link.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mb: 2 }}
                >
                  {link.description}
                </Typography>
                {isDisabled ? (
                  <Chip
                    label="Coming Soon"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                ) : (
                  <Chip
                    label="View"
                    size="small"
                    variant="outlined"
                    icon={<IconArrowRight size={14} />}
                    sx={{ fontSize: "0.7rem" }}
                  />
                )}
              </CardContent>
            </Card>
          );
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={link.title}>
              {card}
            </Grid>
          );
        })}
      </Grid>

      {/* 2FA Setup Prompt */}
      <Box sx={{ mt: 4 }}>
        <Card
          elevation={9}
          sx={{
            background: "linear-gradient(135deg, #5D87FF 0%, #49BEFF 100%)",
            color: "white",
          }}
        >
          <CardContent sx={{ p: "24px" }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography variant="h5" sx={{ color: "white", mb: 1 }}>
                  Secure Your Account
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "rgba(255,255,255,0.85)" }}
                >
                  Set up two-factor authentication to add an extra layer of
                  security to your SuperAdmin account.
                </Typography>
              </Box>
              <Chip
                label="Set up 2FA"
                icon={<IconArrowRight size={16} />}
                onClick={() => (window.location.href = "/setup-2fa")}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                  },
                }}
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
