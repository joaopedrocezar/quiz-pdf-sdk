/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aumentar limite de tamanho para arquivos
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Configurações para uploads maiores
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Limite de 50MB para requisições
    },
  },
  // Timeout aumentado para processar arquivos grandes
  serverRuntimeConfig: {
    maxDuration: 300, // 5 minutos
  },
};

export default nextConfig;
