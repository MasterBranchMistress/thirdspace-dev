import { heroui } from "@heroui/theme";
import { keyframes } from "framer-motion";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        pointLeft: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-6px)" },
        },
        pointRight: {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        pointLeft: "pointLeft 1s ease-in-out infinite",
        pointRight: "pointRight 1s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      textShadow: {
        subtle: "0px 0px 4px rgba(255, 255, 255, 0.4)",
        glow: "0px 0px 6px rgba(255, 255, 255, 0.6)",
      },
      colors: {
        focus: "#5c6cc4",
        concrete: "#f3f2f3",
        primary: {
          DEFAULT: "#5c6cc4",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#ffffff",
        },
        warning: {
          DEFAULT: "#4962BF",
          foreground: "#ffffff",
        },
        indigo: {
          DEFAULT: "#5c6cc4",
          soft: "#4c64bc",
          bold: "#5c74c4",
        },
        chetwode: "#8e8ed5",
        lavender: "#ac9de0",
        moody: {
          DEFAULT: "#748ccc",
          dark: "#6e79cc",
        },
        cold: "#9cacdc",
        marguerite: "#6474c4",
      },
      fill: (theme) => theme("colors"),
    },
  },
  darkMode: false,
  plugins: [heroui()],
};

module.exports = config;
