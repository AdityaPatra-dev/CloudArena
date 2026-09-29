/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          darkest: '#040711',
          dark: '#080d1a',
          surface: '#0d1527',
          card: '#111c35',
          cardHover: '#172445',
          border: '#1e2d4a',
          accent: '#00d4ff',
          neonCyan: '#00f0ff',
          neonEmerald: '#10b981',
          neonPurple: '#a855f7',
          neonAmber: '#f59e0b',
          neonRose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fadeInUp': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulseGlow': 'pulseGlow 3s infinite ease-in-out',
        'floatSlow': 'floatSlow 6s infinite ease-in-out',
        'floatReverse': 'floatReverse 7s infinite ease-in-out',
        'gradientShift': 'gradientShift 8s ease infinite',
        'shimmer': 'shimmer 2.2s infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(10px)' },
        },
        gradientShift: {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -4px rgba(0, 240, 255, 0.35)',
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.35)',
        'glow-purple': '0 0 25px -4px rgba(168, 85, 247, 0.35)',
        'glow-amber': '0 0 25px -4px rgba(245, 158, 11, 0.35)',
        'glow-rose': '0 0 25px -4px rgba(244, 63, 94, 0.35)',
        'card-hover': '0 20px 40px -15px rgba(2, 6, 23, 0.8), 0 0 20px -2px rgba(14, 165, 233, 0.15)',
      }
    },
  },
  plugins: [],
}
