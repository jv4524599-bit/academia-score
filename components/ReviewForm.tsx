'use client';

import { useState, useTransition } from 'react';
import { REVIEW_CATEGORIES } from '@/lib/gym-helpers';
import { submitReview } from '@/app/academia/[slug]/actions';

// Porta o formulário de avaliação por categoria (REVIEW_CATEGORIES,
// pickStar / submitReview) do protótipo -- star-picker de 1 a 5 por
// categoria + nome + "é aluno(a)?" + contato + comentário.
export default function ReviewForm({ gymId, gymSlug }: { gymId: string; gymSlug: string }) {
  const [stars, setStars] = useState<Record<string, number>>({});
  const [alunoAtual, setAlunoAtual] = useState('SIM');
  const [contactType, setContactType] = useState('whatsapp');
  const [contactValue, setContactValue] = useState('');
  const [comentario, setComentario] = useState('');
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickStar(cat: string, n: number) {
    setStars((prev) => ({ ...prev, [cat]: n }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (Object.keys(stars).length === 0) {
      alert('Avalie ao menos uma categoria de 1 a 5 estrelas.');
      return;
    }
    if (!comentario.trim()) {
      alert('Escreva um comentário curto sobre sua experiência.');
      return;
    }

    const formData = new FormData();
    formData.set('comentario', comentario);
    formData.set('alunoAtual', alunoAtual);
    if (contactValue.trim()) {
      formData.set('contatoTipo', contactType);
      formData.set('contatoValor', contactValue);
    }
    formData.set('notas', JSON.stringify(stars));

    startTransition(async () => {
      try {
        await submitReview(gymId, gymSlug, formData);
        setSent(true);
      } catch (err) {
        setError('Não foi possível salvar agora. Tente novamente.');
      }
    });
  }

  if (sent) {
    return (
      <div className="review-form">
        <p style={{ margin: 0, fontSize: 14 }}>
          ✅ Avaliação enviada! Ela será publicada no perfil assim que for aprovada.
        </p>
      </div>
    );
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <label style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>Deixar avaliação</label>
      <div>
        {REVIEW_CATEGORIES.map((cat) => (
          <div className="cat-row" key={cat}>
            <span className="cat-label">{cat}</span>
            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={(stars[cat] || 0) >= n ? 'on' : ''}
                  onClick={() => pickStar(cat, n)}
                  role="button"
                  aria-label={`${cat}: ${n} estrela(s)`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <label style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600, display: 'block', marginTop: 10 }}>
        É aluno(a) dessa academia atualmente?
      </label>
      <select
        value={alunoAtual}
        onChange={(e) => setAlunoAtual(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 10px',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          fontFamily: "'Inter',sans-serif",
          fontSize: 14,
          marginBottom: 8,
          background: '#fff',
        }}
      >
        <option value="SIM">Sim, sou aluno(a) atualmente</option>
        <option value="JA_FUI">Já fui aluno(a), mas não sou mais</option>
        <option value="NAO">Não, apenas visitei/conheço</option>
      </select>
      <label style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600, display: 'block', marginTop: 10 }}>
        WhatsApp para contato (opcional)
      </label>
      <div className="field-row">
        <select value={contactType} onChange={(e) => setContactType(e.target.value)}>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">E-mail</option>
        </select>
        <input
          type="text"
          placeholder="Opcional"
          value={contactValue}
          onChange={(e) => setContactValue(e.target.value)}
        />
      </div>
      <textarea
        rows={2}
        placeholder="Conte como foi sua experiência..."
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />
      {error && <p style={{ color: 'var(--warn)', fontSize: 12.5 }}>{error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? 'Publicando...' : 'Publicar avaliação'}
      </button>
    </form>
  );
}
