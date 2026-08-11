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
};
module.exports = nextConfig;
