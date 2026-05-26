/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        main: "rgb(var(--bg-main) / <alpha-value>)",
        sidebar: "rgb(var(--bg-sidebar) / <alpha-value>)",
        card: "rgb(var(--bg-card) / <alpha-value>)",
        navbar: "rgb(var(--bg-navbar) / <alpha-value>)",
        
        primary: "rgb(var(--text-primary) / <alpha-value>)",
        secondary: "rgb(var(--text-secondary) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        
        accent: {
          primary: "rgb(var(--accent-primary) / <alpha-value>)",
          secondary: "rgb(var(--accent-secondary) / <alpha-value>)",
        },
        
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
        
        border: "rgb(var(--border-color) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
