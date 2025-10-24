/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/Sales/**/*.{js,jsx,ts,tsx}",
    "./src/Repair/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'honeycomb-orange': '#FFA500',
        'electric-blue': '#0057B8',
        'light-gray': '#F8F9FA',
        'dark-charcoal': '#212529',
        'slate-gray': '#6C757D',
        'success-green': '#28A745',
        'error-red': '#DC3545',
        'warning-amber': '#FFC107',
        'tech-white': '#FFFFFF',
        'soft-black': '#343A40',
        'electric-blue-dark': '#00448d',
        'cancel-gray': '#E0E0E0',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(90deg, #0057B8, #FFA500)',
        'gradient-button': 'linear-gradient(90deg, #FFA500, #0057B8)',
      },
      boxShadow: {
        'card': '0 2px 6px rgba(0,0,0,0.08)',
        'button': '0 2px 8px rgba(0,0,0,0.15)',
        'elegant': '0 4px 12px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
