import type { Config } from 'tailwindcss';

// Mesma paleta de cores e fontes do protótipo original --
// assim o visual não muda nada na migração.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#E7E2D6',
        'paper-2': '#DED7C6',
        ink: '#20262B',
        'ink-soft': '#565C5E',
        clay: '#A63F27',
        'clay-dark': '#832F1C',
        gold: '#D6A23D',
        sage: '#4C6B52',
        'sage-bg': '#DDE5D9',
        warn: '#9B3A34',
        'warn-bg': '#E9D9D6',
        line: '#C6BFAE',
        card: '#F3EFE4',
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
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
