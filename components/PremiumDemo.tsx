'use client';

import { useState } from 'react';
import premiumGallery from '@/prisma/premium-gallery.json';

// Perfil premium de demonstração -- portado de renderPremiumCard() /
// openPremiumModal() / openScheduleModal() / confirmSchedule() do protótipo.
// Nada aqui é persistido no banco: é só uma vitrine do que uma academia
// parceira ganharia, igual ao comportamento original.

const TOUR_PANELS = [
  { bg: '#20262B', accent: '#A63F27' },
  { bg: '#232A2E', accent: '#D6A23D' },
  { bg: '#1F2529', accent: '#4C6B52' },
  { bg: '#212729', accent: '#A63F27' },
];

function TourPanel({ bg, accent }: { bg: string; accent: string }) {
  return (
    <svg viewBox="0 0 300 220" style={{ height: '100%', flexShrink: 0, display: 'block' }}>
      <rect width="300" height="220" fill={bg} />
      <rect y="170" width="300" height="50" fill="#2A3238" />
      <rect x="30" y="110" width="14" height="60" fill={accent} />
      <rect x="70" y="90" width="14" height="80" fill={accent} />
      <rect x="220" y="100" width="14" height="70" fill={accent} />
      <rect x="260" y="120" width="14" height="50" fill={accent} />
      <circle cx="150" cy="60" r="10" fill={accent} opacity="0.5" />
    </svg>
  );
}

function VideoThumb() {
  return (
    <svg viewBox="0 0 400 200" style={{ width: '100%', display: 'block' }}>
      <rect width="400" height="200" fill="#20262B" />
      <rect x="0" y="140" width="400" height="60" fill="#2A3238" />
      <rect x="40" y="90" width="18" height="50" fill="#A63F27" />
      <rect x="70" y="70" width="18" height="70" fill="#D6A23D" />
      <rect x="100" y="100" width="18" height="40" fill="#4C6B52" />
      <circle cx="300" cy="90" r="22" fill="none" stroke="#D6A23D" strokeWidth="3" />
      <rect x="270" y="120" width="60" height="10" fill="#3A434A" />
    </svg>
  );
}

const MURAL_NOTES: Array<{ highlight: boolean; date: string; text: React.ReactNode }> = [
  {
    highlight: true,
    date: '24/07 (exemplo)',
    text: (
      <>
        ⚠️ Estaremos <strong>fechados no dia 28/07</strong> para reforma no salão de musculação. Retornamos
        normalmente no dia 29/07. Pedimos desculpas pelo transtorno!
      </>
    ),
  },
  {
    highlight: false,
    date: '20/07 (exemplo)',
    text: '🎉 Nova turma de Funcional às terças e quintas, 19h. Vagas limitadas!',
  },
  { highlight: false, date: '15/07 (exemplo)', text: '🕐 Horário especial no feriado: atendimento das 8h às 12h.' },
];

export default function PremiumDemo() {
  const [open, setOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<string | null>(null);
  const [schName, setSchName] = useState('');
  const [schDay, setSchDay] = useState('');
  const [schTime, setSchTime] = useState('');

  function goToPartnerForm() {
    setOpen(false);
    const footer = document.querySelector('.partner-footer');
    if (footer) footer.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.getElementById('pfAcademia')?.focus(), 500);
  }

  function openSchedule() {
    setScheduleResult(null);
    setSchName('');
    setSchDay('');
    setSchTime('');
    setScheduleOpen(true);
  }

  function confirmSchedule() {
    if (!schName.trim() || !schDay.trim() || !schTime.trim()) {
      alert('Preencha nome, dia e horário.');
      return;
    }
    setScheduleResult(
      `✅ Agendamento simulado com sucesso, ${schName.trim()}! Em um perfil parceiro real, a academia receberia esse pedido para ${schDay.trim()} às ${schTime.trim()} diretamente no WhatsApp.`
    );
  }

  return (
    <>
      <div className="premium-card" onClick={() => setOpen(true)}>
        <div>
          <span className="premium-badge">🏆 Academia Parceira</span>
          <h3>🏆 Academia Parceira (Demonstração)</h3>
          <p className="sub">
            Exemplo de perfil exclusivo para academias parceiras. Clique para ver tudo que um perfil parceiro pode
            ter.
          </p>
        </div>
        <button className="btn-sm" style={{ borderColor: 'var(--gold)', color: 'var(--ink)' }}>
          Ver perfil completo
        </button>
      </div>

      <div className={`overlay premium-modal ${open ? 'show' : ''}`} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="modal">
          <div className="modal-head" style={{ borderBottom: '2px solid var(--gold)' }}>
            <div>
              <span className="premium-badge">🏆 Academia Parceira</span>
              <h2 style={{ margin: '4px 0 0' }}>🏆 Academia Parceira (Demonstração)</h2>
            </div>
            <button className="modal-close" onClick={() => setOpen(false)}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            <div className="premium-intro-banner">
              <p>
                Este é um perfil demonstrativo mostrando como sua academia pode aparecer para milhares de usuários
                ao se tornar parceira do Academia Score.
              </p>
              <button className="premium-cta-big" onClick={goToPartnerForm}>
                🏆 Quero minha academia assim
              </button>
            </div>

            <div className="premium-section">
              <h4>🏆 Selo de Academia Parceira</h4>
              <p>
                Academias parceiras possuem acesso a recursos exclusivos pensados para aumentar sua visibilidade,
                conquistar mais alunos e se destacar no Academia Score.
              </p>
            </div>

            <div className="premium-section">
              <h4>📸 Galeria Premium</h4>
              <div className="premium-photo-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                {premiumGallery.map((p) => (
                  <div className="premium-photo-item" key={p.url}>
                    <div className="premium-photo-slot" title={p.label}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.label} />
                    </div>
                    <span className="premium-photo-caption">{p.label}</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 8 }}>
                Fotos reais de exemplo. Academias parceiras podem colocar até 15 fotos, 3 vídeos e 1 tour 360° na
                galeria.
              </p>
            </div>

            <div className="premium-section">
              <h4>🎥 Vídeo Institucional</h4>
              <div className="premium-video-slot">
                <VideoThumb />
                <div className="play-overlay">
                  <div className="play-circle">▶</div>
                </div>
              </div>
              <p style={{ marginTop: 8 }}>Apresente sua estrutura através de vídeos reais gravados na sua academia.</p>
            </div>

            <div className="premium-section">
              <h4>🎥 Tour 360°</h4>
              <div className="tour360-viewer" style={{ overflowX: 'auto' }}>
                <div className="tour360-track" style={{ width: 300 * TOUR_PANELS.length }}>
                  {TOUR_PANELS.map((p, i) => (
                    <TourPanel key={i} bg={p.bg} accent={p.accent} />
                  ))}
                </div>
                <span className="tour360-hint">⟷ arraste para olhar ao redor</span>
              </div>
              <p style={{ marginTop: 8 }}>
                Demonstração simplificada de tour 360° (arraste/deslize horizontalmente para navegar pelos
                ambientes). Academias parceiras podem oferecer um passeio virtual real pela estrutura.
              </p>
              <p className="note" style={{ marginTop: 6 }}>
                O Tour 360° é um recurso opcional, disponibilizado pelas academias parceiras que optarem por
                fornecê-lo.
              </p>
            </div>

            <div className="premium-section">
              <h4>📍 Localização</h4>
              <div className="premium-social-row">
                <a href="#" onClick={(e) => e.preventDefault()} className="premium-social-chip" style={{ textDecoration: 'none' }}>
                  <span className="social-icon-circle gmaps">📍</span>Google Maps
                </a>
                <a href="#" onClick={(e) => e.preventDefault()} className="premium-social-chip" style={{ textDecoration: 'none' }}>
                  <span className="social-icon-circle waze">W</span>Waze
                </a>
              </div>
              <p style={{ marginTop: 8 }}>Academias parceiras podem oferecer navegação direta por Google Maps e Waze no perfil.</p>
            </div>

            <div className="premium-section">
              <h4>🌐 Site Oficial</h4>
              <a href="#" onClick={(e) => e.preventDefault()} className="btn-sm" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Visitar site da academia
              </a>
            </div>

            <div className="premium-section">
              <h4>📱 Redes Sociais</h4>
              <div className="premium-social-row">
                <span className="premium-social-chip">
                  <span className="social-icon-circle ig">IG</span>Instagram
                </span>
                <span className="premium-social-chip">
                  <span className="social-icon-circle fb">FB</span>Facebook
                </span>
                <span className="premium-social-chip">
                  <span className="social-icon-circle tt">TT</span>TikTok
                </span>
                <span className="premium-social-chip">
                  <span className="social-icon-circle wa">WA</span>WhatsApp
                </span>
              </div>
            </div>

            <div className="premium-section">
              <h4>💰 Planos</h4>
              <table className="premium-plans">
                <tbody>
                  <tr>
                    <th>Mensal</th>
                    <th>Trimestral</th>
                    <th>Semestral</th>
                    <th>Anual</th>
                  </tr>
                  <tr>
                    <td>R$ 129,90</td>
                    <td>R$ 349,90</td>
                    <td>R$ 599,90</td>
                    <td>R$ 999,90</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="premium-section">
              <h4>Horários das Aulas</h4>
              <ul className="premium-schedule-list">
                <li>
                  <span>Fitdance</span>
                  <span>Seg e Qua, 19h</span>
                </li>
                <li>
                  <span>Funcional</span>
                  <span>Ter e Qui, 07h e 18h</span>
                </li>
                <li>
                  <span>Spinning</span>
                  <span>Sex, 19h30</span>
                </li>
                <li>
                  <span>Treino livre</span>
                  <span>Todos os dias, horário livre</span>
                </li>
              </ul>
            </div>

            <div className="premium-section">
              <h4>🎁 Promoções</h4>
              <ul className="premium-promo-list">
                <li>
                  Primeira mensalidade por R$ 9,90 <em className="demo-tag">(exemplo)</em>
                </li>
                <li>
                  Matrícula grátis <em className="demo-tag">(exemplo)</em>
                </li>
                <li>
                  Avaliação física inclusa <em className="demo-tag">(exemplo)</em>
                </li>
              </ul>
            </div>

            <div className="premium-section">
              <h4>📌 Mural de Avisos</h4>
              <p>
                Academias parceiras têm direito a um mural de avisos no perfil, atualizado semanalmente pela
                própria academia — ideal para avisar sobre mudanças de horário, manutenções, eventos e novidades.
              </p>
              <div className="mural-board">
                {MURAL_NOTES.map((n, i) => (
                  <div className={`mural-note ${n.highlight ? 'highlight' : ''}`} key={i}>
                    <span className="mural-date">{n.date}</span>
                    <p>{n.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-section">
              <h4>📅 Agende uma Aula Experimental</h4>
              <button className="premium-cta-big" onClick={openSchedule}>
                Agendar Aula Experimental
              </button>
            </div>

            <div className="premium-section">
              <h4>⭐ Resposta da Academia</h4>
              <div className="premium-review-example">
                <strong>Maria S.</strong> — ★★★★☆
                <br />
                &quot;Adorei a estrutura, só acho que fica um pouco cheia às 19h.&quot;
                <div className="premium-review-reply">
                  Resposta da academia: Obrigado pelo carinho, Maria! Já estamos ampliando o horário de pico para
                  melhorar sua experiência. 💪
                </div>
              </div>
              <p>Academias parceiras podem responder publicamente às avaliações dos alunos.</p>
            </div>

            <div className="premium-section">
              <h4>📊 Estatísticas Exclusivas</h4>
              <div className="premium-stats-grid">
                <div className="premium-stat-box">
                  <span className="num">1.284</span>
                  <span className="label">Visualizações do perfil</span>
                </div>
                <div className="premium-stat-box">
                  <span className="num">312</span>
                  <span className="label">Cliques no WhatsApp</span>
                </div>
                <div className="premium-stat-box">
                  <span className="num">198</span>
                  <span className="label">Cliques em &quot;Como chegar&quot;</span>
                </div>
                <div className="premium-stat-box">
                  <span className="num">87</span>
                  <span className="label">Favoritos</span>
                </div>
                <div className="premium-stat-box">
                  <span className="num">45</span>
                  <span className="label">Leads recebidos</span>
                </div>
                <div className="premium-stat-box">
                  <span className="num">63</span>
                  <span className="label">Comparações realizadas</span>
                </div>
              </div>
              <p style={{ marginTop: 8, fontStyle: 'italic' }}>Dados meramente ilustrativos, apenas para demonstração.</p>
            </div>

            <div className="premium-section">
              <h4>📈 Insights do Academia Score</h4>
              <div className="premium-insight-box">
                &quot;Nos últimos 30 dias, os usuários elogiaram principalmente a limpeza e os professores. O
                principal ponto de melhoria apontado foi a lotação entre 18h e 20h.&quot;
              </div>
            </div>

            <div className="premium-section">
              <h4>🏅 Benefícios Exclusivos</h4>
              <ul className="premium-benefits-list">
                <li>✅ Perfil em destaque</li>
                <li>✅ Galeria com até 15 fotos</li>
                <li>✅ Vídeos</li>
                <li>✅ Link para site</li>
                <li>✅ WhatsApp destacado</li>
                <li>✅ Redes sociais</li>
                <li>✅ Promoções</li>
                <li>✅ Agendamento online</li>
                <li>✅ Resposta às avaliações</li>
                <li>✅ Dashboard exclusivo</li>
                <li>✅ Estatísticas</li>
                <li>✅ Recebimento de leads</li>
                <li>✅ Mural de avisos semanal</li>
              </ul>
            </div>

            <div className="premium-section">
              <h4>Perfil Gratuito x Perfil Parceiro</h4>
              <table className="premium-compare">
                <tbody>
                  <tr>
                    <th className="free">Perfil Gratuito</th>
                    <th className="paid">Perfil Parceiro</th>
                  </tr>
                  <tr>
                    <td>Até 2 fotos</td>
                    <td>Até 15 fotos</td>
                  </tr>
                  <tr>
                    <td>—</td>
                    <td>Até 3 vídeos</td>
                  </tr>
                  <tr>
                    <td>—</td>
                    <td>Tour 360° (1)</td>
                  </tr>
                  <tr>
                    <td>Informações básicas</td>
                    <td>Site oficial</td>
                  </tr>
                  <tr>
                    <td>Avaliações</td>
                    <td>Redes sociais</td>
                  </tr>
                  <tr>
                    <td>Nota</td>
                    <td>Promoções</td>
                  </tr>
                  <tr>
                    <td>—</td>
                    <td>WhatsApp destacado</td>
                  </tr>
                  <tr>
                    <td>—</td>
                    <td>Agendamento online</td>
                  </tr>
                  <tr>
                    <td>—</td>
                    <td>Resposta às avaliações</td>
                  </tr>
                  <tr>
                    <td>—</td>
                    <td>Dashboard e estatísticas</td>
                  </tr>
                  <tr>
                    <td>—</td>
                    <td>Recebimento de leads</td>
                  </tr>
                  <tr>
                    <td>—</td>
                    <td>Mural de avisos semanal</td>
                  </tr>
                  <tr>
                    <td>—</td>
                    <td>Perfil destacado</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="premium-convert">
              <h4>Sua academia pode aparecer assim.</h4>
              <p>Aumente sua visibilidade, gere mais matrículas e destaque sua academia para milhares de pessoas.</p>
              <button className="premium-cta-big" onClick={goToPartnerForm}>
                🏆 Quero tornar minha academia parceira
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`overlay ${scheduleOpen ? 'show' : ''}`}
        onClick={(e) => e.target === e.currentTarget && setScheduleOpen(false)}
      >
        <div className="modal" style={{ maxWidth: 420 }}>
          <div className="modal-head">
            <h2>Agendar aula experimental</h2>
            <button className="modal-close" onClick={() => setScheduleOpen(false)}>
              &times;
            </button>
          </div>
          <div className="modal-body form-grid">
            {scheduleResult ? (
              <p style={{ fontSize: 15 }}>{scheduleResult}</p>
            ) : (
              <>
                <label>Seu nome</label>
                <input type="text" value={schName} onChange={(e) => setSchName(e.target.value)} />
                <label>Melhor dia</label>
                <input type="text" placeholder="Ex: Segunda-feira" value={schDay} onChange={(e) => setSchDay(e.target.value)} />
                <label>Melhor horário</label>
                <input type="text" placeholder="Ex: 19h" value={schTime} onChange={(e) => setSchTime(e.target.value)} />
                <button className="btn-add partner-cta-hero" style={{ marginTop: 16 }} onClick={confirmSchedule}>
                  Confirmar
                </button>
                <p className="note">Este agendamento é apenas uma simulação do recurso disponível para academias parceiras.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
