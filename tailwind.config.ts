import type { Config } from 'tailwindcss';

// Identidade "Preto + Verde Neon" -- espelha as variáveis CSS de
// app/globals.css (:root). Mudar aqui e lá juntos ao ajustar a marca.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4F4F1',
        'paper-2': '#E8E8E3',
        ink: '#0A0A0A',
        'ink-soft': '#64645D',
        clay: '#2F6A00',
        'clay-dark': '#1F4A00',
        neon: '#C6FF3D',
        'neon-dark': '#A6E600',
        gold: '#D6A23D',
        sage: '#4C6B52',
        'sage-bg': '#DDE5D9',
        warn: '#9B3A34',
        'warn-bg': '#E9D9D6',
        line: '#DBDBD5',
        card: '#FFFFFF',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
      },
    },
  },
  plugins: [],
};
export default config;
