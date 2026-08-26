import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F7F8F6",
        surface: "#FFFFFF",
        "surface-2": "#EEF1EE",
        border: "#E1E5E1",
        text: "#171B24",
        "text-muted": "#5B6570",
        navy: "#16233D",
        "navy-tint": "#EEF1F6",
        accent: "#0E7D57",
        "accent-2": "#17A673",
        "accent-tint": "#E4F6EE",
        danger: "#DC4C4C",
        "danger-tint": "#FBEAEA",
      },
      fontFamily: {
        heading: ["var(--font-sora)", "system-ui", "sans-serif"],
        body: ["var(--font-public-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
