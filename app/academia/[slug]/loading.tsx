// UI de carregamento automática do Next.js App Router: some assim que a
// página da academia (page.tsx, com generateMetadata + consulta ao banco)
// terminar de carregar, mas aparece na hora enquanto isso -- sem esse
// arquivo, o usuário ficava olhando pra a página anterior parada (parecendo
// travado) até a próxima terminar de buscar os dados.
export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '24px 16px 60px' }}>
      <div className="modal" style={{ maxWidth: 640, margin: '0 auto', maxHeight: 'none' }}>
        <div className="modal-body">
          <div className="skeleton-block" style={{ height: 160, marginBottom: 18 }} />
          <div className="skeleton-block" style={{ height: 22, width: '55%', marginBottom: 10 }} />
          <div className="skeleton-block" style={{ height: 14, width: '35%', marginBottom: 24 }} />
          {[0, 1, 2].map((i) => (
            <div className="skeleton-row" key={i}>
              <div className="skeleton-block" style={{ height: 40, width: 40, borderRadius: '50%' }} />
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
