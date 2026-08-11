'use client';

import { useState, useTransition } from 'react';
import { loginWithPassword, registerWithPassword } from '@/app/auth/actions';

// Modal "Entre para avaliar" -- login/cadastro por e-mail+senha ou Google.
// Só pede nome, e-mail e senha; nunca pede mais que isso. O e-mail nunca é
// mostrado publicamente (isso é feito no backend, em lib/auth.ts).
export default function AuthModal({
  open,
  onClose,
  returnTo,
  onLoggedIn,
}: {
  open: boolean;
  onClose: () => void;
  returnTo: string;
  onLoggedIn: (displayName: string) => void;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set('email', email);
    fd.set('password', password);
    if (mode === 'register') fd.set('name', name);

    startTransition(async () => {
      const res = mode === 'register' ? await registerWithPassword(fd) : await loginWithPassword(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onLoggedIn(res.displayName);
    });
  }

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <h2>Entre para avaliar</h2>
          <button className="modal-close" onClick={onClose} type="button">
            &times;
          </button>
        </div>
        <div className="modal-body form-grid">
          <p className="note" style={{ marginTop: 0 }}>
            Para manter as avaliações confiáveis, é preciso estar logado para avaliar uma academia. Leva menos de um
            minuto.
          </p>

          <a
            className="btn-add"
            style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}
            href={`/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Continuar com Google
          </a>

          <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-soft)', margin: '10px 0' }}>ou</div>

          <form onSubmit={handleSubmit} className="form-grid" style={{ gap: 8 }}>
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <p style={{ color: 'var(--warn)', fontSize: 12.5, margin: 0 }}>{error}</p>}
            <button type="submit" className="btn-add" disabled={pending}>
              {pending ? 'Enviando...' : mode === 'register' ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--terracota)',
              fontSize: 13,
              cursor: 'pointer',
              marginTop: 4,
              textDecoration: 'underline',
            }}
          >
            {mode === 'login' ? 'Ainda não tem conta? Criar conta' : 'Já tem conta? Entrar'}
          </button>

          <p className="note" style={{ marginTop: 10 }}>
            Seu e-mail nunca é exibido publicamente. Nas avaliações, mostramos apenas seu primeiro nome e a inicial
            do sobrenome (ex: “João V.”).
          </p>
        </div>
      </div>
    </div>
  );
}
