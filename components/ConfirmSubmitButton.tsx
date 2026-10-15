'use client';

import { useFormStatus } from 'react-dom';

// Botão de submit que pede confirmação antes -- usado no "🗑️ Excluir" do
// painel de admin, igual ao confirm() de deleteReview() no protótipo.
// Depois de confirmado, também mostra "Excluindo..." e se desabilita
// enquanto a Server Action roda, pra não parecer travado em conexão lenta.
export default function ConfirmSubmitButton({
  className,
  confirmMessage,
  children,
}: {
  className?: string;
  confirmMessage: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {pending ? 'Excluindo...' : children}
    </button>
  );
}
