import type { RawListing, ListingProvider } from "../listing-provider";
import { normalizeFeatures } from "../criteria";
import type { PropertyType } from "../db.types";

// Rentcast provider — thin adapter for rentcast.io.
// Docs: https://developers.rentcast.io/  (endpoints subject to change)
// We only implement listings/sale and listings/rental.
const BASE = "https://api.rentcast.io/v1";

interface RentcastRow {
  id: string;
  formattedAddress?: string;
  addressLine1?: string;
  city: string;
  state: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  price?: number;
  rent?: number;
  status?: string;
  listedDate?: string;
  publishedDate?: string;
  photos?: string[];
  features?: string[];
  description?: string;
  hoa?: { fee?: number };
  neighborhood?: { name?: string };
}

function toPropertyType(t?: string): PropertyType {
  const s = (t || "").toLowerCase();
  if (s.includes("town")) return "TOWNHOME";
  if (s.includes("condo")) return "CONDO";
  if (s.includes("apart") || s.includes("multi")) return "APARTMENT";
  return "HOUSE";
}

export class RentcastProvider implements ListingProvider {
  key = "rentcast";

  private async req(path: string, params: Record<string, string | number>): Promise<RentcastRow[]> {
    const key = process.env.RENTCAST_API_KEY;
    if (!key) throw new Error("RENTCAST_API_KEY missing");
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const res = await fetch(url, {
      headers: { "X-Api-Key": key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Rentcast ${res.status} ${path}`);
    const json = await res.json();
    return Array.isArray(json) ? (json as RentcastRow[]) : [];
  }

  private normalize(r: RentcastRow, mode: "BUY" | "RENT", source: string): RawListing {
    const priceCents = mode === "RENT" ? Math.round((r.rent ?? 0) * 100) : Math.round((r.price ?? 0) * 100);
    return {
      id: `rentcast:${r.id}`,
      source,
      mode,
      status: (r.status?.toUpperCase() as RawListing["status"]) || "ACTIVE",
      price: priceCents,
      address: r.formattedAddress || r.addressLine1 || "Unknown",
      hood: r.neighborhood?.name ?? null,
      city: `${r.city}, ${r.state}`,
      state: r.state,
      zip: r.zipCode ?? null,
      lat: r.latitude,
      lng: r.longitude,
      beds: r.bedrooms ?? 0,
      baths: r.bathrooms ?? 0,
      sqft: r.squareFootage ?? null,
      lotSqft: r.lotSize ?? null,
      yearBuilt: r.yearBuilt ?? null,
      propertyType: toPropertyType(r.propertyType),
      features: normalizeFeatures(r.features ?? []),
      description: r.description ?? null,
      photos: r.photos ?? [],
      postedAt: r.listedDate || r.publishedDate || new Date().toISOString(),
    };
  }

  async fetchNew({ since, cities }: { since: Date; cities: string[] }): Promise<RawListing[]> {
    const out: RawListing[] = [];
    for (const c of cities) {
      const [city, state] = c.split(",").map((s) => s.trim());
      const params = { city, state: state ?? "", limit: 100 };
      try {
        const sale = await this.req("/listings/sale", params);
        sale
          .filter((r) => !r.listedDate || new Date(r.listedDate) >= since)
          .forEach((r) => out.push(this.normalize(r, "BUY", "rentcast/sale")));
      } catch (e) {
        console.error("[rentcast] sale fetch failed", e);
      }
      try {
        const rent = await this.req("/listings/rental", params);
        rent
          .filter((r) => !r.listedDate || new Date(r.listedDate) >= since)
          .forEach((r) => out.push(this.normalize(r, "RENT", "rentcast/rental")));
      } catch (e) {
        console.error("[rentcast] rental fetch failed", e);
      }
    }
    return out;
  }

  async fetchById(id: string): Promise<RawListing | null> {
    // id format: "rentcast:<provider id>"
    const raw = id.split(":")[1] ?? id;
    try {
      const sale = await this.req(`/listings/sale/${raw}`, {});
      if (sale.length) return this.normalize(sale[0], "BUY", "rentcast/sale");
    } catch {}
    try {
      const rent = await this.req(`/listings/rental/${raw}`, {});
      if (rent.length) return this.normalize(rent[0], "RENT", "rentcast/rental");
    } catch {}
    return null;
  }
}
