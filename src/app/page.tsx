// src/app/page.tsx
"use client";

import { useState, useRef } from "react";
import { AgentSteps } from "@/components/AgentSteps";
import { VerdictBadge } from "@/components/VerdictBadge";
import { ResearchReport } from "@/components/ResearchReport";
import { AgentStep } from "@/lib/agent/investmentAgent";

type Status = "idle" | "running" | "complete" | "error";

interface ResearchResult {
  verdict: "INVEST" | "PASS" | "HOLD AND MONITOR";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  report: string;
  duration: number;
}

const EXAMPLE_COMPANIES = [
  "Apple Inc",
  "Reliance Industries",
  "Nvidia",
  "Zomato",
  "Tesla",
  "Infosys",
];

export default function Home() {
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startResearch = async (companyName: string) => {
    if (!companyName.trim() || status === "running") return;

    // Reset state
    setStatus("running");
    setSteps([]);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: companyName.trim() }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      // Parse SSE stream
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (currentEvent === "step") {
              setSteps((prev) => [...prev, data]);
            } else if (currentEvent === "complete") {
              setResult(data);
              setStatus("complete");
            } else if (currentEvent === "error") {
              throw new Error(data.message);
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(msg);
      setStatus("error");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startResearch(company);
  };

  const handleExample = (ex: string) => {
    setCompany(ex);
    startResearch(ex);
  };

  const reset = () => {
    setStatus("idle");
    setSteps([]);
    setResult(null);
    setError(null);
    setCompany("");
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-sm font-bold text-black">
              AI
            </div>
            <div>
              <div className="font-bold text-white text-sm">Investment Research Agent</div>
              <div className="text-gray-500 text-xs">Powered by Gemini + LangGraph</div>
            </div>
          </div>
          <div className="text-xs text-gray-600 hidden sm:block">
            InsideIIM × Altuni AI Labs Assignment
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero */}
        {status === "idle" && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-ring inline-block" />
              AI-Powered · Real-Time Research · Autonomous Agent
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
              Should you invest in<br />
              <span className="text-emerald-400">any company?</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Enter a company name. The AI agent researches news, financials, and
              market sentiment — then delivers a clear <strong className="text-white">INVEST / PASS</strong> verdict.
            </p>
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
                🏢
              </span>
              <input
                ref={inputRef}
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter company name (e.g. Apple, Tata Motors, Nvidia...)"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 pl-12 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition-colors text-base"
                disabled={status === "running"}
              />
            </div>
            <button
              type="submit"
              disabled={!company.trim() || status === "running"}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold px-6 py-4 rounded-xl transition-colors whitespace-nowrap"
            >
              {status === "running" ? "Researching..." : "Research →"}
            </button>
          </div>
        </form>

        {/* Example Companies */}
        {status === "idle" && (
          <div className="flex flex-wrap gap-2 mb-12">
            <span className="text-gray-600 text-sm py-1">Try:</span>
            {EXAMPLE_COMPANIES.map((ex) => (
              <button
                key={ex}
                onClick={() => handleExample(ex)}
                className="text-sm px-3 py-1 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Research in Progress */}
        {(status === "running" || steps.length > 0) && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-white font-bold">
                {status === "running" ? (
                  <span>
                    🔬 Researching{" "}
                    <span className="text-emerald-400">{company}</span>...
                  </span>
                ) : (
                  <span>
                    ✅ Research complete for{" "}
                    <span className="text-emerald-400">{company}</span>
                  </span>
                )}
              </div>
              {status === "complete" && (
                <button
                  onClick={reset}
                  className="ml-auto text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
                >
                  New Research
                </button>
              )}
            </div>

            <AgentSteps
              steps={steps.filter((s) => s.type !== "final")}
              isRunning={status === "running"}
            />
          </div>
        )}

        {/* Error */}
        {status === "error" && error && (
          <div className="bg-red-950 border border-red-700 rounded-xl p-5 mb-6">
            <div className="text-red-400 font-bold mb-1">❌ Research Failed</div>
            <div className="text-red-300 text-sm">{error}</div>
            <button
              onClick={reset}
              className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {status === "complete" && result && (
          <div className="space-y-6">
            {/* Verdict */}
            <VerdictBadge
              verdict={result.verdict}
              confidence={result.confidence}
              company={company}
              duration={result.duration}
            />

            {/* Full Report */}
            <ResearchReport report={result.report} company={company} />

            {/* New Research CTA */}
            <div className="text-center py-4">
              <button
                onClick={reset}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-3 rounded-xl transition-colors border border-gray-700"
              >
                🔍 Research Another Company
              </button>
            </div>
          </div>
        )}

        {/* How it works — shown only on idle */}
        {status === "idle" && (
          <div className="mt-16 grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: "🔍",
                title: "Real-Time Research",
                desc: "Searches the web for latest news, earnings, and developments about the company",
              },
              {
                icon: "📊",
                title: "Financial Analysis",
                desc: "Pulls live stock data — P/E ratios, margins, debt, analyst ratings, and price trends",
              },
              {
                icon: "🎯",
                title: "Clear Verdict",
                desc: "Synthesizes everything into an INVEST / PASS / HOLD decision with full reasoning",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="font-bold text-white mb-1">{item.title}</div>
                <div className="text-gray-400 text-sm">{item.desc}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20 py-6 text-center text-gray-600 text-xs">
        AI Investment Research Agent · Built with Next.js, LangGraph.js & Gemini
        <span className="mx-2">·</span>
        InsideIIM × Altuni AI Labs Assignment
        <br />
        <span className="text-gray-700 mt-1 block">
          ⚠️ For educational purposes only. Not financial advice.
        </span>
      </footer>
    </div>
  );
}
