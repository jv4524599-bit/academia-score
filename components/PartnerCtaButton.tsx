import Link from 'next/link';

// Botão "🏆 Cadastre sua Academia" -- antes rolava até o formulário de
// parceria no rodapé da própria home; agora a demonstração de perfil
// parceiro e o formulário moraram para /para-academias (ver seção 15 do
// briefing de reformulação: a vitrine comercial não fica mais misturada com
// o ranking), então o botão simplesmente navega para lá. Vira um link em vez
// de um botão com onClick -- funciona sem JS e preserva className/style/title
// para não precisar tocar em nenhum dos lugares que já usam este componente.
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
  return (
    <Link
      href="/para-academias#pfAcademia"
      className={className}
      style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center', ...style }}
      title={title}
    >
      {children}
    </Link>
  );
}
