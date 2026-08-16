/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#20263D",
        paper: "#F7F7FB",
        "paper-dim": "#EDEEF7",
        brand: {
          DEFAULT: "#FF6B4A",
          dark: "#E14F2E",
          light: "#FFE7DF",
        },
        signal: {
          DEFAULT: "#20C978",
          dark: "#0F9C5A",
          light: "#DDFAEA",
        },
        hazard: {
          DEFAULT: "#FFA726",
          dark: "#C9740C",
          light: "#FFF1DA",
        },
        route: {
          DEFAULT: "#4C7DFF",
          dark: "#2E56D6",
          light: "#E3EAFF",
        },
        steel: {
          DEFAULT: "#767C94",
          light: "#D6D8E6",
        },
      },
      fontFamily: {
        display: ["'Fredoka'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(32,38,61,0.06)",
        card: "0 4px 20px rgba(32,38,61,0.08)",
        lift: "0 10px 30px rgba(32,38,61,0.12)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
}
