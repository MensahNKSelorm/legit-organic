import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "forest-green": "#0D3B2A",
        "leaf-green": "#2E7D32",
        "light-leaf": "#81C784",
        "ghana-gold": "#F4C430",
        "dark-gold": "#C59F2C",
        charcoal: "#333333",
        cream: "#FAF7F0",
        beige: "#F5F0E6",
        sand: "#E6D8BD",
        "earth-brown": "#5B3E31",
        "mist-white": "#FEFCF7",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        cursive: ['"Dancing Script"', "cursive"],
      },
      backgroundImage: {
        "hero-pattern": "radial-gradient(circle at 20% 80%, #2E7D3215 0%, transparent 50%), radial-gradient(circle at 80% 20%, #F4C43010 0%, transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
