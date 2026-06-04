"use client";
import Link from "next/link";
import type { Listing } from "@/lib/db.types";
import { fmtPrice } from "@/lib/format";
import { MatchBadge, PhotoPlaceholder, Chip } from "./ui";

export function ListingCard({
  listing,
  matchScore,
  density = "regular",
}: {
  listing: Listing;
  matchScore?: number;
  density?: "compact" | "regular" | "comfy";
}) {
  const pad = density === "compact" ? 12 : density === "comfy" ? 20 : 16;
  return (
    <Link
      href={`/app/listings/${encodeURIComponent(listing.id)}`}
      style={{
        display: "block",
        background: "var(--surface)",
        borderRadius: 20,
        boxShadow: "0 1px 2px rgba(28,32,28,0.05), 0 6px 16px rgba(28,32,28,0.04)",
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ position: "relative" }}>
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photos[0]}
            alt={listing.address}
            style={{ width: "100%", height: 184, objectFit: "cover", display: "block" }}
          />
        ) : (
          <PhotoPlaceholder label={listing.property_type.toLowerCase()} height={184} radius={0} />
        )}
        {typeof matchScore === "number" && (
          <div style={{ position: "absolute", top: 12, left: 12 }}>
            <MatchBadge pct={matchScore} dark />
          </div>
        )}
      </div>
      <div style={{ padding: pad }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: "var(--mono)", fontWeight: 600, fontSize: 18 }}>
            {fmtPrice(listing.price, listing.mode)}
          </div>
          {typeof matchScore === "number" && matchScore < 92 && <MatchBadge pct={matchScore} />}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 6 }}>{listing.address}</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>
          {listing.hood ? `${listing.hood} · ` : ""}
          {listing.city}
        </div>
        <div style={{ height: 1, background: "var(--line)", margin: "12px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink-soft)" }}>
            {listing.beds} bd · {listing.baths} ba
            {listing.sqft ? ` · ${listing.sqft.toLocaleString()} sqft` : ""}
          </div>
        </div>
        {listing.features.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            {listing.features.slice(0, 3).map((f) => (
              <Chip key={f} tone="neutral" size="sm">
                {f.replace(/-/g, " ")}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ListingRow({
  listing,
  matchScore,
}: {
  listing: Listing;
  matchScore?: number;
}) {
  return (
    <Link
      href={`/app/listings/${encodeURIComponent(listing.id)}`}
      style={{
        display: "flex",
        gap: 12,
        background: "var(--surface)",
        borderRadius: 13,
        padding: 12,
        boxShadow: "0 1px 2px rgba(28,32,28,0.05)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ width: 104, height: 88, flexShrink: 0, borderRadius: 9, overflow: "hidden" }}>
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photos[0]}
            alt={listing.address}
            style={{ width: 104, height: 88, objectFit: "cover" }}
          />
        ) : (
          <PhotoPlaceholder label={listing.property_type.toLowerCase()} height={88} radius={9} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--mono)", fontWeight: 600, fontSize: 15 }}>
          {fmtPrice(listing.price, listing.mode)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {listing.address}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
          {listing.hood ? `${listing.hood} · ` : ""}
          {listing.city}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-faint)" }}>
            {listing.beds}bd · {listing.baths}ba{listing.sqft ? ` · ${listing.sqft.toLocaleString()}` : ""}
          </div>
          {typeof matchScore === "number" && <MatchBadge pct={matchScore} />}
        </div>
      </div>
    </Link>
  );
}
