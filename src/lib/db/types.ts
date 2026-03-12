export type UserRole = "client" | "admin";
export type ProjectStatus = "draft" | "uploaded" | "processing" | "delivered";
export type AssetType = "photo" | "video" | "reel";
export type AssetVariant = "original" | "mls" | "web" | "print";
export type AIResultType =
  | "cover_rank"
  | "quality_flag"
  | "caption"
  | "alt_text"
  | "description"
  | "captions";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string | null;
  name: string;
  brokerage: string | null;
  contact_email: string;
  phone: string | null;
  billing_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  address: string;
  sq_ft: number | null;
  property_type: string | null;
  preferred_time_windows: string[] | null;
  addons: unknown[];
  package_id: string | null;
  quote_cents: number | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
  project_id: string | null;
}

export interface Project {
  id: string;
  client_id: string;
  booking_id: string | null;
  address: string;
  mls_number: string | null;
  shoot_date: string | null;
  status: ProjectStatus;
  delivery_status: string | null;
  tags: string[];
  addons: unknown[];
  first_download_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  assets?: Asset[];
  invoices?: Invoice[];
}

export interface Asset {
  id: string;
  project_id: string;
  type: AssetType;
  variant: AssetVariant;
  storage_key: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  watermark_applied: boolean;
  sort_order: number;
  mls_filename: string | null;
  processing_status: string | null;
  created_at: string;
}

export interface Download {
  id: string;
  project_id: string;
  user_id: string | null;
  session_id: string | null;
  asset_id: string | null;
  downloaded_at: string;
  ip: string | null;
}

export interface Invoice {
  id: string;
  project_id: string;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  status: string;
  amount_cents: number;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewApproval {
  id: string;
  project_id: string;
  approved: boolean;
  requested_changes: string | null;
  reviewed_at: string;
  reviewed_by: string | null;
}

export interface AIResult {
  id: string;
  project_id: string;
  asset_id: string | null;
  type: AIResultType;
  payload: Record<string, unknown>;
  created_at: string;
}
