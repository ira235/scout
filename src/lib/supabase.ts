// Supabase clients (server, browser, service-role)
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
// Note: We intentionally use untyped Supabase clients here. Hand-rolled DB types
// in db.types.ts caused complex GenericSchema mismatches with supabase-js v2.46.
// Callers cast row shapes explicitly when needed (see src/lib/db.types.ts exports).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// Browser client (RLS-enforced via user session)
export function supabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
}

// Server (RSC / API routes) - uses cookies
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // RSC: cookies are read-only
        }
      },
    },
  });
}

// Service role: bypasses RLS. ONLY for cron/jobs/webhooks. Never ship to browser.
export function supabaseService() {
  if (!SUPABASE_SERVICE) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
