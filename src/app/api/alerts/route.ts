import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";
import { CriteriaSchema, DIGEST_FREQS } from "@/lib/criteria";

export const runtime = "nodejs";

const PostBody = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  mode: z.enum(["BUY", "RENT"]),
  criteria: CriteriaSchema,
  rawPrompt: z.string().nullable().optional(),
  frequency: z.enum(DIGEST_FREQS).default("DAILY"),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email query param required" }, { status: 400 });
  }
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("alerts")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ alerts: data });
}

export async function POST(req: Request) {
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  const parsed = PostBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, name, mode, criteria, rawPrompt, frequency } = parsed.data;
  const sb = await supabaseServer();

  const { data, error } = await sb
    .from("alerts")
    .insert({
      email,
      name,
      mode,
      criteria,
      raw_prompt: rawPrompt ?? null,
      frequency,
      active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Backfill matches against existing listings so the new alert has data immediately.
  try {
    const { backfillAlertMatches } = await import("@/lib/jobs/backfill");
    await backfillAlertMatches(data.id);
  } catch (e) {
    console.error("[alerts/POST] backfill failed", e);
  }

  return NextResponse.json({ alert: data });
}