/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4338ca',
          700: '#3730a3',
          800: '#312e81',
          900: '#1e1b4b',
        },
        accent: {
          400: '#ff8e53',
          500: '#ff6b4a',
          600: '#f04d2a',
        },
      },
    },
  },
  plugins: [],
}
