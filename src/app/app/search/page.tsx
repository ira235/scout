"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Btn, Chip, Segmented } from "@/components/ui";
import { CANONICAL_FEATURES, type Criteria } from "@/lib/criteria";
import { fmtPrice } from "@/lib/format";
import type { ParsePromptResponse } from "@/lib/criteria";
import type { PropertyType } from "@/lib/db.types";

const PROMPT_EXAMPLES = [
  "3-bed house under $700k with a garden in a walkable neighborhood",
  "Pet-friendly 2-bed rental near transit, in-unit laundry, under $2,800",
  "Move-in ready place close to a park, quiet street, garage",
];

const FEATURE_LABELS: Record<string, string> = Object.fromEntries(
  CANONICAL_FEATURES.map((f) => [f, f.replace(/-/g, " ")])
);

const PROPERTY_LABELS: Record<PropertyType, string> = {
  HOUSE: "House",
  TOWNHOME: "Townhome",
  CONDO: "Condo",
  APARTMENT: "Apartment",
};

const CITY_OPTIONS = ["Portland, OR", "Seattle, WA", "Austin, TX"];

type Layout = "toggle" | "stacked" | "wizard";

const DEFAULT_CRITERIA: Criteria = {
  mode: "BUY",
  location: { cities: ["Portland, OR"], neighborhoods: [], polygon: undefined },
  priceMax: 70_000_000,
  priceMin: 0,
  bedsMin: 0,
  bathsMin: 0,
  propertyTypes: [],
  features: [],
  excludeFeatures: [],
};

function persistDraft(c: Criteria, prompt: string) {
  try {
    sessionStorage.setItem("scout-draft", JSON.stringify({ c, prompt }));
  } catch {}
}
function loadDraft(): { c: Criteria; prompt: string } | null {
  try {
    const raw = sessionStorage.getItem("scout-draft");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const layout = (params.get("style") as Layout) || "toggle";

  const [prompt, setPrompt] = useState("");
  const [criteria, setCriteria] = useState<Criteria>(DEFAULT_CRITERIA);
  const [parseInfo, setParseInfo] = useState<{ confidence: number; unparsed: string[] } | null>(null);
  const [parsing, setParsing] = useState(false);
  const [tab, setTab] = useState<"prompt" | "filters">("prompt");

  useEffect(() => {
    const d = loadDraft();
    if (d) {
      setCriteria(d.c);
      setPrompt(d.prompt);
    }
  }, []);

  useEffect(() => {
    persistDraft(criteria, prompt);
  }, [criteria, prompt]);

  async function parse() {
    if (!prompt.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/parse-prompt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await res.json()) as ParsePromptResponse;
      setCriteria(data.criteria);
      setParseInfo({ confidence: data.confidence, unparsed: data.unparsed });
    } catch (e) {
      console.error(e);
    } finally {
      setParsing(false);
    }
  }

  function goSeeMatches() {
    persistDraft(criteria, prompt);
    router.push("/app/matches");
  }

  const isRent = criteria.mode === "RENT";
  const priceBounds = isRent ? { min: 80_000, max: 600_000, step: 5_000 } : { min: 25_000_000, max: 1_500_000_000, step: 500_000 };

  const summaryChips = useMemo(() => {
    const out: string[] = [];
    out.push(criteria.mode === "BUY" ? "Buy" : "Rent");
    if (criteria.bedsMin > 0) out.push(`${criteria.bedsMin}+ bed`);
    if (criteria.bathsMin > 0) out.push(`${criteria.bathsMin}+ bath`);
    out.push(`≤ ${fmtPrice(criteria.priceMax, criteria.mode)}`);
    if (criteria.propertyTypes.length) out.push(criteria.propertyTypes.map((t) => PROPERTY_LABELS[t]).join(", "));
    if (criteria.location.cities.length) out.push(criteria.location.cities[0]);
    criteria.features.slice(0, 3).forEach((f) => out.push(FEATURE_LABELS[f] ?? f));
    return out;
  }, [criteria]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", color: "var(--primary)", fontWeight: 600, fontSize: 13 }}>◆ SCOUT</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>Describe what you&apos;re looking for</h1>
        </div>
        {layout === "toggle" && (
          <Segmented
            value={tab}
            onChange={(v) => setTab(v)}
            options={[
              { value: "prompt", label: "Prompt" },
              { value: "filters", label: "Filters" },
            ]}
          />
        )}
      </header>

      {(layout === "stacked" || tab === "prompt" || layout === "wizard") && (
        <section style={{ background: "var(--surface)", padding: 20, borderRadius: 20, boxShadow: "0 1px 2px rgba(28,32,28,0.05)" }}>
          <textarea
            placeholder="e.g. 2-bed pet-friendly rental under $2,800 in Portland"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{
              width: "100%",
              minHeight: 100,
              padding: 14,
              border: "1px solid var(--line)",
              borderRadius: 13,
              background: "var(--bg)",
              fontFamily: "var(--sans)",
              fontSize: 16,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {PROMPT_EXAMPLES.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                style={{
                  border: "1px dashed var(--line)",
                  background: "transparent",
                  padding: "8px 12px",
                  borderRadius: 999,
                  fontSize: 13,
                  cursor: "pointer",
                  color: "var(--ink-soft)",
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, alignItems: "center", gap: 12 }}>
            <Btn variant="ghost" size="sm" onClick={parse} disabled={parsing || !prompt.trim()}>
              {parsing ? "Parsing…" : "Parse with Scout"}
            </Btn>
            {parseInfo && (
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-soft)" }}>
                confidence {Math.round(parseInfo.confidence * 100)}%
              </div>
            )}
          </div>

          {parseInfo && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
                Scout understood
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {summaryChips.map((c, i) => (
                  <Chip key={i} tone={i === 0 ? "primary" : "neutral"} size="sm">
                    {c}
                  </Chip>
                ))}
              </div>
              {parseInfo.unparsed.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-faint)" }}>
                  Couldn&apos;t map: {parseInfo.unparsed.join(", ")}. Refine in Filters →
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {(layout === "stacked" || tab === "filters" || layout === "wizard") && (
        <section style={{ background: "var(--surface)", padding: 20, borderRadius: 20, display: "grid", gap: 18, boxShadow: "0 1px 2px rgba(28,32,28,0.05)" }}>
          <div>
            <FieldLabel>Mode</FieldLabel>
            <Segmented
              value={criteria.mode}
              onChange={(v) => setCriteria({ ...criteria, mode: v })}
              options={[
                { value: "BUY", label: "Buy" },
                { value: "RENT", label: "Rent" },
              ]}
            />
          </div>

          <div>
            <FieldLabel>City</FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CITY_OPTIONS.map((c) => {
                const on = criteria.location.cities.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() =>
                      setCriteria({
                        ...criteria,
                        location: {
                          ...criteria.location,
                          cities: on
                            ? criteria.location.cities.filter((x) => x !== c)
                            : [...criteria.location.cities, c],
                        },
                      })
                    }
                    style={pickerBtn(on)}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <FieldLabel hint={fmtPrice(criteria.priceMax, criteria.mode)}>Max price</FieldLabel>
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              step={priceBounds.step}
              value={Math.min(Math.max(criteria.priceMax, priceBounds.min), priceBounds.max)}
              onChange={(e) => setCriteria({ ...criteria, priceMax: parseInt(e.target.value, 10) })}
              className="scout-range"
              style={{
                width: "100%",
                appearance: "none",
                height: 6,
                borderRadius: 999,
                background: `linear-gradient(to right, var(--primary) ${
                  ((Math.min(criteria.priceMax, priceBounds.max) - priceBounds.min) /
                    (priceBounds.max - priceBounds.min)) *
                  100
                }%, rgba(28,32,28,0.10) 0%)`,
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-faint)" }}>
              <span>{fmtPrice(priceBounds.min, criteria.mode)}</span>
              <span>{fmtPrice(priceBounds.max, criteria.mode)}+</span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <FieldLabel>Beds</FieldLabel>
              <Segmented
                size="sm"
                value={criteria.bedsMin}
                onChange={(v) => setCriteria({ ...criteria, bedsMin: v })}
                options={[0, 1, 2, 3, 4].map((n) => ({ value: n, label: n === 0 ? "Any" : `${n}+` }))}
              />
            </div>
            <div>
              <FieldLabel>Baths</FieldLabel>
              <Segmented
                size="sm"
                value={criteria.bathsMin}
                onChange={(v) => setCriteria({ ...criteria, bathsMin: v })}
                options={[0, 1, 2, 3].map((n) => ({ value: n, label: n === 0 ? "Any" : `${n}+` }))}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Property type</FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(Object.keys(PROPERTY_LABELS) as PropertyType[]).map((t) => {
                const on = criteria.propertyTypes.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() =>
                      setCriteria({
                        ...criteria,
                        propertyTypes: on
                          ? criteria.propertyTypes.filter((x) => x !== t)
                          : [...criteria.propertyTypes, t],
                      })
                    }
                    style={pickerBtn(on)}
                  >
                    {PROPERTY_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <FieldLabel>Must-have features</FieldLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CANONICAL_FEATURES.map((f) => {
                const on = criteria.features.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() =>
                      setCriteria({
                        ...criteria,
                        features: on ? criteria.features.filter((x) => x !== f) : [...criteria.features, f],
                      })
                    }
                    style={pickerBtn(on, "accent")}
                  >
                    {FEATURE_LABELS[f]}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Btn full onClick={goSeeMatches}>
          See matches →
        </Btn>
      </div>

      <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
        Layout variant: <span style={{ fontFamily: "var(--mono)" }}>{layout}</span> · try{" "}
        <a href="/app/search?style=stacked" style={{ color: "var(--primary)" }}>?style=stacked</a> ·{" "}
        <a href="/app/search?style=wizard" style={{ color: "var(--primary)" }}>?style=wizard</a>
      </div>
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 9 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--ink-soft)" }}>
        {children}
      </span>
      {hint && <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--green-deep)" }}>{hint}</span>}
    </div>
  );
}

function pickerBtn(on: boolean, tone: "primary" | "accent" = "primary"): React.CSSProperties {
  return {
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--sans)",
    fontWeight: 600,
    fontSize: 14,
    padding: "9px 14px",
    borderRadius: 999,
    background: on ? (tone === "accent" ? "var(--clay-tint)" : "var(--green-tint)") : "rgba(28,32,28,0.05)",
    color: on ? (tone === "accent" ? "var(--clay-deep)" : "var(--green-deep)") : "var(--ink-soft)",
    boxShadow: on ? `inset 0 0 0 1.5px ${tone === "accent" ? "var(--accent)" : "var(--primary)"}` : "none",
    transition: "all .14s",
    textTransform: "capitalize",
  };
}
