import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import PremiumDemo from '@/components/PremiumDemo';
import PartnerForm from '@/components/PartnerForm';
import { CURRENT_CITY_SLUG } from '@/lib/gym-helpers';

// Página dedicada à vitrine comercial (perfil parceiro) e ao formulário de
// parceria -- antes isso ficava misturado na home, competindo com o ranking
// e confundindo quem só queria comparar academias. Agora a home só tem um
// CTA discreto que aponta pra aqui (ver app/page.tsx e PartnerCtaButton).
export const revalidate = 300;

const SITE_URL = 'https://academia-score.vercel.app';
const TITLE = 'Para academias — anuncie no Academia Score';
const DESCRIPTION =
  'Veja como funciona o perfil parceiro do Academia Score: galeria ampliada, vídeo, tour 360°, agendamento de aula experimental. O pagamento nunca altera a nota nem a posição no ranking.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/para-academias` },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/para-academias`,
    siteName: 'Academia Score',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default async function ParaAcademiasPage() {
  const city = await db.city.findUnique({ where: { slug: CURRENT_CITY_SLUG } });
  const [totalGyms, totalReviews] = await Promise.all([
    city ? db.gym.count({ where: { cityId: city.id } }) : 0,
    city ? db.review.count({ where: { status: 'APPROVED', gym: { cityId: city.id } } }) : 0,
  ]);

  return (
    <>
      <header style={{ paddingBottom: 22 }}>
        <nav className="main-nav">
          <Link href="/">← Voltar para o ranking</Link>
        </nav>
        <div className="header-inner" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="eyebrow">PARA ACADEMIAS</div>
            <h1>Apareça para quem já está pesquisando</h1>
            <p className="tagline">Perfil parceiro, não anúncio.</p>
            <p className="sub" style={{ maxWidth: 620 }}>
              {totalGyms > 0
                ? `Hoje ${totalGyms} academias${city ? ` de ${city.nome}` : ''} já estão cadastradas no Academia Score e ${totalReviews} avaliações reais foram publicadas por alunos. Um perfil parceiro ajuda quem está comparando a conhecer melhor a sua academia antes de visitar.`
                : 'O Academia Score ajuda quem está pesquisando academia a comparar estrutura, preço e avaliações reais antes de visitar. Um perfil parceiro ajuda quem está comparando a conhecer melhor a sua academia.'}
            </p>
            <div
              className="trust-callout"
              role="note"
              aria-label="Garantia de imparcialidade do ranking"
            >
              🔒 <strong>Academias parceiras não recebem nenhuma vantagem na nota.</strong> O ranking continua 100%
              baseado nas avaliações reais da comunidade — pagar por um perfil parceiro muda a apresentação do
              perfil, nunca a posição no ranking.
            </div>
          </div>
        </div>
      </header>

      <main style={{ paddingTop: 0 }}>
        <div className="section-block">
          <h3 className="top3-title">Veja como fica um perfil parceiro</h3>
          <p className="note" style={{ marginTop: -6, marginBottom: 16, fontStyle: 'normal' }}>
            Abaixo está uma demonstração completa (dados de exemplo, claramente identificados) do que o perfil
            parceiro inclui.
          </p>
          <PremiumDemo />
        </div>
      </main>

      <footer className="partner-footer">
        <div className="partner-inner">
          <div className="partner-text">
            <h3>Quero anunciar minha academia</h3>
            <p>
              Academias parceiras ganham perfil com galeria de fotos e vídeos ampliada, tabela de planos, tour 360° e
              botão direto de WhatsApp — para ajudar quem está pesquisando a te conhecer melhor. Fale com a gente
              para saber mais.
            </p>
            <p className="note" style={{ marginTop: -4, marginBottom: 12 }}>
              O pagamento de uma parceria não altera a posição da academia no ranking.
            </p>
            <a
              className="btn-add partner-cta-hero"
              style={{ textDecoration: 'none', display: 'inline-block' }}
              href="mailto:parcerias@academiascore.com.br?subject=Quero%20ser%20parceira"
            >
              Enviar e-mail para parceria
            </a>
            <a
              href="https://www.instagram.com/academiascore?igsh=aWUwYTRwbGdvM2s2"
              target="_blank"
              rel="noopener"
              className="footer-instagram"
            >
              <span className="social-icon-circle ig">IG</span>Siga o Academia Score no Instagram
            </a>
          </div>
          <PartnerForm />
        </div>
      </footer>
    </>
  );
}
