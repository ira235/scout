// Supabase clients (server, browser, service-role).
// Env vars are read lazily inside each function so that scripts that load
// dotenv after import (jobs-dev, seed) still get them at call time.
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Browser client (RLS-enforced via user session)
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}

// Server (RSC / API routes) - uses cookies
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
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
    },
  );
}

// Service role: bypasses RLS. ONLY for cron/jobs/webhooks. Never ship to browser.
export function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  if (!service) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
