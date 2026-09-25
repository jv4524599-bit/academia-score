// Banner de divulgação do Movalt Challenge (movaltoficial.com.br) -- outro
// projeto do dono do Academia Score. Usa a peça de divulgação real fornecida
// pelo Movalt (public/movalt-challenge-banner.jpg), com a etiqueta
// "Divulgação" sobreposta pra deixar claro que é conteúdo de outra
// plataforma, separado da marca do Academia Score.
export default function MovaltBanner() {
  return (
    <div className="movalt-banner-wrap section-block">
      <span className="movalt-banner-label">Divulgação</span>
      <a
        href="https://www.movaltoficial.com.br/"
        target="_blank"
        rel="noopener noreferrer"
        className="movalt-banner-link"
        aria-label="Movalt Challenge — 50km em 31 dias, corra ou caminhe de qualquer lugar do Brasil. Inscrições abertas em movaltoficial.com.br"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/movalt-challenge-banner.jpg"
          width={1600}
          height={900}
          alt="Movalt Challenge 50km em 31 dias, edição outubro 2026 — corra ou caminhe de qualquer lugar do Brasil. Medalha, chaveiro, número de peito, certificado e frete incluso para todo o Brasil. Inscrições abertas em movaltoficial.com.br"
          className="movalt-banner-img"
        />
      </a>
    </div>
  );
}
