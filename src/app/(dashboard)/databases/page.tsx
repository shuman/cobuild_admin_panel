"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  IconDatabaseImport,
  IconLeaf,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
} from "@tabler/icons-react";
import api from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PgOverview {
  database: { name: string; size_pretty: string; pg_version: string; started_at: string; uptime: string; uptime_seconds: number };
  cache: { cache_hit_ratio: string; health: string; heap_hits: number; heap_reads: number };
  connections: { total: number; active: number; idle: number; idle_in_transaction: number; waiting_for_lock: number; max_connections: number; usage_percent: number };
  transactions: { committed: number; rolled_back: number; tup_inserted: number; tup_updated: number; tup_deleted: number; tup_fetched: number };
}

interface PgTable {
  schemaname: string; tablename: string; total_size: string; table_size: string;
  indexes_size: string; row_estimate: number;
}
interface PgDeadTuple {
  schemaname: string; table_name: string; dead_tuples: number; live_tuples: number;
  dead_ratio_percent: number; last_autovacuum: string | null; last_vacuum: string | null;
}
interface PgTablesData {
  summary: { table_count: number; total_size: string; high_bloat_tables: number };
  largest_tables: PgTable[];
  dead_tuples: PgDeadTuple[];
}

interface PgSlowQuery {
  query_preview: string; calls: number; avg_ms: number; total_ms: number;
  min_ms: number; max_ms: number; cache_hit_ratio: number | null; blks_read: number;
}
interface PgLongQuery {
  pid: number; duration: string; duration_seconds: number; query_preview: string;
  state: string; wait_event_type: string | null; username: string; application_name: string;
}
interface PgLockWait {
  blocked_pid: number; blocked_user: string; blocked_query: string;
  blocking_pid: number; blocking_user: string; waiting_seconds: number;
}
interface PgQueriesData {
  slow_queries: PgSlowQuery[];
  pg_stat_statements_available: boolean;
  pg_stat_statements_note?: string;
  long_running_queries: PgLongQuery[];
  lock_waits: PgLockWait[];
}

interface PgIndex {
  schemaname: string; table_name: string; index_name: string; scans: number;
  index_size: string; is_unique: boolean; is_primary: boolean;
}
interface PgIndexesData {
  summary: { total_indexes: number; total_index_size: string; unused_count: number };
  index_usage: PgIndex[];
  unused_indexes: PgIndex[];
}

interface MgOverview {
  database: { name: string; size_pretty: string; storage_size: string; index_size: string; total_size: string; collection_count: number; index_count: number; object_count: number; version: string };
  connections: { current: number; available: number; total_created: number; usage_percent: number } | null;
  cache: { cache_hit_ratio: string; health: string; bytes_in_cache: string; max_cache_bytes: string; dirty_bytes: string } | null;
  network: { bytes_in: string; bytes_out: string; requests_in: number } | null;
}

interface MgCollection {
  name: string; count: number; size_pretty: string; storage_size: string;
  avg_obj_size: string; index_count: number; index_size: string; total_size: string; capped: boolean;
}
interface MgCollectionsData {
  collection_count: number;
  top_10_largest: MgCollection[];
  all_collections: MgCollection[];
}

interface MgOperation {
  opid: string; type: string; namespace: string; operation: string; secs_running: number;
  waiting_for_lock: boolean; client: string; desc: string; command_preview: string | null;
}
interface MgOpcounters { insert: number; query: number; update: number; delete: number; getmore: number; command: number }
interface MgOpsData {
  active_ops_count: number;
  active_operations: MgOperation[];
  long_running_ops: MgOperation[];
  waiting_for_lock: MgOperation[];
  opcounters: MgOpcounters | null;
}

interface MgIndexEntry { collection: string; index_name: string; ops: number; since: string | null; key_spec: Record<string, number> }
interface MgIndexesData {
  summary: { total_indexes: number; unused_count: number };
  top_used_indexes: MgIndexEntry[];
  unused_indexes: MgIndexEntry[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

function healthColor(health: string | undefined): "success" | "warning" | "error" | "default" {
  if (health === "excellent" || health === "good") return "success";
  if (health === "needs_attention") return "warning";
  return "default";
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Paper>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>{children}</Typography>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} align="center">
        <Typography variant="body2" color="text.secondary" py={1}>No data</Typography>
      </TableCell>
    </TableRow>
  );
}

function useAdminFetch<T>(path: string, token: string | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    api
      .get<{ items: T }>(path, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setData(res.data.items))
      .catch((e) => setError(e.response?.data?.error ?? e.response?.data?.message ?? e.message ?? "Error"))
      .finally(() => setLoading(false));
  }, [path, token]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

// ─── PostgreSQL Sub-pages ────────────────────────────────────────────────────

function PgOverviewTab({ token }: { token: string }) {
  const { data, loading, error, reload } = useAdminFetch<PgOverview>("/admin/database/postgres/overview", token);

  if (loading) return <Box py={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const { database: db, cache, connections: conn, transactions: tx } = data;

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Tooltip title="Refresh"><IconButton size="small" onClick={reload}><IconRefresh size={16} /></IconButton></Tooltip>
      </Box>

      <SectionHeading>Database</SectionHeading>
      <Grid container spacing={2}>
        {[
          { label: "Name", value: db.name },
          { label: "Size", value: db.size_pretty },
          { label: "Uptime", value: db.uptime },
          { label: "Version", value: db.pg_version.split(" ").slice(0, 2).join(" ") },
        ].map((s) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={s.label}>
            <StatCard label={s.label} value={s.value} />
          </Grid>
        ))}
      </Grid>

      <SectionHeading>Cache</SectionHeading>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Cache Hit Ratio"
            value={
              <Chip size="small" label={cache.cache_hit_ratio} color={healthColor(cache.health)} />
            }
            sub={cache.health?.replace("_", " ")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label="Heap Hits" value={fmt(cache.heap_hits)} /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard label="Heap Reads" value={fmt(cache.heap_reads)} /></Grid>
      </Grid>

      <SectionHeading>Connections</SectionHeading>
      <Grid container spacing={2}>
        {[
          { label: "Total", value: fmt(conn.total) },
          { label: "Active", value: fmt(conn.active) },
          { label: "Idle", value: fmt(conn.idle) },
          { label: "Idle in Txn", value: fmt(conn.idle_in_transaction) },
          { label: "Waiting for Lock", value: fmt(conn.waiting_for_lock) },
          { label: "Max Connections", value: fmt(conn.max_connections) },
          { label: "Usage", value: `${conn.usage_percent}%` },
        ].map((s) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={s.label}>
            <StatCard label={s.label} value={s.value} />
          </Grid>
        ))}
      </Grid>

      <SectionHeading>Transactions</SectionHeading>
      <Grid container spacing={2}>
        {[
          { label: "Committed", value: fmt(tx.committed) },
          { label: "Rolled Back", value: fmt(tx.rolled_back) },
          { label: "Tuples Inserted", value: fmt(tx.tup_inserted) },
          { label: "Tuples Updated", value: fmt(tx.tup_updated) },
          { label: "Tuples Deleted", value: fmt(tx.tup_deleted) },
          { label: "Tuples Fetched", value: fmt(tx.tup_fetched) },
        ].map((s) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={s.label}>
            <StatCard label={s.label} value={s.value} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function PgTablesTab({ token }: { token: string }) {
  const { data, loading, error, reload } = useAdminFetch<PgTablesData>("/admin/database/postgres/tables", token);

  if (loading) return <Box py={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Tooltip title="Refresh"><IconButton size="small" onClick={reload}><IconRefresh size={16} /></IconButton></Tooltip>
      </Box>

      <SectionHeading>Summary</SectionHeading>
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 6, sm: 4 }}><StatCard label="Total Tables" value={fmt(data.summary.table_count)} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}><StatCard label="Total Size" value={data.summary.total_size} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatCard
            label="High Bloat Tables"
            value={
              <Chip size="small" label={data.summary.high_bloat_tables} color={data.summary.high_bloat_tables > 0 ? "warning" : "success"} />
            }
          />
        </Grid>
      </Grid>

      <SectionHeading>Top 10 Largest Tables</SectionHeading>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Schema</TableCell>
              <TableCell>Table</TableCell>
              <TableCell align="right">Total Size</TableCell>
              <TableCell align="right">Table Size</TableCell>
              <TableCell align="right">Index Size</TableCell>
              <TableCell align="right">~Rows</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.largest_tables.length === 0 ? <EmptyRow cols={6} /> : data.largest_tables.map((t, i) => (
              <TableRow key={i}>
                <TableCell>{t.schemaname}</TableCell>
                <TableCell>{t.tablename}</TableCell>
                <TableCell align="right">{t.total_size}</TableCell>
                <TableCell align="right">{t.table_size}</TableCell>
                <TableCell align="right">{t.indexes_size}</TableCell>
                <TableCell align="right">{fmt(t.row_estimate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <SectionHeading>Dead Tuples (Bloat)</SectionHeading>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Table</TableCell>
              <TableCell align="right">Dead Tuples</TableCell>
              <TableCell align="right">Live Tuples</TableCell>
              <TableCell align="right">Dead %</TableCell>
              <TableCell>Last Autovacuum</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.dead_tuples.length === 0 ? <EmptyRow cols={5} /> : data.dead_tuples.map((t, i) => (
              <TableRow key={i}>
                <TableCell>{t.table_name}</TableCell>
                <TableCell align="right">{fmt(t.dead_tuples)}</TableCell>
                <TableCell align="right">{fmt(t.live_tuples)}</TableCell>
                <TableCell align="right">
                  <Chip
                    size="small"
                    label={`${t.dead_ratio_percent}%`}
                    color={t.dead_ratio_percent > 10 ? "warning" : t.dead_ratio_percent > 0 ? "default" : "success"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{t.last_autovacuum ? new Date(t.last_autovacuum).toLocaleString() : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function PgQueriesTab({ token }: { token: string }) {
  const { data, loading, error, reload } = useAdminFetch<PgQueriesData>("/admin/database/postgres/queries", token);

  if (loading) return <Box py={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Tooltip title="Refresh"><IconButton size="small" onClick={reload}><IconRefresh size={16} /></IconButton></Tooltip>
      </Box>

      {!data.pg_stat_statements_available && (
        <Alert severity="info" sx={{ mb: 2 }}>{data.pg_stat_statements_note}</Alert>
      )}

      <SectionHeading>Slow Queries (pg_stat_statements)</SectionHeading>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Query</TableCell>
              <TableCell align="right">Calls</TableCell>
              <TableCell align="right">Avg (ms)</TableCell>
              <TableCell align="right">Total (ms)</TableCell>
              <TableCell align="right">Max (ms)</TableCell>
              <TableCell align="right">Cache %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slow_queries.length === 0 ? <EmptyRow cols={6} /> : data.slow_queries.map((q, i) => (
              <TableRow key={i}>
                <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Tooltip title={q.query_preview}><span>{q.query_preview}</span></Tooltip>
                </TableCell>
                <TableCell align="right">{fmt(q.calls)}</TableCell>
                <TableCell align="right"><Chip size="small" label={`${q.avg_ms}`} color={q.avg_ms > 100 ? "warning" : "default"} variant="outlined" /></TableCell>
                <TableCell align="right">{fmt(q.total_ms)}</TableCell>
                <TableCell align="right">{fmt(q.max_ms)}</TableCell>
                <TableCell align="right">{q.cache_hit_ratio != null ? `${q.cache_hit_ratio}%` : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <SectionHeading>Long-Running Queries</SectionHeading>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>PID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Query</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.long_running_queries.length === 0 ? <EmptyRow cols={5} /> : data.long_running_queries.map((q, i) => (
              <TableRow key={i}>
                <TableCell>{q.pid}</TableCell>
                <TableCell>{q.username}</TableCell>
                <TableCell><Chip size="small" label={`${q.duration_seconds}s`} color={q.duration_seconds > 30 ? "error" : q.duration_seconds > 5 ? "warning" : "default"} variant="outlined" /></TableCell>
                <TableCell>{q.state}</TableCell>
                <TableCell sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Tooltip title={q.query_preview}><span>{q.query_preview}</span></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <SectionHeading>Lock Waits</SectionHeading>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Blocked PID</TableCell>
              <TableCell>Blocked User</TableCell>
              <TableCell>Blocking PID</TableCell>
              <TableCell>Blocking User</TableCell>
              <TableCell align="right">Waiting (s)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.lock_waits.length === 0 ? <EmptyRow cols={5} /> : data.lock_waits.map((l, i) => (
              <TableRow key={i}>
                <TableCell>{l.blocked_pid}</TableCell>
                <TableCell>{l.blocked_user}</TableCell>
                <TableCell>{l.blocking_pid}</TableCell>
                <TableCell>{l.blocking_user}</TableCell>
                <TableCell align="right">{l.waiting_seconds}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function PgIndexesTab({ token }: { token: string }) {
  const { data, loading, error, reload } = useAdminFetch<PgIndexesData>("/admin/database/postgres/indexes", token);

  if (loading) return <Box py={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Tooltip title="Refresh"><IconButton size="small" onClick={reload}><IconRefresh size={16} /></IconButton></Tooltip>
      </Box>

      <SectionHeading>Summary</SectionHeading>
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 6, sm: 4 }}><StatCard label="Total Indexes" value={fmt(data.summary.total_indexes)} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}><StatCard label="Total Index Size" value={data.summary.total_index_size} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatCard label="Unused Indexes" value={
            <Chip size="small" label={data.summary.unused_count} color={data.summary.unused_count > 0 ? "warning" : "success"} />
          } />
        </Grid>
      </Grid>

      <SectionHeading>Index Usage (Top 30)</SectionHeading>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Table</TableCell>
              <TableCell>Index</TableCell>
              <TableCell align="right">Scans</TableCell>
              <TableCell align="right">Size</TableCell>
              <TableCell>Flags</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.index_usage.length === 0 ? <EmptyRow cols={5} /> : data.index_usage.map((idx, i) => (
              <TableRow key={i}>
                <TableCell>{idx.table_name}</TableCell>
                <TableCell sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{idx.index_name}</TableCell>
                <TableCell align="right">{fmt(idx.scans)}</TableCell>
                <TableCell align="right">{idx.index_size}</TableCell>
                <TableCell>
                  {idx.is_primary && <Chip size="small" label="PK" color="primary" sx={{ mr: 0.5 }} />}
                  {idx.is_unique && <Chip size="small" label="Unique" variant="outlined" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {data.unused_indexes.length > 0 && (
        <>
          <SectionHeading>Unused Indexes</SectionHeading>
          <Alert severity="warning" sx={{ mb: 1 }}>
            These indexes have never been scanned. Consider dropping them to reduce write overhead.
          </Alert>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Table</TableCell>
                  <TableCell>Index</TableCell>
                  <TableCell align="right">Size</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.unused_indexes.map((idx, i) => (
                  <TableRow key={i}>
                    <TableCell>{idx.table_name}</TableCell>
                    <TableCell>{idx.index_name}</TableCell>
                    <TableCell align="right">{idx.index_size}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

// ─── MongoDB Sub-pages ───────────────────────────────────────────────────────

function MgOverviewTab({ token }: { token: string }) {
  const { data, loading, error, reload } = useAdminFetch<MgOverview>("/admin/database/mongodb/overview", token);

  if (loading) return <Box py={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const { database: db, connections, cache, network } = data;

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Tooltip title="Refresh"><IconButton size="small" onClick={reload}><IconRefresh size={16} /></IconButton></Tooltip>
      </Box>

      <SectionHeading>Database</SectionHeading>
      <Grid container spacing={2}>
        {[
          { label: "Name", value: db.name },
          { label: "Data Size", value: db.size_pretty },
          { label: "Storage Size", value: db.storage_size },
          { label: "Index Size", value: db.index_size },
          { label: "Total Size", value: db.total_size },
          { label: "Collections", value: fmt(db.collection_count) },
          { label: "Indexes", value: fmt(db.index_count) },
          { label: "Objects", value: fmt(db.object_count) },
          { label: "Version", value: db.version },
        ].map((s) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={s.label}>
            <StatCard label={s.label} value={s.value} />
          </Grid>
        ))}
      </Grid>

      {connections && (
        <>
          <SectionHeading>Connections</SectionHeading>
          <Grid container spacing={2}>
            {[
              { label: "Current", value: fmt(connections.current) },
              { label: "Available", value: fmt(connections.available) },
              { label: "Total Created", value: fmt(connections.total_created) },
              { label: "Usage", value: `${connections.usage_percent}%` },
            ].map((s) => (
              <Grid size={{ xs: 6, sm: 3 }} key={s.label}><StatCard label={s.label} value={s.value} /></Grid>
            ))}
          </Grid>
        </>
      )}

      {cache && (
        <>
          <SectionHeading>WiredTiger Cache</SectionHeading>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <StatCard label="Cache Hit Ratio" value={
                <Chip size="small" label={cache.cache_hit_ratio} color={healthColor(cache.health)} />
              } sub={cache.health?.replace("_", " ")} />
            </Grid>
            {[
              { label: "In Cache", value: cache.bytes_in_cache },
              { label: "Max Cache", value: cache.max_cache_bytes },
              { label: "Dirty Bytes", value: cache.dirty_bytes },
            ].map((s) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={s.label}><StatCard label={s.label} value={s.value} /></Grid>
            ))}
          </Grid>
        </>
      )}

      {network && (
        <>
          <SectionHeading>Network</SectionHeading>
          <Grid container spacing={2}>
            {[
              { label: "Bytes In", value: network.bytes_in },
              { label: "Bytes Out", value: network.bytes_out },
              { label: "Requests", value: fmt(network.requests_in) },
            ].map((s) => (
              <Grid size={{ xs: 6, sm: 4 }} key={s.label}><StatCard label={s.label} value={s.value} /></Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}

function MgCollectionsTab({ token }: { token: string }) {
  const { data, loading, error, reload } = useAdminFetch<MgCollectionsData>("/admin/database/mongodb/collections", token);

  if (loading) return <Box py={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Tooltip title="Refresh"><IconButton size="small" onClick={reload}><IconRefresh size={16} /></IconButton></Tooltip>
      </Box>

      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 6 }}><StatCard label="Total Collections" value={fmt(data.collection_count)} /></Grid>
      </Grid>

      <SectionHeading>Top 10 Largest Collections</SectionHeading>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Collection</TableCell>
              <TableCell align="right">Documents</TableCell>
              <TableCell align="right">Data Size</TableCell>
              <TableCell align="right">Storage</TableCell>
              <TableCell align="right">Index Size</TableCell>
              <TableCell align="right">Total Size</TableCell>
              <TableCell>Capped</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.top_10_largest.length === 0 ? <EmptyRow cols={7} /> : data.top_10_largest.map((c, i) => (
              <TableRow key={i}>
                <TableCell>{c.name}</TableCell>
                <TableCell align="right">{fmt(c.count)}</TableCell>
                <TableCell align="right">{c.size_pretty}</TableCell>
                <TableCell align="right">{c.storage_size}</TableCell>
                <TableCell align="right">{c.index_size}</TableCell>
                <TableCell align="right">{c.total_size}</TableCell>
                <TableCell>{c.capped ? <Chip size="small" label="Yes" /> : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <SectionHeading>All Collections ({data.collection_count})</SectionHeading>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Collection</TableCell>
              <TableCell align="right">Documents</TableCell>
              <TableCell align="right">Data Size</TableCell>
              <TableCell align="right">Total Size</TableCell>
              <TableCell align="right">Indexes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.all_collections.length === 0 ? <EmptyRow cols={5} /> : data.all_collections.map((c, i) => (
              <TableRow key={i}>
                <TableCell>{c.name}</TableCell>
                <TableCell align="right">{fmt(c.count)}</TableCell>
                <TableCell align="right">{c.size_pretty}</TableCell>
                <TableCell align="right">{c.total_size}</TableCell>
                <TableCell align="right">{c.index_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function MgOperationsTab({ token }: { token: string }) {
  const { data, loading, error, reload } = useAdminFetch<MgOpsData>("/admin/database/mongodb/operations", token);

  if (loading) return <Box py={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Tooltip title="Refresh"><IconButton size="small" onClick={reload}><IconRefresh size={16} /></IconButton></Tooltip>
      </Box>

      {data.opcounters && (
        <>
          <SectionHeading>Opcounters (since restart)</SectionHeading>
          <Grid container spacing={2} mb={2}>
            {Object.entries(data.opcounters).map(([k, v]) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={k}>
                <StatCard label={k.charAt(0).toUpperCase() + k.slice(1)} value={fmt(v as number)} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <SectionHeading>Active Operations ({data.active_ops_count})</SectionHeading>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>OpID</TableCell>
              <TableCell>Operation</TableCell>
              <TableCell>Namespace</TableCell>
              <TableCell align="right">Running (s)</TableCell>
              <TableCell>Lock Wait</TableCell>
              <TableCell>Client</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.active_operations.length === 0 ? <EmptyRow cols={6} /> : data.active_operations.map((op, i) => (
              <TableRow key={i}>
                <TableCell>{op.opid}</TableCell>
                <TableCell>{op.operation}</TableCell>
                <TableCell>{op.namespace || "—"}</TableCell>
                <TableCell align="right">
                  <Chip size="small" label={op.secs_running} color={op.secs_running > 5 ? "warning" : "default"} variant="outlined" />
                </TableCell>
                <TableCell>
                  {op.waiting_for_lock ? <Chip size="small" label="Yes" color="error" /> : <IconCheck size={14} color="green" />}
                </TableCell>
                <TableCell>{op.client || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {data.waiting_for_lock.length > 0 && (
        <>
          <Alert severity="warning" icon={<IconAlertTriangle size={16} />} sx={{ mb: 1 }}>
            {data.waiting_for_lock.length} operation(s) waiting for lock
          </Alert>
        </>
      )}
    </Box>
  );
}

function MgIndexesTab({ token }: { token: string }) {
  const { data, loading, error, reload } = useAdminFetch<MgIndexesData>("/admin/database/mongodb/indexes", token);

  if (loading) return <Box py={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Tooltip title="Refresh"><IconButton size="small" onClick={reload}><IconRefresh size={16} /></IconButton></Tooltip>
      </Box>

      <SectionHeading>Summary</SectionHeading>
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 6, sm: 4 }}><StatCard label="Total Indexes" value={fmt(data.summary.total_indexes)} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatCard label="Unused Indexes" value={
            <Chip size="small" label={data.summary.unused_count} color={data.summary.unused_count > 0 ? "warning" : "success"} />
          } />
        </Grid>
      </Grid>

      <SectionHeading>Top Used Indexes</SectionHeading>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Collection</TableCell>
              <TableCell>Index</TableCell>
              <TableCell align="right">Ops</TableCell>
              <TableCell>Key Spec</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.top_used_indexes.length === 0 ? <EmptyRow cols={4} /> : data.top_used_indexes.map((idx, i) => (
              <TableRow key={i}>
                <TableCell>{idx.collection}</TableCell>
                <TableCell>{idx.index_name}</TableCell>
                <TableCell align="right">{fmt(idx.ops)}</TableCell>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>
                  {JSON.stringify(idx.key_spec)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {data.unused_indexes.length > 0 && (
        <>
          <SectionHeading>Unused Indexes</SectionHeading>
          <Alert severity="warning" sx={{ mb: 1 }}>
            These indexes have never been accessed. Consider dropping them to save space and reduce write overhead.
          </Alert>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Collection</TableCell>
                  <TableCell>Index</TableCell>
                  <TableCell>Key Spec</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.unused_indexes.map((idx, i) => (
                  <TableRow key={i}>
                    <TableCell>{idx.collection}</TableCell>
                    <TableCell>{idx.index_name}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>{JSON.stringify(idx.key_spec)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const PG_TABS = ["Overview", "Tables", "Queries", "Indexes"] as const;
const MG_TABS = ["Overview", "Collections", "Operations", "Indexes"] as const;

export default function DatabasesPage() {
  const { data: session } = useSession();
  const token = (session as any)?.apiToken as string | undefined;

  const [dbTab, setDbTab] = useState(0);   // 0 = PostgreSQL, 1 = MongoDB
  const [pgTab, setPgTab] = useState(0);
  const [mgTab, setMgTab] = useState(0);

  if (!token) {
    return (
      <Box py={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <IconDatabaseImport size={28} />
        <Typography variant="h5" fontWeight={700}>Database Metrics</Typography>
      </Box>

      {/* Database selector */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={dbTab}
          onChange={(_, v) => setDbTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <IconDatabaseImport size={16} />
                PostgreSQL
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <IconLeaf size={16} />
                MongoDB
              </Box>
            }
          />
        </Tabs>

        {/* PostgreSQL */}
        {dbTab === 0 && (
          <Box p={2}>
            <Tabs
              value={pgTab}
              onChange={(_, v) => setPgTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
            >
              {PG_TABS.map((t) => <Tab key={t} label={t} />)}
            </Tabs>
            {pgTab === 0 && <PgOverviewTab token={token} />}
            {pgTab === 1 && <PgTablesTab token={token} />}
            {pgTab === 2 && <PgQueriesTab token={token} />}
            {pgTab === 3 && <PgIndexesTab token={token} />}
          </Box>
        )}

        {/* MongoDB */}
        {dbTab === 1 && (
          <Box p={2}>
            <Tabs
              value={mgTab}
              onChange={(_, v) => setMgTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
            >
              {MG_TABS.map((t) => <Tab key={t} label={t} />)}
            </Tabs>
            {mgTab === 0 && <MgOverviewTab token={token} />}
            {mgTab === 1 && <MgCollectionsTab token={token} />}
            {mgTab === 2 && <MgOperationsTab token={token} />}
            {mgTab === 3 && <MgIndexesTab token={token} />}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
