'use client';

import { useState } from 'react';

// Porta openHowItWorks() do protótipo -- conteúdo estático, sem dependência
// de dados do servidor, então fica autocontido num Client Component.
export default function HowItWorksButton() {
  const [open, setOpen] = useState(false);

  function goToPartnerForm() {
    setOpen(false);
    const footer = document.querySelector('.partner-footer');
    if (footer) footer.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.getElementById('pfAcademia')?.focus(), 500);
  }

  return (
    <>
      <a href="#" onClick={(e) => { e.preventDefault(); setOpen(true); }}>
        ❓ Como funciona
      </a>
      <div className={`overlay ${open ? 'show' : ''}`} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="modal">
          <div className="modal-head">
            <h2>Como funciona o Academia Score</h2>
            <button className="modal-close" onClick={() => setOpen(false)}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            <div className="premium-section">
              <h4>🏆 Como funciona o ranking</h4>
              <p>
                As academias são ordenadas pela nota média das avaliações da comunidade — do maior para o menor.
                Não existe posição paga: a ordem é 100% baseada nas notas recebidas.
              </p>
            </div>
            <div className="premium-section">
              <h4>⭐ Como calculamos as notas</h4>
              <p>
                Cada avaliação é composta por notas individuais em várias categorias (Equipamentos, Limpeza,
                Atendimento, etc.). A nota daquela avaliação é a média dessas categorias. A nota final da academia
                é a média de todas as avaliações recebidas, exibida em estrelas (0 a 5) e em nota de 0 a 10.
              </p>
            </div>
            <div className="premium-section">
              <h4>✅ Como são verificadas as avaliações</h4>
              <p>
                Para avaliar, é preciso entrar com uma conta (Google ou e-mail e senha) — isso reduz avaliações
                falsas ou duplicadas. Também perguntamos se a pessoa é aluna atual, já foi aluna, ou apenas visitou —
                essa informação aparece junto ao comentário para dar mais contexto. Cada conta pode avaliar uma
                mesma academia apenas uma vez, e toda avaliação passa por moderação antes de aparecer no perfil.
              </p>
            </div>
            <div className="premium-section">
              <h4>🚩 Como denunciar informações incorretas</h4>
              <p>
                Encontrou um endereço, telefone ou horário errado? Ou uma avaliação que parece falsa ou abusiva?
                Envie um e-mail para <strong>contato@academiascore.com.br</strong> descrevendo o problema, que
                corrigimos o quanto antes.
              </p>
            </div>
            <div className="premium-section">
              <h4>🤝 Como uma academia pode se tornar parceira</h4>
              <p>
                Academias parceiras ganham selo de destaque, galeria de fotos ampliada, vídeo institucional, redes
                sociais em destaque, agendamento de aula experimental e muito mais. Preencha o formulário de
                parceria no rodapé do site, ou veja um exemplo completo no perfil de demonstração.
              </p>
              <button className="btn-sm" onClick={goToPartnerForm}>
                Ver formulário de parceria
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
