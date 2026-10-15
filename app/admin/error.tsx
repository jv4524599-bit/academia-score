'use client';

// Mesmo motivo dos outros error.tsx (ver app/academia/[slug]/error.tsx):
// sem isso, se aprovar/rejeitar/excluir ou carregar o painel falhar (ex.:
// banco sem conexão livre), o botão fica preso no estado "Aprovando..."/
// "Saindo..." (PendingSubmitButton) sem nunca voltar, parecendo travado.
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '24px 16px 60px' }}>
      <div className="modal" style={{ maxWidth: 800, margin: '0 auto', maxHeight: 'none' }}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 15, marginBottom: 8 }}>⚠️ O painel de moderação não respondeu agora.</p>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 20 }}>
            Pode ter sido uma instabilidade momentânea no servidor. Tenta de novo em alguns segundos --
            a ação pode já ter sido salva, confira a lista antes de repetir.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-sm" onClick={() => reset()}>
              Tentar de novo
            </button>
            <a href="/" className="btn-sm" style={{ textDecoration: 'none' }}>
              ← Voltar ao site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
