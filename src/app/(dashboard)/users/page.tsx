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
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  IconSearch,
  IconPlayerPlay,
  IconPlayerPause,
  IconTrash,
  IconRefresh,
  IconCheck,
  IconX,
  IconEdit,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import type { AdminUser, UsersResponse } from "@/types";

type SortField = "name" | "email" | "created_at" | "updated_at" | "is_active" | "last_login_at";
type SortOrder = "asc" | "desc";

interface ConfirmDialog {
  open: boolean;
  title: string;
  message: string;
  action: (() => Promise<void>) | null;
}

function getRoleLabel(user: AdminUser): string {
  if (user.is_super_admin) return "Super Admin";
  if (user.is_admin) return "Admin";
  return "User";
}

type UserRole = "user" | "admin" | "super_admin";

function getRoleValue(user: AdminUser): UserRole {
  if (user.is_super_admin) return "super_admin";
  if (user.is_admin) return "admin";
  return "user";
}

interface EditUserForm {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
}

function EditUserDialog({
  open,
  user,
  token,
  onClose,
  onSaved,
}: {
  open: boolean;
  user: AdminUser | null;
  token?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EditUserForm>({
    name: "",
    email: "",
    phone: "",
    role: "user",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: getRoleValue(user),
        is_active: user.is_active,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setSaving(true);
    try {
      await api.put(
        `/admin/user/${user.id}`,
        {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          is_active: form.is_active,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User updated");
      onSaved();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to update user";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User{user ? `: ${user.name}` : ""}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            required
            fullWidth
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Email"
            required
            fullWidth
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <TextField
            label="Phone"
            fullWidth
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={form.role}
              label="Role"
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as UserRole }))
              }
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="super_admin">Super Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
                color="success"
              />
            }
            label={form.is_active ? "Active" : "Inactive"}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UsersPage() {
  const { data: session } = useSession();
  const token = (session as any)?.apiToken;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(500);
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    open: false,
    title: "",
    message: "",
    action: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: page + 1,
        limit: rowsPerPage,
        sort: sortBy,
        order: sortOrder,
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (activeFilter !== "") params.is_active = activeFilter;

      const response = await api.get<UsersResponse>("/admin/users", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(response.data.items);
      setTotalCount(response.data.count);
      setTotalPages(response.data.total_pages);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to load users";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token, page, rowsPerPage, sortBy, sortOrder, search, roleFilter, activeFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleToggleStatus = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/user/${userId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User status updated");
      fetchUsers();
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

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api.delete(`/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted successfully");
      fetchUsers();
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
    if (confirmDialog.action) await confirmDialog.action();
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

  const handleRoleFilterChange = (event: SelectChangeEvent<string>) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  const handleActiveFilterChange = (event: SelectChangeEvent<string>) => {
    setActiveFilter(event.target.value);
    setPage(0);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Users</Typography>
        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={fetchUsers} disabled={loading}>
              <IconRefresh size={20} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name, email or phone..."
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
            sx={{ minWidth: 250, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Role</InputLabel>
            <Select value={roleFilter} label="Role" onChange={handleRoleFilterChange}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="super_admin">Super Admin</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Active</InputLabel>
            <Select value={activeFilter} label="Active" onChange={handleActiveFilterChange}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Typography variant="body2" color="text.secondary" mb={1}>
        {totalCount} user{totalCount !== 1 ? "s" : ""} found
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "name"}
                  direction={sortBy === "name" ? sortOrder : "asc"}
                  onClick={() => handleSort("name")}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "email"}
                  direction={sortBy === "email" ? sortOrder : "asc"}
                  onClick={() => handleSort("email")}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "is_active"}
                  direction={sortBy === "is_active" ? sortOrder : "asc"}
                  onClick={() => handleSort("is_active")}
                >
                  Active
                </TableSortLabel>
              </TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Last login</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "created_at"}
                  direction={sortBy === "created_at" ? sortOrder : "asc"}
                  onClick={() => handleSort("created_at")}
                >
                  Created
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Projects</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  sx={{ opacity: actionLoading === user.id ? 0.5 : 1 }}
                >
                  <TableCell>
                    <Link
                      href={`/users/${user.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ "&:hover": { textDecoration: "underline" } }}
                      >
                        {user.name}
                      </Typography>
                    </Link>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone ?? "—"}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={user.is_active ? <IconCheck size={14} /> : <IconX size={14} />}
                      label={user.is_active ? "Yes" : "No"}
                      size="small"
                      variant="outlined"
                      color={user.is_active ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={user.is_verified ? "Yes" : "No"}
                      variant="outlined"
                      color={user.is_verified ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.last_login_at)}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell align="center">
                    {user.projects?.length ?? 0}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0} justifyContent="flex-end">
                      <Tooltip title="Edit">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={actionLoading === user.id}
                            onClick={() => {
                              setEditUser(user);
                              setEditOpen(true);
                            }}
                          >
                            <IconEdit size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip
                        title={
                          user.is_super_admin && user.is_active
                            ? "Cannot deactivate Super Admin"
                            : user.is_active
                              ? "Deactivate"
                              : "Activate"
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            color={user.is_active ? "warning" : "success"}
                            disabled={
                              actionLoading === user.id ||
                              (user.is_super_admin && user.is_active)
                            }
                            onClick={() =>
                              openConfirm(
                                user.is_active ? "Deactivate User" : "Activate User",
                                `Are you sure you want to ${user.is_active ? "deactivate" : "activate"} "${user.name}"?`,
                                () => handleToggleStatus(user.id)
                              )
                            }
                          >
                            {user.is_active ? (
                              <IconPlayerPause size={18} />
                            ) : (
                              <IconPlayerPlay size={18} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={user.is_super_admin ? "Cannot delete Super Admin" : "Delete"}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={actionLoading === user.id || user.is_super_admin}
                            onClick={() =>
                              openConfirm(
                                "Delete User",
                                `Are you sure you want to delete "${user.name}"? This action cannot be undone.`,
                                () => handleDeleteUser(user.id)
                              )
                            }
                          >
                            <IconTrash size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[100, 250, 500, 1000]}
        />
      </TableContainer>

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

      <EditUserDialog
        open={editOpen}
        user={editUser}
        token={token}
        onClose={() => setEditOpen(false)}
        onSaved={fetchUsers}
      />
    </Box>
  );
}
