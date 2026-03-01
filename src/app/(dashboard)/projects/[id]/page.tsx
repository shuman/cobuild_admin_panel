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
  CircularProgress,
  Alert,
  Stack,
  Button,
  Divider,
} from "@mui/material";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";
import api from "@/lib/api";
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

  if (!id) {
    return (
      <Box sx={{ py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (loadingProject && !project) {
    return (
      <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
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

  const SectionTable = ({
    title,
    count,
    loading,
    children,
  }: {
    title: string;
    count: number;
    loading: boolean;
    children: React.ReactNode;
  }) => (
    <Paper sx={{ p: 2, mb: 3 }} elevation={1}>
      <Typography variant="h6" gutterBottom>
        {title} ({count})
      </Typography>
      {loading ? (
        <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        children
      )}
    </Paper>
  );

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <Button
          component={Link}
          href="/projects"
          startIcon={<IconArrowLeft size={18} />}
          size="small"
          color="inherit"
        >
          Back
        </Button>
      </Stack>

      {/* Project info */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
        <Typography variant="h5" gutterBottom>
          {project?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {project?.slug}
        </Typography>
        {project?.description && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {project.description}
          </Typography>
        )}
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
          <Chip
            label={project?.status ?? "—"}
            size="small"
            variant="outlined"
            color={
              project?.status === "Active"
                ? "success"
                : project?.status === "Suspended"
                  ? "warning"
                  : "default"
            }
          />
          <Chip
            icon={project?.is_active ? <IconCheck size={14} /> : <IconX size={14} />}
            label={project?.is_active ? "Active" : "Inactive"}
            size="small"
            variant="outlined"
            color={project?.is_active ? "success" : "default"}
          />
          {project?.is_premium && (
            <Chip label="Premium" size="small" color="warning" />
          )}
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Creator
        </Typography>
        {creator ? (
          <Typography variant="body2">
            {creator.name} — {creator.email}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        )}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }} gutterBottom>
          Created
        </Typography>
        <Typography variant="body2">
          {project?.created_at ? formatDate(project.created_at) : "—"}
        </Typography>
        {project?.updated_at && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }} gutterBottom>
              Updated
            </Typography>
            <Typography variant="body2">{formatDate(project.updated_at)}</Typography>
          </>
        )}
      </Paper>

      {/* Users (project users from admin API) */}
      <SectionTable title="Users" count={filteredUsers.length} loading={loadingUsers}>
        {filteredUsers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No users
          </Typography>
        ) : (
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
        )}
      </SectionTable>

      {/* Members (project members) */}
      <SectionTable title="Members" count={members.length} loading={loadingMembers}>
        {members.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No members
          </Typography>
        ) : (
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
        )}
      </SectionTable>

      {/* Vendors */}
      <SectionTable title="Vendors" count={vendors.length} loading={loadingVendors}>
        {vendors.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No vendors
          </Typography>
        ) : (
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
        )}
      </SectionTable>

      {/* Properties */}
      <SectionTable title="Properties" count={properties.length} loading={loadingProperties}>
        {properties.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No properties
          </Typography>
        ) : (
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
        )}
      </SectionTable>

      {/* Deposit schedules */}
      <SectionTable
        title="Deposit schedules"
        count={depositSchedules.length}
        loading={loadingDepositSchedules}
      >
        {depositSchedules.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No deposit schedules
          </Typography>
        ) : (
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
        )}
      </SectionTable>

      {/* Notices */}
      <SectionTable title="Notices" count={notices.length} loading={loadingNotices}>
        {notices.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No notices
          </Typography>
        ) : (
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
        )}
      </SectionTable>

      {/* Files */}
      <SectionTable title="Files" count={files.length} loading={loadingFiles}>
        {files.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No files
          </Typography>
        ) : (
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
        )}
      </SectionTable>
    </Box>
  );
}
