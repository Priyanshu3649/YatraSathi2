/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      lg: "1024px",
      xl: "1280px",
      // Mobile breakpoints (sm, md) are intentionally removed for desktop-first design
    },
    extend: {},
  },
  plugins: [],
}
