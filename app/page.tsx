import CityHome from '@/components/CityHome';
import { CURRENT_CITY_SLUG } from '@/lib/gym-helpers';

// Roda no servidor: busca os dados direto do banco a cada visita.
// Isso é o que resolve o problema de SEO -- o Google já recebe o HTML pronto.
export const revalidate = 60; // regenera a página a cada 60s (ISR)

// A home em "/" é só a cidade original renderizada pelo componente
// compartilhado CityHome (ver components/CityHome.tsx). A lógica de
// ranking, notas em formação, JSON-LD etc. mora lá -- aqui só escolhe a
// cidade e o prefixo de rota.
export default async function HomePage({
  searchParams,
}: {
  searchParams: { compare?: string; authError?: string };
}) {
  return <CityHome citySlug={CURRENT_CITY_SLUG} basePath="" searchParams={searchParams} />;
}
