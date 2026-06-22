import { NextResponse, type NextRequest } from "next/server";

// Simplified middleware for Option A (email-only alerts, no login required).
// Only cron routes are protected (via x-cron-secret header).
// All /app/* and /api/* routes are public.
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

  // Everything else is public
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};