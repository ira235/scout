import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { verifyToken } from "@/lib/tokens";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const data = verifyToken(token || "");
  if (!data || data.action !== "unsubscribe") return new Response("Invalid or expired link", { status: 400 });
  const sb = supabaseService();
  if (data.alertId) await sb.from("alerts").update({ active: false }).eq("id", data.alertId);
  await sb.from("user_settings").update({ push_enabled: false }).eq("user_id", data.userId);
  return new Response(unsubHtml("Unsubscribed", `You won't receive more "${data.alertId ? "this alert" : "Scout"}" emails.`), {
    status: 200,
    headers: { "content-type": "text/html" },
  });
}

function unsubHtml(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui;background:#EFEBE2;color:#1C201C;display:grid;place-items:center;min-height:100vh;margin:0}main{background:#fff;padding:32px;border-radius:20px;max-width:480px;text-align:center;box-shadow:0 6px 16px rgba(0,0,0,0.05)}h1{margin:0 0 12px;font-size:22px}p{margin:0;color:#444}</style></head>
<body><main><h1>${title}</h1><p>${body}</p></main></body></html>`;
}
