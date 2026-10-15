'use client';

import { useFormStatus } from 'react-dom';

// Botão de submit que troca o próprio texto por um "Processando..." (ou
// equivalente) e se desabilita enquanto a Server Action do form está
// rodando -- usado em ações do painel de admin (Aprovar, Rejeitar, Sair)
// que antes não davam nenhum retorno visual ao clicar, e pareciam travadas
// em conexões mais lentas. useFormStatus() só enxerga o <form> mais próximo
// (cada linha de avaliação tem o seu), então cada botão reflete só a própria ação.
export default function PendingSubmitButton({
  className,
  pendingText,
  children,
}: {
  className?: string;
  pendingText: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
