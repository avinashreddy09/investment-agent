// src/lib/tools/webSearch.ts
// Tavily Search Tool — fetches real-time news and web results about a company

import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const webSearchTool = tool(
  async ({ query }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error("TAVILY_API_KEY not set");

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 6,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Format results into clean text for the LLM
    const results = data.results
      ?.map(
        (r: { title: string; content: string; url: string }) =>
          `[${r.title}]\n${r.content}\nSource: ${r.url}`
      )
      .join("\n\n---\n\n");

    return results || "No results found.";
  },
  {
    name: "web_search",
    description:
      "Search the web for recent news, articles, and information about a company. Use this to find recent developments, controversies, earnings reports, leadership changes, or market news.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "The search query. Be specific, e.g. 'Tata Motors Q4 2024 earnings results' or 'Reliance Industries recent news 2024'"
        ),
    }),
  }
);
