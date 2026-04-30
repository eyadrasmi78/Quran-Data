/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        ui: ['"Cairo"', '"Tajawal"', 'system-ui', 'sans-serif'],
        quran: ['"Amiri Quran"', '"Scheherazade New"', '"Amiri"', 'serif']
      },
      colors: {
        brand: {
          50:  '#f1f8f4',
          100: '#dcecdf',
          200: '#b9d8c1',
          300: '#8ebd9b',
          400: '#5e9d72',
          500: '#3d8054',
          600: '#2d6541',
          700: '#255134',
          800: '#1f4029',
          900: '#142a1c'
        }
      }
    }
  },
  plugins: []
};
