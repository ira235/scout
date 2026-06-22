import { supabaseServer } from "@/lib/supabase";
import { Btn, Chip, FreqBadge } from "@/components/ui";
import { AlertToggleClient } from "./client";
import { AlertsPageClient } from "./alerts-client";
import type { Alert } from "@/lib/db.types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  return <AlertsPageClient />;
}