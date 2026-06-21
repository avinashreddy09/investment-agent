// src/app/api/analyze/route.ts
// Streaming API endpoint — sends agent steps to frontend in real-time using SSE

import { NextRequest } from "next/server";
import { runInvestmentResearch, AgentStep } from "@/lib/agent/investmentAgent";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes max for deep research

export async function POST(req: NextRequest) {
  const { company } = await req.json();

  if (!company || typeof company !== "string" || company.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Company name is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Server-Sent Events stream
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = async (event: string, data: unknown) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(payload));
  };

  // Run agent in background, stream steps as they happen
  (async () => {
    try {
      await sendEvent("start", { company: company.trim(), timestamp: new Date().toISOString() });

      const result = await runInvestmentResearch(
        company.trim(),
        async (step: AgentStep) => {
          // Stream each agent step to frontend
          await sendEvent("step", step);
        }
      );

      // Final result
      await sendEvent("complete", {
        verdict: result.verdict,
        confidence: result.confidence,
        report: result.report,
        duration: result.duration,
        stepCount: result.steps.length,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Research failed";
      await sendEvent("error", { message });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
