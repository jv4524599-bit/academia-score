// Banners de divulgação do Movalt Challenge (movaltoficial.com.br) -- outro
// projeto do dono do Academia Score. Usa as peças de divulgação reais
// fornecidas pelo Movalt (public/movalt-challenge-banner.jpg = 50km,
// public/movalt-challenge-70km-banner.jpg = 70km), com a etiqueta
// "Divulgação" sobreposta em cada uma pra deixar claro que é conteúdo de
// outra plataforma, separado da marca do Academia Score. Aparece em
// qualquer cidade (CityHome.tsx chama <MovaltBanner /> uma vez por página,
// então atualizar aqui reflete em todas as cidades do Academia Score).
export default function MovaltBanner() {
  return (
    <>
      <div className="movalt-banner-wrap section-block">
        <span className="movalt-banner-label">Divulgação</span>
        <a
          href="https://www.movaltoficial.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="movalt-banner-link"
          aria-label="Movalt Challenge — 50km, aberto o ano inteiro, corra, caminhe ou pedale de qualquer lugar do Brasil no seu ritmo. Inscrições abertas em movaltoficial.com.br"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/movalt-challenge-banner.jpg"
            width={1672}
            height={941}
            alt="Movalt Challenge 50km, aberto o ano inteiro — comece quando quiser, corra, caminhe ou pedale no seu ritmo, de qualquer lugar do Brasil. Kit completo por R$90: medalha e chaveiro oficiais, número de peito e certificado, frete incluso para todo o Brasil, grupo no WhatsApp e comunidade no Strava. Inscrições abertas em movaltoficial.com.br"
            className="movalt-banner-img"
          />
        </a>
      </div>

      <div className="movalt-banner-wrap section-block">
        <span className="movalt-banner-label">Divulgação</span>
        <a
          href="https://www.movaltoficial.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="movalt-banner-link"
          aria-label="Movalt Challenge — 70km, supere o seu limite, corra, caminhe ou pedale de qualquer lugar do Brasil no seu ritmo. Inscrições abertas em movaltoficial.com.br"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/movalt-challenge-70km-banner.jpg"
            width={1672}
            height={941}
            alt="Movalt Challenge 70km, supere o seu limite — corra, caminhe ou pedale no seu ritmo, de qualquer lugar do Brasil. Kit completo por R$90: medalha e chaveiro oficiais, número de peito e certificado de conclusão, frete incluso para todo o Brasil, grupo no WhatsApp e comunidade no Strava. Desafio 70km, edição novembro 2026. Inscrições abertas em movaltoficial.com.br"
            className="movalt-banner-img"
          />
        </a>
      </div>
    </>
  );
}
