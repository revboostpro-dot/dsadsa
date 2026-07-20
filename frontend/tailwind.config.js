/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Dark base
        bg: {
          DEFAULT: '#0a0f0a',
          secondary: '#111811',
          card: '#141c14',
          elevated: '#1a241a',
          border: '#1f2f1f',
        },
        // Green accent
        primary: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
          dark: '#16a34a',
          muted: '#166534',
          glow: 'rgba(34,197,94,0.2)',
        },
        // Status colors
        status: {
          available: '#22c55e',
          locked: '#eab308',
          cooldown: '#ef4444',
        },
        // Text
        text: {
          primary: '#f0fdf0',
          secondary: '#86a886',
          muted: '#4b6b4b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
        'bounce-in':  'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { from: { transform: 'translateY(-20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pulseGreen:{ '0%,100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(34,197,94,0)' } },
        shimmer:   { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        bounceIn:  { from: { transform: 'scale(0.8)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(34,197,94,0.3)',
        'glow-sm': '0 0 10px rgba(34,197,94,0.2)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
        elevated: '0 8px 40px rgba(0,0,0,0.6)',
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
