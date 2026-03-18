/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: `http://marcib.ddns.net:4000/api/:path*`,
        },
      ]
    },
  }
  
  export default nextConfig
