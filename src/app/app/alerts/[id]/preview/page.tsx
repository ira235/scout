import { notFound } from "next/navigation";
import { previewDigestForAlert } from "@/lib/jobs/digest";

export const dynamic = "force-dynamic";

export default async function DigestPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await previewDigestForAlert(id);
  if (!result) return notFound();
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <header>
        <a href="/app/alerts" style={{ fontSize: 13, color: "var(--ink-soft)", textDecoration: "none" }}>
          ← Back to alerts
        </a>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>Email digest preview</h1>
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          This is the exact email you&apos;ll receive at your next send time.
        </p>
      </header>
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(28,32,28,0.05)",
        }}
      >
        <iframe
          srcDoc={result.html}
          title="digest preview"
          style={{ width: "100%", border: "none", minHeight: 800, display: "block" }}
        />
      </div>
    </div>
  );
}
