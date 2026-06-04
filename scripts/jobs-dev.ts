// Local jobs runner. Tick every 60s.
// Run with: `npm run jobs:dev`. Requires SUPABASE_SERVICE_ROLE_KEY + DB.
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { runCrawl } from "../src/lib/jobs/crawl";
import { runDigestTick } from "../src/lib/jobs/digest";

const TICK_MS = 60 * 1000;

async function tick() {
  const t = new Date().toISOString();
  console.log(`[${t}] tick`);
  try {
    const c = await runCrawl();
    console.log("  crawl:", c);
  } catch (e) {
    console.error("  crawl failed:", e);
  }
  try {
    const d = await runDigestTick();
    console.log("  digest:", d);
  } catch (e) {
    console.error("  digest failed:", e);
  }
}

(async () => {
  await tick();
  setInterval(tick, TICK_MS);
})();
