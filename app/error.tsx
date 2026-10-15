'use client';

// Error boundary de último recurso para a página inicial (app/page.tsx) e
// qualquer rota de primeiro nível sem error.tsx próprio. Mesmo motivo dos
// outros (ver app/academia/[slug]/error.tsx): sem isso, uma falha aqui
// deixava a tela em branco ou a navegação "pendurada" sem explicação.
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '24px 16px 60px' }}>
      <div className="modal" style={{ maxWidth: 640, margin: '0 auto', maxHeight: 'none' }}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 15, marginBottom: 8 }}>⚠️ O site não respondeu agora.</p>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 20 }}>
            Pode ter sido uma instabilidade momentânea no servidor. Tenta de novo em alguns segundos.
          </p>
          <button className="btn-sm" onClick={() => reset()}>
            Tentar de novo
          </button>
        </div>
      </div>
    </div>
  );
}
