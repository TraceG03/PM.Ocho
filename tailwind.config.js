/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        'accent-purple': "#7c3aed",
        accent: {
          green: "#10b981",
          purple: "#7c3aed",
          indigo: "#6366f1"
        }
      }
    },
  },
  plugins: [],
}
