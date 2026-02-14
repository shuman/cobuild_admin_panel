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
  CircularProgress,
  Alert,
  Stack,
  Button,
  Divider,
} from "@mui/material";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";
import api from "@/lib/api";
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

interface UserDetailResponse {
  count: number;
  items: AdminUser;
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

  if (loading || !id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={320}>
        <CircularProgress />
      </Box>
    );
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

      <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
        User Details
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
        <Typography variant="subtitle1" fontWeight={600} color="text.secondary" gutterBottom>
          Profile
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2} sx={{ maxWidth: 480 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Name</Typography>
            <Typography fontWeight={600}>{user.name}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography>{user.email}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Phone</Typography>
            <Typography>{user.phone ?? "—"}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Role</Typography>
            <Chip
              label={getRoleLabel(user)}
              size="small"
              variant="outlined"
              color={
                user.is_super_admin
                  ? "error"
                  : user.is_admin
                    ? "primary"
                    : "default"
              }
            />
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Active</Typography>
            <Chip
              icon={user.is_active ? <IconCheck size={14} /> : <IconX size={14} />}
              label={user.is_active ? "Yes" : "No"}
              size="small"
              variant="outlined"
              color={user.is_active ? "success" : "default"}
            />
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Verified</Typography>
            <Chip
              size="small"
              label={user.is_verified ? "Yes" : "No"}
              variant="outlined"
              color={user.is_verified ? "success" : "default"}
            />
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Last login</Typography>
            <Typography>{formatDate(user.last_login_at)}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Created</Typography>
            <Typography>{formatDate(user.created_at)}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">Updated</Typography>
            <Typography>{formatDate(user.updated_at)}</Typography>
          </Box>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Associated Projects ({associatedProjects.length})
      </Typography>
      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow>
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
    </Box>
  );
}
