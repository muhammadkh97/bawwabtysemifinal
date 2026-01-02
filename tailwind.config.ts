import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8A2BE2',
          600: '#6236FF',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
        },
        secondary: {
          500: '#FF007F',
          600: '#FF219D',
        },
        accent: {
          500: '#00A86B',
        },
      },
      fontFamily: {
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
