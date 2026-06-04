"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Segmented, Chip } from "@/components/ui";
import { ListingCard, ListingRow } from "@/components/listing";
import type { Listing, DigestFreq } from "@/lib/db.types";
import type { Criteria } from "@/lib/criteria";
import { scoreListing } from "@/lib/match";

type Sort = "best" | "price" | "newest";
type Layout = "card" | "list";
type Density = "compact" | "regular" | "comfy";

interface ScoredListing {
  listing: Listing;
  score: number;
}

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

export default function MatchesPage() {
  const router = useRouter();
  const [criteria, setCriteria] = useState<Criteria>(DEFAULT_CRITERIA);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [sort, setSort] = useState<Sort>("best");
  const [layout, setLayout] = useState<Layout>("card");
  const [density, setDensity] = useState<Density>("regular");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [alertName, setAlertName] = useState("");
  const [alertFreq, setAlertFreq] = useState<DigestFreq>("DAILY");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("scout-draft");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.c) setCriteria(d.c);
        if (d.prompt) setDraftPrompt(d.prompt);
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/listings/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ criteria }),
        });
        const data = await res.json();
        if (!cancelled) setListings(data.listings ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [criteria]);

  const scored = useMemo<ScoredListing[]>(() => {
    const list = listings.map((l) => ({ listing: l, score: scoreListing(l, criteria).total }));
    list.sort((a, b) => {
      if (sort === "price") return a.listing.price - b.listing.price;
      if (sort === "newest")
        return new Date(b.listing.posted_at).getTime() - new Date(a.listing.posted_at).getTime();
      return b.score - a.score;
    });
    return list;
  }, [listings, criteria, sort]);

  async function saveAlert() {
    if (!alertName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: alertName.trim(),
          mode: criteria.mode,
          criteria,
          rawPrompt: draftPrompt || null,
          frequency: alertFreq,
        }),
      });
      if (!res.ok) {
        const t = await res.json().catch(() => null);
        alert(`Save failed: ${t?.error ?? res.status}`);
        return;
      }
      router.push("/app/alerts");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Matches</h1>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            {loading ? "Searching…" : `${scored.length} listing${scored.length === 1 ? "" : "s"}`}
            {criteria.location.cities.length > 0 && ` in ${criteria.location.cities.join(", ")}`}
          </div>
        </div>
        <Btn size="sm" onClick={() => setShowSave(true)}>
          Save as alert
        </Btn>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Chip tone="primary" size="sm">{criteria.mode === "BUY" ? "Buy" : "Rent"}</Chip>
        {criteria.bedsMin > 0 && <Chip size="sm">{criteria.bedsMin}+ bed</Chip>}
        {criteria.bathsMin > 0 && <Chip size="sm">{criteria.bathsMin}+ bath</Chip>}
        <Chip size="sm">≤ ${(criteria.priceMax / 100).toLocaleString()}</Chip>
        {criteria.features.slice(0, 4).map((f) => (
          <Chip key={f} tone="accent" size="sm">{f.replace(/-/g, " ")}</Chip>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap" }}>
        <Segmented<Sort>
          size="sm"
          value={sort}
          onChange={setSort}
          options={[
            { value: "best", label: "Best match" },
            { value: "price", label: "Price" },
            { value: "newest", label: "Newest" },
          ]}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Segmented<Layout>
            size="sm"
            value={layout}
            onChange={setLayout}
            options={[
              { value: "card", label: "Cards" },
              { value: "list", label: "List" },
            ]}
          />
          <Segmented<Density>
            size="sm"
            value={density}
            onChange={setDensity}
            options={[
              { value: "compact", label: "Compact" },
              { value: "regular", label: "Regular" },
              { value: "comfy", label: "Comfy" },
            ]}
          />
        </div>
      </div>

      {layout === "card" ? (
        <div
          style={{
            display: "grid",
            gap: density === "compact" ? 10 : density === "comfy" ? 20 : 14,
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {scored.map(({ listing, score }) => (
            <ListingCard key={listing.id} listing={listing} matchScore={score} density={density} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {scored.map(({ listing, score }) => (
            <ListingRow key={listing.id} listing={listing} matchScore={score} />
          ))}
        </div>
      )}

      {!loading && scored.length === 0 && (
        <div style={{ padding: 28, textAlign: "center", color: "var(--ink-soft)", background: "var(--surface)", borderRadius: 20 }}>
          No matches yet. Loosen filters or try a different city.
        </div>
      )}

      {showSave && (
        <div
          role="dialog"
          aria-modal
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 80,
            padding: 16,
          }}
          onClick={() => !saving && setShowSave(false)}
        >
          <div
            style={{ background: "var(--surface)", borderRadius: 20, padding: 20, width: "100%", maxWidth: 420, display: "grid", gap: 14 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 800, fontSize: 18 }}>Save alert</div>
            <input
              autoFocus
              placeholder="Alert name (e.g. Walkable 2-bed rental)"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 13, fontSize: 16 }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--ink-soft)", marginBottom: 8 }}>
                Frequency
              </div>
              <Segmented<DigestFreq>
                value={alertFreq}
                onChange={setAlertFreq}
                options={[
                  { value: "INSTANT", label: "Instant" },
                  { value: "DAILY", label: "Daily" },
                  { value: "WEEKLY", label: "Weekly" },
                ]}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setShowSave(false)}>
                Cancel
              </Btn>
              <Btn onClick={saveAlert} disabled={saving || !alertName.trim()}>
                {saving ? "Saving…" : "Save"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
