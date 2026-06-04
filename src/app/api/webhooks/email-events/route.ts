// Resend webhook for bounce/complaint events.
// Resend signs requests with svix-style headers. We do a lightweight check by
// requiring RESEND_WEBHOOK_SECRET to match a header (HMAC verification can be
// added when Resend's signature scheme is finalized in your account).
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export const runtime = "nodejs";

interface Payload {
  type?: string;
  data?: { email?: { to?: string[] }; to?: string[]; reason?: string };
}

export async function POST(req: Request) {
  const expected = process.env.RESEND_WEBHOOK_SECRET;
  const provided = req.headers.get("x-webhook-secret");
  if (expected && provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let json: Payload;
  try { json = (await req.json()) as Payload; } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const type = json.type ?? "";
  const to = json.data?.email?.to ?? json.data?.to ?? [];
  const reason = json.data?.reason ?? type;

  if (/bounce/i.test(type) || /complaint/i.test(type) || /spam/i.test(type)) {
    const sb = supabaseService();
    for (const email of to) {
      await sb.from("email_health").upsert({
        email,
        status: /complaint|spam/i.test(type) ? "complained" : "bounced",
        reason,
      });
    }
  }
  return NextResponse.json({ ok: true });
}
