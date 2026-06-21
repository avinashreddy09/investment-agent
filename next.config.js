/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@langchain/langgraph', '@langchain/core', '@langchain/groq'],
}
module.exports = nextConfig