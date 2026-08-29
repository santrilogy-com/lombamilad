/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#24211c',
        paper: '#efede7',
        paper2: '#e5e2da',
        olive: '#8a7c4c',
        'olive-d': '#675c37',
        'olive-l': '#c3b68b',
        'olive-p': '#e8e2cd',
        grey: '#7c7b77',
        'grey-l': '#a9a7a2',
      },
      fontFamily: {
        disp: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Sora', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
