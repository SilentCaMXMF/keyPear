/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006b22',
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#01872e',
          600: '#006b22',
          700: '#005c1e',
          800: '#004d19',
          900: '#003e15',
        },
        'primary-container': '#01872e',
        'on-surface': '#1e293b',
        'on-surface-variant': '#64748b',
        'error-container': '#fef2f2',
        'on-error-container': '#dc2626',
        'secondary': '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
