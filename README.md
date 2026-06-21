# 🤖 AI Investment Research Agent

> Built for the **InsideIIM × Altuni AI Labs — AI Product Engineer Intern Assignment**

An autonomous AI agent that researches any company and delivers a clear **INVEST / PASS / HOLD** verdict — with full reasoning, financial analysis, and sentiment scoring.

**Live Demo:** [your-app.vercel.app](https://your-app.vercel.app) ← deploy and add link

---

## 📌 Overview

You type a company name. The agent:

1. **Searches the web** for recent news, earnings, controversies, leadership changes
2. **Fetches financial data** (P/E ratio, margins, debt, analyst ratings) via Alpha Vantage
3. **Analyzes sentiment** across the news — scoring positives, negatives, and red flags
4. **Synthesizes everything** using Gemini 1.5 Pro into a structured research report
5. **Delivers a verdict**: `INVEST`, `PASS`, or `HOLD AND MONITOR` with confidence level

The entire research process is streamed live to the UI — you can watch the agent call each tool in real time.

---

## 🚀 How to Run It

### Prerequisites
- Node.js 18+
- Three API keys (all have free tiers):

| Key | Where to Get |
|-----|-------------|
| `GOOGLE_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `TAVILY_API_KEY` | [tavily.com](https://tavily.com) — free 1000 searches/month |
| `ALPHA_VANTAGE_API_KEY` | [alphavantage.co](https://www.alphavantage.co/support/#api-key) — free |

### Setup

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/investment-research-agent
cd investment-research-agent
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your API keys

# 3. Run
npm run dev
# Open http://localhost:3000
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
# Add environment variables in Vercel dashboard
```

---

## 🏗️ How It Works — Architecture

```
User Input: "Tata Motors"
        │
        ▼
┌─────────────────────────────────────┐
│     Next.js API Route (/api/analyze) │
│     Server-Sent Events (SSE stream)  │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         LangGraph ReAct Agent        │
│         (Gemini 1.5 Pro LLM)         │
│                                      │
│  ┌──────────┐ ┌──────────────────┐  │
│  │ Web      │ │ Financial Data   │  │
│  │ Search   │ │ (Alpha Vantage)  │  │
│  │ (Tavily) │ └──────────────────┘  │
│  └──────────┘ ┌──────────────────┐  │
│               │ Sentiment        │  │
│               │ Analyzer (LLM)   │  │
│               └──────────────────┘  │
└─────────────────┬───────────────────┘
                  │
                  ▼
        Streamed to Frontend
        (steps → verdict → report)
```

### Key Components

| File | Purpose |
|------|---------|
| `src/lib/agent/investmentAgent.ts` | Core LangGraph ReAct agent + system prompt |
| `src/lib/tools/webSearch.ts` | Tavily web search tool |
| `src/lib/tools/financialData.ts` | Alpha Vantage financial data tool |
| `src/lib/tools/sentimentAnalysis.ts` | Gemini-powered sentiment scorer |
| `src/app/api/analyze/route.ts` | SSE streaming API route |
| `src/app/page.tsx` | Main UI with live agent feed |
| `src/components/AgentSteps.tsx` | Real-time tool call visualizer |
| `src/components/VerdictBadge.tsx` | INVEST/PASS verdict display |

### Why LangGraph ReAct?

I used `createReactAgent` from LangGraph.js — a **ReAct (Reason + Act)** pattern where the LLM:
- Decides which tool to call next based on what it knows so far
- Calls the tool, observes the result
- Iterates until it has enough information to make a decision

This is more intelligent than a fixed pipeline — the agent might do 2 web searches for a private company vs 1 search + financial data for a public company.

---

## ⚖️ Key Decisions & Trade-offs

### Decision 1: LangGraph ReAct vs Fixed Pipeline

**Chose:** ReAct agent (autonomous tool selection)

**Why:** A fixed pipeline (search → financials → sentiment → verdict) is brittle. A private company has no financial data; a newly listed company has sparse news. The ReAct pattern lets the agent adapt — it can skip tools that aren't relevant and do extra searches when it finds something interesting.

**Trade-off:** Less predictable execution path, harder to debug. Fixed pipeline is simpler but less intelligent.

---

### Decision 2: Streaming via SSE vs WebSockets

**Chose:** Server-Sent Events (SSE)

**Why:** SSE is simpler to implement in Next.js API routes, works over HTTP/1.1, and is one-directional (server → client) which is all we need. WebSockets add complexity (connection management, handshakes) for no benefit in this use case.

**Trade-off:** SSE doesn't support bidirectional communication. Fine for this use case; would need WebSockets for a chat-like interaction.

---

### Decision 3: Gemini 1.5 Pro as the LLM

**Chose:** Gemini 1.5 Pro via `@langchain/google-genai`

**Why:** Large 1M token context window (can handle lots of research data), free tier available for development, strong reasoning for financial analysis. Also used Gemini 1.5 Flash for the sentiment sub-task (cheaper and faster for structured output).

**Trade-off:** GPT-4o has slightly better reasoning for financial analysis but costs more with no free tier.

---

### Decision 4: Alpha Vantage for Financial Data

**Chose:** Alpha Vantage (free tier: 25 API calls/day)

**Why:** Free tier, comprehensive data (overview, income statement, balance sheet, analyst ratings), and covers both US stocks and many international markets.

**Trade-off:** Free tier rate limits (25 calls/day, 5/min). For production, Yahoo Finance unofficial API or a paid provider (Polygon.io) would be better.

**Left out:** Real-time options data, insider trading patterns, institutional holdings — would improve the analysis significantly with more time/budget.

---

### Decision 5: What I Left Out

- **User authentication / history:** No login or saved research sessions
- **Portfolio comparison:** Research multiple companies and compare side-by-side
- **Price charts:** Could use Recharts to visualize historical price data returned by Alpha Vantage
- **PDF export:** Let users download the research report
- **Webhook / async research:** For very deep research, queue the job and email the result

---

## 📋 Example Runs

### 1. Apple Inc (AAPL) — Result: INVEST

```
Bull Case: Strong services revenue growth, $110B cash position, loyal ecosystem
Bear Case: China regulatory risk, valuation premium (P/E ~28x)
Red Flags: None identified
Verdict: INVEST (HIGH confidence) — Services segment de-risks hardware cyclicality
```

### 2. Zomato — Result: HOLD AND MONITOR

```
Bull Case: Market leader in India food delivery, improving unit economics
Bear Case: Still loss-making, intense competition from Swiggy, Blinkit integration risk
Red Flags: High cash burn rate
Verdict: HOLD AND MONITOR (MEDIUM confidence) — Wait for sustained profitability
```

### 3. WeWork — Result: PASS

```
Bull Case: Global brand, real estate market recovery
Bear Case: Filed Chapter 11 bankruptcy 2023, massive debt, negative EBITDA
Red Flags: 🚩 Bankruptcy filing, accounting controversies, leadership failure
Verdict: PASS (HIGH confidence) — Structural business model failure
```

---

## 🔮 What I Would Improve With More Time

1. **LangGraph StateGraph** instead of ReAct — define explicit research stages (news → financials → sentiment → synthesis) with conditional edges based on company type (public vs private, sector)

2. **RAG on SEC filings / annual reports** — index 10-K and 10-Q filings into a vector store so the agent can do deep fundamental analysis, not just surface-level metrics

3. **Competitor analysis** — automatically identify and research 2-3 competitors to give relative valuation context

4. **Multi-timeframe analysis** — separate short-term (3-month) and long-term (3-year) verdicts based on different research emphasis

5. **Confidence calibration** — track how past verdicts aged over 6 months to improve the agent's confidence scoring

6. **Better error recovery** — if Tavily or Alpha Vantage fails, fall back to alternative data sources gracefully

---

## 📁 Project Structure

```
investment-research-agent/
├── src/
│   ├── app/
│   │   ├── api/analyze/route.ts    # SSE streaming endpoint
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                # Main UI
│   ├── components/
│   │   ├── AgentSteps.tsx          # Live tool call feed
│   │   ├── VerdictBadge.tsx        # INVEST/PASS display
│   │   └── ResearchReport.tsx      # Markdown report renderer
│   └── lib/
│       ├── agent/
│       │   └── investmentAgent.ts  # LangGraph ReAct agent
│       └── tools/
│           ├── webSearch.ts        # Tavily search tool
│           ├── financialData.ts    # Alpha Vantage tool
│           └── sentimentAnalysis.ts # Gemini sentiment tool
├── .env.local.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| AI Framework | LangGraph.js (ReAct agent) + LangChain.js |
| LLM | Google Gemini 1.5 Pro / Flash |
| Web Search | Tavily API |
| Financial Data | Alpha Vantage API |
| Styling | Tailwind CSS |
| Markdown | react-markdown |
| Deployment | Vercel |

---

*Built by [Your Name] for InsideIIM × Altuni AI Labs — AI Product Engineer Intern Assignment*
