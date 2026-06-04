import type { RawListing, ListingProvider } from "../listing-provider";
import { normalizeFeatures } from "../criteria";
import type { PropertyType } from "../db.types";

// US Real Estate Listings (RapidAPI)
//   host: us-real-estate-listings.p.rapidapi.com
//   docs: https://rapidapi.com/datascraper/api/us-real-estate-listings
// Endpoints used:
//   GET /for-sale?location=<city, state>&offset=&limit=
//   GET /for-rent?location=<city, state>&offset=&limit=
//   GET /propertyDetails?property_id=<id>
const HOST = process.env.RAPIDAPI_HOST || "us-real-estate-listings.p.rapidapi.com";
const BASE = `https://${HOST}`;

interface RapidListing {
  property_id?: string;
  listing_id?: string;
  status?: string;
  list_price?: number | null;
  list_date?: string | null;
  primary_photo?: { href?: string | null } | null;
  photos?: { href?: string | null }[] | null;
  tags?: string[] | null;
  description?: {
    beds?: number | null;
    baths?: number | null;
    sqft?: number | null;
    lot_sqft?: number | null;
    type?: string | null;
    sub_type?: string | null;
    year_built?: number | null;
    text?: string | null;
  } | null;
  location?: {
    neighborhoods?: { name?: string }[] | null;
    address?: {
      line?: string;
      city?: string;
      state_code?: string;
      state?: string;
      postal_code?: string;
      coordinate?: { lat?: number; lon?: number } | null;
    } | null;
  } | null;
}

function toPropertyType(t?: string | null, sub?: string | null): PropertyType {
  const s = `${t || ""} ${sub || ""}`.toLowerCase();
  if (s.includes("town")) return "TOWNHOME";
  if (s.includes("condo")) return "CONDO";
  if (s.includes("apartment") || s.includes("multi") || s.includes("co-op") || s.includes("coop")) return "APARTMENT";
  return "HOUSE";
}

function rapidId(r: RapidListing): string {
  return `rapidapi:${r.property_id || r.listing_id || crypto.randomUUID()}`;
}

export class RapidApiProvider implements ListingProvider {
  key = "rapidapi";

  private async req<T>(path: string, params: Record<string, string | number>): Promise<T> {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) throw new Error("RAPIDAPI_KEY missing");
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const t0 = Date.now();
    console.log(`[rapidapi] GET ${path}?${url.searchParams.toString()}`);
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-host": HOST,
        "x-rapidapi-key": key,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const ms = Date.now() - t0;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[rapidapi] ${res.status} ${path} (${ms}ms): ${body.slice(0, 300)}`);
      throw new Error(`RapidAPI ${res.status} ${path}: ${body.slice(0, 200)}`);
    }
    const json = (await res.json()) as T;
    console.log(`[rapidapi] OK ${path} (${ms}ms)`);
    return json;
  }

  private normalize(r: RapidListing, mode: "BUY" | "RENT", source: string): RawListing | null {
    const a = r.location?.address;
    const c = a?.coordinate;
    const lat = c?.lat ?? null;
    const lng = c?.lon ?? null;
    if (lat == null || lng == null) return null;
    if (!a?.city || !a?.state_code) return null;

    const dollars = r.list_price ?? 0;
    if (!dollars) return null;
    const priceCents = Math.round(dollars * 100);

    const photos: string[] = [];
    if (r.primary_photo?.href) photos.push(r.primary_photo.href);
    for (const p of r.photos ?? []) {
      if (p?.href && !photos.includes(p.href)) photos.push(p.href);
      if (photos.length >= 8) break;
    }

    const hood = r.location?.neighborhoods?.[0]?.name ?? null;

    const status: RawListing["status"] =
      r.status === "for_sale" || r.status === "for_rent" || r.status === "active"
        ? "ACTIVE"
        : r.status === "pending"
          ? "PENDING"
          : r.status === "sold"
            ? "SOLD"
            : "ACTIVE";

    return {
      id: rapidId(r),
      source,
      mode,
      status,
      price: priceCents,
      address: a.line || "Unknown",
      hood,
      city: `${a.city}, ${a.state_code}`,
      state: a.state_code,
      zip: a.postal_code ?? null,
      lat,
      lng,
      beds: r.description?.beds ?? 0,
      baths: r.description?.baths ?? 0,
      sqft: r.description?.sqft ?? null,
      lotSqft: r.description?.lot_sqft ?? null,
      yearBuilt: r.description?.year_built ?? null,
      propertyType: toPropertyType(r.description?.type, r.description?.sub_type),
      features: normalizeFeatures(r.tags ?? []),
      description: r.description?.text ?? null,
      photos,
      postedAt: r.list_date || new Date().toISOString(),
    };
  }

  async fetchNew({ since, cities }: { since: Date; cities: string[] }): Promise<RawListing[]> {
    const out: RawListing[] = [];
    const limit = Number(process.env.RAPIDAPI_LIMIT || 25);
    console.log(`[rapidapi] fetchNew cities=${cities.join("|")} limit=${limit} since=${since.toISOString()}`);

    for (const c of cities) {
      for (const [path, mode, source] of [
        ["/for-sale", "BUY", "rapidapi/for-sale"],
        ["/for-rent", "RENT", "rapidapi/for-rent"],
      ] as const) {
        try {
          const json = await this.req<{ listings?: RapidListing[]; totalResultCount?: number }>(path, {
            location: c,
            offset: 0,
            limit,
          });
          const raw = json.listings ?? [];
          let kept = 0;
          let dropped = 0;
          for (const r of raw) {
            if (r.list_date && new Date(r.list_date) < since) {
              dropped++;
              continue;
            }
            const norm = this.normalize(r, mode, source);
            if (norm) {
              out.push(norm);
              kept++;
            } else {
              dropped++;
            }
          }
          console.log(
            `[rapidapi] ${path} city="${c}" raw=${raw.length} kept=${kept} dropped=${dropped} total=${json.totalResultCount ?? "?"}`,
          );
        } catch (e) {
          console.error(`[rapidapi] ${path} ${c} failed`, e);
        }
      }
    }
    console.log(`[rapidapi] fetchNew returning ${out.length} normalized listings`);
    return out;
  }

  async fetchById(id: string): Promise<RawListing | null> {
    const raw = id.startsWith("rapidapi:") ? id.slice("rapidapi:".length) : id;
    try {
      const json = await this.req<{ listing?: RapidListing; data?: RapidListing }>(
        "/propertyDetails",
        { property_id: raw },
      );
      const row = json.listing || json.data;
      if (!row) return null;
      const mode = row.status === "for_rent" ? "RENT" : "BUY";
      return this.normalize(row, mode, `rapidapi/${mode === "RENT" ? "for-rent" : "for-sale"}`);
    } catch (e) {
      console.error("[rapidapi] fetchById failed", e);
      return null;
    }
  }
}
