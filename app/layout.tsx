import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Academia Score — Valparaíso de Goiás',
  description:
    'Compare preços, avaliações reais, estrutura, Wellhub (Gympass), TotalPass e escolha com mais confiança.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
