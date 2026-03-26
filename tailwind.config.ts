import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
        },
        border: {
          DEFAULT: 'var(--border)',
          active: 'var(--border-active)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: 'var(--accent)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },
      borderRadius: {
        md: 'var(--radius)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      boxShadow: {
        glow: '0 0 0 1px var(--accent-glow), 0 8px 30px -12px rgba(0,0,0,0.8)',
      },
      keyframes: {
        pulseOverdue: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.6' },
        },
      },
      animation: {
        'pulse-overdue': 'pulseOverdue 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
