// Digest job (spec §8).
import { supabaseService } from "../supabase";
import { renderDigestEmail } from "../email";
import { Resend } from "resend";

const FIFTEEN_MIN = 15 * 60 * 1000;

function hourInTZ(tz: string, now = new Date()): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false });
    return parseInt(fmt.format(now), 10);
  } catch {
    return now.getUTCHours();
  }
}
function dayInTZ(tz: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(now);
  } catch {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getUTCDay()];
  }
}

async function sendDigestForAlert(alertId: string, opts: { allowEmpty?: boolean }) {
  const sb = supabaseService();

  const { data: alert } = await sb
    .from("alerts")
    .select("id, user_id, name, frequency, active, criteria")
    .eq("id", alertId)
    .single();
  if (!alert || !alert.active) return { skipped: true };

  const { data: profile } = await sb.from("profiles").select("email, name").eq("id", alert.user_id).single();
  if (!profile?.email) return { skipped: true };

  const { data: settings } = await sb
    .from("user_settings")
    .select("per_email_cap, theme")
    .eq("user_id", alert.user_id)
    .single();
  const cap = settings?.per_email_cap ?? 10;
  const theme = (settings?.theme ?? "sage") as "sage" | "cobalt" | "navy" | "ocean" | "ink";

  const { data: health } = await sb
    .from("email_health")
    .select("status")
    .eq("email", profile.email)
    .maybeSingle();
  if (health && health.status !== "ok") return { skipped: true, reason: "email-unhealthy" };

  const { data: pending } = await sb
    .from("alert_matches")
    .select("id, listing_id, match_score, listings:listing_id(*)")
    .eq("alert_id", alert.id)
    .is("notified_at", null)
    .order("match_score", { ascending: false })
    .limit(cap);

  const matches = (pending ?? []).map((m) => ({
    matchId: m.id,
    score: m.match_score,
    listing: m.listings as unknown as import("../db.types").Listing,
  }));

  if (!matches.length && !opts.allowEmpty) return { skipped: true, reason: "no-matches" };

  const { html, text } = await renderDigestEmail({
    alert: { id: alert.id, name: alert.name, frequency: alert.frequency },
    user: { id: alert.user_id, email: profile.email, name: profile.name },
    matches,
    theme,
    perEmailCap: cap,
  });

  const fromAddress = process.env.RESEND_FROM || "Scout <alerts@scout.app>";
  const resendKey = process.env.RESEND_API_KEY;

  let messageId: string | undefined;
  if (resendKey) {
    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from: fromAddress,
      to: profile.email,
      subject:
        matches.length > 0
          ? `${matches.length} new ${matches.length === 1 ? "home" : "homes"} match "${alert.name}"`
          : `No new matches this week — ${alert.name}`,
      html,
      text,
    });
    messageId = result.data?.id;
  } else {
    console.log(`[digest] (dry) → ${profile.email}: ${matches.length} matches for "${alert.name}"`);
  }

  if (matches.length) {
    const ids = matches.map((m) => m.matchId);
    await sb.from("alert_matches").update({ notified_at: new Date().toISOString() }).in("id", ids);
  }
  await sb.from("alerts").update({ last_notified_at: new Date().toISOString() }).eq("id", alert.id);
  await sb.from("alert_send_log").insert({ alert_id: alert.id });

  return { sent: matches.length, messageId };
}

export async function sendInstantDigests(alertIds: string[]) {
  const sb = supabaseService();
  const since = new Date(Date.now() - FIFTEEN_MIN).toISOString();
  for (const id of alertIds) {
    const { data: recent } = await sb
      .from("alert_send_log")
      .select("alert_id")
      .eq("alert_id", id)
      .gte("sent_at", since)
      .limit(1);
    if (recent && recent.length) continue;
    try {
      await sendDigestForAlert(id, { allowEmpty: false });
    } catch (e) {
      console.error("[digest:instant] failed for alert", id, e);
    }
  }
}

export async function runDigestTick(now = new Date()) {
  const sb = supabaseService();
  const { data: rows } = await sb
    .from("alerts")
    .select("id, user_id, frequency, active, user_settings:user_id(send_hour, timezone)")
    .eq("active", true);

  const todo: string[] = [];
  for (const a of rows ?? []) {
    if (a.frequency === "INSTANT") continue;
    const settings = a.user_settings as unknown as { send_hour: number; timezone: string } | null;
    const tz = settings?.timezone ?? "America/Los_Angeles";
    const sendHour = settings?.send_hour ?? 8;
    if (hourInTZ(tz, now) !== sendHour) continue;
    if (a.frequency === "WEEKLY" && dayInTZ(tz, now) !== "Mon") continue;
    todo.push(a.id);
  }

  let sent = 0;
  for (const id of todo) {
    const { data: alertMeta } = await sb.from("alerts").select("frequency").eq("id", id).single();
    const allowEmpty = alertMeta?.frequency === "WEEKLY";
    try {
      const r = await sendDigestForAlert(id, { allowEmpty });
      if ((r as { sent?: number }).sent) sent++;
    } catch (e) {
      console.error("[digest:tick] failed for alert", id, e);
    }
  }
  return { considered: todo.length, sent };
}

// Exposed for the in-app preview page (renders without sending).
export async function previewDigestForAlert(alertId: string) {
  const sb = supabaseService();
  const { data: alert } = await sb
    .from("alerts")
    .select("id, user_id, name, frequency")
    .eq("id", alertId)
    .single();
  if (!alert) return null;

  const { data: profile } = await sb.from("profiles").select("email, name").eq("id", alert.user_id).single();
  const { data: settings } = await sb
    .from("user_settings")
    .select("per_email_cap, theme")
    .eq("user_id", alert.user_id)
    .single();
  const cap = settings?.per_email_cap ?? 10;
  const theme = (settings?.theme ?? "sage") as "sage" | "cobalt" | "navy" | "ocean" | "ink";

  const { data: pending } = await sb
    .from("alert_matches")
    .select("id, listing_id, match_score, listings:listing_id(*)")
    .eq("alert_id", alert.id)
    .is("notified_at", null)
    .order("match_score", { ascending: false })
    .limit(cap);

  const matches = (pending ?? []).map((m) => ({
    matchId: m.id,
    score: m.match_score,
    listing: m.listings as unknown as import("../db.types").Listing,
  }));

  return renderDigestEmail({
    alert: { id: alert.id, name: alert.name, frequency: alert.frequency },
    user: { id: alert.user_id, email: profile?.email ?? "you@example.com", name: profile?.name ?? null },
    matches,
    theme,
    perEmailCap: cap,
  });
}
