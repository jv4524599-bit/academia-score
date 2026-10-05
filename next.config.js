/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Permite o next/image otimizar as fotos/logos servidas do Supabase Storage
    // (bucket público "academia-score"), além dos arquivos locais em /public.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
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
