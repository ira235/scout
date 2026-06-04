// ListingProvider interface — see spec §6
import type { ListingMode, PropertyType } from "./db.types";

export interface RawListing {
  id: string; // provider-stable e.g. "rentcast:42"
  source: string;
  mode: ListingMode;
  status?: "ACTIVE" | "PENDING" | "SOLD" | "OFF";
  price: number; // cents (or monthly-rent cents)
  address: string;
  hood?: string | null;
  city: string;
  state: string;
  zip?: string | null;
  lat: number;
  lng: number;
  beds: number;
  baths: number;
  sqft?: number | null;
  lotSqft?: number | null;
  yearBuilt?: number | null;
  propertyType: PropertyType;
  features: string[];
  description?: string | null;
  photos: string[];
  postedAt: string; // ISO
}

export interface ListingProvider {
  key: string;
  fetchNew(opts: { since: Date; cities: string[] }): Promise<RawListing[]>;
  fetchById(id: string): Promise<RawListing | null>;
}

import { MockProvider } from "./providers/mock";
import { RentcastProvider } from "./providers/rentcast";
import { RapidApiProvider } from "./providers/rapidapi";

export function getListingProvider(): ListingProvider {
  const which = (process.env.LISTING_PROVIDER || "mock").toLowerCase();
  if (which === "rentcast") return new RentcastProvider();
  if (which === "rapidapi") return new RapidApiProvider();
  return new MockProvider();
}
