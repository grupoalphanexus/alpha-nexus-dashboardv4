/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#6172f3', light: '#8098fb', dim: 'rgba(97,114,243,0.15)' },
      },
      fontFamily: { display: ['Syne', 'sans-serif'] },
    },
  },
  plugins: [],
}
