/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "custom-blue": "#4213FF",
        "light-bg": "#F8F9FA",
        "light-surface": "#FFFFFF",
        "light-card": "#F0F4F8",
        "light-border": "#E2E8F0",
        "accent-pink": "#FF6B9D",
        "accent-purple": "#9B7EDE",
        "accent-cyan": "#4ECDC4",
      },
      backgroundImage: {
        "custom-gradient":
          "radial-gradient(circle at -10% 40%, rgba(255, 107, 157, 0.15) 0%, transparent 50%) , radial-gradient(circle at 90% -15%, rgba(155, 126, 222, 0.15) 0%, transparent 50%), linear-gradient(135deg, #F8F9FA 0%, #E8F0F8 100%)",
        "light-gradient":
          "linear-gradient(135deg, #FFFFFF 0%, #F0F4F8 50%, #E8F0F8 100%)",
      },
    },
  },
  plugins: [],
};