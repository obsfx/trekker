/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        page: {
          DEFAULT: '#1e3a5f',
          dark: '#0f1f33'
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.95)',
          muted: 'rgba(255, 255, 255, 0.85)',
          card: 'rgba(255, 255, 255, 0.9)',
          dark: 'rgba(15, 23, 42, 0.95)',
          'muted-dark': 'rgba(15, 23, 42, 0.85)',
          'card-dark': 'rgba(15, 23, 42, 0.9)'
        },
        accent: {
          DEFAULT: '#1e3a5f',
          light: 'rgba(30, 58, 95, 0.1)',
          dark: '#93c5fd'
        },
        text: {
          DEFAULT: '#1e293b',
          muted: '#475569',
          dark: '#f1f5f9',
          'muted-dark': '#94a3b8'
        },
        border: {
          DEFAULT: 'rgba(30, 58, 95, 0.15)',
          dark: 'rgba(148, 163, 184, 0.2)'
        }
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace']
      },
      fontSize: {
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.25vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.35vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.5vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.2rem + 1vw, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.5rem + 1.5vw, 2.5rem)',
        'fluid-4xl': 'clamp(2.25rem, 1.75rem + 2vw, 3rem)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'lift': 'lift 0.2s ease-out forwards'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        lift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2px)' }
        }
      }
    }
  },
  plugins: []
};
