/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'blue': {
          600: '#3b82f6',
          700: '#1e40af',
          800: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}