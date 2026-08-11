'use client';

import { useEffect, useState, useTransition } from 'react';
import ReviewForm from '@/components/ReviewForm';
import AuthModal from '@/components/AuthModal';
import { logoutUser } from '@/app/auth/actions';

// Gate de login para avaliar: se não estiver logado, mostra o botão "Entre
// para avaliar" (abre o AuthModal); se estiver, mostra o formulário de
// avaliação normalmente, com o nome já vindo da conta (não mais texto livre).
export default function ReviewGate({
  gymId,
  gymSlug,
  loggedInDisplayName,
  autoOpen,
}: {
  gymId: string;
  gymSlug: string;
  loggedInDisplayName: string | null;
  autoOpen: boolean;
}) {
  const [name, setName] = useState<string | null>(loggedInDisplayName);
  const [authOpen, setAuthOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (autoOpen && name) {
      document.getElementById('avaliar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (name) {
    return (
      <div id="avaliar">
        <div className="review-gate-user" style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 6 }}>
          Avaliando como <strong>{name}</strong>.{' '}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await logoutUser();
                setName(null);
              })
            }
            style={{ background: 'none', border: 'none', color: 'var(--terracota)', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}
          >
            Não é você? Sair
          </button>
        </div>
        <ReviewForm gymId={gymId} gymSlug={gymSlug} />
      </div>
    );
  }

  return (
    <div id="avaliar" className="review-form">
      <button type="button" className="btn-add" onClick={() => setAuthOpen(true)}>
        Entre para avaliar
      </button>
      <p className="note" style={{ marginTop: 8, marginBottom: 0 }}>
        Para garantir que as avaliações sejam de pessoas reais, é preciso estar logado para avaliar. Leva menos de um
        minuto.
      </p>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        returnTo={`/academia/${gymSlug}?avaliar=1#avaliar`}
        onLoggedIn={(displayName) => {
          setName(displayName);
          setAuthOpen(false);
        }}
      />
    </div>
  );
}
