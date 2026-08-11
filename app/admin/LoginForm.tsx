'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from './actions';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await loginAdmin(formData);
      if (!res.ok) {
        setError(res.error || 'Senha incorreta.');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="modal" style={{ maxWidth: 360, margin: '60px auto', maxHeight: 'none' }}>
      <div className="modal-head">
        <h2>🔒 Painel da academia</h2>
      </div>
      <div className="modal-body form-grid">
        <form action={handleSubmit}>
          <label>Senha de administrador</label>
          <input type="password" name="password" placeholder="Digite a senha" required />
          {error && <p style={{ color: 'var(--warn)', fontSize: 12.5, marginTop: 6 }}>{error}</p>}
          <button className="btn-add" type="submit" style={{ marginTop: 14 }} disabled={pending}>
            {pending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="note">Área restrita para moderação de avaliações. Acesso apenas para o administrador do site.</p>
      </div>
    </div>
  );
}
