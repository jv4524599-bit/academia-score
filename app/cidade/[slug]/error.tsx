'use client';

// Mesmo motivo do app/academia/[slug]/error.tsx: sem error boundary aqui,
// uma falha ao carregar a listagem de academias de uma cidade deixa a
// barra de progresso do topo girando pra sempre (parece travado) em vez
// de mostrar um erro claro com opção de tentar de novo.
export default function CidadeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '24px 16px 60px' }}>
      <div className="modal" style={{ maxWidth: 640, margin: '0 auto', maxHeight: 'none' }}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 15, marginBottom: 8 }}>⚠️ Não deu pra carregar essa cidade agora.</p>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 20 }}>
            Pode ter sido uma instabilidade momentânea no servidor. Tenta de novo em alguns segundos.
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
