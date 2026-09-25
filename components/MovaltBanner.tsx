// Banner de divulgação do Movalt Challenge (movaltoficial.com.br) -- outro
// projeto do dono do Academia Score. Fica com identidade visual própria
// (preto + laranja), separada da marca do Academia Score, e marcado como
// "Divulgação" para deixar claro que é conteúdo de outra plataforma.
export default function MovaltBanner() {
  return (
    <div className="movalt-banner section-block">
      <span className="movalt-banner-label">Divulgação</span>
      <div className="movalt-banner-text">
        <div className="movalt-banner-brand">
          MOV<span>ALT</span> CHALLENGE
        </div>
        <h3>
          50<span className="movalt-km">KM</span> EM 31 DIAS
        </h3>
        <p>
          Corra ou caminhe de qualquer lugar do Brasil. Medalha, número de peito, certificado e frete incluso —
          edição de outubro 2026.
        </p>
      </div>
      <div className="movalt-banner-cta">
        <a href="https://www.movaltoficial.com.br/" target="_blank" rel="noopener noreferrer">
          Inscrições abertas →
        </a>
        <span>movaltoficial.com.br</span>
      </div>
    </div>
  );
}
