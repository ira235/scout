// One-shot crawl: pulls listings for the cities passed as CLI args (or a default
// set) using whatever provider is configured via LISTING_PROVIDER.
//
// Usage:
//   npm run crawl -- "New York, NY"
//   npm run crawl -- "New York, NY" "San Francisco, CA"
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { runCrawl } from "../src/lib/jobs/crawl";

const DEFAULTS = ["Portland, OR", "Seattle, WA", "Austin, TX", "New York, NY"];

(async () => {
  const cities = process.argv.slice(2);
  const target = cities.length ? cities : DEFAULTS;
  const sinceArg = process.env.CRAWL_SINCE_MS;
  const sinceMs = sinceArg ? Number(sinceArg) : undefined;
  console.log(`Crawling: ${target.join(" | ")}${sinceMs !== undefined ? ` since=${sinceMs}` : ""}`);
  try {
    const r = await runCrawl({ cities: target, sinceMs });
    console.log("Done:", r);
  } catch (e) {
    console.error("Crawl failed:", e);
    process.exit(1);
  }
})();
