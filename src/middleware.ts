import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Auth gate. Protects /app/* and /api/* except cron (which checks x-cron-secret).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Cron routes auth via header
  if (pathname.startsWith("/api/cron/")) {
    const secret = process.env.CRON_SECRET;
    const provided = req.headers.get("x-cron-secret");
    if (!secret || provided !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Webhooks: pass through (signature verified inside handler)
  if (pathname.startsWith("/api/webhooks/")) return NextResponse.next();

  // Marketing landing + auth pages don't need a session
  const isProtected = pathname.startsWith("/app") || pathname.startsWith("/api");
  if (!isProtected) return NextResponse.next();

  // Dev escape hatch: SCOUT_SKIP_AUTH=1 lets you preview the app without signing in.
  // Pages and API routes that read auth.getUser() will see no user; some features
  // (saving alerts, settings) will short-circuit, but the UI still renders.
  if (process.env.SCOUT_SKIP_AUTH === "1") {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anon) {
    // dev mode without supabase keys: allow
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
        for (const { name, value, options } of toSet) res.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const next = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/auth/sign-in?next=${next}`, req.url));
  }
  return res;
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};
