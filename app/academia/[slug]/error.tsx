'use client';

// Error boundary do App Router para a página de uma academia. Sem esse
// arquivo, quando a Server Action/consulta ao banco falhar (ex.: banco sem
// conexão livre no plano gratuito do Supabase -- ver nota em lib/db.ts),
// o Next.js cai num erro genérico e a barra de progresso do topo
// (RouteProgressBar) fica girando pra sempre, porque a URL nunca termina
// de trocar -- parecendo que o site travou. Com isso aqui, aparece uma
// mensagem clara e um botão pra tentar de novo.
export default function AcademiaError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '24px 16px 60px' }}>
      <div className="modal" style={{ maxWidth: 640, margin: '0 auto', maxHeight: 'none' }}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 15, marginBottom: 8 }}>⚠️ Não deu pra carregar essa academia agora.</p>
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
