/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blood: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        ivory: {
          DEFAULT: '#FFF9F2',
          light: '#FFFAF5',
          dark: '#F7EFE4'
        },
        cream: '#FFFDF9',
        crimson: {
          DEFAULT: '#981B24',
          dark: '#6F1018',
          deep: '#80141D'
        },
        navy: {
          DEFAULT: '#102B46',
          heading: '#102B46',
          muted: '#68717D',
          dark: '#0B1E33'
        },
        emerald: {
          accent: '#147D64',
          hover: '#0F6550'
        },
        rose: {
          deco: '#F3DEDA'
        }
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
