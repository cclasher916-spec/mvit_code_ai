/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Outfit', 'sans-serif'],
      },
      colors: {
        background: 'rgba(var(--color-background), <alpha-value>)',
        surface: 'rgba(var(--color-surface), <alpha-value>)',
        border: 'rgba(var(--color-border), <alpha-value>)',
        subtle: 'rgba(var(--color-subtle), <alpha-value>)',
        textMain: 'rgba(var(--color-text-main), <alpha-value>)',
        textMuted: 'rgba(var(--color-text-muted), <alpha-value>)',
        white: 'rgba(var(--color-adaptive-white), <alpha-value>)',
        brand: {
          400: 'rgba(var(--color-brand-400), <alpha-value>)',
          500: 'rgba(var(--color-brand-500), <alpha-value>)',
          600: 'rgba(var(--color-brand-600), <alpha-value>)',
        },
        accent: {
          purple: '#8b5cf6',
          pink: '#ec4899',
          green: '#10b981',
          yellow: '#f59e0b',
        }
      },
      backgroundImage: {
        'gradient-main': 'radial-gradient(circle at top right, var(--color-bg-grad-1) 0%, var(--color-bg-grad-2) 100%)',
        'gradient-hero': 'linear-gradient(135deg, rgba(var(--color-brand-400), 1) 0%, #8b5cf6 100%)',
        'gradient-glass': 'linear-gradient(180deg, rgba(var(--color-text-main), 0.03) 0%, rgba(var(--color-text-main), 0) 100%)',
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-gentle': 'bounceGentle 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}