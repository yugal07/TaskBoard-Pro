/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // Add more shades as needed
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          // Define secondary color palette
          400: '#a3a3a3',
          500: '#737373',
        },
        dark: {
          100: '#d1d5db',
          200: '#9ca3af',
          800: '#1f2937',
          900: '#111827',
        }
      },
    },
  },
  plugins: [],
}