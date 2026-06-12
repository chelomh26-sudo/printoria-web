/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#96d629',
          50:  '#f5fce8',
          100: '#eaf9d0',
          200: '#d3f2a0',
          300: '#b8e866',
          400: '#a3dc3f',
          500: '#96d629',
          600: '#78b01e',
          700: '#5c891a',
          800: '#496b17',
          900: '#3d5a15',
        },
      },
    },
  },
  plugins: [],
}
