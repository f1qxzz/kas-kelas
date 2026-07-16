import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#08080e",
        card: "#0f0f18",
        elevated: "#181825",
        border: "#1e1e32",
        income: { DEFAULT: "#22c55e" },
        expense: { DEFAULT: "#ef4444" },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config
