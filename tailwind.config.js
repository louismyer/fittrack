/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'scan-line': {
          '0%, 100%': { top: '0%', opacity: '0.9' },
          '50%':      { top: '100%', opacity: '0.7' },
        },
      },
      animation: {
        'scan-line': 'scan-line 2s ease-in-out infinite',
      },
      colors: {
        brand: {
          DEFAULT: '#FC4C02',
          dark:    '#E04300',
          light:   '#FF6B35',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
