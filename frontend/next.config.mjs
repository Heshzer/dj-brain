/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ]
    },
  }
  
  export default nextConfig
