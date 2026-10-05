import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

// Measurement ID da propriedade GA4 "academia score site" (analytics.google.com).
// Fica hardcoded (não é segredo -- é um valor público, visível em texto puro no
// JS de qualquer site que usa GA) em vez de variável de ambiente, para não
// depender de configurar mais uma env var na Vercel.
const GA_MEASUREMENT_ID = 'G-VFT1QENSP2';

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
      <body>
        {children}
        <Analytics />
      </body>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
    </html>
  );
}
