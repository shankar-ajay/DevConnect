/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            code: {
              backgroundColor: theme('colors.gray.100'),
              borderRadius: theme('borderRadius.sm'),
              paddingTop: '0.125rem',
              paddingBottom: '0.125rem',
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              fontWeight: '400',
            },
            'code::before': { content: '""' },
            'code::after':  { content: '""' },
          },
        },
        invert: {
          css: {
            code: { backgroundColor: theme('colors.gray.800') },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
