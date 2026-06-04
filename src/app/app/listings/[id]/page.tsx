import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { fmtPrice } from "@/lib/format";
import { Btn, Chip, MatchBadge, PhotoPlaceholder } from "@/components/ui";
import type { Listing } from "@/lib/db.types";

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: listing } = await sb.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing) return notFound();

  const {
    data: { user },
  } = await sb.auth.getUser();

  let topReasons: string[] = [];
  let matchScore: number | null = null;
  if (user) {
    const { data: m } = await sb
      .from("alert_matches")
      .select("match_score, alerts:alert_id(criteria)")
      .eq("listing_id", id)
      .order("match_score", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (m) {
      matchScore = m.match_score;
      const c = (m.alerts as unknown as { criteria: unknown } | null)?.criteria;
      const { CriteriaSchema } = await import("@/lib/criteria");
      const { scoreListing } = await import("@/lib/match");
      const parsed = CriteriaSchema.safeParse(c);
      if (parsed.success) {
        topReasons = scoreListing(listing as Listing, parsed.data).reasons.slice(0, 3);
      }
    }
  }

  return (
    <article style={{ display: "grid", gap: 18 }}>
      <a href="/app/matches" style={{ fontSize: 13, color: "var(--ink-soft)", textDecoration: "none" }}>
        ← Back to matches
      </a>
      <div style={{ borderRadius: 20, overflow: "hidden", background: "var(--surface)", boxShadow: "0 1px 2px rgba(28,32,28,0.05)" }}>
        {listing.photos?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photos[0]} alt={listing.address} style={{ width: "100%", height: 360, objectFit: "cover" }} />
        ) : (
          <PhotoPlaceholder label={listing.property_type.toLowerCase()} height={360} radius={0} />
        )}
        <div style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 600, fontSize: 26 }}>
              {fmtPrice(listing.price, listing.mode)}
            </div>
            {matchScore !== null && <MatchBadge pct={matchScore} />}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 10 }}>{listing.address}</h1>
          <div style={{ fontSize: 14, color: "var(--ink-soft)" }}>
            {listing.hood ? `${listing.hood} · ` : ""}{listing.city}
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 16, fontFamily: "var(--mono)", fontSize: 14, color: "var(--ink-soft)", flexWrap: "wrap" }}>
            <span>{listing.beds} bd</span><span>·</span><span>{listing.baths} ba</span>
            {listing.sqft && (<><span>·</span><span>{listing.sqft.toLocaleString()} sqft</span></>)}
            {listing.year_built && (<><span>·</span><span>built {listing.year_built}</span></>)}
          </div>
          {listing.description && (
            <p style={{ marginTop: 16, fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.6 }}>{listing.description}</p>
          )}
          {listing.features.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16 }}>
              {listing.features.map((f: string) => (
                <Chip key={f} tone="neutral" size="sm">{f.replace(/-/g, " ")}</Chip>
              ))}
            </div>
          )}
        </div>
      </div>

      {topReasons.length > 0 && (
        <section style={{ background: "var(--surface)", padding: 22, borderRadius: 20, boxShadow: "0 1px 2px rgba(28,32,28,0.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--ink-soft)", marginBottom: 10 }}>
            Why Scout flagged this
          </div>
          <ul style={{ display: "grid", gap: 8, margin: 0, paddingLeft: 18 }}>
            {topReasons.map((r, i) => (<li key={i} style={{ fontSize: 14 }}>{r}</li>))}
          </ul>
        </section>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <Btn variant="primary" full>Save to favorites</Btn>
        <Btn variant="ghost">Share</Btn>
      </div>
    </article>
  );
}
