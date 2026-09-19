"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  TableSortLabel,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  InputAdornment,
  SelectChangeEvent,
  Skeleton,
} from "@mui/material";
import {
  IconSearch,
  IconPlayerPlay,
  IconPlayerPause,
  IconTrash,
  IconRefresh,
  IconCheck,
  IconX,
  IconBan,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Project, ProjectsResponse } from "@/types";

type SortField = "name" | "created_at" | "updated_at" | "status" | "is_active";
type SortOrder = "asc" | "desc";

interface ConfirmDialog {
  open: boolean;
  title: string;
  message: string;
  action: (() => Promise<void>) | null;
}

/** Row actions shared by the desktop table and the mobile card list. */
function ProjectActions({
  project,
  actionLoading,
  onToggleActive,
  onSuspend,
  onResume,
  onDelete,
}: {
  project: Project;
  actionLoading: string | null;
  onToggleActive: (project: Project) => void;
  onSuspend: (project: Project) => void;
  onResume: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const isSuspended = project.status === "Suspended";
  return (
    <Stack direction="row" spacing={0} justifyContent="flex-end">
      <Tooltip title={project.is_active ? "Deactivate" : "Activate"}>
        <span>
          <IconButton
            size="small"
            color={project.is_active ? "warning" : "success"}
            disabled={actionLoading === project.id}
            onClick={() => onToggleActive(project)}
          >
            {project.is_active ? (
              <IconPlayerPause size={18} />
            ) : (
              <IconPlayerPlay size={18} />
            )}
          </IconButton>
        </span>
      </Tooltip>
      {isSuspended ? (
        <Tooltip title="Resume (set Active)">
          <span>
            <IconButton
              size="small"
              color="success"
              disabled={actionLoading === project.id}
              onClick={() => onResume(project)}
            >
              <IconPlayerPlay size={18} />
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <Tooltip title="Suspend">
          <span>
            <IconButton
              size="small"
              color="warning"
              disabled={actionLoading === project.id}
              onClick={() => onSuspend(project)}
            >
              <IconBan size={18} />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <Tooltip title="Delete">
        <span>
          <IconButton
            size="small"
            color="error"
            disabled={actionLoading === project.id}
            onClick={() => onDelete(project)}
          >
            <IconTrash size={18} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const token = (session as { apiToken?: string } | null)?.apiToken;

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/search state
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");

  // Pagination state
  const [page, setPage] = useState(0); // MUI uses 0-based
  const [rowsPerPage, setRowsPerPage] = useState(500);

  // Sort state
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    open: false,
    title: "",
    message: "",
    action: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page: page + 1, // API is 1-based
        limit: rowsPerPage,
        sort: sortBy,
        order: sortOrder,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (activeFilter !== "") params.is_active = activeFilter;

      const response = await api.get<ProjectsResponse>("/admin/projects", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setProjects(response.data.items);
      setTotalCount(response.data.count);
      setTotalPages(response.data.total_pages);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to load projects";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token, page, rowsPerPage, sortBy, sortOrder, search, statusFilter, activeFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Action handlers
  const handleUpdateProject = async (
    projectId: string,
    data: Record<string, unknown>,
    successMsg: string
  ) => {
    setActionLoading(projectId);
    try {
      await api.put(`/admin/project/${projectId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(successMsg);
      fetchProjects();
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Action failed";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setActionLoading(projectId);
    try {
      await api.delete(`/admin/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Delete failed";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirm = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmDialog({ open: true, title, message, action });
  };

  const closeConfirm = () => {
    setConfirmDialog({ open: false, title: "", message: "", action: null });
  };

  const handleConfirmAction = async () => {
    if (confirmDialog.action) {
      await confirmDialog.action();
    }
    closeConfirm();
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(0);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleActiveFilterChange = (event: SelectChangeEvent<string>) => {
    setActiveFilter(event.target.value);
    setPage(0);
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" | "info" => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "paused":
      case "suspended":
        return "warning";
      case "completed":
        return "info";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Shared row actions for the desktop table and mobile card list
  const projectActions = (project: Project) => (
    <ProjectActions
      project={project}
      actionLoading={actionLoading}
      onToggleActive={(p) =>
        openConfirm(
          p.is_active ? "Deactivate Project" : "Activate Project",
          `Are you sure you want to ${p.is_active ? "deactivate" : "activate"} "${p.name}"?`,
          () =>
            handleUpdateProject(
              p.id,
              { is_active: !p.is_active },
              `Project ${p.is_active ? "deactivated" : "activated"}`
            )
        )
      }
      onSuspend={(p) =>
        openConfirm(
          "Suspend Project",
          `Are you sure you want to suspend "${p.name}"? This will set its status to Suspended.`,
          () => handleUpdateProject(p.id, { status: "Suspended" }, "Project suspended")
        )
      }
      onResume={(p) =>
        openConfirm(
          "Resume Project",
          `Resume "${p.name}" and set status back to Active?`,
          () => handleUpdateProject(p.id, { status: "Active" }, "Project resumed")
        )
      }
      onDelete={(p) =>
        openConfirm(
          "Delete Project",
          `Are you sure you want to delete "${p.name}"? This action uses soft delete.`,
          () => handleDeleteProject(p.id)
        )
      }
    />
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Projects</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchProjects} disabled={loading}>
            <IconRefresh size={20} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search by name or slug..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={18} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: { sm: 250 }, width: { xs: "100%" }, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: { sm: 140 }, width: { xs: "100%" } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={handleStatusFilterChange}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Paused">Paused</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { sm: 140 }, width: { xs: "100%" } }}>
            <InputLabel>Active</InputLabel>
            <Select
              value={activeFilter}
              label="Active"
              onChange={handleActiveFilterChange}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Summary */}
      <Typography variant="body2" color="text.secondary" mb={1}>
        {totalCount} project{totalCount !== 1 ? "s" : ""} found
      </Typography>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper elevation={1}>
        {/* Mobile: compact card list */}
        <Box sx={{ display: { xs: "block", md: "none" }, p: { xs: 1.5, sm: 2 } }}>
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1.5,
                  mb: 1.5,
                }}
              >
                <Skeleton variant="text" width="55%" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="rounded" width={150} height={22} />
              </Box>
            ))
          ) : projects.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No projects found
            </Typography>
          ) : (
            projects.map((project) => (
              <Box
                key={project.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1.5,
                  mb: 1.5,
                  opacity: actionLoading === project.id ? 0.5 : 1,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Link
                      href={`/projects/${project.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {project.name}
                      </Typography>
                    </Link>
                    <Typography variant="caption" color="text.secondary">
                      {project.slug}
                    </Typography>
                    {project.created_by && typeof project.created_by === "object" && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", wordBreak: "break-all" }}
                      >
                        by {project.created_by.name} · {project.created_by.email}
                      </Typography>
                    )}
                  </Box>
                  {projectActions(project)}
                </Stack>
                <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: "wrap", rowGap: 0.5 }}>
                  <Chip
                    label={project.status}
                    color={getStatusColor(project.status)}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={project.is_active ? <IconCheck size={14} /> : <IconX size={14} />}
                    label={project.is_active ? "Active" : "Inactive"}
                    color={project.is_active ? "success" : "default"}
                    size="small"
                    variant="outlined"
                  />
                  {project.is_premium && (
                    <Chip label="Premium" color="warning" size="small" variant="filled" />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                  {project.users_count} users · {project.members_count} members · Created{" "}
                  {formatDate(project.created_at)}
                </Typography>
              </Box>
            ))
          )}
        </Box>

        {/* Desktop: table */}
        <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "name"}
                  direction={sortBy === "name" ? sortOrder : "asc"}
                  onClick={() => handleSort("name")}
                >
                  Project
                </TableSortLabel>
              </TableCell>
              <TableCell>Creator</TableCell>
              <TableCell align="center">Users</TableCell>
              <TableCell align="center">Members</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "status"}
                  direction={sortBy === "status" ? sortOrder : "asc"}
                  onClick={() => handleSort("status")}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "is_active"}
                  direction={sortBy === "is_active" ? sortOrder : "asc"}
                  onClick={() => handleSort("is_active")}
                >
                  Active
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Premium</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "created_at"}
                  direction={sortBy === "created_at" ? sortOrder : "asc"}
                  onClick={() => handleSort("created_at")}
                >
                  Created
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No projects found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow
                  key={project.id}
                  hover
                  sx={{ opacity: actionLoading === project.id ? 0.5 : 1 }}
                >
                  {/* Project Name + Slug (clickable) */}
                  <TableCell>
                    <Link
                      href={`/projects/${project.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {project.name}
                      </Typography>
                    </Link>
                    <Typography variant="caption" color="text.secondary">
                      {project.slug}
                    </Typography>
                  </TableCell>

                  {/* Creator */}
                  <TableCell>
                    {project.created_by &&
                    typeof project.created_by === "object" ? (
                      <Box>
                        <Typography variant="body2">
                          {project.created_by.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {project.created_by.email}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>

                  {/* Users Count */}
                  <TableCell align="center">
                    <Typography variant="body2">{project.users_count}</Typography>
                  </TableCell>

                  {/* Members Count */}
                  <TableCell align="center">
                    <Typography variant="body2">{project.members_count}</Typography>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Chip
                      label={project.status}
                      color={getStatusColor(project.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Active */}
                  <TableCell>
                    <Chip
                      icon={project.is_active ? <IconCheck size={14} /> : <IconX size={14} />}
                      label={project.is_active ? "Yes" : "No"}
                      color={project.is_active ? "success" : "default"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Premium */}
                  <TableCell align="center">
                    {project.is_premium ? (
                      <Chip label="Premium" color="warning" size="small" variant="filled" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>

                  {/* Created At */}
                  <TableCell>
                    <Typography variant="body2">{formatDate(project.created_at)}</Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right">{projectActions(project)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[100, 250, 500, 1000]}
      />
    </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
