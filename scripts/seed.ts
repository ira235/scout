// One-shot seed: insert the 30 demo listings into your Supabase DB.
// Usage: `npm run seed`. Requires SUPABASE_SERVICE_ROLE_KEY.
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { supabaseService } from "../src/lib/supabase";
import { SEED_LISTINGS } from "../src/lib/seed-listings";
import { normalizeFeatures } from "../src/lib/criteria";

async function main() {
  const sb = supabaseService();
  const rows = SEED_LISTINGS.map((r) => ({
    id: r.id,
    source: r.source,
    mode: r.mode,
    status: "ACTIVE" as const,
    price: r.price,
    address: r.address,
    hood: r.hood ?? null,
    city: r.city,
    state: r.state,
    zip: r.zip ?? null,
    lat: r.lat,
    lng: r.lng,
    beds: r.beds,
    baths: r.baths,
    sqft: r.sqft ?? null,
    lot_sqft: r.lotSqft ?? null,
    year_built: r.yearBuilt ?? null,
    property_type: r.propertyType,
    features: normalizeFeatures(r.features),
    description: r.description ?? null,
    photos: r.photos ?? [],
    posted_at: r.postedAt,
    fetched_at: new Date().toISOString(),
  }));
  const { error, data } = await sb.from("listings").upsert(rows).select("id");
  if (error) {
    console.error("seed failed:", error.message);
    process.exit(1);
  }
  console.log(`Seeded ${data?.length ?? 0} listings.`);
}
main();
