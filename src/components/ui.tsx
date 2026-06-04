"use client";
import { type CSSProperties } from "react";
import { cn } from "@/lib/format";

export function Chip({
  children,
  tone = "neutral",
  size = "md",
  icon,
  style,
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "primary" | "accent" | "outline";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  const tones: Record<string, CSSProperties> = {
    neutral: { background: "rgba(28,32,28,0.05)", color: "var(--ink-soft)" },
    primary: { background: "var(--green-tint)", color: "var(--green-deep)" },
    accent: { background: "var(--clay-tint)", color: "var(--clay-deep)" },
    outline: { background: "transparent", color: "var(--ink-soft)", border: "1px solid var(--line)" },
  };
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap font-semibold", className)}
      style={{
        ...tones[tone],
        fontSize: size === "sm" ? 11.5 : 13,
        padding: size === "sm" ? "5px 9px" : "7px 11px",
        borderRadius: 999,
        lineHeight: 1,
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  );
}

export function MatchBadge({ pct, dark = false }: { pct: number; dark?: boolean }) {
  const strong = pct >= 92;
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap font-mono"
      style={{
        fontFamily: "var(--mono)",
        fontSize: 12,
        fontWeight: 600,
        color: dark ? "#fff" : strong ? "var(--green-deep)" : "var(--ink-soft)",
        background: dark
          ? "rgba(28,32,28,0.78)"
          : strong
          ? "var(--green-tint)"
          : "transparent",
        padding: dark ? "5px 9px" : strong ? "3px 8px" : "0",
        borderRadius: 999,
      }}
    >
      ◆ {pct}% match
    </span>
  );
}

export function FreqBadge({ freq }: { freq: "INSTANT" | "DAILY" | "WEEKLY" }) {
  const label = freq === "INSTANT" ? "Instant" : freq === "DAILY" ? "Daily" : "Weekly";
  const tone = freq === "DAILY" ? "accent" : "primary";
  const icon = freq === "INSTANT" ? "⚡" : freq === "DAILY" ? "◷" : "◰";
  return (
    <Chip tone={tone} size="sm">
      <span style={{ fontFamily: "var(--mono)" }}>{icon}</span> {label}
    </Chip>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  full,
  type = "button",
  disabled,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
  full?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  href?: string;
}) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
    borderRadius: 14,
    fontSize: size === "sm" ? 14 : 16,
    padding: size === "sm" ? "9px 14px" : "14px 20px",
    width: full ? "100%" : "auto",
    fontFamily: "var(--sans)",
    transition: "transform .12s, filter .12s",
    opacity: disabled ? 0.6 : 1,
    textDecoration: "none",
  };
  const variants: Record<string, CSSProperties> = {
    primary: { background: "var(--primary)", color: "#fff" },
    ghost: { background: "rgba(28,32,28,0.05)", color: "var(--ink)" },
    outline: { background: "transparent", color: "var(--ink)", border: "1px solid var(--line)" },
  };
  const style = { ...base, ...variants[variant] };
  if (href) {
    return (
      <a href={href} style={style}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={style}>
      {children}
    </button>
  );
}

export function PhotoPlaceholder({
  label = "photo",
  height = 184,
  radius = 16,
}: {
  label?: string;
  height?: number;
  radius?: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: radius,
        overflow: "hidden",
        background: "var(--green-tint)",
      }}
    >
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="ph-stripe" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="14" height="14" fill="var(--green-tint)" />
            <rect width="7" height="14" fill="var(--clay-tint)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ph-stripe)" opacity="0.6" />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            letterSpacing: 0.4,
            color: "var(--ink-soft)",
            textTransform: "uppercase",
            background: "rgba(255,255,255,0.7)",
            padding: "4px 9px",
            borderRadius: 7,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      style={{
        display: "inline-flex",
        background: "rgba(28,32,28,0.05)",
        borderRadius: 999,
        padding: 4,
        gap: 0,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            style={{
              border: "none",
              padding: size === "sm" ? "6px 12px" : "8px 16px",
              fontSize: size === "sm" ? 13 : 14,
              fontWeight: 600,
              borderRadius: 999,
              cursor: "pointer",
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--primary)" : "var(--ink-soft)",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              transition: "all .12s",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
