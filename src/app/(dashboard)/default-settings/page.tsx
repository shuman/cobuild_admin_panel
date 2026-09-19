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
    DialogContentText,
    DialogActions,
    Button,
    InputAdornment,
    Switch,
    Collapse,
    Divider,
    Grid,
    Chip,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Skeleton,
} from "@mui/material";
import {
    IconSearch,
    IconRefresh,
    IconChevronDown,
    IconChevronUp,
    IconDeviceFloppy,
    IconAlertCircle,
    IconPlus,
    IconShield,
    IconSettings,
} from "@tabler/icons-react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { DefaultSetting, DefaultSettingsResponse, SettingType } from "@/types";
import JsonView from '@uiw/react-json-view';
// If themes fail, we'll stick to default and fix later

interface ConfirmDialog {
    open: boolean;
    title: string;
    message: React.ReactNode;
    action: (() => Promise<void>) | null;
}

const TYPE_TONES: Record<string, "primary" | "secondary" | "success" | "info" | "warning" | "default"> = {
    json: "primary",
    array: "secondary",
    boolean: "success",
    integer: "info",
    float: "warning",
};

export default function DefaultSettingsPage() {
    const { data: session } = useSession();
    const token = (session as any)?.apiToken;

    const [settings, setSettings] = useState<DefaultSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Record<string, any>>({});
    const [viewMode, setViewMode] = useState<Record<string, 'graphical' | 'raw'>>({});
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
        open: false,
        title: "",
        message: null,
        action: null,
    });

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newSetting, setNewSetting] = useState({
        key: "",
        type: "json" as SettingType,
        value: "" as any,
        description: "",
        is_active: true,
    });

    const fetchSettings = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<DefaultSettingsResponse>("/admin/default-settings", {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Ensure complex types are objects
            const processedItems = response.data.items.map(item => {
                if ((item.type === 'json' || item.type === 'array') && typeof item.value === 'string') {
                    try {
                        return { ...item, value: JSON.parse(item.value) };
                    } catch {
                        return item;
                    }
                }
                return item;
            });
            setSettings(processedItems);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load default settings");
        } finally {
            setLoading(false);
        }
    }, [token]);

    const [permissionStructure, setPermissionStructure] = useState<any>(null);

    const fetchPermissionStructure = useCallback(async () => {
        if (!token) return;
        try {
            const response = await api.get("/admin/permissions/base-structure", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPermissionStructure(response.data.items || response.data);
        } catch (err) {
            console.error("Failed to load permission structure", err);
        }
    }, [token]);

    useEffect(() => {
        fetchSettings();
        fetchPermissionStructure();
    }, [fetchSettings, fetchPermissionStructure]);

    const handleToggleActive = async (setting: DefaultSetting) => {
        const newStatus = !setting.is_active;

        setConfirmDialog({
            open: true,
            title: "Confirm Status Change",
            message: (
                <Typography>
                    Are you sure you want to {newStatus ? "activate" : "deactivate"} <b>{setting.key}</b>?
                </Typography>
            ),
            action: async () => {
                setActionLoading(setting.id);
                try {
                    await api.put(`/admin/default-settings/${setting.id}`,
                        { is_active: newStatus },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    toast.success("Status updated successfully");
                    fetchSettings();
                } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to update status");
                } finally {
                    setActionLoading(null);
                }
            },
        });
    };

    const handleSaveSetting = async (setting: DefaultSetting) => {
        const updatedValue = editValues[setting.id];
        if (updatedValue === undefined) return;

        setConfirmDialog({
            open: true,
            title: "Review Changes",
            message: (
                <Box>
                    <Typography mb={1}>Are you sure you want to save changes to <b>{setting.key}</b>?</Typography>
                    <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50', fontSize: '0.875rem' }}>
                        <Box mb={1}><Typography variant="caption" color="text.secondary">OLD VALUE:</Typography><pre style={{ margin: 0, overflow: 'auto' }}>{JSON.stringify(setting.value, null, 4)}</pre></Box>
                        <Divider sx={{ my: 1 }} />
                        <Box><Typography variant="caption" color="primary">NEW VALUE:</Typography><pre style={{ margin: 0, overflow: 'auto' }}>{JSON.stringify(updatedValue, null, 4)}</pre></Box>
                    </Paper>
                </Box>
            ),
            action: async () => {
                setActionLoading(setting.id);
                try {
                    await api.put(`/admin/default-settings/${setting.id}`,
                        { value: updatedValue },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    toast.success("Setting updated successfully");
                    setExpandedId(null);
                    fetchSettings();
                } catch (err: any) {
                    toast.error(err.response?.data?.message || "Failed to update setting");
                } finally {
                    setActionLoading(null);
                }
            },
        });
    };

    const handleAddSetting = async () => {
        if (!newSetting.key) {
            toast.error("Key is required");
            return;
        }

        setActionLoading("add");
        try {
            let valueToSave = newSetting.value;

            // Pre-process values based on type if needed
            if ((newSetting.type === 'json' || newSetting.type === 'array') && typeof valueToSave === 'string' && valueToSave.trim() !== '') {
                try {
                    valueToSave = JSON.parse(valueToSave);
                } catch {
                    toast.error("Invalid JSON/Array format");
                    setActionLoading(null);
                    return;
                }
            } else if (newSetting.type === 'boolean') {
                valueToSave = typeof valueToSave === 'string' ? valueToSave === 'true' : !!valueToSave;
            } else if (newSetting.type === 'integer') {
                valueToSave = parseInt(valueToSave);
            } else if (newSetting.type === 'float') {
                valueToSave = parseFloat(valueToSave);
            }

            await api.post("/admin/default-settings", {
                ...newSetting,
                value: valueToSave
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success("Default setting added successfully");
            setIsAddDialogOpen(false);
            setNewSetting({
                key: "",
                type: "json",
                value: "",
                description: "",
                is_active: true,
            });
            fetchSettings();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add setting");
        } finally {
            setActionLoading(null);
        }
    };

    const handleJsonValueChange = (settingId: string, path: string[], newValue: any) => {
        setEditValues(prev => {
            const setting = settings.find(s => s.id === settingId);
            const rawVal = prev[settingId] !== undefined ? prev[settingId] : setting?.value;

            let currentVal;
            try {
                // If it's a string that should be an object, try parsing it
                if (typeof rawVal === 'string' && (setting?.type === 'json' || setting?.type === 'array')) {
                    currentVal = JSON.parse(rawVal);
                } else {
                    currentVal = JSON.parse(JSON.stringify(rawVal));
                }
            } catch {
                currentVal = rawVal;
            }

            if (path.length === 0) {
                return { ...prev, [settingId]: newValue };
            }

            // If we have a path but currentVal is not an object, we can't traverse
            if (typeof currentVal !== 'object' || currentVal === null) {
                return { ...prev, [settingId]: newValue };
            }

            // Update nested value
            let target = currentVal;
            for (let i = 0; i < path.length - 1; i++) {
                const key = path[i];
                if (target[key] === undefined || target[key] === null || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                target = target[key];
            }

            const lastKey = path[path.length - 1];
            if (lastKey !== undefined) {
                target[lastKey] = newValue;
            }

            return { ...prev, [settingId]: currentVal };
        });
    };

    const handleRawJsonChange = (settingId: string, value: string) => {
        setEditValues(prev => ({ ...prev, [settingId]: value }));

        // Try parsing to update the graphical view implicitly (since renderGraphicalEditor uses currentVal)
        // If it's valid JSON, it will be an object in next render. If invalid, it stays a string.
        try {
            JSON.parse(value);
        } catch {
            // Keep as string if invalid, graphical editor will handle it
        }
    };

    const filteredSettings = settings.filter(s =>
        s.key.toLowerCase().includes(searchInput.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchInput.toLowerCase()))
    );

    const renderGraphicalEditor = (settingId: string, val: any, path: string[] = []): React.ReactNode => {
        if (typeof val === 'boolean') {
            return (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 100 }}>{path[path.length - 1]}:</Typography>
                    <Switch
                        size="small"
                        checked={val}
                        onChange={(e) => handleJsonValueChange(settingId, path, e.target.checked)}
                    />
                </Stack>
            );
        }

        if (val !== null && typeof val === 'object') {
            return (
                <Box sx={{ pl: path.length > 0 ? 3 : 0, py: 0.5, borderLeft: path.length > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
                    {path.length > 0 && <Typography variant="caption" color="primary" fontWeight="bold" sx={{ display: 'block', mb: 1 }}>{path[path.length - 1].toUpperCase()}</Typography>}
                    <Grid container spacing={2}>
                        {Object.keys(val).map(key => {
                            const isLeaf = typeof val[key] === 'boolean' || typeof val[key] === 'string' || typeof val[key] === 'number';
                            return (
                                <Grid size={{ xs: 12, sm: isLeaf && path.length > 0 ? 6 : 12 }} key={key}>
                                    {renderGraphicalEditor(settingId, val[key], [...path, key])}
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>
            );
        }

        return (
            <Box sx={{ mb: 1 }}>
                <Typography variant="body2" mb={0.5} fontWeight={500}>{path[path.length - 1] || 'Value'}:</Typography>
                <TextField
                    fullWidth
                    size="small"
                    multiline={typeof val === 'string' && val.length > 50}
                    rows={typeof val === 'string' && val.length > 50 ? 3 : 1}
                    value={val ?? ""}
                    onChange={(e) => handleJsonValueChange(settingId, path, e.target.value)}
                />
            </Box>
        );
    };

    /** Expanded value editor, shared by the desktop Collapse row and the mobile card. */
    const renderEditorPanel = (setting: DefaultSetting) => {
        const isComplex = setting.type === 'json' || setting.type === 'array';
        const currentVal = editValues[setting.id] !== undefined ? editValues[setting.id] : setting.value;

        return (
            <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'action.hover', borderRadius: { xs: 1.5, sm: 2 }, my: 1 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} mb={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="subtitle2" color="primary" fontWeight="bold">EDIT VALUE</Typography>
                        {isComplex && (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption">RAW</Typography>
                                <Switch
                                    size="small"
                                    checked={(viewMode[setting.id] || 'graphical') === 'graphical'}
                                    onChange={(e) => {
                                        const isGraphical = e.target.checked;
                                        if (isGraphical) {
                                            // If switching to graphical, try to parse the string first
                                            try {
                                                if (typeof currentVal === 'string') {
                                                    const parsed = JSON.parse(currentVal);
                                                    setEditValues(prev => ({ ...prev, [setting.id]: parsed }));
                                                }
                                                setViewMode(prev => ({ ...prev, [setting.id]: 'graphical' }));
                                            } catch {
                                                toast.error("Cannot switch to graphical: Invalid JSON");
                                            }
                                        } else {
                                            // Switching to raw: stringify current object
                                            const stringified = typeof currentVal === 'object' ? JSON.stringify(currentVal, null, 4) : currentVal;
                                            setEditValues(prev => ({ ...prev, [setting.id]: stringified }));
                                            setViewMode(prev => ({ ...prev, [setting.id]: 'raw' }));
                                        }
                                    }}
                                />
                                <Typography variant="caption">GRAPHICAL</Typography>
                            </Stack>
                        )}
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        {isComplex && (viewMode[setting.id] || 'graphical') === 'raw' && (
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    try {
                                        const val = currentVal;
                                        const formatted = typeof val === 'string' ? JSON.stringify(JSON.parse(val), null, 4) : JSON.stringify(val, null, 4);
                                        setEditValues(prev => ({ ...prev, [setting.id]: formatted }));
                                        toast.success("JSON prettified");
                                    } catch {
                                        toast.error("Invalid JSON, cannot prettify");
                                    }
                                }}
                            >
                                Prettify
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<IconDeviceFloppy size={16} />}
                            onClick={() => handleSaveSetting(setting)}
                            disabled={actionLoading === setting.id || JSON.stringify(currentVal) === JSON.stringify(setting.value)}
                        >
                            Save Changes
                        </Button>
                    </Stack>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {isComplex ? (
                    (viewMode[setting.id] || 'graphical') === 'graphical' ? (
                        // GRAPHICAL MODE (Auto-handles object or string-that-can-be-object)
                        renderGraphicalEditor(setting.id, typeof currentVal === 'string' ? (() => { try { return JSON.parse(currentVal) } catch { return currentVal } })() : currentVal)
                    ) : (
                        // RAW MODE
                        <TextField
                            fullWidth
                            multiline
                            rows={15}
                            variant="outlined"
                            value={typeof currentVal === 'string' ? currentVal : JSON.stringify(currentVal, null, 4)}
                            onChange={(e) => handleRawJsonChange(setting.id, e.target.value)}
                            sx={{
                                '& .MuiInputBase-root': {
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem'
                                }
                            }}
                        />
                    )
                ) : setting.type === 'boolean' ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography>Value:</Typography>
                        <Switch
                            checked={!!currentVal}
                            onChange={(e) => setEditValues(prev => ({ ...prev, [setting.id]: e.target.checked }))}
                        />
                    </Stack>
                ) : (
                    <TextField
                        fullWidth
                        label="Value"
                        type={setting.type === 'integer' || setting.type === 'float' ? 'number' : 'text'}
                        value={currentVal ?? ""}
                        onChange={(e) => setEditValues(prev => ({ ...prev, [setting.id]: e.target.value }))}
                    />
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                spacing={{ xs: 1.5, sm: 2 }}
                sx={{ mb: { xs: 2, sm: 2.5 } }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 800,
                            fontSize: { xs: "1.5rem", sm: "1.85rem" },
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Default Settings
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" }, mt: 0.25 }}
                    >
                        Manage global platform configuration keys and values
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                    <Button
                        variant="contained"
                        startIcon={<IconPlus size={18} />}
                        onClick={() => setIsAddDialogOpen(true)}
                        sx={{ fontWeight: 600, textTransform: "none" }}
                    >
                        Add New
                    </Button>
                    <Tooltip title="Refresh">
                        <span>
                            <IconButton
                                onClick={fetchSettings}
                                disabled={loading}
                                sx={{ border: "1px solid", borderColor: "divider" }}
                            >
                                <IconRefresh size={20} />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Stack>
            </Stack>

            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: { xs: 2, sm: 2.5 },
                    border: "1px solid",
                    borderColor: "divider",
                }}
            >
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Search settings by key or description..."
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
                />
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper
                elevation={0}
                sx={{
                    borderRadius: { xs: 2, sm: 2.5 },
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                }}
            >
                {/* Mobile: expandable card list */}
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
                    ) : filteredSettings.length === 0 ? (
                        <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                            <IconSettings size={28} opacity={0.4} />
                            <Typography color="text.secondary">No settings found</Typography>
                        </Stack>
                    ) : (
                        filteredSettings.map((setting) => {
                            const isExpanded = expandedId === setting.id;
                            return (
                                <Box
                                    key={setting.id}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        p: 1.5,
                                        mb: 1.5,
                                        opacity: actionLoading === setting.id ? 0.5 : 1,
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                        <Box
                                            sx={{ minWidth: 0, cursor: "pointer" }}
                                            onClick={() => setExpandedId(isExpanded ? null : setting.id)}
                                        >
                                            <Typography variant="subtitle2" fontWeight={600} sx={{ fontFamily: "monospace" }}>
                                                {setting.key}
                                            </Typography>
                                            {setting.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {setting.description}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
                                            <Switch
                                                size="small"
                                                checked={setting.is_active}
                                                onChange={() => handleToggleActive(setting)}
                                                disabled={actionLoading === setting.id}
                                            />
                                            <IconButton size="small" onClick={() => setExpandedId(isExpanded ? null : setting.id)}>
                                                {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
                                        <Chip
                                            label={setting.type.toUpperCase()}
                                            size="small"
                                            variant="outlined"
                                            color={TYPE_TONES[setting.type] ?? "default"}
                                            sx={{ fontFamily: "monospace", fontSize: "0.68rem", fontWeight: 700 }}
                                        />
                                    </Stack>
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        {renderEditorPanel(setting)}
                                    </Collapse>
                                </Box>
                            );
                        })
                    )}
                </Box>

                {/* Desktop: expandable table */}
                <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell width={50} />
                            <TableCell>Key</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="center">Active</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [0, 1, 2, 3].map((i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6} sx={{ py: 1.75 }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Skeleton variant="circular" width={20} height={20} />
                                            <Skeleton variant="text" width="22%" />
                                            <Skeleton variant="rounded" width={64} height={22} />
                                            <Skeleton variant="text" width="32%" sx={{ display: { lg: "block", md: "none" } }} />
                                            <Skeleton variant="text" width="10%" />
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : filteredSettings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Stack alignItems="center" spacing={1}>
                                        <IconSettings size={28} opacity={0.4} />
                                        <Typography color="text.secondary">No settings found</Typography>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSettings.map((setting) => {
                                const isExpanded = expandedId === setting.id;
                                const isComplex = setting.type === 'json' || setting.type === 'array';

                                return (
                                    <React.Fragment key={setting.id}>
                                        <TableRow hover sx={{ '& > *': { borderBottom: 'unset' }, opacity: actionLoading === setting.id ? 0.5 : 1 }}>
                                            <TableCell>
                                                {isComplex && (
                                                    <IconButton size="small" onClick={() => setExpandedId(isExpanded ? null : setting.id)}>
                                                        {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={600} sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                                                    {setting.key}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={setting.type.toUpperCase()}
                                                    size="small"
                                                    variant="outlined"
                                                    color={TYPE_TONES[setting.type] ?? "default"}
                                                    sx={{ fontFamily: "monospace", fontSize: "0.68rem", fontWeight: 700 }}
                                                />
                                            </TableCell>
                                            <TableCell>{setting.description || "—"}</TableCell>
                                            <TableCell align="center">
                                                <Switch
                                                    size="small"
                                                    checked={setting.is_active}
                                                    onChange={() => handleToggleActive(setting)}
                                                    disabled={actionLoading === setting.id}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {!isComplex && (
                                                    <Tooltip title="Quick Edit">
                                                        <IconButton size="small" color="primary" onClick={() => setExpandedId(isExpanded ? null : setting.id)}>
                                                            <IconDeviceFloppy size={18} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>

                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                    {renderEditorPanel(setting)}
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                </TableContainer>
            </Paper>

            {permissionStructure && (
                <Box sx={{ mt: { xs: 4, sm: 5 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5} mb={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                            <Box
                                sx={{
                                    width: { xs: 36, sm: 42 },
                                    height: { xs: 36, sm: 42 },
                                    borderRadius: 2,
                                    bgcolor: (th) => `${th.palette.primary.main}18`,
                                    color: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <IconShield size={22} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
                                    Base Permission Structure
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', fontSize: { xs: '0.72rem', sm: '0.78rem' } }}
                                >
                                    Reference blueprint for project user type permissions
                                </Typography>
                            </Box>
                        </Stack>
                        <Chip
                            label="READ-ONLY"
                            size="small"
                            variant="outlined"
                            color="info"
                            sx={{ fontWeight: 600, fontSize: '0.68rem', letterSpacing: '0.05em', flexShrink: 0 }}
                        />
                    </Stack>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 1.5, sm: 2.5 },
                            borderRadius: { xs: 2, sm: 2.5 },
                            border: '1px solid',
                            borderColor: 'divider',
                            overflow: 'hidden',
                        }}
                    >
                        <JsonView
                            value={permissionStructure}
                            displayDataTypes={false}
                            displayObjectSize={true}
                            enableClipboard={true}
                            collapsed={2}
                        />
                    </Paper>
                </Box>
            )}

            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box component="span" sx={{ display: 'flex', color: 'primary.main' }}>
                        <IconAlertCircle size={22} />
                    </Box>
                    {confirmDialog.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText component="div">{confirmDialog.message}</DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))} color="inherit">Cancel</Button>
                    <Button onClick={async () => {
                        if (confirmDialog.action) await confirmDialog.action();
                        setConfirmDialog(prev => ({ ...prev, open: false }));
                    }} variant="contained">Confirm</Button>
                </DialogActions>
            </Dialog>

            {/* Add New Setting Dialog */}
            <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Add New Default Setting</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Setting Key"
                            placeholder="e.g. system_maintenance_mode"
                            required
                            value={newSetting.key}
                            onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel id="setting-type-label">Type</InputLabel>
                            <Select
                                id="setting-type-select"
                                labelId="setting-type-label"
                                label="Type"
                                value={newSetting.type}
                                onChange={(e) => setNewSetting({ ...newSetting, type: e.target.value as SettingType, value: e.target.value === 'boolean' ? false : "" })}
                            >
                                <MenuItem value="json">JSON</MenuItem>
                                <MenuItem value="array">Array</MenuItem>
                                <MenuItem value="boolean">Boolean</MenuItem>
                                <MenuItem value="integer">Integer</MenuItem>
                                <MenuItem value="float">Float</MenuItem>
                            </Select>
                        </FormControl>

                        {newSetting.type === 'boolean' ? (
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography>Value:</Typography>
                                <Switch
                                    id="setting-value-switch"
                                    checked={newSetting.value === true}
                                    onChange={(e) => setNewSetting({ ...newSetting, value: e.target.checked })}
                                />
                                <Typography variant="body2">{newSetting.value ? 'True' : 'False'}</Typography>
                            </Stack>
                        ) : (
                            <TextField
                                id="setting-value-input"
                                fullWidth
                                multiline={newSetting.type === 'json' || newSetting.type === 'array'}
                                rows={newSetting.type === 'json' || newSetting.type === 'array' ? 6 : 1}
                                label="Value"
                                placeholder={newSetting.type === 'json' ? '{"key": "value"}' : newSetting.type === 'array' ? '["item1", "item2"]' : 'Value'}
                                value={newSetting.value}
                                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                                sx={newSetting.type === 'json' || newSetting.type === 'array' ? {
                                    '& .MuiInputBase-root': {
                                        fontFamily: 'monospace',
                                    }
                                } : {}}
                            />
                        )}

                        <TextField
                            id="setting-description-input"
                            fullWidth
                            label="Description"
                            placeholder="What is this setting for?"
                            multiline
                            rows={2}
                            value={newSetting.description}
                            onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                        />

                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography>Active State:</Typography>
                            <Switch
                                id="setting-status-switch"
                                checked={newSetting.is_active}
                                onChange={(e) => setNewSetting({ ...newSetting, is_active: e.target.checked })}
                            />
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setIsAddDialogOpen(false)} color="inherit">Cancel</Button>
                    <Button
                        id="create-setting-submit"
                        onClick={handleAddSetting}
                        variant="contained"
                        disabled={actionLoading === 'add'}
                        startIcon={actionLoading === 'add' ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={18} />}
                    >
                        Create Setting
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
