/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#F8FAF8',
          primary: '#C1DDC0',
          text: '#313632',
          muted: '#939693',
        },
        qingteng: {
          green: '#7eb89a',
          'green-light': '#a8d4bc',
          pink: '#f5d5d5',
          'pink-light': '#fce8e8',
        }
      }
    },
  },
  plugins: [],
}
