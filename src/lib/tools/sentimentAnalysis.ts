import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatGroq } from "@langchain/groq";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.1,
  apiKey: process.env.GROQ_API_KEY,
});

export const sentimentAnalysisTool = tool(
  async ({ company, news_text }) => {
    const prompt = `Analyze sentiment for ${company}. News: ${news_text}. Return JSON only: {"overall_sentiment":"positive|neutral|negative","sentiment_score":0.0,"key_positives":[],"key_negatives":[],"red_flags":[],"momentum":"improving|stable|declining","summary":""}`;
    const response = await llm.invoke(prompt);
    const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    return text.replace(/```json|```/g, "").trim();
  },
  {
    name: "analyze_sentiment",
    description: "Analyze sentiment from news text about a company.",
    schema: z.object({
      company: z.string(),
      news_text: z.string(),
    }),
  }
);