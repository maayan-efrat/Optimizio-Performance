import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Indigo Night palette
        bg: '#0f0a2e',
        panel: '#16133d',
        card: '#1e1b4b',
        brand: '#7c3aed',
        accent: '#06b6d4',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124, 58, 237, 0.15), 0 8px 40px rgba(124, 58, 237, 0.15)',
        'glow-cyan': '0 0 0 1px rgba(6, 182, 212, 0.15), 0 8px 40px rgba(6, 182, 212, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'Heebo', 'sans-serif'],
        hebrew: ['Heebo', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
