import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        /* Semantic tokens -- auto-flip via CSS variables in globals.css */
        dt: {
          bg:            'hsl(var(--base))',
          surface:       'hsl(var(--base-soft))',
          'surface-alt': 'hsl(var(--base-contrast))',
          border:        'hsl(var(--border-subtle))',
          text:          'hsl(var(--text-strong))',
          'text-muted':  'hsl(var(--text-soft))',
          'input-bg':    'hsl(var(--input-bg))',
          'accent-soft': 'hsl(var(--accent-soft))',
          'accent-border': 'hsl(var(--accent-border))',
        },
        brand: {
          DEFAULT: '#22c55e',
          hover: '#00CC6F',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          
        },
        neon: {
          cyan: '#00ffff',
          magenta: '#ff00ff',
          green: '#00ff88',
          purple: '#bf00ff',
        },
        surface: {
          DEFAULT: '#0A0B0E',
          elevated: '#0F1115',
          overlay: '#1a1a24',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.05)',
          light: 'rgba(255, 255, 255, 0.1)',
        },
        trust: {
          high: '#22c55e',    // score > 75
          medium: '#3b82f6',  // score 50-75
          low: '#eab308',     // score < 50
          danger: '#ef4444',  // disputes/errors
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 136, 0.5)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
