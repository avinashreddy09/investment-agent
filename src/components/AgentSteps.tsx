// src/components/AgentSteps.tsx
// Shows the agent's live "thinking" process — tool calls, results, reasoning

"use client";

import { AgentStep } from "@/lib/agent/investmentAgent";

const TOOL_ICONS: Record<string, string> = {
  web_search: "🔍",
  get_financial_data: "📊",
  analyze_sentiment: "🧠",
};

const TOOL_LABELS: Record<string, string> = {
  web_search: "Web Search",
  get_financial_data: "Financial Data",
  analyze_sentiment: "Sentiment Analysis",
};

interface AgentStepsProps {
  steps: AgentStep[];
  isRunning: boolean;
}

export function AgentSteps({ steps, isRunning }: AgentStepsProps) {
  if (steps.length === 0 && !isRunning) return null;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs font-mono text-gray-400">Agent Research Process</span>
        {isRunning && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-ring" />
            <span className="text-xs text-emerald-400">Running</span>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto font-mono text-sm">
        {steps
          .filter((s) => s.type !== "final")
          .map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              {/* Step icon */}
              <div className="mt-0.5 shrink-0">
                {step.type === "tool_call" && (
                  <span className="text-blue-400">
                    {TOOL_ICONS[step.tool || ""] || "🔧"}
                  </span>
                )}
                {step.type === "tool_result" && (
                  <span className="text-green-400">✓</span>
                )}
                {step.type === "thinking" && (
                  <span className="text-purple-400">💭</span>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                {step.type === "tool_call" && (
                  <>
                    <div className="text-blue-300 font-semibold text-xs">
                      Calling {TOOL_LABELS[step.tool || ""] || step.tool}
                    </div>
                    {step.input && (
                      <div className="text-gray-500 text-xs mt-1 truncate">
                        {step.input.slice(0, 120)}
                        {step.input.length > 120 ? "..." : ""}
                      </div>
                    )}
                  </>
                )}
                {step.type === "tool_result" && (
                  <>
                    <div className="text-emerald-400 font-semibold text-xs">
                      Result from {TOOL_LABELS[step.tool || ""] || step.tool}
                    </div>
                    {step.output && (
                      <div className="text-gray-400 text-xs mt-1 line-clamp-2">
                        {step.output}
                      </div>
                    )}
                  </>
                )}
                {step.type === "thinking" && (
                  <div className="text-purple-300 text-xs line-clamp-2">
                    {step.content?.slice(0, 150)}
                    {(step.content?.length || 0) > 150 ? "..." : ""}
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* Running indicator */}
        {isRunning && (
          <div className="flex gap-3 items-center">
            <span className="text-gray-500">⏳</span>
            <span className="text-gray-500 text-xs">
              Researching<span className="blink">_</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
