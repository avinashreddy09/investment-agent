// src/components/ResearchReport.tsx
"use client";

import ReactMarkdown from "react-markdown";

interface ResearchReportProps {
  report: string;
  company: string;
}

export function ResearchReport({ report, company }: ResearchReportProps) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Full Research Report</h2>
          <p className="text-gray-400 text-sm">{company} — AI Investment Analysis</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(report);
          }}
          className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
        >
          📋 Copy
        </button>
      </div>

      {/* Report content */}
      <div className="p-6 report-content prose prose-invert max-w-none">
        <ReactMarkdown>{report}</ReactMarkdown>
      </div>
    </div>
  );
}
