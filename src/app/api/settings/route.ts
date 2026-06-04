import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";

const Patch = z.object({
  default_freq: z.enum(["INSTANT", "DAILY", "WEEKLY"]).optional(),
  send_hour: z.number().int().min(0).max(23).optional(),
  timezone: z.string().optional(),
  per_email_cap: z.number().int().min(1).max(50).optional(),
  push_enabled: z.boolean().optional(),
  hide_pending: z.boolean().optional(),
  high_match_only: z.boolean().optional(),
  theme: z.string().optional(),
});

export async function GET() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await sb.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
  if (data) return NextResponse.json(data);
  // bootstrap defaults if missing
  const { data: created } = await sb
    .from("user_settings")
    .insert({ user_id: user.id })
    .select()
    .single();
  return NextResponse.json(created);
}

export async function PATCH(req: Request) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = Patch.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const { data, error } = await sb
    .from("user_settings")
    .update(parsed.data)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
