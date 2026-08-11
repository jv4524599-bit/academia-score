import Link from 'next/link';
import { db } from '@/lib/db';
import { isAdminSession } from '@/lib/session';
import LoginForm from './LoginForm';
import { approveReview, rejectReview, deleteReview, logoutAdmin } from './actions';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import { reviewAvg, fmtDatePtBr } from '@/lib/gym-helpers';

// Depende de cookie de sessão + dados de moderação que mudam a toda hora --
// não faz sentido cachear/ISR, então é sempre dinâmica.
export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  if (status === 'PENDING') return <span className="admin-badge pending">Pendente</span>;
  if (status === 'REJECTED') return <span className="admin-badge rejected">Rejeitada</span>;
  return <span className="admin-badge approved">Aprovada</span>;
}

export default async function AdminPage() {
  const isAdmin = isAdminSession();

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <LoginForm />
      </div>
    );
  }

  const reviews: any[] = await db.review.findMany({
    include: { gym: { select: { name: true } } },
  });

  reviews.sort((a, b) => {
    const pa = a.status === 'PENDING' ? 0 : 1;
    const pb = b.status === 'PENDING' ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return (b.reportCount || 0) - (a.reportCount || 0);
  });

  const pendingCount = reviews.filter((r) => r.status === 'PENDING').length;
  const reportedCount = reviews.filter((r) => r.reportCount > 0).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', padding: '24px 16px 60px' }}>
      <div className="modal" style={{ maxWidth: 800, margin: '0 auto', maxHeight: 'none' }}>
        <div className="modal-head">
          <h2>🔒 Painel de moderação</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/" className="btn-sm" style={{ textDecoration: 'none' }}>
              ← Voltar ao site
            </Link>
            <form action={logoutAdmin}>
              <button className="btn-sm" type="submit">
                Sair
              </button>
            </form>
          </div>
        </div>
        <div className="modal-body">
          {reviews.length === 0 ? (
            <p className="empty-state">Nenhuma avaliação enviada ainda.</p>
          ) : (
            <>
              <p className="note" style={{ marginBottom: 14 }}>
                {pendingCount} pendente(s) · {reportedCount} denunciada(s) · {reviews.length} no total
              </p>
              <div className="admin-review-list">
                {reviews.map((rv) => (
                  <div className="admin-review-row" key={rv.id}>
                    <div className="admin-review-head">
                      <strong>{rv.gym?.name || rv.gymId}</strong>
                      <StatusBadge status={rv.status} />
                      {rv.reportCount > 0 && <span className="admin-badge reported">🚩 {rv.reportCount}</span>}
                    </div>
                    <div className="similar-gym-meta">
                      {rv.autor} · ★ {reviewAvg(rv.notas as unknown as Record<string, number>).toFixed(1)} ·{' '}
                      {fmtDatePtBr(rv.createdAt)}
                    </div>
                    <p style={{ margin: '6px 0', fontSize: 13.5 }}>{rv.comentario}</p>
                    <div className="admin-review-actions">
                      {rv.status !== 'APPROVED' && (
                        <form action={approveReview.bind(null, rv.id)}>
                          <button className="btn-sm" type="submit">
                            ✅ Aprovar
                          </button>
                        </form>
                      )}
                      {rv.status !== 'REJECTED' && (
                        <form action={rejectReview.bind(null, rv.id)}>
                          <button className="btn-sm" type="submit">
                            🚫 Rejeitar
                          </button>
                        </form>
                      )}
                      <form action={deleteReview.bind(null, rv.id)}>
                        <ConfirmSubmitButton className="btn-sm" confirmMessage="Excluir esta avaliação permanentemente?">
                          🗑️ Excluir
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
