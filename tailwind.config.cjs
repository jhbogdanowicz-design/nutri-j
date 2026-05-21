/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // use class strategy for dark mode
  theme: {
    extend: {
      colors: {
        primary: 'hsl(215,85%,55%)',
        accent: 'hsl(340,80%,60%)',
        background: 'hsl(220,10%,6%)',
        surface: 'hsl(220,10%,12%)',
        muted: 'hsl(0,0%,45%)',
        text: 'hsl(0,0%,92%)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      boxShadow: {
        light: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        medium: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
