/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rv: {
          gold: '#ffd700',
          dark: '#0a0a0a',
          deepBlue: '#1e3a8a'
        }
      },
      backgroundImage: {
        'rv-panel': 'linear-gradient(135deg, #0a0a0a 0%, #1e3a8a 100%)'
      },
      minHeight: {
        touch: '48px'
      },
      minWidth: {
        touch: '48px'
      },
      boxShadow: {
        'rv-gold': '0 4px 15px rgba(255, 215, 0, 0.3)'
      },
      screens: {
        'mobile-sm': '390px',
        mobile: '480px',
        tablet: '768px',
        desktop: '1024px'
      }
    },
  },
  plugins: [],
}

