/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@langchain/langgraph', '@langchain/core', '@langchain/groq'],
  env: {
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
  }
}
module.exports = nextConfig