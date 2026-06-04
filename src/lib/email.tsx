// React Email digest template + render helper.
import * as React from "react";
import { render } from "@react-email/components";
import { THEMES, type ThemeName } from "./themes";
import { fmtPrice } from "./format";
import { signToken } from "./tokens";
import type { Listing, DigestFreq } from "./db.types";

interface MatchEntry {
  matchId: string;
  score: number;
  listing: Listing;
}

interface RenderArgs {
  alert: { id: string; name: string; frequency: DigestFreq };
  user: { id: string; email: string; name: string | null };
  matches: MatchEntry[];
  theme: ThemeName;
  perEmailCap: number;
}

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function DigestEmail(args: RenderArgs) {
  const { alert, user, matches, theme, perEmailCap } = args;
  const t = THEMES[theme] ?? THEMES.sage;
  const totalPending = matches.length;
  const overflow = Math.max(0, totalPending - perEmailCap);
  const top = matches.slice(0, perEmailCap);
  const topMatch = top[0]?.score ?? 0;
  const minPrice = top.length
    ? Math.min(...top.map((m) => m.listing.price))
    : 0;
  const isRent = alert.name.toLowerCase().includes("rent") || top[0]?.listing.mode === "RENT";

  const expiry = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 60;
  const unsubToken = signToken({ action: "unsubscribe", userId: user.id, alertId: alert.id, exp: expiry });
  const pauseToken = signToken({ action: "pause", userId: user.id, alertId: alert.id, exp: expiry });
  const freqWeeklyToken = signToken({
    action: "freq", userId: user.id, alertId: alert.id, exp: expiry, freq: "WEEKLY",
  });

  const utm = `utm=digest-${alert.id}`;
  const link = (path: string) => `${APP_URL()}${path}${path.includes("?") ? "&" : "?"}${utm}`;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>{`${totalPending || "No"} new homes match "${alert.name}"`}</title>
      </head>
      <body
        style={{
          margin: 0,
          background: t.bg,
          fontFamily: "Hanken Grotesk, system-ui, sans-serif",
          color: t.ink,
        }}
      >
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ background: t.bg, padding: "24px 0" }}>
          <tbody>
            <tr>
              <td align="center">
                <table width="600" cellPadding={0} cellSpacing={0} style={{ width: "600px", maxWidth: "100%" }}>
                  {/* Brand header */}
                  <tbody>
                    <tr>
                      <td style={{ padding: "12px 24px 20px", display: "flex" }}>
                        <table width="100%" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td>
                                <span style={{ fontWeight: 800, fontSize: 22, color: t.primary, letterSpacing: -0.3 }}>
                                  ◆ Scout
                                </span>
                              </td>
                              <td align="right" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: t.inkFaint }}>
                                {new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ fontSize: 13, color: t.inkSoft, marginTop: 6 }}>
                          For {user.name || user.email}
                        </div>
                      </td>
                    </tr>

                    {/* Hero band */}
                    <tr>
                      <td
                        style={{
                          padding: 24,
                          borderRadius: 20,
                          background: `linear-gradient(135deg, ${t.primary}, ${t.greenDeep})`,
                          color: "#fff",
                        }}
                      >
                        <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 600 }}>
                          {alert.frequency === "WEEKLY" ? "Weekly digest" : alert.frequency === "DAILY" ? "Daily digest" : "Instant alert"}
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginTop: 6 }}>
                          {totalPending > 0
                            ? `${totalPending} new home${totalPending === 1 ? "" : "s"} match "${alert.name}"`
                            : `No new matches this week for "${alert.name}"`}
                        </div>

                        {totalPending > 0 && (
                          <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: 18 }}>
                            <tbody>
                              <tr>
                                <td style={statTile(t)}>
                                  <div style={statLbl}>New today</div>
                                  <div style={statVal}>{top.length}</div>
                                </td>
                                <td style={statTile(t)}>
                                  <div style={statLbl}>Top match</div>
                                  <div style={statVal}>{topMatch}%</div>
                                </td>
                                <td style={statTile(t)}>
                                  <div style={statLbl}>From</div>
                                  <div style={statVal}>{fmtPrice(minPrice, isRent ? "RENT" : "BUY")}</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>

                    {/* Listing blocks */}
                    {top.map((m) => {
                      const l = m.listing;
                      const photo = l.photos[0];
                      return (
                        <tr key={m.matchId}>
                          <td style={{ padding: "16px 0" }}>
                            <table
                              width="100%"
                              cellPadding={0}
                              cellSpacing={0}
                              style={{ background: t.surface, borderRadius: 20, overflow: "hidden", border: `1px solid ${t.line}` }}
                            >
                              <tbody>
                                <tr>
                                  <td style={{ padding: 0, height: 200 }}>
                                    {photo ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={photo} alt="" width={600} style={{ display: "block", width: "100%", height: 200, objectFit: "cover" }} />
                                    ) : (
                                      <div
                                        style={{
                                          height: 200,
                                          background: `repeating-linear-gradient(45deg, ${t.greenTint}, ${t.greenTint} 14px, ${t.surface} 14px, ${t.surface} 28px)`,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: t.inkSoft, background: "rgba(255,255,255,0.7)", padding: "4px 9px", borderRadius: 7 }}>
                                          {l.property_type.toLowerCase()}
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: 18 }}>
                                    <table width="100%" cellPadding={0} cellSpacing={0}>
                                      <tbody>
                                        <tr>
                                          <td>
                                            <span style={{ display: "inline-block", background: t.accent, color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 999, letterSpacing: 0.6, textTransform: "uppercase", marginRight: 8 }}>
                                              New
                                            </span>
                                            <span style={{ fontFamily: "JetBrains Mono, monospace", background: t.greenTint, color: t.greenDeep, fontWeight: 600, fontSize: 12, padding: "3px 8px", borderRadius: 999 }}>
                                              {m.score}% match
                                            </span>
                                          </td>
                                          <td align="right" style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 600, fontSize: 18, color: t.ink }}>
                                            {fmtPrice(l.price, l.mode)}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 10 }}>{l.address}</div>
                                    <div style={{ fontSize: 13, color: t.inkSoft, marginTop: 2 }}>
                                      {l.hood ? `${l.hood} · ` : ""}{l.city}
                                    </div>
                                    <div style={{ height: 1, background: t.line, margin: "12px 0" }} />
                                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: t.inkSoft }}>
                                      {l.beds} bd · {l.baths} ba{l.sqft ? ` · ${l.sqft.toLocaleString()} sqft` : ""}
                                    </div>
                                    {l.description && (
                                      <div style={{ fontSize: 13, color: t.inkSoft, marginTop: 8, lineHeight: 1.5 }}>{l.description}</div>
                                    )}
                                    <a
                                      href={link(`/app/listings/${l.id}`)}
                                      style={{
                                        display: "inline-block",
                                        marginTop: 14,
                                        background: t.primary,
                                        color: "#fff",
                                        textDecoration: "none",
                                        padding: "10px 18px",
                                        borderRadius: 14,
                                        fontWeight: 700,
                                        fontSize: 14,
                                      }}
                                    >
                                      View listing
                                    </a>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Footer */}
                    <tr>
                      <td style={{ padding: "20px 8px 0", color: t.inkFaint, fontSize: 12, lineHeight: 1.6 }}>
                        {overflow > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <a href={link(`/app/alerts/${alert.id}`)} style={{ color: t.greenDeep, textDecoration: "none", fontWeight: 600 }}>
                              {overflow} more match{overflow === 1 ? "" : "es"} in the app →
                            </a>
                          </div>
                        )}
                        <div>You're getting these because you set up the "{alert.name}" alert ({alert.frequency.toLowerCase()}).</div>
                        <div style={{ marginTop: 6 }}>
                          <a href={`${APP_URL()}/api/email/freq?token=${freqWeeklyToken}`} style={footerLink(t)}>Switch to weekly</a>
                          {" · "}
                          <a href={`${APP_URL()}/api/email/pause?token=${pauseToken}`} style={footerLink(t)}>Pause this alert</a>
                          {" · "}
                          <a href={`${APP_URL()}/api/email/unsubscribe?token=${unsubToken}`} style={footerLink(t)}>Unsubscribe</a>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

const statTile = (t: typeof THEMES.sage): React.CSSProperties => ({
  background: "rgba(255,255,255,0.12)",
  borderRadius: 13,
  padding: 12,
  width: "33%",
  color: "#fff",
});
const statLbl: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  opacity: 0.8,
};
const statVal: React.CSSProperties = {
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 18,
  fontWeight: 600,
  marginTop: 4,
};
const footerLink = (t: typeof THEMES.sage): React.CSSProperties => ({
  color: t.greenDeep,
  textDecoration: "underline",
});

function plainText(args: RenderArgs): string {
  const { alert, matches } = args;
  const lines: string[] = [];
  lines.push(
    matches.length > 0
      ? `${matches.length} new home${matches.length === 1 ? "" : "s"} match "${alert.name}"`
      : `No new matches this week — ${alert.name}`
  );
  lines.push("");
  for (const m of matches) {
    const l = m.listing;
    lines.push(
      `${fmtPrice(l.price, l.mode)} — ${l.address} — ${l.beds}bd/${l.baths}ba${l.sqft ? `/${l.sqft}sqft` : ""} — ${m.score}% — ${APP_URL()}/app/listings/${l.id}?utm=digest-${alert.id}`
    );
  }
  return lines.join("\n");
}

export async function renderDigestEmail(args: RenderArgs): Promise<{ html: string; text: string }> {
  const html = await render(<DigestEmail {...args} />);
  return { html, text: plainText(args) };
}
