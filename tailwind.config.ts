import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface0: "#000000",
        surface1: "#09090b",
        surface2: "#18181b",
        brand: "#3b82f6",
        accentA: "#10b981",
        accentB: "#f97316",
        muted: "#71717a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Archivo Black"', "Impact", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "24px",
        lg: "16px",
        md: "8px",
      },
      boxShadow: {
        kinetic: "0 2px 0 0 rgba(255,255,255,0.08)",
        kineticDark: "0 2px 0 0 rgba(0,0,0,0.7)",
      },
    },
  },
  plugins: [],
} satisfies Config;
