/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Permite o next/image referenciar as fotos/logos servidas do Supabase
    // Storage (bucket público "academia-score"), além dos arquivos locais em /public.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // TEMPORÁRIO: toda imagem do site (logos e fotos de TODAS as academias)
    // estava voltando 402 (Payment Required) em /_next/image -- a conta da
    // Vercel bateu no limite incluído de Image Optimization do mês (ou não
    // tem "spend management"/cartão configurado pra cobrir o excedente).
    // unoptimized:true faz o Next servir a imagem original direto da URL do
    // Supabase, sem passar pelo otimizador da Vercel -- perde o resize
    // automático, mas para de quebrar a imagem de TODAS as academias no site.
    // Assim que resolver o limite/plano no painel da Vercel (Settings > seu
    // time > Usage, ou habilitar Spend Management), pode remover essa linha
    // para voltar a otimizar as imagens automaticamente.
    unoptimized: true,
  },
  // Headers de segurança aplicados a toda resposta. Não inclui Content-Security-Policy
  // de propósito: o app não usa nenhum <script> inline nem next/script hoje, mas o
  // Next.js App Router injeta scripts internos (payload de RSC/hidratação) que um CSP
  // sem nonce bloquearia, quebrando o site. Adicionar CSP exige testar em ambiente de
  // preview antes de ir pra produção -- ver relatório de auditoria.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Impede que o site seja carregado dentro de <iframe> de outro domínio
          // (proteção contra clickjacking, ex. num overlay invisível sobre o botão de login).
          { key: 'X-Frame-Options', value: 'DENY' },
          // Impede que o navegador tente "adivinhar" o tipo de um arquivo servido
          // (ex.: tratar um upload de imagem como HTML/JS executável).
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Não manda a URL completa de origem como Referer em navegação cross-site,
          // só o domínio -- evita vazar paths/tokens em query string para terceiros.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Desliga por padrão APIs de navegador que o site não usa.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // Força HTTPS por 2 anos, incluindo subdomínios (a Vercel já redireciona
          // HTTP->HTTPS, isso garante que o navegador nem tente HTTP da próxima vez).
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
