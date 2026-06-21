/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['langchain', '@langchain/langgraph'],
  },
}

module.exports = nextConfig
