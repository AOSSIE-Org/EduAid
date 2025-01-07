/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'custom-blue': '#4213FF',
      },
      backgroundImage: {
        'custom-gradient':
          'radial-gradient(circle at -10% 40%, rgba(66, 19, 255, 0.8) 0%, transparent 40%) , radial-gradient(circle at 90% -15%, rgba(255, 19, 132, 0.8) 0%, transparent 40%)',
      },
    },
  },
  plugins: [],
}
