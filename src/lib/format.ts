// Tiny utility helpers
export function fmtPrice(cents: number, mode: "BUY" | "RENT" = "BUY"): string {
  const dollars = Math.round(cents / 100);
  if (mode === "RENT") return "$" + dollars.toLocaleString("en-US") + "/mo";
  return "$" + dollars.toLocaleString("en-US");
}

export function fmtBeds(b: number): string {
  if (b === 0) return "Studio";
  return Number.isInteger(b) ? `${b} bed` : `${b} bed`;
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d}d`;
  const w = Math.round(d / 7);
  return `${w}w`;
}

export function cn(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(" ");
}
