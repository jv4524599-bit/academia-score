import type { Config } from 'tailwindcss';

// Identidade "Preto + Amarelo" -- espelha as variáveis CSS de
// app/globals.css (:root). Mudar aqui e lá juntos ao ajustar a marca.
// (Nenhum componente usa essas classes utilitárias do Tailwind hoje --
// toda a estilização real vem das classes manuais em globals.css -- mas
// os valores ficam espelhados aqui pra não desalinhar se isso mudar.)
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#0A0A0A',
        'paper-2': '#17140E',
        ink: '#F4F4F1',
        'ink-soft': '#ACA89D',
        clay: '#FFD400',
        'clay-dark': '#E0B600',
        neon: '#FFD400',
        'neon-dark': '#E0B600',
        gold: '#F0C147',
        sage: '#6FDB8E',
        'sage-bg': '#1E3626',
        warn: '#F08A8A',
        'warn-bg': '#3A2420',
        line: '#2E2A1E',
        card: '#141210',
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
