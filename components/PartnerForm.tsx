'use client';

import { useState, useTransition } from 'react';
import { createPartnerLead } from '@/app/actions';

// Porta sendPartnerContact() do rodapé -- no protótipo só compunha um
// mailto; aqui persiste de verdade em PartnerLead e mostra confirmação.
export default function PartnerForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createPartnerLead(formData);
      if (!res.ok) {
        setError(res.error || 'Não foi possível enviar. Tente novamente.');
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="partner-form">
        <h4>Recebemos seu contato!</h4>
        <p style={{ color: '#C9C4B6', fontSize: 13.5 }}>
          Obrigado pelo interesse. Nossa equipe vai entrar em contato em breve. Você também pode escrever direto
          para <strong>parcerias@academiascore.com.br</strong>.
        </p>
      </div>
    );
  }

  return (
    <form className="partner-form" action={handleSubmit}>
      <h4>ou preencha rapidinho:</h4>
      <input type="text" id="pfAcademia" name="academia" placeholder="Nome da academia" required />
      <input type="text" name="responsavel" placeholder="Seu nome" required />
      <input type="text" name="contato" placeholder="WhatsApp ou e-mail para retorno" required />
      <textarea name="mensagem" rows={2} placeholder="Mensagem (opcional)" />
      {error && <p style={{ color: '#E9A79B', fontSize: 12.5, marginBottom: 8 }}>{error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? 'Enviando...' : 'Enviar contato'}
      </button>
    </form>
  );
}
