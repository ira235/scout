// HMAC-signed tokens for unauthenticated email links (unsubscribe / pause / freq).
import { createHmac, timingSafeEqual } from "crypto";

const SECRET = () => process.env.UNSUB_SECRET || process.env.CRON_SECRET || "dev-insecure";

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Buffer {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export interface TokenPayload {
  action: "unsubscribe" | "pause" | "freq";
  alertId?: string;
  userId: string;
  exp: number; // epoch seconds
  freq?: "INSTANT" | "DAILY" | "WEEKLY";
}

export function signToken(payload: TokenPayload): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(createHmac("sha256", SECRET()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [body, sig] = (token || "").split(".");
  if (!body || !sig) return null;
  const expected = b64url(createHmac("sha256", SECRET()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(fromB64url(body).toString("utf8")) as TokenPayload;
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}
