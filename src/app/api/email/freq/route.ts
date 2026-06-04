import { supabaseService } from "@/lib/supabase";
import { verifyToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const data = verifyToken(token);
  if (!data || data.action !== "freq" || !data.alertId || !data.freq)
    return new Response("Invalid link", { status: 400 });
  await supabaseService().from("alerts").update({ frequency: data.freq }).eq("id", data.alertId);
  return new Response(
    `<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;text-align:center;padding:60px"><h1>Frequency updated</h1><p>This alert is now <b>${data.freq.toLowerCase()}</b>.</p></body>`,
    { headers: { "content-type": "text/html" } }
  );
}
