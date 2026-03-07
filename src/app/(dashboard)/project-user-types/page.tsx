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
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  InputAdornment,
  Switch,
  Chip,
  Tabs,
  Tab,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
} from "@mui/material";
import {
  IconSearch,
  IconRefresh,
  IconPlus,
  IconEdit,
  IconTrash,
  IconShield,
  IconCode,
  IconTable,
  IconToggleLeft,
  IconToggleRight,
} from "@tabler/icons-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type {
  ProjectUserType,
  ProjectUserTypesResponse,
} from "@/types";

// ── Permission matrix configuration ──────────────────────────────────────────

type BasePermissionStructure = Record<string, Record<string, boolean>>;

function toModuleLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toActionLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildPermissionsWithBase(
  existing: Record<string, Record<string, boolean>> | null | undefined,
  base: BasePermissionStructure
): Record<string, Record<string, boolean>> {
  const result: Record<string, Record<string, boolean>> = {};
  for (const [module, actions] of Object.entries(base)) {
    result[module] = {};
    for (const action of Object.keys(actions)) {
      result[module][action] = existing?.[module]?.[action] ?? false;
    }
  }
  return result;
}

// ── Permission Matrix Component ───────────────────────────────────────────────

function PermissionMatrix({
  permissions,
  baseStructure,
  onChange,
  readOnly = false,
}: {
  permissions: Record<string, Record<string, boolean>>;
  baseStructure: BasePermissionStructure;
  onChange: (updated: Record<string, Record<string, boolean>>) => void;
  readOnly?: boolean;
}) {
  const handleToggle = (moduleKey: string, action: string) => {
    if (readOnly) return;
    onChange({
      ...permissions,
      [moduleKey]: {
        ...(permissions[moduleKey] ?? {}),
        [action]: !(permissions[moduleKey]?.[action] ?? false),
      },
    });
  };

  const handleToggleAll = (moduleKey: string, value: boolean) => {
    if (readOnly) return;
    const moduleActions = Object.keys(baseStructure[moduleKey] ?? {});
    const newModule: Record<string, boolean> = {};
    for (const action of moduleActions) {
      newModule[action] = value;
    }
    onChange({ ...permissions, [moduleKey]: newModule });
  };

  return (
    <Box>
      {Object.entries(baseStructure).map(([moduleKey, moduleActions]) => {
        const modulePerms = permissions[moduleKey] ?? {};
        const moduleActionKeys = Object.keys(moduleActions);
        const allEnabled = moduleActionKeys.every((a) => modulePerms[a] === true);
        return (
          <Box
            key={moduleKey}
            sx={{
              pl: 3,
              py: 1,
              borderLeft: "2px solid",
              borderColor: "primary.light",
              mb: 2,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="primary" fontWeight="bold">
                {toModuleLabel(moduleKey).toUpperCase()}
              </Typography>
              {!readOnly && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    All
                  </Typography>
                  <Switch
                    size="small"
                    checked={allEnabled}
                    onChange={(e) => handleToggleAll(moduleKey, e.target.checked)}
                    color="success"
                  />
                </Stack>
              )}
            </Stack>
            <Grid container spacing={1}>
              {moduleActionKeys.map((action) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={action}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Switch
                      size="small"
                      checked={modulePerms[action] === true}
                      onChange={() => handleToggle(moduleKey, action)}
                      disabled={readOnly}
                      color="primary"
                    />
                    <Typography variant="body2">{toActionLabel(action)}</Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}
    </Box>
  );
}

// ── Add/Edit Dialog ───────────────────────────────────────────────────────────

interface UserTypeFormData {
  name: string;
  slug: string;
  description: string;
  permissions: Record<string, Record<string, boolean>>;
  is_active: boolean;
}

function UserTypeDialog({
  open,
  onClose,
  onSaved,
  editTarget,
  token,
  baseStructure,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (type: ProjectUserType) => void;
  editTarget: ProjectUserType | null;
  token: string;
  baseStructure: BasePermissionStructure | null;
}) {
  const isEdit = editTarget !== null;
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("");

  const [form, setForm] = useState<UserTypeFormData>({
    name: "",
    slug: "",
    description: "",
    permissions: {},
    is_active: true,
  });

  useEffect(() => {
    if (open && baseStructure) {
      setTab(0);
      setJsonMode(false);
      setJsonError(null);
      if (editTarget) {
        const perms = buildPermissionsWithBase(editTarget.permissions, baseStructure);
        setForm({
          name: editTarget.name,
          slug: editTarget.slug,
          description: editTarget.description ?? "",
          permissions: perms,
          is_active: editTarget.is_active,
        });
        setJsonText(JSON.stringify(perms, null, 2));
      } else {
        const defaultPerms = buildPermissionsWithBase(null, baseStructure);
        setForm({ name: "", slug: "", description: "", permissions: defaultPerms, is_active: true });
        setJsonText(JSON.stringify(defaultPerms, null, 2));
      }
    }
  }, [open, editTarget, baseStructure]);

  // Auto-generate slug from name (only when adding, and slug not manually changed)
  const handleNameChange = (value: string) => {
    const newSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setForm((f) => ({
      ...f,
      name: value,
      slug: isEdit ? f.slug : newSlug,
    }));
  };

  const handlePermissionsChange = (updated: Record<string, Record<string, boolean>>) => {
    setForm((f) => ({ ...f, permissions: updated }));
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleJsonTextChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setForm((f) => ({ ...f, permissions: parsed }));
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      setTab(0);
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      setTab(0);
      return;
    }
    if (jsonMode && jsonError) {
      toast.error("Fix JSON errors before saving");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        permissions: form.permissions,
        is_active: form.is_active,
      };

      let response;
      if (isEdit) {
        response = await api.put(`/admin/project-user-type/${editTarget!.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await api.post("/admin/project-user-type", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      const saved = (response.data as any).items as ProjectUserType;
      toast.success(isEdit ? "User type updated" : "User type created");
      onSaved(saved);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        "Failed to save user type";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? `Edit: ${editTarget?.name}` : "Add Project User Type"}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab label="Basic Info" />
          <Tab label="Permissions" />
        </Tabs>

        {/* ── Basic Info Tab ── */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <TextField
                label="Name"
                required
                fullWidth
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Project Manager"
              />
              <TextField
                label="Slug"
                required
                fullWidth
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="e.g. project-manager"
                helperText="Lowercase letters, numbers, and hyphens only"
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the role and responsibilities…"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    color="success"
                  />
                }
                label={form.is_active ? "Active" : "Inactive"}
              />
            </Stack>
          </Box>
        )}

        {/* ── Permissions Tab ── */}
        {tab === 1 && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Configure default permissions for this user type
              </Typography>
              <Tooltip title={jsonMode ? "Switch to matrix view" : "Switch to JSON editor"}>
                <IconButton
                  size="small"
                  onClick={() => setJsonMode((v) => !v)}
                  color={jsonMode ? "primary" : "default"}
                >
                  {jsonMode ? <IconTable size={18} /> : <IconCode size={18} />}
                </IconButton>
              </Tooltip>
            </Stack>

            {jsonMode ? (
              <Box>
                <TextField
                  multiline
                  fullWidth
                  rows={18}
                  value={jsonText}
                  onChange={(e) => handleJsonTextChange(e.target.value)}
                  error={!!jsonError}
                  helperText={jsonError ?? "Edit the permissions JSON directly"}
                  inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8rem" } }}
                />
              </Box>
            ) : baseStructure ? (
              <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                <PermissionMatrix
                  permissions={form.permissions}
                  baseStructure={baseStructure}
                  onChange={handlePermissionsChange}
                />
              </Box>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
          {isEdit ? "Save Changes" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────

function DeleteDialog({
  open,
  target,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  target: ProjectUserType | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete User Type</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete <strong>{target?.name}</strong>?{" "}
          {(target?.project_users_count ?? 0) > 0 && (
            <Box component="span" color="warning.main">
              This type is currently assigned to {target?.project_users_count} user(s).
            </Box>
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}>
          {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── View Permissions Dialog ───────────────────────────────────────────────────

function ViewPermissionsDialog({
  open,
  target,
  onClose,
  baseStructure,
}: {
  open: boolean;
  target: ProjectUserType | null;
  onClose: () => void;
  baseStructure: BasePermissionStructure | null;
}) {
  const [jsonMode, setJsonMode] = useState(false);
  if (!target) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <span>Permissions: {target.name}</span>
          <Tooltip title={jsonMode ? "Matrix view" : "JSON view"}>
            <IconButton size="small" onClick={() => setJsonMode((v) => !v)}>
              {jsonMode ? <IconTable size={18} /> : <IconCode size={18} />}
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {jsonMode ? (
          <Box
            component="pre"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.8rem",
              whiteSpace: "pre-wrap",
              bgcolor: "action.hover",
              p: 2,
              borderRadius: 1,
            }}
          >
            {JSON.stringify(target.permissions, null, 2)}
          </Box>
        ) : baseStructure ? (
          <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <PermissionMatrix
              permissions={target.permissions ?? {}}
              baseStructure={baseStructure}
              onChange={() => {}}
              readOnly
            />
          </Box>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Sort helpers ──────────────────────────────────────────────────────────────

type SortField = "name" | "slug" | "created_at" | "updated_at" | "is_active";

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectUserTypesPage() {
  const { data: session } = useSession();
  const token = (session as any)?.apiToken as string;

  const [types, setTypes] = useState<ProjectUserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [baseStructure, setBaseStructure] = useState<BasePermissionStructure | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // Sort
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Dialogs
  const [addEditDialog, setAddEditDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectUserType | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectUserType | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [viewTarget, setViewTarget] = useState<ProjectUserType | null>(null);

  const fetchTypes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        sort_by: sortBy,
        sort_dir: sortDir,
        limit: "100",
      };
      if (search.trim()) params.search = search.trim();
      if (filterActive !== "all") params.is_active = filterActive === "active" ? "true" : "false";

      const res = await api.get<ProjectUserTypesResponse>("/admin/project-user-types", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setTypes(res.data.items ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load project user types");
    } finally {
      setLoading(false);
    }
  }, [token, search, filterActive, sortBy, sortDir]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  useEffect(() => {
    if (!token) return;
    api
      .get("/admin/permissions/base-structure", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const perms = (res.data as any)?.items?.permissions;
        if (perms && typeof perms === "object") {
          setBaseStructure(perms as BasePermissionStructure);
        }
      })
      .catch(() => {});
  }, [token]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const handleToggleStatus = async (type: ProjectUserType) => {
    setActionLoading(type.id);
    try {
      const res = await api.patch(
        `/admin/project-user-type/${type.id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = (res.data as any).items as ProjectUserType;
      setTypes((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      toast.success(updated.is_active ? "User type activated" : "User type deactivated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to toggle status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    try {
      await api.delete(`/admin/project-user-type/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTypes((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success("User type deleted");
      setDeleteDialog(false);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? "Failed to delete");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaved = (saved: ProjectUserType) => {
    setTypes((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  // Stats
  const totalCount = types.length;
  const activeCount = types.filter((t) => t.is_active).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Header ── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Project User Types
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user roles and their default permission settings for projects
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<IconPlus size={18} />}
          onClick={() => {
            setEditTarget(null);
            setAddEditDialog(true);
          }}
        >
          Add User Type
        </Button>
      </Stack>

      {/* ── Stats Row ── */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
        <Chip
          label={`Total: ${totalCount}`}
          color="default"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: "0.85rem" }}
        />
        <Chip
          label={`Active: ${activeCount}`}
          color="success"
          variant={filterActive === "active" ? "filled" : "outlined"}
          onClick={() => setFilterActive((v) => (v === "active" ? "all" : "active"))}
          sx={{ fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
        />
        <Chip
          label={`Inactive: ${inactiveCount}`}
          color="error"
          variant={filterActive === "inactive" ? "filled" : "outlined"}
          onClick={() => setFilterActive((v) => (v === "inactive" ? "all" : "inactive"))}
          sx={{ fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
        />
      </Stack>

      {/* ── Toolbar ── */}
      <Stack direction="row" spacing={2} mb={2} alignItems="center" flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search by name, slug, or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size={18} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as typeof filterActive)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchTypes} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : <IconRefresh size={18} />}
          </IconButton>
        </Tooltip>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Table ── */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "name"}
                  direction={sortBy === "name" ? sortDir : "asc"}
                  onClick={() => handleSort("name")}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "slug"}
                  direction={sortBy === "slug" ? sortDir : "asc"}
                  onClick={() => handleSort("slug")}
                >
                  Slug
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ maxWidth: 200 }}>Description</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === "is_active"}
                  direction={sortBy === "is_active" ? sortDir : "asc"}
                  onClick={() => handleSort("is_active")}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Users</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "created_at"}
                  direction={sortBy === "created_at" ? sortDir : "asc"}
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
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : types.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">No project user types found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              types.map((type) => (
                <TableRow key={type.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {type.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
                      {type.slug}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 200,
                      }}
                      title={type.description ?? ""}
                    >
                      {type.description ?? <em style={{ opacity: 0.5 }}>No description</em>}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={type.is_active ? "Active" : "Inactive"}
                      color={type.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {type.project_users_count ?? 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<IconShield size={14} />}
                      onClick={() => {
                        setViewTarget(type);
                        setViewDialog(true);
                      }}
                      sx={{ fontSize: "0.72rem", py: 0.3 }}
                    >
                      View
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {new Date(type.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title={type.is_active ? "Deactivate" : "Activate"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(type)}
                            disabled={actionLoading === type.id}
                            color={type.is_active ? "success" : "default"}
                          >
                            {actionLoading === type.id ? (
                              <CircularProgress size={16} />
                            ) : type.is_active ? (
                              <IconToggleRight size={18} />
                            ) : (
                              <IconToggleLeft size={18} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditTarget(type);
                            setAddEditDialog(true);
                          }}
                        >
                          <IconEdit size={17} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setDeleteTarget(type);
                            setDeleteDialog(true);
                          }}
                        >
                          <IconTrash size={17} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Add/Edit Dialog ── */}
      <UserTypeDialog
        open={addEditDialog}
        onClose={() => setAddEditDialog(false)}
        onSaved={handleSaved}
        editTarget={editTarget}
        token={token}
        baseStructure={baseStructure}
      />

      {/* ── Delete Dialog ── */}
      <DeleteDialog
        open={deleteDialog}
        target={deleteTarget}
        onClose={() => {
          setDeleteDialog(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading === deleteTarget?.id}
      />

      {/* ── View Permissions Dialog ── */}
      <ViewPermissionsDialog
        open={viewDialog}
        target={viewTarget}
        onClose={() => {
          setViewDialog(false);
          setViewTarget(null);
        }}
        baseStructure={baseStructure}
      />
    </Box>
  );
}
