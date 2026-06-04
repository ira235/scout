import Link from "next/link";

export default function Landing() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 640, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--mono)", color: "var(--primary)", fontWeight: 600, marginBottom: 16 }}>
          ◆ SCOUT
        </div>
        <h1 style={{ fontWeight: 800, fontSize: 56, lineHeight: 1.05, letterSpacing: -1 }}>
          Tell us what home you want. We&apos;ll watch the market for you.
        </h1>
        <p style={{ marginTop: 18, fontSize: 18, color: "var(--ink-soft)" }}>
          Describe your dream home in plain English, or build precise filters. Scout emails you the moment
          new listings match — instantly, daily, or weekly.
        </p>
        <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
          <Link
            href="/app/search"
            style={{
              background: "var(--primary)",
              color: "#fff",
              padding: "14px 22px",
              borderRadius: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Start scouting
          </Link>
          <Link
            href="/auth/sign-in"
            style={{
              background: "rgba(28,32,28,0.05)",
              color: "var(--ink)",
              padding: "14px 22px",
              borderRadius: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
