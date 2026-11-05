/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera .next/standalone, usado pelo Dockerfile
  output: 'standalone',
  images: {
    // Fotos de capa das matérias, guardadas no Supabase Storage do sistema geek-news
    remotePatterns: [{ protocol: 'https', hostname: 'kjvbngcouygwfuuylzsh.supabase.co', pathname: '/storage/v1/object/public/**' }],
  },
};

export default nextConfig;
