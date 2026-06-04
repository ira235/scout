"use client";
import { useEffect, useState } from "react";
import { Btn, Segmented } from "@/components/ui";
import { useTheme } from "@/components/theme-provider";
import { THEME_NAMES, type ThemeName } from "@/lib/themes";
import type { DigestFreq, UserSettings } from "@/lib/db.types";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/settings");
      if (r.ok) setSettings(await r.json());
    })();
  }, []);

  async function patch(patch: Partial<UserSettings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Settings</h1>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{saving ? "Saving…" : "Up to date"}</div>
      </header>

      <Section title="Default frequency">
        <Segmented<DigestFreq>
          value={settings?.default_freq ?? "DAILY"}
          onChange={(v) => patch({ default_freq: v })}
          options={[
            { value: "INSTANT", label: "Instant" },
            { value: "DAILY", label: "Daily" },
            { value: "WEEKLY", label: "Weekly" },
          ]}
        />
      </Section>

      <Section title="Send time" hint={`${settings?.send_hour ?? 8}:00 ${settings?.timezone ?? "America/Los_Angeles"}`}>
        <input
          type="range"
          min={0}
          max={23}
          value={settings?.send_hour ?? 8}
          onChange={(e) => patch({ send_hour: parseInt(e.target.value, 10) })}
          className="scout-range"
          style={{ width: "100%", appearance: "none", height: 6, borderRadius: 999 }}
        />
      </Section>

      <Section title="Per-email cap" hint={`${settings?.per_email_cap ?? 10} listings`}>
        <input
          type="range"
          min={1}
          max={25}
          value={settings?.per_email_cap ?? 10}
          onChange={(e) => patch({ per_email_cap: parseInt(e.target.value, 10) })}
          className="scout-range"
          style={{ width: "100%", appearance: "none", height: 6, borderRadius: 999 }}
        />
      </Section>

      <Section title="High match only">
        <ToggleRow
          on={settings?.high_match_only ?? false}
          onChange={(v) => patch({ high_match_only: v })}
          label="Only show matches at 85% or higher"
        />
      </Section>

      <Section title="Hide pending sales">
        <ToggleRow
          on={settings?.hide_pending ?? true}
          onChange={(v) => patch({ hide_pending: v })}
          label="Skip listings already in pending status"
        />
      </Section>

      <Section title="Push notifications">
        <ToggleRow
          on={settings?.push_enabled ?? true}
          onChange={(v) => patch({ push_enabled: v })}
          label="Send a push when a high-match listing arrives"
        />
      </Section>

      <Section title="Theme">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {THEME_NAMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                patch({ theme: t.id });
              }}
              style={{
                border: theme === t.id ? "2px solid var(--primary)" : "1px solid var(--line)",
                background: "var(--surface)",
                padding: "10px 14px",
                borderRadius: 13,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Btn href="/auth/sign-out" variant="ghost">
        Sign out
      </Btn>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "var(--surface)", padding: 18, borderRadius: 20, boxShadow: "0 1px 2px rgba(28,32,28,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--ink-soft)" }}>
          {title}
        </div>
        {hint && <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-faint)" }}>{hint}</div>}
      </div>
      {children}
    </section>
  );
}

function ToggleRow({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer" }}>
      <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>{label}</span>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => onChange(!on)}
        style={{
          position: "relative",
          width: 44,
          height: 26,
          borderRadius: 999,
          background: on ? "var(--primary)" : "rgba(28,32,28,0.18)",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: on ? 21 : 3,
            width: 20,
            height: 20,
            background: "#fff",
            borderRadius: 999,
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "left .15s",
          }}
        />
      </button>
    </label>
  );
}
