import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef1f7",
          100: "#d7deec",
          200: "#adbcd9",
          300: "#7e94bf",
          400: "#4f6ba3",
          500: "#324e83",
          600: "#233a68",
          700: "#182a4d",
          800: "#101d38",
          900: "#0a1428",
          950: "#060d1a",
        },
        gold: {
          50: "#fbf6e9",
          100: "#f5e8c2",
          200: "#eed494",
          300: "#e4bd62",
          400: "#d7a63d",
          500: "#c08f2b",
          600: "#9c7020",
          700: "#78551b",
          800: "#5a4118",
          900: "#453316",
        },
        parchment: "#f7f4ee",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
