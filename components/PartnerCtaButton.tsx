'use client';

// Botão "🏆 Cadastre sua Academia" -- rola até o formulário de parceria no
// rodapé e foca no primeiro campo, igual a goToPartnerForm() do protótipo.
export default function PartnerCtaButton({
  className,
  style,
  title,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  children: React.ReactNode;
}) {
  function goToPartnerForm() {
    const footer = document.querySelector('.partner-footer');
    if (footer) footer.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.getElementById('pfAcademia')?.focus(), 500);
  }

  return (
    <button className={className} style={style} title={title} onClick={goToPartnerForm}>
      {children}
    </button>
  );
}
