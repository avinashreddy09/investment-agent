// src/components/VerdictBadge.tsx
"use client";

type Verdict = "INVEST" | "PASS" | "HOLD AND MONITOR";
type Confidence = "HIGH" | "MEDIUM" | "LOW";

interface VerdictBadgeProps {
  verdict: Verdict;
  confidence: Confidence;
  company: string;
  duration: number;
}

const VERDICT_CONFIG = {
  INVEST: {
    bg: "bg-emerald-950",
    border: "border-emerald-500",
    text: "text-emerald-400",
    icon: "📈",
    glow: "shadow-emerald-900",
  },
  PASS: {
    bg: "bg-red-950",
    border: "border-red-500",
    text: "text-red-400",
    icon: "🚫",
    glow: "shadow-red-900",
  },
  "HOLD AND MONITOR": {
    bg: "bg-amber-950",
    border: "border-amber-500",
    text: "text-amber-400",
    icon: "👁️",
    glow: "shadow-amber-900",
  },
};

const CONFIDENCE_COLORS = {
  HIGH: "text-emerald-400 bg-emerald-950",
  MEDIUM: "text-amber-400 bg-amber-950",
  LOW: "text-gray-400 bg-gray-800",
};

export function VerdictBadge({ verdict, confidence, company, duration }: VerdictBadgeProps) {
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG["HOLD AND MONITOR"];

  return (
    <div
      className={`rounded-2xl border-2 ${config.border} ${config.bg} p-6 shadow-2xl ${config.glow}`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left: Verdict */}
        <div className="flex items-center gap-4">
          <div className="text-5xl">{config.icon}</div>
          <div>
            <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold mb-1">
              Investment Decision
            </div>
            <div className={`text-3xl font-black ${config.text} tracking-tight`}>
              {verdict}
            </div>
            <div className="text-gray-400 text-sm mt-1">{company}</div>
          </div>
        </div>

        {/* Right: Meta */}
        <div className="flex flex-col items-end gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${CONFIDENCE_COLORS[confidence]}`}>
            {confidence} CONFIDENCE
          </div>
          <div className="text-gray-500 text-xs">
            Research completed in {duration}s
          </div>
        </div>
      </div>
    </div>
  );
}
