/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/': ['./private_vault/**/*'],
    '/api/library': ['./private_vault/**/*'],
    '/api/stream': ['./private_vault/**/*'],
    '/api/download': ['./private_vault/**/*']
  }
};

export default nextConfig;
