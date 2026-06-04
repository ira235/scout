import { TabBar } from "@/components/tab-bar";
import { supabaseServer } from "@/lib/supabase";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Try to read unread alert badge count, but never block render in dev w/o auth.
  let unread = 0;
  try {
    const sb = await supabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) {
      const { count } = await sb
        .from("alert_matches")
        .select("id", { count: "exact", head: true })
        .is("notified_at", null);
      unread = count ?? 0;
    }
  } catch {}

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 96 }}>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 32px" }}>{children}</main>
      <TabBar unreadAlerts={unread} />
    </div>
  );
}
