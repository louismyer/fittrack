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
        'fab-in': {
          from: { opacity: '0', transform: 'scale(0.85) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'scan-line': 'scan-line 2s ease-in-out infinite',
        'fab-in': 'fab-in 150ms ease-out both',
      },
      colors: {
        brand: {
          DEFAULT: '#4F46E5',
          dark:    '#4338CA',
          light:   '#6366F1',
        },
        background: '#F8FAFC',
        surface: '#FFFFFF',
        'surface-border': '#E2E8F0',
        'section-header': '#1E293B',
        secondary: '#64748B',
        'progress-track': '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
}
