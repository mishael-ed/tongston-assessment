/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1d1d1b',
        brandYellow: '#fff107',
        cream: '#fafaf8',
      },
      boxShadow: { panel: '0 14px 40px rgba(29, 29, 27, 0.07)' }
    }
  },
  plugins: []
};
