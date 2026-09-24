/**
 * lib/db.ts
 * ─────────────────────────────────────────────────────────────
 * All Supabase database helper functions used throughout the app.
 * Every function returns { data, error } so callers can decide
 * how to handle failures.
 */

import { createBrowserClient } from "@supabase/ssr";

// ─── Client ──────────────────────────────────────────────────────────────────
function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  timezone: string | null;
  company_name: string | null;
  vat_id: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  plan: "free" | "pro" | "enterprise";
  dark_mode: boolean;
  email_notifications: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  type: "Email" | "Text" | "URL";
  content: string;
  risk_level: "High" | "Medium" | "Low";
  risk_score: number;
  is_scam: boolean;
  details: Record<string, any> | null;
  created_at: string;
  // Legacy aliases kept for backward compat with old components
  riskLevel?: "High" | "Medium" | "Low";
  riskScore?: number;
  isScam?: boolean;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  amount: number;
  status: "Paid" | "Pending" | "Failed";
  pdf_url: string | null;
  created_at: string;
}

export type DbResult<T> = { data: T | null; error: Error | null };

// ─── AUTH HELPERS ────────────────────────────────────────────────────────────

/**
 * Get the currently authenticated user.
 * Returns null if no user is logged in.
 */
export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  try {
    const supabase = getClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return { id: user.id, email: user.email || '' };
  } catch {
    return null;
  }
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────

/**
 * Fetch the profile row for a user.
 * Returns null (not an error) when the row doesn't exist yet.
 */
export async function getUserProfile(userId: string): Promise<DbResult<Profile>> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // No row found — not an error, just empty
      return { data: null, error: null };
    }
    if (error) throw error;
    return { data: data as Profile, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Allowed fields for client-side profile updates.
 * IMPORTANT: `plan` must NEVER be in this list – it should be changed only
 * by server-side logic (e.g. after a successful payment webhook).
 */
const ALLOWED_PROFILE_UPDATES: (keyof Profile)[] = [
  "first_name",
  "last_name",
  "name",
  "country",
  "timezone",
  "company_name",
  "vat_id",
  "address_line_1",
  "address_line_2",
  "city",
  "state",
  "zip_code",
  "dark_mode",
  "email_notifications",
  "language",
];

/**
 * Update personal info fields on a profile row.
 * Creates the row if it doesn't exist (upsert).
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>
): Promise<DbResult<Profile>> {
  try {
    // Remove any disallowed fields (like "plan") to prevent privilege escalation
    const safeUpdates: Record<string, any> = {};
    for (const key of ALLOWED_PROFILE_UPDATES) {
      if (key in updates) {
        safeUpdates[key] = (updates as any)[key];
      }
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...safeUpdates }, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;
    return { data: data as Profile, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Update only the business / billing fields.
 */
export async function updateBusinessDetails(
  userId: string,
  details: {
    company_name?: string;
    vat_id?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  }
): Promise<DbResult<Profile>> {
  return updateProfile(userId, details);
}

/**
 * Update notification / preference settings.
 */
export async function updateSettings(
  userId: string,
  settings: {
    dark_mode?: boolean;
    email_notifications?: boolean;
    language?: string;
  }
): Promise<DbResult<Profile>> {
  return updateProfile(userId, settings);
}

/**
 * Hard-delete a user's profile (cascade deletes scans + invoices).
 * The auth.users row must be deleted separately via supabase.auth.admin.deleteUser
 * or via a Supabase Edge Function.
 */
export async function deleteUserProfile(userId: string): Promise<DbResult<null>> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// ─── SCANS ───────────────────────────────────────────────────────────────────

/**
 * Fetch all scans for a user, newest first.
 * Normalises snake_case DB fields to camelCase aliases so legacy
 * components that read `riskLevel`, `riskScore`, `isScam` still work.
 */
export async function getUserScans(userId: string): Promise<DbResult<Scan[]>> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Attach legacy camelCase aliases
    const normalised = (data ?? []).map((s: any) => ({
      ...s,
      riskLevel: s.risk_level,
      riskScore: s.risk_score,
      isScam: s.is_scam,
    })) as Scan[];

    return { data: normalised, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// ❌ createScan has been removed intentionally.
// All scan analysis and insertion must happen server-side (e.g. in an Edge Function)
// to prevent users from supplying fake risk_level / is_scam values.
// If you need to trigger a scan, call your Edge Function endpoint instead.

/**
 * Delete a single scan by id (only if it belongs to the user — RLS enforced).
 */
export async function deleteScan(scanId: string): Promise<DbResult<null>> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from("scans")
      .delete()
      .eq("id", scanId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// ─── INVOICES ────────────────────────────────────────────────────────────────

/**
 * Fetch all invoices for a user.
 */
export async function getUserInvoices(userId: string): Promise<DbResult<Invoice[]>> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data as Invoice[], error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Convenience: fetch invoices for whoever is currently logged in.
 */
export async function getMyInvoices(): Promise<DbResult<Invoice[]>> {
  try {
    const supabase = getClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");
    return getUserInvoices(user.id);
  } catch (err: any) {
    return { data: null, error: err };
  }
}