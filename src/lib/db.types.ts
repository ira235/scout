// Hand-rolled types matching supabase/migrations/0001_init.sql
// In a real env: `supabase gen types typescript --local > src/lib/db.types.ts`

export type DigestFreq = "INSTANT" | "DAILY" | "WEEKLY";
export type ListingMode = "BUY" | "RENT";
export type ListingStatus = "ACTIVE" | "PENDING" | "SOLD" | "OFF";
export type PropertyType = "HOUSE" | "TOWNHOME" | "CONDO" | "APARTMENT";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; name: string | null; created_at: string };
        Insert: { id: string; email: string; name?: string | null };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          default_freq: DigestFreq;
          send_hour: number;
          timezone: string;
          per_email_cap: number;
          push_enabled: boolean;
          hide_pending: boolean;
          high_match_only: boolean;
          theme: string;
        };
        Insert: { user_id: string } & Partial<Database["public"]["Tables"]["user_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Row"]>;
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          mode: ListingMode;
          criteria: unknown;
          raw_prompt: string | null;
          frequency: DigestFreq;
          active: boolean;
          last_notified_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          mode: ListingMode;
          criteria: unknown;
          raw_prompt?: string | null;
          frequency?: DigestFreq;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]> & { active?: boolean };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          source: string;
          mode: ListingMode;
          status: ListingStatus;
          price: number;
          address: string;
          hood: string | null;
          city: string;
          state: string;
          zip: string | null;
          lat: number;
          lng: number;
          beds: number;
          baths: number;
          sqft: number | null;
          lot_sqft: number | null;
          year_built: number | null;
          property_type: PropertyType;
          features: string[];
          description: string | null;
          photos: string[];
          posted_at: string;
          fetched_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["listings"]["Row"], "fetched_at" | "status"> & {
          fetched_at?: string;
          status?: ListingStatus;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Row"]>;
        Relationships: [];
      };
      alert_matches: {
        Row: {
          id: string;
          alert_id: string;
          listing_id: string;
          match_score: number;
          notified_at: string | null;
          created_at: string;
        };
        Insert: {
          alert_id: string;
          listing_id: string;
          match_score: number;
          notified_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["alert_matches"]["Insert"]>;
        Relationships: [];
      };
      favorites: {
        Row: { user_id: string; listing_id: string; created_at: string };
        Insert: { user_id: string; listing_id: string };
        Update: never;
        Relationships: [];
      };
      email_health: {
        Row: { email: string; status: string; reason: string | null; updated_at: string };
        Insert: { email: string; status?: string; reason?: string | null };
        Update: Partial<Database["public"]["Tables"]["email_health"]["Insert"]>;
        Relationships: [];
      };
      alert_send_log: {
        Row: { alert_id: string; sent_at: string };
        Insert: { alert_id: string; sent_at?: string };
        Update: never;
        Relationships: [];
      };
    };
    Enums: {
      digest_freq: DigestFreq;
      listing_mode: ListingMode;
      listing_status: ListingStatus;
      property_type: PropertyType;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];
export type AlertMatch = Database["public"]["Tables"]["alert_matches"]["Row"];
export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
