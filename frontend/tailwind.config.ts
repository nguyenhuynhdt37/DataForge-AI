import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F8F7F2",
        "surface-card": "#FFFFFF",
        "primary-sage": "#B7CDBB",
        "mist-blue": "#C6D9E8",
        "soft-mint": "#DCEBE0",
        "dusty-lavender": "#DCD6E8",
        ink: "#303A3B",
        "ink-muted": "#6B7677",
        "border-delicate": "#E5E3DC",
      },
      fontFamily: {
        editorial: ["Georgia", "Cambria", "Baskerville", "serif"],
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "SF Mono", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        "soft-sm": "0 1px 3px rgba(48, 58, 59, 0.04)",
        soft: "0 4px 16px rgba(48, 58, 59, 0.05)",
        "soft-lg": "0 8px 30px rgba(48, 58, 59, 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
