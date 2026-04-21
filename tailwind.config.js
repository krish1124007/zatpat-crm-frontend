/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1e40af',
          50: '#eff6ff',
          600: '#1e40af',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};
