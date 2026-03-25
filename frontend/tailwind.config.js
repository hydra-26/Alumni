/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        psu: {
          deep:  '#051f4a',
          dark:  '#072d6b',
          DEFAULT: '#0a3d8f',
          mid:   '#0e4aab',
          light: '#1a5cc8',
        },
        gold: {
          dark:  '#d4a800',
          DEFAULT: '#f5c518',
          light: '#ffd740',
        },
      },
      fontFamily: {
        sans:    ['Lexend', 'Noto Sans', 'Segoe UI', 'sans-serif'],
        display: ['Lexend', 'Noto Sans', 'Segoe UI', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(10,61,143,0.08), 0 1px 2px rgba(10,61,143,0.04)',
        panel: '0 4px 16px rgba(10,61,143,0.10), 0 2px 4px rgba(10,61,143,0.06)',
        gold: '0 4px 14px rgba(245,197,24,0.35)',
      },
      animation: {
        'fade-up':    'fadeUp 0.25s ease forwards',
        'slide-in':   'slideIn 0.2s ease forwards',
        'progress':   'progress 1.2s cubic-bezier(0.4,0,0.2,1) forwards',
      },
      keyframes: {
        fadeUp:   { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
        slideIn:  { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'none' } },
        progress: { from: { width: '0%' }, to: { width: 'var(--w)' } },
      },
    },
  },
  plugins: [],
}
