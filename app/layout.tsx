import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE_URL = 'https://academia-score.vercel.app';
const TITLE = 'Academia Score — Valparaíso de Goiás';
const DESCRIPTION =
  'Compare preços, avaliações reais, estrutura, Wellhub (Gympass), TotalPass e escolha com mais confiança.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Título simples (sem `template`): as páginas internas já montam seu
  // próprio título completo (ex.: "Nome da academia | Academia Score"),
  // então um template aqui duplicava o sufixo ("... | Academia Score | Academia Score").
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Academia Score',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
