import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx}", "./emails/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--sans)", "system-ui", "sans-serif"],
        mono: ["var(--mono)", "ui-monospace", "monospace"],
      },
      colors: {
        primary: "var(--primary)",
        accent: "var(--accent)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--ink-faint)",
        surface: "var(--surface)",
        line: "var(--line)",
        "green-deep": "var(--green-deep)",
        "green-tint": "var(--green-tint)",
        "clay-deep": "var(--clay-deep)",
        "clay-tint": "var(--clay-tint)",
      },
      borderRadius: {
        card: "20px",
        sm2: "13px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,32,28,0.05), 0 6px 16px rgba(28,32,28,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
