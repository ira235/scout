// Theme tokens — kept in sync with tailwind.config.ts and globals.css.
// Each theme defines `--primary`, `--accent`, `--bg`, plus the legacy var names
// `--green` / `--clay` mapped to primary / accent for ease of refactor (spec §9).

export type ThemeName = "sage" | "cobalt" | "navy" | "ocean" | "ink";

export interface ThemeVars {
  primary: string;
  accent: string;
  bg: string;
  greenDeep: string;
  greenTint: string;
  clayDeep: string;
  clayTint: string;
  surface: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  line: string;
}

export const THEMES: Record<ThemeName, ThemeVars> = {
  sage: {
    primary: "#2F5D4F", accent: "#C9794A", bg: "#EFEBE2",
    greenDeep: "#1F3D33", greenTint: "#DCE8DD",
    clayDeep: "#84431F", clayTint: "#F1DECB",
    surface: "#FBFAF5", ink: "#1C201C", inkSoft: "#444844", inkFaint: "#7A7E7A",
    line: "rgba(28,32,28,0.10)",
  },
  cobalt: {
    primary: "#1F4FD9", accent: "#E07A3C", bg: "#EDF0F7",
    greenDeep: "#15347A", greenTint: "#D9E2F8",
    clayDeep: "#A0451B", clayTint: "#F5DAC4",
    surface: "#FFFFFF", ink: "#1A1F2C", inkSoft: "#444A58", inkFaint: "#7B8194",
    line: "rgba(26,31,44,0.10)",
  },
  navy: {
    primary: "#0B3A6F", accent: "#4A90E2", bg: "#EFF3F9",
    greenDeep: "#072246", greenTint: "#D6E0F0",
    clayDeep: "#1F4F84", clayTint: "#D2E3F5",
    surface: "#FFFFFF", ink: "#11233F", inkSoft: "#3F4E64", inkFaint: "#7A8499",
    line: "rgba(17,35,63,0.10)",
  },
  ocean: {
    primary: "#0E6E8A", accent: "#E3A857", bg: "#E8EEF1",
    greenDeep: "#0B4D63", greenTint: "#CFE4EC",
    clayDeep: "#7E5524", clayTint: "#F4E1C2",
    surface: "#FBFCFD", ink: "#102A33", inkSoft: "#3D4F58", inkFaint: "#778890",
    line: "rgba(16,42,51,0.10)",
  },
  ink: {
    primary: "#15315B", accent: "#D77A4A", bg: "#F0EBDF",
    greenDeep: "#0E2042", greenTint: "#D8DEEB",
    clayDeep: "#874320", clayTint: "#F1DBC6",
    surface: "#FBFAF5", ink: "#181D2A", inkSoft: "#3F4658", inkFaint: "#76808F",
    line: "rgba(24,29,42,0.10)",
  },
};

export const THEME_NAMES: { id: ThemeName; label: string }[] = [
  { id: "sage", label: "Sage & Clay" },
  { id: "cobalt", label: "Cobalt & White" },
  { id: "navy", label: "Navy & Sky" },
  { id: "ocean", label: "Ocean & Sand" },
  { id: "ink", label: "Ink Blue & Bone" },
];

export function themeStyleVars(theme: ThemeName): React.CSSProperties {
  const v = THEMES[theme] ?? THEMES.sage;
  return {
    // canonical
    ["--primary" as never]: v.primary,
    ["--accent" as never]: v.accent,
    ["--bg" as never]: v.bg,
    ["--surface" as never]: v.surface,
    ["--ink" as never]: v.ink,
    ["--ink-soft" as never]: v.inkSoft,
    ["--ink-faint" as never]: v.inkFaint,
    ["--line" as never]: v.line,
    ["--green-deep" as never]: v.greenDeep,
    ["--green-tint" as never]: v.greenTint,
    ["--clay-deep" as never]: v.clayDeep,
    ["--clay-tint" as never]: v.clayTint,
    // legacy aliases (spec §9: keep --green / --clay for ease of refactor)
    ["--green" as never]: v.primary,
    ["--clay" as never]: v.accent,
  } as React.CSSProperties;
}
