"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Btn, Chip, FreqBadge } from "@/components/ui";
import { AlertToggleClient } from "./client";
import type { Alert } from "@/lib/db.types";

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

export function AlertsPageClient() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("scout-email");
    if (stored) {
      setEmail(stored);
      fetchAlerts(stored);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchAlerts(e: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts?email=${encodeURIComponent(e)}`);
      const data = await res.json();
      setAlerts(data.alerts ?? []);
    } finally {
      setLoading(false);
    }
  }

  function handleEmailSubmit() {
    if (!emailInput.trim()) return;
    localStorage.setItem("scout-email", emailInput.trim());
    setEmail(emailInput.trim());
    fetchAlerts(emailInput.trim());
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--ink-soft)" }}>Loading…</div>;
  }

  if (!email) {
    return (
      <div style={{ padding: 40, textAlign: "center", display: "grid", gap: 16, maxWidth: 400, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>See your alerts</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>Enter the email you used when saving an alert.</p>
        <input
          type="email"
          placeholder="your@email.com"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
          style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 13, fontSize: 16 }}
        />
        <Btn onClick={handleEmailSubmit}>View my alerts</Btn>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Saved alerts</h1>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            {alerts.length} alert{alerts.length === 1 ? "" : "s"} for {email}
          </div>
        </div>
        <Btn variant="ghost" size="sm" onClick={() => {
          localStorage.removeItem("scout-email");
          setEmail(null);
          setAlerts([]);
        }}>
          Switch email
        </Btn>
      </header>

      {alerts.length === 0 && (
        <div style={{ padding: 28, textAlign: "center", color: "var(--ink-soft)", background: "var(--surface)", borderRadius: 20 }}>
          No alerts yet for {email}. <Link href="/app/search" style={{ color: "var(--primary)" }}>Build one →</Link>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {alerts.map((a: Alert) => (
          <article
            key={a.id}
            style={{ background: "var(--surface)", borderRadius: 20, padding: 18, boxShadow: "0 1px 2px rgba(28,32,28,0.05)", display: "grid", gap: 8 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{a.name}</h3>
                  <FreqBadge freq={a.frequency} />
                  {!a.active && <Chip tone="outline" size="sm">Paused</Chip>}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 4, fontFamily: "var(--mono)" }}>
                  {a.last_notified_at ? `Last sent: ${new Date(a.last_notified_at).toLocaleString()}` : "Not sent yet"}
                </div>
              </div>
              <AlertToggleClient id={a.id} active={a.active} />
            </div>
            <SummaryChips criteria={a.criteria} mode={a.mode} />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <Btn href={`/app/alerts/${a.id}/preview`} variant="ghost" size="sm">Preview digest</Btn>
              <Btn href="/app/search" variant="ghost" size="sm">Edit</Btn>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}