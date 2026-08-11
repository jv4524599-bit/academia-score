import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE_URL = 'https://academia-score.vercel.app';
const TITLE = 'Academia Score — Valparaíso de Goiás';
const DESCRIPTION =
  'Compare preços, avaliações reais, estrutura, Wellhub (Gympass), TotalPass e escolha com mais confiança.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s | Academia Score' },
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
  themeColor: '#20262B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
