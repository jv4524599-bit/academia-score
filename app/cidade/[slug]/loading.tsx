// Mesma ideia do loading.tsx da ficha da academia: Suspense fallback
// automático do Next.js pra página da cidade, que também faz consulta ao
// banco (ranking completo) antes de renderizar.
export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '24px 16px 60px' }}>
      <div className="modal" style={{ maxWidth: 640, margin: '0 auto', maxHeight: 'none' }}>
        <div className="modal-body">
          <div className="skeleton-block" style={{ height: 20, width: '45%', marginBottom: 10 }} />
          <div className="skeleton-block" style={{ height: 14, width: '30%', marginBottom: 24 }} />
          {[0, 1, 2, 3, 4].map((i) => (
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
