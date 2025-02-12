/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "custom-blue": "#4213FF",
      },
      backgroundImage: {
        "custom-gradient":
          "radial-gradient(circle at -10% 40%, rgba(66, 19, 255, 0.8) 0%, transparent 40%) , radial-gradient(circle at 90% -15%, rgba(255, 19, 132, 0.8) 0%, transparent 40%)",
      },
      animation: {
        blob: "blob 7s infinite",
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
};