"use client";

import React, { useEffect, useState } from "react";
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
  IconUsers,
  IconFriends,
  IconBuildingStore,
  IconFiles,
  IconTag,
  IconCalendarDollar,
  IconNotes,
  IconUser,
} from "@tabler/icons-react";
import api from "@/lib/api";
import StatCard from "@/components/dashboard/StatCard";
import type {
  Project,
  ProjectDetailResponse,
  ProjectUser,
  ProjectUsersResponse,
  ListResponse,
  ProjectMember,
  ProjectVendor,
  ProjectProperty,
  ProjectDepositSchedule,
  ProjectNotice,
  ProjectFile,
} from "@/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const projectScopedHeaders = (token: string, projectId: string) => ({
  Authorization: `Bearer ${token}`,
  "X-Project-ID": projectId,
});

type SectionTone = "primary" | "secondary" | "success" | "warning" | "info";

/** Bordered section card with tinted icon header, count chip, skeleton rows. */
function SectionCard({
  title,
  icon,
  tone = "primary",
  count,
  loading,
  emptyLabel,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone?: SectionTone;
  count: number;
  loading: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
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
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{
          px: { xs: 1.5, sm: 2 },
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "action.hover",
        }}
      >
        <Box
          sx={(th) => ({
            width: 30,
            height: 30,
            borderRadius: 1.5,
            bgcolor: `${th.palette[tone].main}18`,
            color: th.palette[tone].main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            "& svg": { width: 17, height: 17 },
          })}
        >
          {icon}
        </Box>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, fontSize: { xs: "0.9rem", sm: "0.95rem" }, flex: 1 }}
        >
          {title}
        </Typography>
        <Chip label={count} size="small" variant="outlined" />
      </Stack>
      {loading ? (
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          {[0, 1, 2].map((i) => (
            <Stack key={i} direction="row" spacing={2} sx={{ py: 1.25 }}>
              <Skeleton variant="text" width="22%" />
              <Skeleton variant="text" width="38%" />
              <Skeleton variant="text" width="24%" />
            </Stack>
          ))}
        </Box>
      ) : count === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          {emptyLabel}
        </Typography>
      ) : (
        children
      )}
    </Paper>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const { data: session } = useSession();
  const token = (session as any)?.apiToken;

  const [project, setProject] = useState<Project | null>(null);
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [vendors, setVendors] = useState<ProjectVendor[]>([]);
  const [properties, setProperties] = useState<ProjectProperty[]>([]);
  const [depositSchedules, setDepositSchedules] = useState<ProjectDepositSchedule[]>([]);
  const [notices, setNotices] = useState<ProjectNotice[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);

  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingDepositSchedules, setLoadingDepositSchedules] = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!token || !id) return;
    setLoadingProject(true);
    setError(null);
    api
      .get<ProjectDetailResponse>(`/admin/project/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProject((res.data as ProjectDetailResponse).items))
      .catch((err) => {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to load project"
        );
      })
      .finally(() => setLoadingProject(false));
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    setLoadingUsers(true);
    api
      .get<ProjectUsersResponse>(`/admin/project/${id}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProjectUsers(res.data.items || []))
      .catch(() => setProjectUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    setLoadingMembers(true);
    api
      .get<ListResponse<ProjectMember>>("/members", {
        headers: projectScopedHeaders(token, id),
        params: { limit: 500 },
      })
      .then((res) => setMembers(res.data.items ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    setLoadingVendors(true);
    api
      .get<ListResponse<ProjectVendor>>("/vendors", {
        headers: projectScopedHeaders(token, id),
        params: { limit: 500 },
      })
      .then((res) => setVendors(res.data.items ?? []))
      .catch(() => setVendors([]))
      .finally(() => setLoadingVendors(false));
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    setLoadingProperties(true);
    api
      .get<ListResponse<ProjectProperty>>("/properties", {
        headers: projectScopedHeaders(token, id),
        params: { limit: 500 },
      })
      .then((res) => setProperties(res.data.items ?? []))
      .catch(() => setProperties([]))
      .finally(() => setLoadingProperties(false));
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    setLoadingDepositSchedules(true);
    api
      .get<ListResponse<ProjectDepositSchedule>>("/deposit_schedules", {
        headers: projectScopedHeaders(token, id),
        params: { limit: 500 },
      })
      .then((res) => setDepositSchedules(res.data.items ?? []))
      .catch(() => setDepositSchedules([]))
      .finally(() => setLoadingDepositSchedules(false));
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    setLoadingNotices(true);
    api
      .get<ListResponse<ProjectNotice>>("/notices", {
        headers: projectScopedHeaders(token, id),
        params: { limit: 100 },
      })
      .then((res) => setNotices(res.data.items ?? []))
      .catch(() => setNotices([]))
      .finally(() => setLoadingNotices(false));
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    setLoadingFiles(true);
    api
      .get<ListResponse<ProjectFile>>("/files", {
        headers: projectScopedHeaders(token, id),
        params: { limit: 500 },
      })
      .then((res) => setFiles(res.data.items ?? []))
      .catch(() => setFiles([]))
      .finally(() => setLoadingFiles(false));
  }, [token, id]);

  if (!id || (loadingProject && !project)) {
    return (
      <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
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
              variant="rounded"
              width={56}
              height={56}
              sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton variant="text" width="45%" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="35%" />
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
  }

  if (error && !project) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button component={Link} href="/projects" startIcon={<IconArrowLeft size={18} />}>
          Back to Projects
        </Button>
      </Box>
    );
  }

  const creator =
    project?.created_by && typeof project.created_by === "object"
      ? project.created_by
      : null;

  // Exclude members and vendors — they already appear in their own sections
  const filteredUsers = projectUsers.filter(
    (u) => u.project_user_type_slug !== "member" && u.project_user_type_slug !== "vendor"
  );

  const statusTone: SectionTone =
    project?.status === "Active"
      ? "success"
      : project?.status === "Suspended"
        ? "warning"
        : "primary";

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <Button
        component={Link}
        href="/projects"
        startIcon={<IconArrowLeft size={16} />}
        size="small"
        color="inherit"
        sx={{ mb: 2, fontWeight: 600, textTransform: "none" }}
      >
        Back to Projects
      </Button>

      {/* ── Hero: project summary ── */}
      <Paper
        elevation={0}
        sx={(th) => {
          const tone = th.palette[statusTone].main;
          return {
            position: "relative",
            overflow: "hidden",
            borderRadius: { xs: 2, sm: 2.5 },
            mb: 2.5,
            border: "1px solid",
            borderColor:
              th.palette.mode === "dark" ? `${tone}59` : `${tone}66`,
            background:
              th.palette.mode === "dark"
                ? `linear-gradient(135deg, ${tone}1F 0%, ${tone}0A 100%)`
                : `linear-gradient(135deg, ${tone}1A 0%, #FFFDF9 100%)`,
            boxShadow:
              th.palette.mode === "dark"
                ? "0 4px 20px 0 rgba(0,0,0,0.3)"
                : `0 4px 16px 0 ${tone}1A`,
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: 4,
              bgcolor: tone,
            },
          };
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 3 }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          sx={{
            p: { xs: "16px 18px", sm: "22px 26px" },
            pl: { xs: "18px", sm: "26px" },
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.5, sm: 2.5 }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            sx={{ minWidth: 0, flex: 1 }}
          >
            <Box
              sx={(th) => ({
                width: { xs: 46, sm: 56 },
                height: { xs: 46, sm: 56 },
                borderRadius: { xs: 1.5, sm: 2 },
                bgcolor: `${th.palette[statusTone].main}22`,
                color: th.palette[statusTone].main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                "& svg": { width: { xs: 24, sm: 28 }, height: { xs: 24, sm: 28 } },
              })}
            >
              <IconBuildingSkyscraper size={28} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
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
                  {project?.name}
                </Typography>
                <Chip
                  label={project?.status ?? "—"}
                  size="small"
                  color={statusTone === "primary" ? "default" : statusTone}
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: "monospace", fontSize: "0.78rem", mt: 0.25 }}
              >
                {project?.slug}
              </Typography>
              {project?.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.75,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    maxWidth: 640,
                  }}
                >
                  {project.description}
                </Typography>
              )}
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ mt: 1.25, flexWrap: "wrap", rowGap: 0.5 }}
              >
                <Chip
                  icon={project?.is_active ? <IconCheck size={14} /> : <IconX size={14} />}
                  label={project?.is_active ? "Active" : "Inactive"}
                  size="small"
                  variant="outlined"
                  color={project?.is_active ? "success" : "default"}
                />
                {project?.is_premium && (
                  <Chip label="Premium" size="small" color="warning" variant="outlined" />
                )}
                <Chip
                  label={`Created ${project?.created_at ? formatDate(project.created_at) : "—"}`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>
          </Stack>

          {/* Creator block */}
          <Stack
            direction={{ xs: "row", md: "column" }}
            spacing={{ xs: 2, md: 0.5 }}
            alignItems={{ xs: "center", md: "flex-end" }}
            sx={{
              flexShrink: 0,
              pl: { xs: 0, md: 3 },
              borderLeft: { md: "1px solid" },
              borderColor: "divider",
              minWidth: 0,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={(th) => ({
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  bgcolor: `${th.palette.primary.main}18`,
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "& svg": { width: 16, height: 16 },
                })}
              >
                <IconUser size={16} />
              </Box>
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
                Creator
              </Typography>
            </Stack>
            {creator ? (
              <Box sx={{ textAlign: { xs: "left", md: "right" }, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {creator.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  component="div"
                  sx={{ maxWidth: { md: 240 } }}
                >
                  {creator.email}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            )}
            {project?.updated_at && (
              <Typography variant="caption" color="text.secondary">
                Updated {formatDate(project.updated_at)}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* ── Quick stats ── */}
      <Grid container spacing={{ xs: 1.5, sm: 2.5 }} sx={{ mb: 0.5 }}>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard
            title="Project Users"
            value={loadingUsers ? null : String(filteredUsers.length)}
            icon={<IconUsers size={22} />}
            tone="primary"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard
            title="Members"
            value={loadingMembers ? null : String(members.length)}
            icon={<IconFriends size={22} />}
            tone="secondary"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard
            title="Vendors"
            value={loadingVendors ? null : String(vendors.length)}
            icon={<IconBuildingStore size={22} />}
            tone="warning"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, lg: 3 }}>
          <StatCard
            title="Files"
            value={loadingFiles ? null : String(files.length)}
            icon={<IconFiles size={22} />}
            tone="info"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 1.5 }} />

      {/* Users (project users from admin API) */}
      <SectionCard
        title="Users"
        icon={<IconUsers size={17} />}
        tone="primary"
        count={filteredUsers.length}
        loading={loadingUsers}
        emptyLabel="No users"
      >
        <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((m) => (
                  <TableRow key={m.project_user_id ?? m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>{m.phone ?? "—"}</TableCell>
                    <TableCell>
                      {m.project_user_type_name ? (
                        <Chip
                          size="small"
                          label={m.project_user_type_name}
                          variant="outlined"
                          color={
                            m.project_user_type_slug === "creator"
                              ? "primary"
                              : m.project_user_type_slug === "member"
                                ? "info"
                                : m.project_user_type_slug === "vendor"
                                  ? "warning"
                                  : "default"
                          }
                        />
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {m.project_user_invitation_status ? (
                        <Chip size="small" label={m.project_user_invitation_status} variant="outlined" />
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={m.project_user_is_active !== false ? "Yes" : "No"}
                        color={m.project_user_is_active !== false ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {m.project_user_joined_at
                        ? formatDate(m.project_user_joined_at)
                        : m.project_user_created_at
                          ? formatDate(m.project_user_created_at)
                          : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
      </SectionCard>

      {/* Members (project members) */}
      <SectionCard
        title="Members"
        icon={<IconFriends size={17} />}
        tone="secondary"
        count={members.length}
        loading={loadingMembers}
        emptyLabel="No members"
      >
        <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {m.user?.name ?? m.name ?? "—"}
                    </TableCell>
                    <TableCell>{m.user?.email ?? m.email ?? "—"}</TableCell>
                    <TableCell>{m.user?.phone ?? m.phone ?? "—"}</TableCell>
                    <TableCell>{m.invitation_status ?? "—"}</TableCell>
                    <TableCell>
                      {m.joined_at ? formatDate(m.joined_at) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
      </SectionCard>

      {/* Vendors */}
      <SectionCard
        title="Vendors"
        icon={<IconBuildingStore size={17} />}
        tone="warning"
        count={vendors.length}
        loading={loadingVendors}
        emptyLabel="No vendors"
      >
        <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.user?.name ?? v.business_name ?? "—"}</TableCell>
                    <TableCell>{v.user?.email ?? v.business_email ?? "—"}</TableCell>
                    <TableCell>{v.business_phone ?? "—"}</TableCell>
                    <TableCell>{v.vendor_type?.name ?? "—"}</TableCell>
                    <TableCell>{v.invitation_status ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
      </SectionCard>

      {/* Properties */}
      <SectionCard
        title="Properties"
        icon={<IconTag size={17} />}
        tone="success"
        count={properties.length}
        loading={loadingProperties}
        emptyLabel="No properties"
      >
        <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Value type</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties
                  .filter((p) => !p.is_deleted)
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.property_code ?? "—"}</TableCell>
                      <TableCell>{p.name ?? "—"}</TableCell>
                      <TableCell>{p.property_value_type ?? "—"}</TableCell>
                      <TableCell>
                        {p.property_value_type === "percentage"
                          ? `${p.percentage_of_project ?? "—"}%`
                          : p.fixed_value != null
                            ? String(p.fixed_value)
                            : "—"}
                      </TableCell>
                      <TableCell>
                        {p.created_at ? formatDate(p.created_at) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
      </SectionCard>

      {/* Deposit schedules */}
      <SectionCard
        title="Deposit Schedules"
        icon={<IconCalendarDollar size={17} />}
        tone="info"
        count={depositSchedules.length}
        loading={loadingDepositSchedules}
        emptyLabel="No deposit schedules"
      >
        <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {depositSchedules.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.name ?? "—"}</TableCell>
                    <TableCell>{d.deposit_type?.name ?? "—"}</TableCell>
                    <TableCell>{d.amount != null ? String(d.amount) : "—"}</TableCell>
                    <TableCell>
                      {d.start_date ? formatDate(d.start_date) : "—"}
                    </TableCell>
                    <TableCell>
                      {d.end_date ? formatDate(d.end_date) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
      </SectionCard>

      {/* Notices */}
      <SectionCard
        title="Notices"
        icon={<IconNotes size={17} />}
        tone="primary"
        count={notices.length}
        loading={loadingNotices}
        emptyLabel="No notices"
      >
        <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Importance</TableCell>
                  <TableCell>Pinned</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notices.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>{n.title ?? "—"}</TableCell>
                    <TableCell>{n.importance ?? "—"}</TableCell>
                    <TableCell>{n.is_pinned ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {n.created_at ? formatDate(n.created_at) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
      </SectionCard>

      {/* Files */}
      <SectionCard
        title="Files"
        icon={<IconFiles size={17} />}
        tone="info"
        count={files.length}
        loading={loadingFiles}
        emptyLabel="No files"
      >
        <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Path</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.name ?? "—"}</TableCell>
                    <TableCell>{f.path ?? "—"}</TableCell>
                    <TableCell>
                      {f.size != null ? `${Math.round(f.size / 1024)} KB` : "—"}
                    </TableCell>
                    <TableCell>{f.is_folder ? "Folder" : f.mime_type ?? "—"}</TableCell>
                    <TableCell>
                      {f.created_at ? formatDate(f.created_at) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
      </SectionCard>
    </Box>
  );
}
