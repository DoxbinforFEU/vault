/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./admin.html", "./src/**/*.{js,jsx}"],
  darkMode: "media", // follows the device's light/dark setting automatically
  theme: {
    extend: {
      colors: {
        sapphire: {
          DEFAULT: "#3B82F6", // vibrant blue
          dark: "#1D4ED8",
          light: "#93C5FD",
        },
        over: "#E5484D", // tomato / over-budget red
        caution: "#F5A623", // amber / nearing limit
        gray: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "San Francisco",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
