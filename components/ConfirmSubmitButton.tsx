'use client';

// Botão de submit que pede confirmação antes -- usado no "🗑️ Excluir" do
// painel de admin, igual ao confirm() de deleteReview() no protótipo.
export default function ConfirmSubmitButton({
  className,
  confirmMessage,
  children,
}: {
  className?: string;
  confirmMessage: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className={className}
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
