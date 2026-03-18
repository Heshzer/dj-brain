/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          // Vercel Edge Proxy n'accepte QUE les ports standards (80 ou 443).
          // Le routeur de l'ami devra rediriger le port 80 externe vers son port 4000 interne.
          destination: `http://marcib.ddns.net/api/:path*`,
        },
      ]
    },
  }
  
  export default nextConfig
