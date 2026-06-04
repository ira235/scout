"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function SignInInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/app/search";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function magic() {
    setErr(null);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setErr(error.message);
    else setSent(true);
  }

  async function google() {
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setErr(error.message);
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ background: "var(--surface)", padding: 32, borderRadius: 20, maxWidth: 400, width: "100%" }}>
        <div style={{ fontFamily: "var(--mono)", color: "var(--primary)", fontWeight: 600, fontSize: 13 }}>◆ SCOUT</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>Sign in</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 6 }}>
          Get a magic link by email or sign in with Google.
        </p>

        {!sent ? (
          <>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: 12, border: "1px solid var(--line)", borderRadius: 13, fontSize: 16, marginTop: 16 }}
            />
            <button
              onClick={magic}
              disabled={!email}
              style={{ width: "100%", marginTop: 10, padding: 14, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 16, cursor: "pointer" }}
            >
              Send magic link
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0", color: "var(--ink-faint)", fontSize: 12 }}>
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              or
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>
            <button
              onClick={google}
              style={{ width: "100%", padding: 12, background: "rgba(28,32,28,0.05)", color: "var(--ink)", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
            >
              Continue with Google
            </button>
          </>
        ) : (
          <div style={{ marginTop: 16, fontSize: 14, color: "var(--ink-soft)" }}>
            Check your inbox for a sign-in link.
          </div>
        )}

        {err && <div style={{ color: "#a32", marginTop: 12, fontSize: 13 }}>{err}</div>}
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}
