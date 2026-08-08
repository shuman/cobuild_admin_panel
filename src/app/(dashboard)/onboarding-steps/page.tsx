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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  FormControlLabel,
} from "@mui/material";
import {
  IconSearch,
  IconRefresh,
  IconPlus,
  IconEdit,
  IconTrash,
  IconToggleLeft,
  IconToggleRight,
  IconListCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type {
  OnboardingStep,
  OnboardingStepsResponse,
  OnboardingTargetTable,
} from "@/types";

// Must match the controller's ALLOWED_TARGET_TABLES whitelist.
const TARGET_TABLE_OPTIONS: OnboardingTargetTable[] = [
  "members",
  "properties",
  "data_protection_profiles",
  "deposits",
  "expenses",
];

// ── Add/Edit Dialog ───────────────────────────────────────────────────────────

interface OnboardingStepFormData {
  key: string;
  label: string;
  description: string;
  route_path: string;
  target_table: OnboardingTargetTable;
  sort_order: number;
  is_active: boolean;
}

function OnboardingStepDialog({
  open,
  onClose,
  onSaved,
  editTarget,
  token,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (step: OnboardingStep) => void;
  editTarget: OnboardingStep | null;
  token: string;
}) {
  const isEdit = editTarget !== null;
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<OnboardingStepFormData>({
    key: "",
    label: "",
    description: "",
    route_path: "",
    target_table: "members",
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setForm({
          key: editTarget.key,
          label: editTarget.label,
          description: editTarget.description ?? "",
          route_path: editTarget.route_path ?? "",
          target_table: (editTarget.target_table as OnboardingTargetTable) ?? "members",
          sort_order: editTarget.sort_order ?? 0,
          is_active: editTarget.is_active,
        });
      } else {
        setForm({
          key: "",
          label: "",
          description: "",
          route_path: "",
          target_table: "members",
          sort_order: 0,
          is_active: true,
        });
      }
    }
  }, [open, editTarget]);

  // Auto-generate key from label when adding.
  const handleLabelChange = (value: string) => {
    const newKey = value
      .toLowerCase()
      .replace(/[^a-z0-9\s_]/g, "")
      .replace(/\s+/g, "_");
    setForm((f) => ({
      ...f,
      label: value,
      key: isEdit ? f.key : newKey,
    }));
  };

  const handleSave = async () => {
    if (!form.key.trim()) {
      toast.error("Key is required");
      return;
    }
    if (!form.label.trim()) {
      toast.error("Label is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        key: form.key.trim(),
        label: form.label.trim(),
        description: form.description.trim() || null,
        route_path: form.route_path.trim() || null,
        target_table: form.target_table,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };

      let response;
      if (isEdit) {
        response = await api.put(`/admin/onboarding-steps/${editTarget!.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        response = await api.post("/admin/onboarding-steps", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      const saved = (response.data as any).items as OnboardingStep;
      toast.success(isEdit ? "Onboarding step updated" : "Onboarding step created");
      onSaved(saved);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        "Failed to save onboarding step";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? `Edit: ${editTarget?.label}` : "Add Onboarding Step"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField
            label="Label"
            required
            fullWidth
            value={form.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g. Add Members"
          />
          <TextField
            label="Key"
            required
            fullWidth
            value={form.key}
            onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
            placeholder="e.g. add_members"
            helperText="Lowercase letters, numbers, and underscores only"
            inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short helper text shown under the step label"
          />
          <TextField
            label="Route Path"
            fullWidth
            value={form.route_path}
            onChange={(e) => setForm((f) => ({ ...f, route_path: e.target.value }))}
            placeholder="e.g. /:projectSlug/members"
            helperText="Use :projectSlug as a placeholder for the project slug"
            inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }}
          />
          <FormControl fullWidth required>
            <InputLabel>Target Table</InputLabel>
            <Select
              label="Target Table"
              value={form.target_table}
              onChange={(e) =>
                setForm((f) => ({ ...f, target_table: e.target.value as OnboardingTargetTable }))
              }
            >
              {TARGET_TABLE_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Sort Order"
            type="number"
            fullWidth
            value={form.sort_order}
            onChange={(e) =>
              setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))
            }
            helperText="Lower numbers appear first in the checklist"
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
  target: OnboardingStep | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Onboarding Step</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete <strong>{target?.label}</strong>?
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          This action cannot be undone. Projects that have already dismissed the checklist
          will not be affected.
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

// ── Sort helpers ──────────────────────────────────────────────────────────────

type SortField =
  | "key"
  | "label"
  | "target_table"
  | "sort_order"
  | "is_active"
  | "created_at"
  | "updated_at";

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OnboardingStepsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.apiToken as string;

  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  // Sort
  const [sortBy, setSortBy] = useState<SortField>("sort_order");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Dialogs
  const [addEditDialog, setAddEditDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<OnboardingStep | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OnboardingStep | null>(null);

  const fetchSteps = useCallback(async () => {
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

      const res = await api.get<OnboardingStepsResponse>("/admin/onboarding-steps", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setSteps(res.data.items ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load onboarding steps");
    } finally {
      setLoading(false);
    }
  }, [token, search, filterActive, sortBy, sortDir]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const handleToggleStatus = async (step: OnboardingStep) => {
    setActionLoading(step.id);
    try {
      const res = await api.patch(
        `/admin/onboarding-steps/${step.id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = (res.data as any).items as OnboardingStep;
      setSteps((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      toast.success(updated.is_active ? "Step activated" : "Step deactivated");
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
      await api.delete(`/admin/onboarding-steps/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSteps((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success("Onboarding step deleted");
      setDeleteDialog(false);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.response?.data?.error ?? "Failed to delete");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaved = (saved: OnboardingStep) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  // Stats
  const totalCount = steps.length;
  const activeCount = steps.filter((s) => s.is_active).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Header ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Onboarding Steps
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the setup checklist shown to project owners
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
          Add Step
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
          placeholder="Search by key, label, or target table…"
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
          <IconButton onClick={fetchSteps} disabled={loading}>
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
              <TableCell sx={{ width: 60 }}>
                <TableSortLabel
                  active={sortBy === "sort_order"}
                  direction={sortBy === "sort_order" ? sortDir : "asc"}
                  onClick={() => handleSort("sort_order")}
                >
                  #
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "label"}
                  direction={sortBy === "label" ? sortDir : "asc"}
                  onClick={() => handleSort("label")}
                >
                  Label
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "key"}
                  direction={sortBy === "key" ? sortDir : "asc"}
                  onClick={() => handleSort("key")}
                >
                  Key
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ maxWidth: 220 }}>Description</TableCell>
              <TableCell>Route Path</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "target_table"}
                  direction={sortBy === "target_table" ? sortDir : "asc"}
                  onClick={() => handleSort("target_table")}
                >
                  Target Table
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortBy === "is_active"}
                  direction={sortBy === "is_active" ? sortDir : "asc"}
                  onClick={() => handleSort("is_active")}
                >
                  Status
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
            ) : steps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Stack alignItems="center" spacing={1}>
                    <IconListCheck size={28} opacity={0.4} />
                    <Typography color="text.secondary">No onboarding steps found</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              steps.map((step) => (
                <TableRow key={step.id} hover>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {step.sort_order}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {step.label}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: "monospace", fontSize: "0.78rem" }}
                    >
                      {step.key}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 220,
                      }}
                      title={step.description ?? ""}
                    >
                      {step.description ?? (
                        <em style={{ opacity: 0.5 }}>No description</em>
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                      noWrap
                    >
                      {step.route_path ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={step.target_table}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: "monospace", fontSize: "0.72rem" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={step.is_active ? "Active" : "Inactive"}
                      color={step.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title={step.is_active ? "Deactivate" : "Activate"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(step)}
                            disabled={actionLoading === step.id}
                            color={step.is_active ? "success" : "default"}
                          >
                            {actionLoading === step.id ? (
                              <CircularProgress size={16} />
                            ) : step.is_active ? (
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
                            setEditTarget(step);
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
                            setDeleteTarget(step);
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
      <OnboardingStepDialog
        open={addEditDialog}
        onClose={() => setAddEditDialog(false)}
        onSaved={handleSaved}
        editTarget={editTarget}
        token={token}
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
    </Box>
  );
}
