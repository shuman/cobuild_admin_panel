export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo_path: string | null;
  is_admin: boolean;
  is_super_admin: boolean;
  is_verified: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  items: {
    token: string;
    user: User;
  };
}

export interface TwoFARequiredResponse {
  requires_2fa: boolean;
  two_fa_token: string;
  message: string;
}

export interface TwoFAVerifyResponse {
  success: boolean;
  message: string;
  jwt_token: string;
  user: User;
}

export interface TwoFASetupResponse {
  success: boolean;
  secret: string;
  qr_uri: string;
}

export interface TwoFAStatusResponse {
  success: boolean;
  is_enabled: boolean;
  enabled_at: string | null;
}

export interface ApiError {
  error?: string;
  message?: string;
  reason?: string;
  requires_2fa?: boolean;
  two_fa_token?: string;
}

// ── Admin User Management ──

export interface AdminUserProject {
  id: string;
  name: string;
  slug: string;
  type: "owner" | "member";
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_admin: boolean;
  is_super_admin: boolean;
  is_active: boolean;
  is_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  projects?: AdminUserProject[];
}

export interface UsersResponse {
  count: number;
  page: number;
  items: AdminUser[];
  limit: number;
  total_pages: number;
}

// ── Project Types ──

export interface ProjectCreator {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  status: string;
  is_active: boolean;
  is_deleted: boolean;
  is_premium: boolean;
  project_share_code: string | null;
  project_share_active: boolean;
  settings: Record<string, unknown> | null;
  created_by: ProjectCreator | string | null;
  deleted_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  users_count: number;
  members_count: number;
}

export interface ProjectsResponse {
  count: number;
  page: number;
  items: Project[];
  limit: number;
  total_pages: number;
}

/** Backend returns project in `items` (single object), with count, success, message */
export interface ProjectDetailResponse {
  success: number;
  message: string;
  count: number;
  items: Project;
  timestamp?: string;
  status?: number;
}

export interface ProjectUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  project_user_id?: string;
  project_user_note?: string | null;
  project_user_is_active?: boolean;
  project_user_created_at?: string;
  created_at?: string;
}

export interface ProjectUsersResponse {
  success: boolean;
  count: number;
  page: number;
  items: ProjectUser[];
  limit: number;
  total_pages: number;
}

/** Generic list response from backend (members, vendors, properties, etc.) */
export interface ListResponse<T> {
  count: number;
  page?: number;
  items: T[];
  success?: number;
  message?: string;
  timestamp?: string;
  status?: number;
}

/** Project-scoped list APIs use X-Project-ID header; items filtered by project */
export interface ProjectMember {
  id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  invitation_status?: string;
  joined_at?: string | null;
  created_at?: string;
  user?: { id: string; name?: string; email?: string; phone?: string | null };
}

export interface ProjectVendor {
  id: string;
  business_name?: string;
  business_email?: string | null;
  business_phone?: string | null;
  invitation_status?: string;
  created_at?: string;
  user?: { id: string; name?: string; email?: string };
  vendor_type?: { id: string; name?: string };
}

export interface ProjectProperty {
  id: string;
  name?: string;
  property_code?: string;
  property_value_type?: string;
  percentage_of_project?: number | null;
  fixed_value?: number | null;
  is_deleted?: boolean;
  created_at?: string;
}

export interface ProjectDepositSchedule {
  id: string;
  name?: string;
  amount?: number;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  deposit_type?: { id: string; name?: string };
}

export interface ProjectNotice {
  id: string;
  title?: string;
  content?: string;
  importance?: string | null;
  is_pinned?: boolean;
  created_at?: string;
  creator?: { id: string; name?: string; email?: string };
}

export interface ProjectFile {
  id: string;
  name?: string;
  path?: string;
  size?: number;
  mime_type?: string | null;
  is_folder?: boolean;
  created_at?: string;
}

// Health check (Laravel Health)
export interface HealthCheckResult {
  name: string;
  label: string;
  notificationMessage: string;
  shortSummary: string;
  status: "ok" | "failed" | "warning" | "crashed" | "skipped";
  meta: Record<string, unknown>;
}

export interface HealthJsonResponse {
  finishedAt: number;
  checkResults: HealthCheckResult[];
}
