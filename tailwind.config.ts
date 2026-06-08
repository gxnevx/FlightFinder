import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cockpit: {
          bg: "#0a0e16",
          panel: "#121826",
          edge: "#1f2937",
          accent: "#38bdf8",
          gold: "#fbbf24",
          good: "#34d399",
          warn: "#f59e0b",
          bad: "#f87171",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
