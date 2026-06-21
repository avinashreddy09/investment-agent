/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { webSearchTool } from "../tools/webSearch";
import { financialDataTool } from "../tools/financialData";
import { sentimentAnalysisTool } from "../tools/sentimentAnalysis";

const SYSTEM_PROMPT = `You are an elite AI Investment Research Analyst. Research companies and deliver INVEST / PASS / HOLD AND MONITOR verdicts.
Steps: 1) Search web for recent news 2) Get financial data if public company 3) Analyze sentiment 4) Write report.
Always end your report with exactly:
**DECISION: INVEST** or **DECISION: PASS** or **DECISION: HOLD AND MONITOR**
**Confidence Level: HIGH** or **Confidence Level: MEDIUM** or **Confidence Level: LOW**
**Reasoning:** your explanation here
**Risk Level:** LOW or MEDIUM or HIGH or VERY HIGH`;

export type AgentStep = {
  type: "tool_call" | "tool_result" | "thinking" | "final";
  tool?: string;
  input?: string;
  output?: string;
  content?: string;
};

export type ResearchResult = {
  company: string;
  verdict: "INVEST" | "PASS" | "HOLD AND MONITOR";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  report: string;
  steps: AgentStep[];
  duration: number;
};

function buildAgent() {
  const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    apiKey: process.env.GROQ_API_KEY,
    maxTokens: 4096,
  });
  return createReactAgent({ llm, tools: [webSearchTool, financialDataTool, sentimentAnalysisTool] });
}

function parseVerdict(report: string): { verdict: ResearchResult["verdict"]; confidence: ResearchResult["confidence"] } {
  const v = report.match(/DECISION:\s*(INVEST|PASS|HOLD AND MONITOR)/i);
  const c = report.match(/Confidence Level:\s*(HIGH|MEDIUM|LOW)/i);
  return {
    verdict: (v?.[1]?.toUpperCase() as ResearchResult["verdict"]) || "PASS",
    confidence: (c?.[1]?.toUpperCase() as ResearchResult["confidence"]) || "LOW",
  };
}

export async function runInvestmentResearch(company: string, onStep?: (step: AgentStep) => void): Promise<ResearchResult> {
  const startTime = Date.now();
  const agent = buildAgent();
  const steps: AgentStep[] = [];

  const stream = await agent.stream(
    { messages: [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(`Research ${company} as a potential investment and give your verdict.`)] },
    { recursionLimit: 25 }
  );

  for await (const chunk of stream) {
    const agentMessages: any[] = Array.isArray((chunk as any).agent?.messages)
      ? (chunk as any).agent.messages
      : [];

    for (const msg of agentMessages) {
      if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          const step: AgentStep = { type: "tool_call", tool: tc.name, input: JSON.stringify(tc.args) };
          steps.push(step);
          onStep?.(step);
        }
      } else if (typeof msg.content === "string" && msg.content.trim()) {
        const step: AgentStep = { type: "thinking", content: msg.content };
        steps.push(step);
        onStep?.(step);
      }
    }

    const toolMessages: any[] = Array.isArray((chunk as any).tools?.messages)
      ? (chunk as any).tools.messages
      : [];

    for (const msg of toolMessages) {
      if (typeof msg.content === "string") {
        const step: AgentStep = { type: "tool_result", tool: msg.name, output: msg.content.slice(0, 500) };
        steps.push(step);
        onStep?.(step);
      }
    }
  }

  const lastThinking = [...steps].reverse().find((s) => s.type === "thinking" && (s.content?.length || 0) > 100);
  const finalReport = lastThinking?.content || "Research completed.";
  const { verdict, confidence } = parseVerdict(finalReport);
  steps.push({ type: "final", content: finalReport });

  return { company, verdict, confidence, report: finalReport, steps, duration: Math.round((Date.now() - startTime) / 1000) };
}