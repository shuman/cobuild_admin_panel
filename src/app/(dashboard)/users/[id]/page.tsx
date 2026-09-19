"use client";

import React, { useEffect, useState, Fragment } from "react";
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
  Alert,
  Stack,
  Button,
  Grid,
  Skeleton,
} from "@mui/material";
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconBuildingSkyscraper,
  IconClock,
  IconCalendarPlus,
  IconRefresh,
} from "@tabler/icons-react";
import api from "@/lib/api";
import StatCard from "@/components/dashboard/StatCard";
import type { AdminUser, AdminUserProject } from "@/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getRoleLabel(user: AdminUser): string {
  if (user.is_super_admin) return "Super Admin";
  if (user.is_admin) return "Admin";
  return "User";
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface UserDetailResponse {
  count: number;
  items: AdminUser;
}

/** Label + value info tile used in the Account Information grid. */
function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "0.68rem",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Box sx={{ wordBreak: "break-word", minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const { data: session } = useSession();
  const token = (session as { apiToken?: string } | null)?.apiToken;

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    api
      .get<UserDetailResponse>(`/admin/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        setUser(Array.isArray(data.items) ? data.items[0] : data.items);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to load user"
        );
      })
      .finally(() => setLoading(false));
  }, [token, id]);

  const skeleton = (
    <Box>
      <Skeleton variant="rounded" width={110} height={32} sx={{ mb: 3 }} />
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 2.5,
          borderRadius: { xs: 2, sm: 2.5 },
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton
            variant="circular"
            width={56}
            height={56}
            sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="65%" />
          </Box>
        </Stack>
      </Paper>
      <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: 0.5 }}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} size={{ xs: 6, sm: 6, lg: 3 }}>
            <Skeleton variant="rounded" height={116} sx={{ height: { xs: 96, sm: 116 } }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  if (loading || !id) {
    return skeleton;
  }

  if (error || !user) {
    return (
      <Box>
        <Button
          component={Link}
          href="/users"
          startIcon={<IconArrowLeft size={18} />}
          sx={{ mb: 2 }}
        >
          Back to Users
        </Button>
        <Alert severity="error">{error || "User not found"}</Alert>
      </Box>
    );
  }

  const associatedProjects: AdminUserProject[] = user.projects ?? [];
  const roleTone: "error" | "primary" | "default" = user.is_super_admin
    ? "error"
    : user.is_admin
      ? "primary"
      : "default";

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <Button
        component={Link}
        href="/users"
        startIcon={<IconArrowLeft size={16} />}
        size="small"
        color="inherit"
        sx={{ mb: 2, fontWeight: 600, textTransform: "none" }}
      >
        Back to Users
      </Button>

      {/* ── Hero: identity summary ── */}
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: { xs: 2, sm: 2.5 },
          mb: 2.5,
          border: "1px solid",
          borderColor: (th) =>
            th.palette.mode === "dark"
              ? "rgba(93, 135, 255, 0.35)"
              : "rgba(93, 135, 255, 0.4)",
          background: (th) =>
            th.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(93, 135, 255, 0.12) 0%, rgba(93, 135, 255, 0.04) 100%)"
              : "linear-gradient(135deg, #ECF2FF 0%, #FFFDF9 100%)",
          boxShadow: (th) =>
            th.palette.mode === "dark"
              ? "0 4px 20px 0 rgba(0,0,0,0.3)"
              : "0 4px 16px 0 rgba(93, 135, 255, 0.1)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 4,
            bgcolor: "primary.main",
          },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 2, sm: 2.5 }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{
            p: { xs: "16px 18px", sm: "22px 26px" },
            pl: { xs: "18px", sm: "26px" },
          }}
        >
          <Box
            sx={{
              width: { xs: 48, sm: 58 },
              height: { xs: 48, sm: 58 },
              borderRadius: { xs: 1.5, sm: 2 },
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: { xs: "1.1rem", sm: "1.35rem" },
              fontWeight: 700,
              letterSpacing: "0.02em",
              boxShadow: "0 0 16px rgba(93, 135, 255, 0.35)",
            }}
          >
            {getInitials(user.name) || "?"}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={{ xs: 1, sm: 1.25 }}
              flexWrap="wrap"
              sx={{ rowGap: 0.75 }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.2rem", sm: "1.5rem" },
                  letterSpacing: "-0.02em",
                  wordBreak: "break-word",
                }}
              >
                {user.name}
              </Typography>
              <Chip
                label={getRoleLabel(user)}
                size="small"
                color={roleTone}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ wordBreak: "break-all", mt: 0.25 }}
            >
              {user.email}
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ mt: 1.25, flexWrap: "wrap", rowGap: 0.5 }}
            >
              <Chip
                icon={user.is_active ? <IconCheck size={14} /> : <IconX size={14} />}
                label={user.is_active ? "Active" : "Inactive"}
                size="small"
                variant="outlined"
                color={user.is_active ? "success" : "default"}
              />
              <Chip
                size="small"
                label={user.is_verified ? "Verified" : "Unverified"}
                variant="outlined"
                color={user.is_verified ? "success" : "default"}
              />
              <Chip
                label={`${associatedProjects.length} project${associatedProjects.length !== 1 ? "s" : ""}`}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* ── Quick stats ── */}
      <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: 0.5 }}>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard
            title="Associated Projects"
            value={String(associatedProjects.length)}
            icon={<IconBuildingSkyscraper size={22} />}
            tone="primary"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard
            title="Last Login"
            value={formatDate(user.last_login_at)}
            icon={<IconClock size={22} />}
            tone="info"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard
            title="Member Since"
            value={formatDate(user.created_at)}
            icon={<IconCalendarPlus size={22} />}
            tone="success"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard
            title="Last Updated"
            value={formatDate(user.updated_at)}
            icon={<IconRefresh size={22} />}
            tone="warning"
          />
        </Grid>
      </Grid>

      {/* ── Account information ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          mt: 2.5,
          mb: 3,
          borderRadius: { xs: 2, sm: 2.5 },
          border: "1px solid",
          borderColor: "divider",
          boxShadow: (th) =>
            th.palette.mode === "dark"
              ? "0 4px 20px 0 rgba(0,0,0,0.25)"
              : "0 2px 10px 0 rgba(0,0,0,0.04)",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, mb: 2.5, fontSize: { xs: "0.95rem", sm: "1rem" } }}
        >
          Account Information
        </Typography>
        <Grid container spacing={{ xs: 2.5, sm: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Full Name">
              <Typography variant="body2" fontWeight={600}>
                {user.name}
              </Typography>
            </InfoItem>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Email">
              <Typography variant="body2">{user.email}</Typography>
            </InfoItem>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Phone">
              <Typography variant="body2">{user.phone ?? "—"}</Typography>
            </InfoItem>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Role">
              <Chip
                label={getRoleLabel(user)}
                size="small"
                variant="outlined"
                color={roleTone}
              />
            </InfoItem>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Account Status">
              <Chip
                icon={user.is_active ? <IconCheck size={14} /> : <IconX size={14} />}
                label={user.is_active ? "Active" : "Inactive"}
                size="small"
                variant="outlined"
                color={user.is_active ? "success" : "default"}
              />
            </InfoItem>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Email Verified">
              <Chip
                size="small"
                label={user.is_verified ? "Yes" : "No"}
                variant="outlined"
                color={user.is_verified ? "success" : "default"}
              />
            </InfoItem>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Associated projects ── */}
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.5,
            bgcolor: (th) => `${th.palette.secondary.main}18`,
            color: "secondary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "& svg": { width: 17, height: 17 },
          }}
        >
          <IconBuildingSkyscraper size={17} />
        </Box>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, fontSize: { xs: "0.95rem", sm: "1rem" } }}
        >
          Associated Projects
        </Typography>
        <Chip label={associatedProjects.length} size="small" variant="outlined" />
      </Stack>
      <Paper
        elevation={0}
        sx={{
          borderRadius: { xs: 2, sm: 2.5 },
          border: "1px solid",
          borderColor: "divider",
          boxShadow: (th) =>
            th.palette.mode === "dark"
              ? "0 4px 20px 0 rgba(0,0,0,0.25)"
              : "0 2px 10px 0 rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Mobile: compact card list */}
        <Box sx={{ display: { xs: "block", md: "none" }, p: { xs: 1.5, sm: 2 } }}>
          {associatedProjects.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No projects
            </Typography>
          ) : (
            associatedProjects.map((proj) => (
              <Box
                key={proj.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1.5,
                  mb: 1.5,
                }}
              >
                <Link
                  href={`/projects/${proj.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    {proj.name}
                  </Typography>
                </Link>
                <Typography variant="caption" color="text.secondary">
                  {proj.slug}
                </Typography>
                <Box sx={{ mt: 0.75 }}>
                  <Chip
                    label={proj.type === "owner" ? "Owner" : "Member"}
                    size="small"
                    variant="outlined"
                    color={proj.type === "owner" ? "primary" : "default"}
                  />
                </Box>
              </Box>
            ))
          )}
        </Box>

        {/* Desktop: table */}
        <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell>Project</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {associatedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No projects</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <Fragment>
                  {associatedProjects.map(function (proj) {
                    return (
                      <TableRow key={proj.id} hover>
                        <TableCell>
                          <Link
                            href={"/projects/" + proj.id}
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ "&:hover": { textDecoration: "underline" } }}
                            >
                              {proj.name}
                            </Typography>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {proj.slug}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={proj.type === "owner" ? "Owner" : "Member"}
                            size="small"
                            variant="outlined"
                            color={proj.type === "owner" ? "primary" : "default"}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </Fragment>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
