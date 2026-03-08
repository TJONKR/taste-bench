import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAF8",
        "canvas-warm": "#F7F5F0",
        ink: "#1A1A1A",
        accent: "#C45D3E",
        "accent-hover": "#A84D33",
        burgundy: "#7B2D3B",
        olive: "#5C6B4F",
        "score-high": "#B8860B",
        "score-mid": "#708090",
        "score-low": "#C47D7D",
        border: "#E8E5E0",
        "card-bg": "#FFFFFF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.05)",
        "card-hover": "0 2px 8px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
