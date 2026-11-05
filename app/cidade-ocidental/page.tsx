import type { Metadata } from 'next';
import CityHome from '@/components/CityHome';
import { CIDADE_OCIDENTAL_SLUG } from '@/lib/gym-helpers';

// Home de Cidade Ocidental -- mesmo layout e lógica da home de Valparaíso
// de Goiás (ver components/CityHome.tsx), só trocando a cidade e o prefixo
// de rota. Pra adicionar outra cidade no futuro, copiar este arquivo.
export const revalidate = 60;

const SITE_URL = 'https://academia-score.vercel.app';
const TITLE = 'Academia Score — Cidade Ocidental';
const DESCRIPTION =
  'Compare academias de Cidade Ocidental por avaliações reais, preço, estrutura, Wellhub (Gympass) e TotalPass — sem posição paga no ranking.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/cidade-ocidental' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/cidade-ocidental`,
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

export default async function CidadeOcidentalHomePage({
  searchParams,
}: {
  searchParams: { compare?: string; authError?: string };
}) {
  return <CityHome citySlug={CIDADE_OCIDENTAL_SLUG} basePath="/cidade-ocidental" searchParams={searchParams} />;
}
