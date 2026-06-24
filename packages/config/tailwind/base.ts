import type { Config } from 'tailwindcss';

// DeTrust Design System - Web3-native Glassmorphism Theme (Option B)
// Distinctive, modern aesthetic with translucent surfaces and neon accents

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // Custom Typography - Distinctive, not generic
      fontFamily: {
        sans: ['Satoshi', 'SF Pro Display', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'Satoshi', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      // Web3-native Color Palette with neon accents
      colors: {
        // Primary brand colors
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Main brand green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        
        // Accent neon colors
        neon: {
          cyan: '#00ffff',
          magenta: '#ff00ff',
          green: '#00ff88',
          purple: '#bf00ff',
          blue: '#00a8ff',
        },
        
        // Glass surface colors
        glass: {
          white: 'rgba(255, 255, 255, 0.05)',
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.15)',
          heavy: 'rgba(255, 255, 255, 0.2)',
        },
        
        // Dark theme backgrounds
        surface: {
          base: '#0a0a0f',
          raised: '#12121a',
          overlay: '#1a1a24',
          elevated: '#22222e',
        },
        
        // Semantic colors
        success: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
          dark: '#16a34a',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
        },
        
        // Trust score gradient colors
        trust: {
          low: '#ef4444',
          medium: '#f59e0b',
          high: '#22c55e',
          excellent: '#00ff88',
        },
      },
      
      // Glassmorphism effects
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      
      // Glow effects
      boxShadow: {
        'glow-sm': '0 0 10px rgba(34, 197, 94, 0.3)',
        'glow-md': '0 0 20px rgba(34, 197, 94, 0.4)',
        'glow-lg': '0 0 40px rgba(34, 197, 94, 0.5)',
        'glow-cyan': '0 0 20px rgba(0, 255, 255, 0.4)',
        'glow-magenta': '0 0 20px rgba(255, 0, 255, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      
      // Border radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      
      // Custom spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      
      // Animation durations
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      
      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-up': 'fadeUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      
      // Background image patterns
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': `
          radial-gradient(at 40% 20%, rgba(34, 197, 94, 0.15) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(0, 255, 255, 0.1) 0px, transparent 50%),
          radial-gradient(at 0% 50%, rgba(191, 0, 255, 0.1) 0px, transparent 50%),
          radial-gradient(at 80% 50%, rgba(0, 168, 255, 0.1) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(34, 197, 94, 0.1) 0px, transparent 50%)
        `,
        'grid-pattern': `
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};

export default config;
