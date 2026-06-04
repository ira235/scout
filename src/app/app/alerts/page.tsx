import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import { Btn, Chip, FreqBadge } from "@/components/ui";
import { AlertToggleClient } from "./client";
import type { Alert } from "@/lib/db.types";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Please sign in to see your alerts.</p>
        <Btn href="/auth/sign-in">Sign in</Btn>
      </div>
    );
  }

  const { data: alerts } = await sb
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: matchCounts } = await sb
    .from("alert_matches")
    .select("alert_id, notified_at");
  const pendingMap = new Map<string, number>();
  for (const m of matchCounts ?? []) {
    if (!m.notified_at) pendingMap.set(m.alert_id, (pendingMap.get(m.alert_id) ?? 0) + 1);
  }

  const next = (alerts ?? []).find((a) => a.active && (pendingMap.get(a.id) ?? 0) > 0);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Saved alerts</h1>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          {alerts?.length ?? 0} alert{(alerts?.length ?? 0) === 1 ? "" : "s"}
        </div>
      </header>

      {next && (
        <Link
          href={`/app/alerts/${next.id}/preview`}
          style={{
            display: "block",
            background: "var(--green-tint)",
            color: "var(--green-deep)",
            padding: 16,
            borderRadius: 20,
            textDecoration: "none",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            Tomorrow&apos;s digest preview ready →
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            {pendingMap.get(next.id)} new match{pendingMap.get(next.id) === 1 ? "" : "es"} for &quot;{next.name}&quot;
          </div>
        </Link>
      )}

      {(alerts ?? []).length === 0 && (
        <div
          style={{
            padding: 28,
            textAlign: "center",
            color: "var(--ink-soft)",
            background: "var(--surface)",
            borderRadius: 20,
          }}
        >
          No alerts yet. <Link href="/app/search" style={{ color: "var(--primary)" }}>Build one →</Link>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {(alerts ?? []).map((a: Alert) => (
          <article
            key={a.id}
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              padding: 18,
              boxShadow: "0 1px 2px rgba(28,32,28,0.05)",
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{a.name}</h3>
                  <FreqBadge freq={a.frequency} />
                  {!a.active && <Chip tone="outline" size="sm">Paused</Chip>}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4, fontFamily: "var(--mono)" }}>
                  {a.last_notified_at
                    ? `Last sent: ${new Date(a.last_notified_at).toLocaleString()}`
                    : "Not sent yet"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {(pendingMap.get(a.id) ?? 0) > 0 && (
                  <Chip tone="accent" size="sm">{pendingMap.get(a.id)} new</Chip>
                )}
                <AlertToggleClient id={a.id} active={a.active} />
              </div>
            </div>

            <SummaryChips criteria={a.criteria} mode={a.mode} />

            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <Btn href={`/app/alerts/${a.id}/preview`} variant="ghost" size="sm">
                Preview digest
              </Btn>
              <Btn href={`/app/search`} variant="ghost" size="sm">
                Edit
              </Btn>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SummaryChips({ criteria, mode }: { criteria: unknown; mode: "BUY" | "RENT" }) {
  const c = (criteria || {}) as Record<string, unknown>;
  const chips: string[] = [];
  chips.push(mode === "BUY" ? "Buy" : "Rent");
  const beds = (c.bedsMin as number) || 0;
  if (beds > 0) chips.push(`${beds}+ bed`);
  const priceMax = c.priceMax as number | undefined;
  if (typeof priceMax === "number") {
    chips.push(`≤ $${(priceMax / 100).toLocaleString()}${mode === "RENT" ? "/mo" : ""}`);
  }
  const loc = c.location as { cities?: string[]; neighborhoods?: string[] } | undefined;
  if (loc?.cities?.length) chips.push(loc.cities.join(", "));
  const features = (c.features as string[] | undefined) ?? [];
  features.slice(0, 3).forEach((f) => chips.push(f.replace(/-/g, " ")));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {chips.map((c, i) => (
        <Chip key={i} tone={i === 0 ? "primary" : "neutral"} size="sm">
          {c}
        </Chip>
      ))}
    </div>
  );
}
