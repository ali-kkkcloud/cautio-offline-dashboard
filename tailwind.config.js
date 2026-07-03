/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgmain: "#0a1120",
        panel: "#101a2c",
        panel2: "#0d1626",
        border: "#1e2a40",
        accent: "#2dd4ff",
      },
      boxShadow: {
        glow: "0 0 24px rgba(45,212,255,0.08)",
      },
    },
  },
  plugins: [],
};
