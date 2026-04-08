/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Victor Mono"', 'monospace'],
        mono: ['"Victor Mono"', 'monospace'],
      },
      colors: {
        primary: '#000000',
        secondary: '#333333',
        background: '#ffffff',
        surface: '#f5f5f5',
        muted: '#666666',
        border: '#000000',
        success: '#000000',
        error: '#000000',
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [
    function({ addBase, theme }) {
      addBase({
        '*': {
          'border-radius': '0 !important',
        },
      });
    },
  ],
}
