"use client";

import React, { useState } from "react";
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
  Divider,
  Stack,
  Alert,
  Tab,
  Tabs,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  IconChevronDown,
  IconBrandWebflow,
  IconBolt,
  IconLock,
  IconCode,
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconInfoCircle,
} from "@tabler/icons-react";
import DashboardCard from "@/components/shared/DashboardCard";

// ─── Types ──────────────────────────────────────────────────────────────────

interface EventPayloadField {
  name: string;
  type: string;
  nullable?: boolean;
  description: string;
}

interface WsEvent {
  id: string;
  broadcastAs: string;
  phpClass: string;
  channels: string[];
  channelType: "private" | "public";
  trigger: string;
  description: string;
  payload: EventPayloadField[];
  frontendListener: string;
  phpCode: string;
  notes?: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const WS_EVENTS: WsEvent[] = [
  {
    id: "permission-updated",
    broadcastAs: "PermissionUpdated",
    phpClass: "App\\Events\\PermissionUpdated",
    channels: ["project.{projectId}", "user.{userId}"],
    channelType: "private",
    trigger: "POST /api/project_user/manage_permissions",
    description:
      "Fired whenever a project user's permissions are explicitly saved from the Project Users page. Also fired by role group operations (create, update, delete, assign, unassign). The affected client fetches fresh permissions from the API without requiring a re-login.",
    payload: [
      { name: "project_id", type: "string (UUID)", description: "The project the permission change belongs to." },
      { name: "user_id", type: "string (UUID)", nullable: true, description: "Specific user affected. null when a role group itself changes (affects all assigned users)." },
      { name: "role_group_id", type: "string (UUID)", nullable: true, description: "Role group affected (if relevant)." },
      {
        name: "action",
        type: "string",
        description:
          "One of: permissions_updated | role_group_created | role_group_updated | role_group_deleted | user_assigned | user_unassigned | ownership_transferred",
      },
      { name: "timestamp", type: "ISO 8601 string", description: "Server time the event was dispatched." },
    ],
    frontendListener: `// PermissionContext.js — already wired globally
const echo = getEcho()
const projectChannel = echo.private(\`project.\${projectId}\`)
const userChannel    = echo.private(\`user.\${user.id}\`)

// Both naming formats are listened to for compatibility
projectChannel.listen('PermissionUpdated', handlePermissionUpdatedEvent)
projectChannel.listen('.PermissionUpdated', handlePermissionUpdatedEvent)

userChannel.listen('PermissionUpdated', (event) => {
  if (event.project_id === projectId) refreshPermissions()
})

// refreshPermissions() fetches POST /api/permissions/project/{id}
// and updates localStorage + React state immediately`,
    phpCode: `// app/Events/PermissionUpdated.php
class PermissionUpdated implements ShouldBroadcastNow
{
    public function __construct(
        public string  $projectId,
        public ?string $userId      = null,
        public ?string $roleGroupId = null,
        public string  $action      = 'updated',
    ) {}

    public function broadcastOn(): array
    {
        $channels = [new PrivateChannel('project.' . $this->projectId)];
        if ($this->userId) {
            $channels[] = new PrivateChannel('user.' . $this->userId);
        }
        return $channels;
    }

    public function broadcastAs(): string { return 'PermissionUpdated'; }

    public function broadcastWith(): array
    {
        return [
            'project_id'    => $this->projectId,
            'user_id'       => $this->userId,
            'role_group_id' => $this->roleGroupId,
            'action'        => $this->action,
            'timestamp'     => now()->toISOString(),
        ];
    }
}

// Dispatch example (ProjectUserController)
broadcast(new PermissionUpdated(
    (string) $project_id,
    (string) $projectUser->user_id,
    null,
    'permissions_updated'
));`,
    notes:
      "Uses ShouldBroadcastNow (synchronous, no queue). Broadcast is wrapped in a try/catch so a Reverb outage does NOT break the API response. The project channel also receives the event so admins logged in as another user on the same project see changes immediately.",
  },
  {
    id: "channel-message-sent",
    broadcastAs: "message.sent",
    phpClass: "App\\Events\\ChannelMessageSent",
    channels: ["messaging.channel.{channelId}"],
    channelType: "private",
    trigger: "POST /api/message (MessageController)",
    description:
      "Fired when a user sends a message to a group messaging channel. Only members of that channel receive the event.",
    payload: [
      {
        name: "message.id",
        type: "string (UUID)",
        description: "Unique ID of the new message.",
      },
      { name: "message.channel_id", type: "string (UUID)", description: "Channel the message belongs to." },
      { name: "message.user_id", type: "string (UUID)", description: "Sender's user ID." },
      { name: "message.body", type: "string", description: "Message text content." },
      { name: "message.created_at", type: "ISO 8601 string", description: "Server-side creation timestamp." },
      { name: "message.user.id", type: "string (UUID)", description: "Sender's user record." },
      { name: "message.user.name", type: "string", description: "Sender's display name." },
      { name: "message.user.email", type: "string", description: "Sender's email." },
      { name: "message.user.photo_path", type: "string | null", nullable: true, description: "Sender's avatar URL." },
    ],
    frontendListener: `// Messaging.js
const instance = echo.private(\`messaging.channel.\${channelId}\`)

instance.listen('.message.sent', (e) => {
  setMessages((prev) => [...prev, e.message])
})

// Cleanup
return () => { echo.leave(\`messaging.channel.\${channelId}\`) }`,
    phpCode: `// app/Events/ChannelMessageSent.php
class ChannelMessageSent implements ShouldBroadcastNow
{
    public function __construct(public MessagingMessage $message) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('messaging.channel.' . $this->message->channel_id)];
    }

    public function broadcastAs(): string { return 'message.sent'; }

    public function broadcastWith(): array
    {
        $this->message->load(['user:id,name,email,photo_path']);
        $user = $this->message->user;
        return [
            'message' => [
                'id'         => $this->message->id,
                'channel_id' => $this->message->channel_id,
                'user_id'    => $this->message->user_id,
                'body'       => $this->message->body,
                'created_at' => $this->message->created_at,
                'user'       => $user ? ['id' => $user->id, 'name' => $user->name, ...] : null,
            ],
        ];
    }
}

// Dispatch (MessageController)
broadcast(new ChannelMessageSent($message));`,
    notes:
      "Payload is explicitly constructed (not toArray()) to stay well below Reverb/Pusher's 10 KB per-message limit. The dot prefix (.message.sent) on the frontend is required because broadcastAs() returns a custom name.",
  },
  {
    id: "direct-message-sent",
    broadcastAs: "message.sent",
    phpClass: "App\\Events\\DirectMessageSent",
    channels: ["messaging.direct.{conversationId}"],
    channelType: "private",
    trigger: "POST /api/direct-message (DirectMessageController)",
    description:
      "Fired when a user sends a direct message to another user. Only the two participants of that conversation receive the event.",
    payload: [
      { name: "message.id", type: "string (UUID)", description: "Unique ID of the direct message." },
      { name: "message.conversation_id", type: "string (UUID)", description: "Private conversation ID." },
      { name: "message.sender_id", type: "string (UUID)", description: "Sender's user ID." },
      { name: "message.recipient_id", type: "string (UUID)", description: "Recipient's user ID." },
      { name: "message.body", type: "string", description: "Message text content." },
      { name: "message.is_read", type: "boolean", description: "Whether the recipient has read it." },
      { name: "message.read_at", type: "ISO 8601 string | null", nullable: true, description: "When it was read." },
      { name: "message.sender.id / name / email / photo_path", type: "object", description: "Sender user data." },
    ],
    frontendListener: `// Messaging.js
const instance = echo.private(\`messaging.direct.\${conversationId}\`)

instance.listen('.message.sent', (e) => {
  setMessages((prev) => [...prev, e.message])
})

// Cleanup
return () => { echo.leave(\`messaging.direct.\${conversationId}\`) }`,
    phpCode: `// app/Events/DirectMessageSent.php
class DirectMessageSent implements ShouldBroadcastNow
{
    public function __construct(public DirectMessage $message) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('messaging.direct.' . $this->message->conversation_id)];
    }

    public function broadcastAs(): string { return 'message.sent'; }

    public function broadcastWith(): array { /* explicit field list */ }
}

// Dispatch (DirectMessageController)
broadcast(new DirectMessageSent($message));`,
    notes: "Authorization: the channel gate checks that the authenticated user is user1_id or user2_id of the DirectConversation record.",
  },
  {
    id: "user-added-to-channel",
    broadcastAs: "channel.member.added",
    phpClass: "App\\Events\\UserAddedToChannel",
    channels: ["App.Models.User.{userId}"],
    channelType: "private",
    trigger: "POST /api/channel/members (ChannelController)",
    description:
      "Sent to a specific user's personal channel when they are added to a messaging channel by an admin or channel owner. Allows the frontend to show the new channel in the sidebar without polling.",
    payload: [
      { name: "channel_id", type: "string (UUID)", description: "Channel the user was added to." },
      { name: "channel_name", type: "string", description: "Display name of the channel." },
      { name: "channel_description", type: "string", description: "Channel description." },
      { name: "added_by_name", type: "string", description: "Name of the user who performed the action." },
    ],
    frontendListener: `// Subscribe to personal user channel
const userChannel = echo.private(\`App.Models.User.\${user.id}\`)

userChannel.listen('.channel.member.added', (event) => {
  // Add the new channel to the sidebar list
  setChannels((prev) => [...prev, {
    id: event.channel_id,
    name: event.channel_name,
    description: event.channel_description,
  }])
  showToast(\`You were added to #\${event.channel_name} by \${event.added_by_name}\`)
})`,
    phpCode: `// app/Events/UserAddedToChannel.php
class UserAddedToChannel implements ShouldBroadcastNow
{
    public function __construct(
        public string $channelId,
        public string $channelName,
        public string $channelDescription,
        public string $addedByName,
        public string $userId
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('App.Models.User.' . $this->userId)];
    }

    public function broadcastAs(): string { return 'channel.member.added'; }

    public function broadcastWith(): array
    {
        return [
            'channel_id'          => $this->channelId,
            'channel_name'        => $this->channelName,
            'channel_description' => $this->channelDescription,
            'added_by_name'       => $this->addedByName,
        ];
    }
}`,
    notes: "Uses the Laravel model-based channel (App.Models.User.{id}) which is authorized by default for the matching user.",
  },
  {
    id: "broadcast-test",
    broadcastAs: "message.sent",
    phpClass: "App\\Events\\BroadcastTest",
    channels: ["messaging.channel.{channelId}"],
    channelType: "private",
    trigger: "Internal / Debug only",
    description:
      "Development-only test event used to verify Reverb connectivity without sending a real message. Mimics the ChannelMessageSent payload format so the frontend can render it normally.",
    payload: [
      { name: "message.id", type: "string", description: "Generated test ID (test-{uniqid()})." },
      { name: "message.body", type: "string", description: "Timestamped test message." },
      { name: "message.created_at", type: "ISO 8601 string", description: "Server timestamp." },
      { name: "message.user.name", type: "string", description: "Always 'Test'." },
      { name: "message.user.id", type: "string", description: "Always 'test'." },
    ],
    frontendListener: `// Handled by the same listener as ChannelMessageSent
// No special handling needed — appears as a normal message in UI`,
    phpCode: `// Dispatch for debugging
broadcast(new BroadcastTest($channelId));`,
    notes: "Do NOT fire this in production. It is not behind any permission check by itself.",
  },
];

// ─── Channel Authorization Reference ────────────────────────────────────────

const CHANNEL_AUTH = [
  {
    pattern: "project.{projectId}",
    type: "Private",
    rule: "Super admin OR project creator OR any ProjectUser record for that project.",
  },
  {
    pattern: "user.{userId}",
    type: "Private",
    rule: "Only the authenticated user whose id matches the channel parameter.",
  },
  {
    pattern: "messaging.channel.{channelId}",
    type: "Private",
    rule: "User must have a ChannelMember record for that MessagingChannel.",
  },
  {
    pattern: "messaging.direct.{conversationId}",
    type: "Private",
    rule: "User must be user1_id or user2_id of the DirectConversation.",
  },
  {
    pattern: "App.Models.User.{id}",
    type: "Private",
    rule: "Authenticated user id must equal the channel parameter (Laravel default model channel).",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Box
        component="pre"
        sx={{
          backgroundColor: "#1e1e2e",
          color: "#cdd6f4",
          borderRadius: 2,
          p: 2.5,
          overflowX: "auto",
          fontSize: "0.78rem",
          lineHeight: 1.65,
          fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          m: 0,
          maxHeight: 420,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {code}
      </Box>
      <Tooltip title={copied ? "Copied!" : "Copy"} placement="top">
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: copied ? "#a6e3a1" : "rgba(255,255,255,0.4)",
            "&:hover": { color: "#cdd6f4" },
          }}
        >
          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="code"
      sx={{
        backgroundColor: "rgba(99,102,241,0.12)",
        color: "#818cf8",
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
        fontSize: "0.8rem",
        fontFamily: "monospace",
      }}
    >
      {children}
    </Box>
  );
}

function ChannelChip({ channel }: { channel: string }) {
  return (
    <Chip
      label={channel}
      size="small"
      sx={{
        backgroundColor: "rgba(99,102,241,0.12)",
        color: "#818cf8",
        fontFamily: "monospace",
        fontSize: "0.75rem",
        border: "1px solid rgba(99,102,241,0.3)",
      }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WebSocketEventsDocsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedEvent, setExpandedEvent] = useState<string | false>(WS_EVENTS[0].id);

  return (
    <Box>
      {/* Header */}
      <DashboardCard>
        <Stack direction="row" alignItems="center" spacing={2} mb={1}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              backgroundColor: "#5D87FF1A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBrandWebflow size={24} color="#5D87FF" />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              WebSocket Events
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete reference for all real-time broadcast events in Co Build Manager
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          {[
            { label: "Total Events", value: WS_EVENTS.length, color: "#5D87FF" },
            { label: "Unique broadcastAs Names", value: 3, color: "#49BEFF" },
            { label: "Private Channels", value: 5, color: "#13DEB9" },
            { label: "Broadcast Strategy", value: "ShouldBroadcastNow", color: "#FFAE1F" },
          ].map((s) => (
            <Grid size={{ xs: 6, md: 3 }} key={s.label}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${s.color}33`,
                  backgroundColor: `${s.color}0D`,
                }}
              >
                <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DashboardCard>

      {/* Navigation Tabs */}
      <Box sx={{ mt: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Events Reference" />
          <Tab label="Channel Authorization" />
          <Tab label="Frontend Setup" />
          <Tab label="Implementation Guide" />
        </Tabs>

        {/* ── TAB 0: Events Reference ─────────────────────────────────── */}
        {activeTab === 0 && (
          <Stack spacing={2}>
            {/* Quick overview table */}
            <DashboardCard title="All Events" subtitle="Overview of every broadcast event in the system">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>PHP Class</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>broadcastAs</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Channel(s)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Trigger</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {WS_EVENTS.map((ev) => (
                      <TableRow
                        key={ev.id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => {
                          setExpandedEvent(ev.id);
                          setActiveTab(0);
                          document.getElementById(`event-${ev.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                      >
                        <TableCell>
                          <InlineCode>{ev.phpClass.split("\\").pop()}</InlineCode>
                        </TableCell>
                        <TableCell>
                          <InlineCode>.{ev.broadcastAs}</InlineCode>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {ev.channels.map((ch) => (
                              <ChannelChip key={ch} channel={ch} />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {ev.trigger}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DashboardCard>

            {/* Detail accordions */}
            {WS_EVENTS.map((ev) => (
              <Box id={`event-${ev.id}`} key={ev.id}>
                <Accordion
                  expanded={expandedEvent === ev.id}
                  onChange={(_, open) => setExpandedEvent(open ? ev.id : false)}
                  elevation={2}
                  sx={{ borderRadius: "12px !important", overflow: "hidden" }}
                >
                  <AccordionSummary expandIcon={<IconChevronDown />}>
                    <Stack direction="row" alignItems="center" spacing={2} width="100%" pr={2}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                          backgroundColor: "#5D87FF1A",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <IconBolt size={18} color="#5D87FF" />
                      </Box>
                      <Box flex={1}>
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                          <Typography variant="h6" fontWeight={700}>
                            {ev.phpClass.split("\\").pop()}
                          </Typography>
                          <InlineCode>.{ev.broadcastAs}</InlineCode>
                          {ev.id === "broadcast-test" && (
                            <Chip label="Debug only" size="small" color="warning" variant="outlined" />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {ev.trigger}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="flex-end" gap={0.5}>
                        {ev.channels.map((ch) => (
                          <ChannelChip key={ch} channel={ch} />
                        ))}
                      </Stack>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={3}>
                      {/* Left column */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          Description
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                          {ev.description}
                        </Typography>

                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          Payload Fields
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2.5 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: "action.hover" }}>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Field</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Description</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {ev.payload.map((f) => (
                                <TableRow key={f.name}>
                                  <TableCell>
                                    <InlineCode>{f.name}</InlineCode>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" color={f.nullable ? "text.secondary" : "inherit"}>
                                      {f.type}
                                      {f.nullable && " | null"}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                      {f.description}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {ev.notes && (
                          <Alert severity="info" icon={<IconInfoCircle size={18} />} sx={{ fontSize: "0.8rem" }}>
                            {ev.notes}
                          </Alert>
                        )}
                      </Grid>

                      {/* Right column */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          Backend (PHP)
                        </Typography>
                        <Box sx={{ mb: 2.5 }}>
                          <CodeBlock code={ev.phpCode} />
                        </Box>

                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                          Frontend Listener (JavaScript)
                        </Typography>
                        <CodeBlock code={ev.frontendListener} />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Box>
            ))}
          </Stack>
        )}

        {/* ── TAB 1: Channel Authorization ────────────────────────────── */}
        {activeTab === 1 && (
          <Stack spacing={3}>
            <DashboardCard
              title="Channel Authorization"
              subtitle="How channels.php gates are defined — backend/routes/channels.php"
            >
              <Alert severity="info" sx={{ mb: 3 }}>
                All channels in this system are <strong>Private</strong>. Users must authenticate with a valid JWT token before
                the channel auth endpoint (<InlineCode>/api/broadcasting/auth</InlineCode>) will grant subscription access.
              </Alert>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "action.hover" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Channel Pattern</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Authorization Rule</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {CHANNEL_AUTH.map((ch) => (
                      <TableRow key={ch.pattern} hover>
                        <TableCell>
                          <ChannelChip channel={ch.pattern} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<IconLock size={12} />}
                            label={ch.type}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{ch.rule}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DashboardCard>

            <DashboardCard title="channels.php Source" subtitle="Full authorization gate definitions">
              <CodeBlock
                code={`// backend/routes/channels.php

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (string) $user->id === (string) $id;
});

Broadcast::channel('messaging.channel.{channelId}', function ($user, $channelId) {
    $channel = MessagingChannel::withoutGlobalScope(ProjectScope::class)->find($channelId);
    if (!$channel) return false;
    return ChannelMember::where('channel_id', $channelId)
        ->where('user_id', $user->id)
        ->exists();
});

Broadcast::channel('messaging.direct.{conversationId}', function ($user, $conversationId) {
    $conversation = DirectConversation::withoutGlobalScope(ProjectScope::class)->find($conversationId);
    if (!$conversation) return false;
    return $conversation->hasUser((string) $user->id);
});

Broadcast::channel('project.{projectId}', function ($user, $projectId) {
    if ($user->is_super_admin) return true;
    if ($user->createdProjects()->where('id', $projectId)->exists()) return true;
    return ProjectUser::where('user_id', $user->id)
        ->where('project_id', $projectId)
        ->exists();
});

Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (string) $user->id === (string) $userId;
});`}
              />
            </DashboardCard>
          </Stack>
        )}

        {/* ── TAB 2: Frontend Setup ────────────────────────────────────── */}
        {activeTab === 2 && (
          <Stack spacing={3}>
            <DashboardCard title="Tech Stack" subtitle="Libraries powering the WebSocket layer">
              <Grid container spacing={2}>
                {[
                  { name: "Laravel Reverb", role: "WebSocket server (self-hosted)", color: "#FF2D20" },
                  { name: "Laravel Echo", role: "Client-side subscription management", color: "#4FC08D" },
                  { name: "Pusher JS", role: "Transport driver used by Echo with Reverb", color: "#300d4f" },
                ].map((t) => (
                  <Grid size={{ xs: 12, md: 4 }} key={t.name}>
                    <Card variant="outlined" sx={{ height: "100%" }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight={700} sx={{ color: t.color }}>
                          {t.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t.role}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </DashboardCard>

            <DashboardCard title="Environment Variables" subtitle="Required .env values in the frontend (Vite)">
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "action.hover" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Variable</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Default</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Purpose</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { name: "VITE_REVERB_APP_KEY", def: "cobuild-key", desc: "Must match REVERB_APP_KEY in backend .env" },
                      { name: "VITE_REVERB_HOST", def: "127.0.0.1", desc: "Hostname of the Reverb server" },
                      { name: "VITE_REVERB_PORT", def: "8080", desc: "Reverb WebSocket port" },
                      { name: "VITE_REVERB_SCHEME", def: "http", desc: "Set to https in production with TLS termination" },
                      { name: "VITE_API_URL", def: "http://127.0.0.1:8181/api", desc: "Backend API base URL (used to derive auth endpoint)" },
                    ].map((row) => (
                      <TableRow key={row.name}>
                        <TableCell><InlineCode>{row.name}</InlineCode></TableCell>
                        <TableCell><InlineCode>{row.def}</InlineCode></TableCell>
                        <TableCell><Typography variant="caption">{row.desc}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Alert severity="warning">
                Never prefix private keys with <InlineCode>VITE_</InlineCode>. The Reverb app key is not a secret (it identifies the app, not authenticates it). Auth is done via JWT on the channel auth endpoint.
              </Alert>
            </DashboardCard>

            <DashboardCard title="Echo Singleton (src/services/echo.js)" subtitle="How the Echo instance is created and reused">
              <CodeBlock
                code={`// src/services/echo.js
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher   // Required by Laravel Echo

export const createEcho = () => {
  const token = localStorage.getItem('token')
  if (!token) return null

  return new Echo({
    broadcaster:       'reverb',
    key:               import.meta.env.VITE_REVERB_APP_KEY || 'cobuild-key',
    wsHost:            import.meta.env.VITE_REVERB_HOST    || '127.0.0.1',
    wsPort:            import.meta.env.VITE_REVERB_PORT    || 8080,
    wssPort:           import.meta.env.VITE_REVERB_PORT    || 8080,
    forceTLS:          (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint:      \`\${apiHost}/api/broadcasting/auth\`,
    auth: {
      headers: {
        Authorization: \`Bearer \${token}\`,
        Accept: 'application/json',
        'X-Project-ID': currentProjectId,   // Needed for channel project-scope auth
      },
    },
  })
}

// Singleton — recreated on login, destroyed on logout
let echoInstance = null

export const getEcho = () => {
  const token = localStorage.getItem('token')
  if (!token) { echoInstance?.disconnect(); echoInstance = null; return null }
  if (!echoInstance) echoInstance = createEcho()
  return echoInstance
}

export const disconnectEcho = () => {
  if (echoInstance) { echoInstance.disconnect(); echoInstance = null }
}`}
              />
            </DashboardCard>

            <DashboardCard title="PermissionContext WebSocket Integration" subtitle="How real-time permission refresh works">
              <Alert severity="success" sx={{ mb: 2 }}>
                <strong>Zero re-login required.</strong> When permissions change, the affected user receives a{" "}
                <InlineCode>PermissionUpdated</InlineCode> event on their personal channel. The context immediately calls the{" "}
                permissions API and updates React state — all UI permission checks react in real-time.
              </Alert>
              <CodeBlock
                code={`// src/contexts/PermissionContext.js

// refreshPermissions: fetches live permissions from API, not from stale selectedProject
const refreshPermissions = useCallback(async () => {
  if (!selectedProject?.id || isRefreshingPermissionsRef.current) return
  isRefreshingPermissionsRef.current = true

  try {
    const response = await fetchData(\`permissions/project/\${selectedProject.id}\`)
    const payload  = response?.items || response || {}

    const refreshedProject = {
      ...selectedProject,
      project_permissions: payload.permissions || {},
      user_role:           payload.user_role   || selectedProject.user_role,
      permission_source:   payload.permission_source,
      role_group:          payload.role_group,
      is_creator:          payload.is_creator  || false,
      user_type:           payload.user_type   || null,
    }

    localStorage.setItem('selectedProject', JSON.stringify(refreshedProject))
    loadPermissionsFromProject(refreshedProject)

    // Notify other listeners (e.g. sidebar, nav guards)
    localStorage.setItem('permissionVersion', Date.now().toString())
    window.dispatchEvent(new CustomEvent('permissionsUpdated'))
  } catch (err) {
    loadPermissionsFromProject(selectedProject)  // fallback to cached
  } finally {
    isRefreshingPermissionsRef.current = false  // debounce guard
  }
}, [selectedProject, loadPermissionsFromProject])

// WebSocket subscriptions (in useEffect)
const projectChannel = echo.private(\`project.\${projectId}\`)
const userChannel    = echo.private(\`user.\${user.id}\`)

// Both event name formats for Echo compatibility
projectChannel.listen('PermissionUpdated',  handleEvent)
projectChannel.listen('.PermissionUpdated', handleEvent)

userChannel.listen('PermissionUpdated',  (e) => { if (e.project_id === projectId) refreshPermissions() })
userChannel.listen('.PermissionUpdated', (e) => { if (e.project_id === projectId) refreshPermissions() })

// handleEvent on projectChannel — ignores events not directed at this user
const handleEvent = (event) => {
  if (!event.user_id || event.user_id === user.id) refreshPermissions()
}`}
              />
            </DashboardCard>
          </Stack>
        )}

        {/* ── TAB 3: Implementation Guide ─────────────────────────────── */}
        {activeTab === 3 && (
          <Stack spacing={3}>
            <DashboardCard
              title="Adding a New Real-Time Event"
              subtitle="Step-by-step guide to implement a new broadcast event"
            >
              {[
                {
                  step: "1",
                  title: "Create the Event class",
                  code: `// backend/app/Events/MyNewEvent.php
<?php

namespace App\\Events;

use Illuminate\\Broadcasting\\PrivateChannel;
use Illuminate\\Contracts\\Broadcasting\\ShouldBroadcastNow;
use Illuminate\\Foundation\\Events\\Dispatchable;
use Illuminate\\Broadcasting\\InteractsWithSockets;
use Illuminate\\Queue\\SerializesModels;

class MyNewEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string  $projectId,
        public string  $payload,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('project.' . $this->projectId)];
    }

    // Use ShouldBroadcastNow for real-time (no queue delay)
    // Use ShouldBroadcast if you want queue delivery (lower API latency)

    public function broadcastAs(): string
    {
        return 'my.event.name';   // Frontend listens with '.my.event.name'
    }

    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->projectId,
            'payload'    => $this->payload,
            'timestamp'  => now()->toISOString(),
        ];
        // ⚠️  Keep payload under 10KB (Reverb/Pusher limit)
        // ✅  Explicitly list fields — never toArray() large models
    }
}`,
                  notes: "Use ShouldBroadcastNow for permission and real-time UI changes. Use ShouldBroadcast (queued) for notification-style events where slight delay is acceptable.",
                },
                {
                  step: "2",
                  title: "Authorize the channel (if new)",
                  code: `// backend/routes/channels.php
// Only needed if you're introducing a NEW channel pattern

Broadcast::channel('my-resource.{resourceId}', function ($user, $resourceId) {
    // Return true to allow, false to deny, or a data array for presence channels
    return MyModel::where('id', $resourceId)
        ->where('user_id', $user->id)
        ->exists();
});`,
                  notes: "Existing channels (project.{id}, user.{id}, etc.) are already authorized — no changes needed if you reuse them.",
                },
                {
                  step: "3",
                  title: "Dispatch from your controller",
                  code: `// Inside your controller method, after DB::commit()

try {
    broadcast(new MyNewEvent(
        projectId: (string) $project_id,
        payload:   'some value',
    ));
} catch (\\Throwable $e) {
    // Always catch broadcast errors — never let Reverb being down
    // break an API response
    Log::warning('Broadcast failed', ['error' => $e->getMessage()]);
}

return $this->renderSuccess($resource, 1, 'Resource updated successfully');`,
                  notes: "Always wrap broadcast() in try/catch. Place it AFTER DB::commit() so data is committed before the client receives the event and tries to fetch it.",
                },
                {
                  step: "4",
                  title: "Subscribe in the frontend component",
                  code: `// In your React component (useEffect)
import { getEcho } from '../../services/echo'

useEffect(() => {
  const echo = getEcho()
  if (!echo || !projectId) return

  const channel = echo.private(\`project.\${projectId}\`)

  // Note the dot prefix (.my.event.name) — required for custom broadcastAs names
  channel.listen('.my.event.name', (event) => {
    console.log('My event received:', event)
    // Update state here
    setData((prev) => [...prev, event.payload])
  })

  // Always clean up to prevent memory leaks
  return () => {
    channel.stopListening('.my.event.name')
    // echo.leave(\`project.\${projectId}\`) if this is the only listener
  }
}, [projectId])`,
                  notes: null,
                },
              ].map(({ step, title, code, notes }) => (
                <Box key={step} sx={{ mb: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: "#5D87FF",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        flexShrink: 0,
                      }}
                    >
                      {step}
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {title}
                    </Typography>
                  </Stack>
                  <CodeBlock code={code} />
                  {notes && (
                    <Alert severity="info" sx={{ mt: 1.5, fontSize: "0.8rem" }}>
                      {notes}
                    </Alert>
                  )}
                </Box>
              ))}
            </DashboardCard>

            <DashboardCard title="Best Practices & Rules" subtitle="Follow these to keep real-time events reliable">
              <Grid container spacing={2}>
                {[
                  {
                    icon: <IconCheck size={18} />,
                    color: "#13DEB9",
                    label: "Always wrap broadcast() in try/catch",
                    detail: "A Reverb outage must never cause an API endpoint to return a 500. Log the error and move on.",
                  },
                  {
                    icon: <IconCheck size={18} />,
                    color: "#13DEB9",
                    label: "Dispatch AFTER DB::commit()",
                    detail: "If the client receives the event and immediately fetches data, it should see the committed state.",
                  },
                  {
                    icon: <IconCheck size={18} />,
                    color: "#13DEB9",
                    label: "Explicitly define broadcastWith()",
                    detail: "Never return toArray() of a large model — keep every payload under 10 KB.",
                  },
                  {
                    icon: <IconCheck size={18} />,
                    color: "#13DEB9",
                    label: "Use ShouldBroadcastNow for permission events",
                    detail: "Real-time permission changes must not be delayed by queue workers.",
                  },
                  {
                    icon: <IconCheck size={18} />,
                    color: "#13DEB9",
                    label: "Use isRefreshing refs to debounce",
                    detail: "When a user is on both project and user channels, the same event may fire twice. Guard with a ref.",
                  },
                  {
                    icon: <IconCheck size={18} />,
                    color: "#13DEB9",
                    label: "Listen to both 'EventName' and '.EventName'",
                    detail: "Echo can prepend a dot for custom broadcastAs names. Register both to be safe.",
                  },
                  {
                    icon: <IconArrowRight size={18} />,
                    color: "#FFAE1F",
                    label: "Clean up all listeners on unmount",
                    detail: "Use stopListening() or echo.leave() in the useEffect cleanup function.",
                  },
                  {
                    icon: <IconArrowRight size={18} />,
                    color: "#FFAE1F",
                    label: "Use BroadcastTest for debugging",
                    detail: "Fire BroadcastTest to a channel to confirm connectivity before building real event logic.",
                  },
                ].map((item) => (
                  <Grid size={{ xs: 12, md: 6 }} key={item.label}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <Box sx={{ color: item.color, mt: 0.25, flexShrink: 0 }}>{item.icon}</Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {item.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.detail}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </DashboardCard>

            <DashboardCard title="Known Limitations" subtitle="Current constraints and future considerations">
              <Stack spacing={1.5}>
                {[
                  {
                    severity: "warning" as const,
                    text: "Payload size limit: Reverb (via Pusher protocol) enforces a 10 KB per-message limit. Always explicitly list fields in broadcastWith().",
                  },
                  {
                    severity: "warning" as const,
                    text: "selectedProject in ProjectContext is not updated by refreshPermissions() — only PermissionContext state and localStorage are refreshed. Components reading non-permission project metadata from ProjectContext will be stale until navigation.",
                  },
                  {
                    severity: "info" as const,
                    text: "BroadcastTest fires on the messaging channel so it appears as a chat message in the UI. Use only in development for connectivity checks.",
                  },
                  {
                    severity: "info" as const,
                    text: "ShouldBroadcastNow is synchronous and blocks the HTTP response slightly while Reverb is reached. For high-throughput endpoints, consider switching to ShouldBroadcast (queued) if latency becomes a concern.",
                  },
                ].map((item, i) => (
                  <Alert key={i} severity={item.severity} sx={{ fontSize: "0.82rem" }}>
                    {item.text}
                  </Alert>
                ))}
              </Stack>
            </DashboardCard>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
