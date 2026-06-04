import type { RawListing, ListingProvider } from "../listing-provider";
import { SEED_LISTINGS } from "../seed-listings";

// Mock provider — reads from in-memory fixtures (also used to seed the DB).
// `fetchNew` returns listings whose postedAt > since AND city in cities[].
export class MockProvider implements ListingProvider {
  key = "mock";

  async fetchNew({ since, cities }: { since: Date; cities: string[] }): Promise<RawListing[]> {
    const cityNames = cities.map((c) => c.split(",")[0].trim().toLowerCase());
    return SEED_LISTINGS.filter((l) => {
      const matchCity =
        cityNames.length === 0 ||
        cityNames.some((c) => l.city.toLowerCase().split(",")[0].trim() === c);
      return matchCity && new Date(l.postedAt).getTime() >= since.getTime();
    });
  }

  async fetchById(id: string): Promise<RawListing | null> {
    return SEED_LISTINGS.find((l) => l.id === id) ?? null;
  }
}
