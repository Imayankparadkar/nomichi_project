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
        rust: "#D55D27",
        yellow: "#FFFE00",
        ink: "#1C1B1A",
        olive: "#45471D",
        sand: "#D1B788",
        cream: "#FFFBF5",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
