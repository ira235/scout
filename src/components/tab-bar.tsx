"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/app/search", label: "Search", icon: "◐" },
  { href: "/app/matches", label: "Matches", icon: "◆" },
  { href: "/app/alerts", label: "Alerts", icon: "◷" },
  { href: "/app/settings", label: "Settings", icon: "◇" },
];

export function TabBar({ unreadAlerts = 0 }: { unreadAlerts?: number }) {
  const pathname = usePathname() || "";
  return (
    <nav
      aria-label="Primary"
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        gap: 4,
        padding: 6,
        borderRadius: 999,
        background: "rgba(255,255,255,0.78)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow:
          "0 6px 20px rgba(28,32,28,0.10), 0 1px 2px rgba(28,32,28,0.06)",
        border: "1px solid var(--line)",
      }}
    >
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        const showDot = t.label === "Alerts" && unreadAlerts > 0;
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              position: "relative",
              padding: "10px 16px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              color: active ? "#fff" : "var(--ink-soft)",
              background: active ? "var(--primary)" : "transparent",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontFamily: "var(--mono)" }}>{t.icon}</span>
            {t.label}
            {showDot && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 6,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "var(--accent)",
                  border: "2px solid var(--surface)",
                }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
