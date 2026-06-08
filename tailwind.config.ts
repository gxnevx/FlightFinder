import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        paper: "#f4f3ef",
        ink: { DEFAULT: "#17160f", soft: "#5c5a51", faint: "#9b988d" },
        line: "#e5e2d9",
        signal: { good: "#3f6f52", warn: "#9a6b1e", bad: "#9a3b34" },
      },
      letterSpacing: { tightest: "-0.04em" },
    },
  },
  plugins: [],
};

export default config;
