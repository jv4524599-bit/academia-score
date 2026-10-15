// Suspense fallback automático do Next.js para /admin -- cobre tanto a
// navegação até o painel quanto o instante logo após aprovar/rejeitar/
// excluir uma avaliação (a Server Action revalida a página e o React
// mostra esse fallback enquanto a lista atualizada é buscada de novo no
// banco), então o clique nunca fica parecendo travado sem feedback nenhum.
export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '24px 16px 60px' }}>
      <div className="modal" style={{ maxWidth: 800, margin: '0 auto', maxHeight: 'none' }}>
        <div className="modal-head">
          <div className="skeleton-block" style={{ height: 22, width: 200 }} />
        </div>
        <div className="modal-body">
          <div className="skeleton-block" style={{ height: 14, width: '40%', marginBottom: 16 }} />
          {[0, 1, 2].map((i) => (
            <div className="skeleton-row" key={i}>
              <div className="skeleton-block" style={{ height: 32, width: 32, borderRadius: '50%' }} />
              <div className="skeleton-block" style={{ height: 14, width: 48 }} />
              <div className="skeleton-block" style={{ height: 14 }} />
              <div className="skeleton-block" style={{ height: 28, width: 70 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
