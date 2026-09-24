/**
 * lib/supabase.ts
 * ─────────────────────────────────────────────────────────────
 * Single shared Supabase browser client.
 *
 * IMPORTANT: createBrowserClient() must only be called ONCE per browser
 * context. Every file that needs Supabase should import `supabase` from
 * here instead of calling createBrowserClient() itself — otherwise you
 * get multiple GoTrueClient instances fighting over the same
 * localStorage auth token key, which triggers the
 * "Multiple GoTrueClient instances detected" warning and can cause
 * flaky/duplicated auth state, race conditions on token refresh, etc.
 */

import { createBrowserClient } from "@supabase/ssr";

// Module-level singleton. Because ES modules are cached by Node/Next.js,
// this file's top-level code only runs once per browser session, so
// `supabase` is guaranteed to be the same instance everywhere it's imported.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);