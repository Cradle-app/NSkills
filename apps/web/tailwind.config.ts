import type { Config } from 'tailwindcss';

/**
 * Cradle Design System v3.0 - Tailwind Configuration
 * 
 * Modern, Claude Code-inspired design system with:
 * - Warm, soft dark palette
 * - Refined typography
 * - Consistent spacing
 * - Subtle, professional aesthetics
 */

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Background hierarchy - warm slate tones */
        forge: {
          bg: 'hsl(220 16% 8%)',
          surface: 'hsl(220 14% 11%)',
          muted: 'hsl(220 13% 14%)',
          elevated: 'hsl(220 12% 18%)',
          hover: 'hsl(220 11% 22%)',
          active: 'hsl(220 10% 26%)',
          /* Legacy text/border mappings */
          text: 'hsl(220 15% 93%)',
          border: 'hsl(220 10% 20%)',
          'border-strong': 'hsl(220 10% 28%)',
          'text-secondary': 'hsl(220 10% 70%)',
        },

        /* Accent colors - softer, more balanced palette */
        accent: {
          /* Primary - Warm terracotta/coral */
          primary: 'hsl(18 76% 58%)',
          cyan: 'hsl(18 76% 58%)', /* Legacy alias */
          /* Secondary - Soft purple */
          secondary: 'hsl(255 45% 60%)',
          purple: 'hsl(255 45% 60%)', /* Legacy alias */
          /* Tertiary - Muted teal */
          tertiary: 'hsl(175 45% 50%)',
          /* Semantic accents */
          lime: 'hsl(152 50% 45%)',
          amber: 'hsl(38 65% 52%)',
          coral: 'hsl(0 55% 55%)',
          magenta: 'hsl(285 45% 55%)',
        },

        /* Node category colors - softer palette */
        node: {
          contracts: 'hsl(200 55% 55%)',
          payments: 'hsl(38 60% 55%)',
          agents: 'hsl(285 45% 55%)',
          app: 'hsl(152 45% 50%)',
          quality: 'hsl(0 50% 55%)',
          intelligence: 'hsl(255 45% 58%)',
          telegram: 'hsl(200 70% 48%)',
        },

        /* Semantic colors */
        success: 'hsl(152 50% 45%)',
        warning: 'hsl(38 65% 52%)',
        error: 'hsl(0 55% 55%)',
        info: 'hsl(200 55% 52%)',
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', 'monospace'],
        display: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1' }],
        'xs': ['0.6875rem', { lineHeight: '1.25' }],
        'sm': ['0.8125rem', { lineHeight: '1.375' }],
        'base': ['0.875rem', { lineHeight: '1.5' }],
        'md': ['0.9375rem', { lineHeight: '1.5' }],
        'lg': ['1rem', { lineHeight: '1.5' }],
        'xl': ['1.125rem', { lineHeight: '1.375' }],
        '2xl': ['1.375rem', { lineHeight: '1.25' }],
        '3xl': ['1.625rem', { lineHeight: '1.25' }],
        '4xl': ['2rem', { lineHeight: '1.2' }],
      },

      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
      },

      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'base': '0.5rem',
        'lg': '0.625rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },

      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.25)',
        'sm': '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.35), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.35), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.35)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.25)',
        'glow-sm': '0 0 8px -2px var(--tw-shadow-color)',
        'glow': '0 0 16px -4px var(--tw-shadow-color)',
        'glow-lg': '0 0 24px -6px var(--tw-shadow-color)',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
        'grid-dots': `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
        'glow-primary': 'radial-gradient(ellipse at center, hsl(18 76% 58% / 0.1), transparent 60%)',
        'glow-secondary': 'radial-gradient(ellipse at center, hsl(255 45% 60% / 0.08), transparent 60%)',
        'mesh-gradient': `
          radial-gradient(at 40% 20%, hsl(18 76% 58% / 0.06) 0px, transparent 50%),
          radial-gradient(at 80% 0%, hsl(255 45% 60% / 0.05) 0px, transparent 50%),
          radial-gradient(at 0% 50%, hsl(152 50% 45% / 0.04) 0px, transparent 50%),
          radial-gradient(at 80% 50%, hsl(38 65% 52% / 0.04) 0px, transparent 50%),
          radial-gradient(at 0% 100%, hsl(255 45% 60% / 0.05) 0px, transparent 50%)
        `,
      },

      backgroundSize: {
        'grid': '32px 32px',
        'grid-lg': '64px 64px',
      },

      animation: {
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },

      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },

      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

      transitionDuration: {
        'instant': '50ms',
        'fast': '100ms',
        'normal': '150ms',
        'moderate': '200ms',
        'slow': '300ms',
        'slower': '400ms',
      },
    },
  },
  plugins: [],
};

export default config;
