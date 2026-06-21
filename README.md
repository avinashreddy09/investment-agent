# 🤖 AI Investment Research Agent

> **InsideIIM × Altuni AI Labs — AI Product Engineer Intern Assignment**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://investment-agent-886v-ip4efmwe7.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/avinashreddy09/investment-agent)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph.js-ReAct%20Agent-blue?style=for-the-badge)](https://langchain-ai.github.io/langgraphjs/)

**🔗 Live App:** https://investment-agent-886v-ip4efmwe7.vercel.app/

An autonomous AI agent that takes any company name, researches it in real time using multiple tools, and delivers a clear **INVEST / PASS / HOLD AND MONITOR** verdict — with full reasoning, financial analysis, and sentiment scoring streamed live to the UI.

---

## 📌 Overview

You type a company name. The AI agent autonomously:

1. 🔍 **Searches the web** — finds recent news, earnings, controversies, leadership changes (2–3 targeted searches)
2. 📊 **Fetches financial data** — pulls live P/E ratio, profit margins, debt levels, analyst ratings via Alpha Vantage
3. 🧠 **Analyzes sentiment** — scores the news for positives, negatives, and red flags using Groq LLM
4. ⚖️ **Synthesizes a verdict** — combines all findings into a structured research report with a clear decision

The entire research process is **streamed live** to the UI via Server-Sent Events — you watch the agent call each tool in real time, see the results, and get the final verdict.

---

## 🚀 How to Run It

### Prerequisites

- Node.js 18+
- 3 API keys (all free tiers available):

| Key | Where to Get | Free Tier |
|-----|-------------|-----------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | Very generous free tier |
| `TAVILY_API_KEY` | [app.tavily.com](https://app.tavily.com) | 1000 searches/month |
| `ALPHA_VANTAGE_API_KEY` | [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key) | 25 calls/day |

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/avinashreddy09/investment-agent.git
cd investment-agent

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Set up environment variables
cp .env.local.example .env.local
# Open .env.local and add your API keys

# 4. Run the development server
npm run dev
# Open http://localhost:3000
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
GROQ_API_KEY=gsk_your_groq_key_here
TAVILY_API_KEY=tvly_your_tavily_key_here
ALPHA_VANTAGE_API_KEY=your_alphavantage_key_here
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard:
# Settings → Environment Variables → Add GROQ_API_KEY, TAVILY_API_KEY, ALPHA_VANTAGE_API_KEY
```

---

## 🏗️ How It Works — Architecture

```
User Input: "Tata Motors"
        │
        ▼
┌──────────────────────────────────────────┐
│   Next.js API Route (/api/analyze)        │
│   Server-Sent Events (SSE stream)         │
│   export const dynamic = 'force-dynamic'  │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│        LangGraph ReAct Agent              │
│        (Groq — llama-3.3-70b-versatile)  │
│                                           │
│  Tool 1: web_search (Tavily API)          │
│    → Recent news, earnings, events        │
│                                           │
│  Tool 2: get_financial_data (Alpha Vantage)│
│    → P/E ratio, margins, debt, ratings   │
│                                           │
│  Tool 3: analyze_sentiment (Groq LLM)    │
│    → Sentiment score, red flags           │
│                                           │
│  Agent iterates until confident enough   │
│  to deliver a final verdict              │
└──────────────────┬───────────────────────┘
                   │
                   ▼
     SSE Stream → React Frontend
     Each step shown live:
     🔍 Tool Call → ✓ Result → 💭 Thinking → 🎯 Verdict
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/agent/investmentAgent.ts` | Core LangGraph ReAct agent, system prompt, stream parser |
| `src/lib/tools/webSearch.ts` | Tavily web search tool with LangChain tool wrapper |
| `src/lib/tools/financialData.ts` | Alpha Vantage financial data — overview, income, quote |
| `src/lib/tools/sentimentAnalysis.ts` | Groq-powered structured sentiment scorer |
| `src/app/api/analyze/route.ts` | SSE streaming API endpoint (force-dynamic) |
| `src/app/page.tsx` | Main UI — search, live agent feed, verdict display |
| `src/components/AgentSteps.tsx` | Real-time tool call visualizer (terminal-style) |
| `src/components/VerdictBadge.tsx` | INVEST / PASS / HOLD AND MONITOR verdict card |
| `src/components/ResearchReport.tsx` | Full markdown report renderer with copy button |

### Why LangGraph ReAct?

I used `createReactAgent` from LangGraph.js — a **ReAct (Reason + Act)** pattern where the LLM:
- **Reasons** about what information it still needs
- **Acts** by calling the right tool
- **Observes** the result and decides what to do next
- **Repeats** until it has enough data to make a confident decision

This is far more intelligent than a fixed pipeline (search → financials → sentiment → verdict) because:
- Private companies have no financial data → agent skips that tool automatically
- If news reveals a bankruptcy, agent prioritizes that over financial ratios
- Agent does 2–3 web searches from different angles instead of just one

---

## ⚖️ Key Decisions & Trade-offs

### Decision 1: LangGraph ReAct vs Fixed Pipeline

| | ReAct Agent (chosen) | Fixed Pipeline |
|---|---|---|
| **Flexibility** | Adapts to each company | Same steps every time |
| **Intelligence** | Skips irrelevant tools | Always runs all steps |
| **Debuggability** | Harder to predict path | Easy to trace |
| **Quality** | Better for edge cases | Brittle for private companies |

**Chose ReAct** because the assignment said "how it works is up to you" — autonomy is the point.

---

### Decision 2: Server-Sent Events vs WebSockets for Streaming

**Chose SSE** because:
- One-directional (server → client) is all we need for streaming agent steps
- Native support in Next.js API routes with `TransformStream`
- Works over HTTP/1.1, no upgrade handshake needed
- WebSockets would add complexity with no benefit for this use case

---

### Decision 3: Groq (llama-3.3-70b) as the LLM

**Chose Groq** because:
- Extremely fast inference (tokens/sec much faster than OpenAI)
- Generous free tier — no credit card required
- `llama-3.3-70b-versatile` has strong reasoning for financial analysis
- Originally built for Gemini but switched due to free tier quota exhaustion

**Trade-off:** GPT-4o has marginally better financial reasoning but requires paid API access.

---

### Decision 4: Alpha Vantage for Financial Data

**Chose Alpha Vantage** because:
- Completely free tier (25 calls/day)
- Covers US stocks + international markets (BSE, NSE tickers)
- Returns comprehensive data: overview, income statement, analyst ratings, price history

**Trade-off:** 25 calls/day limit means heavy testing exhausts the quota. For production, Polygon.io or a Bloomberg API would be better.

**Left out intentionally:**
- Real-time options flow and insider trading data
- Institutional holdings (13F filings)
- DCF (Discounted Cash Flow) valuation model

---

### Decision 5: What I Left Out (Would Add With More Time)

- **User auth + research history** — save past research sessions per user
- **Portfolio mode** — research multiple companies and compare side-by-side
- **Price charts** — visualize 1Y price history using Recharts + Alpha Vantage
- **PDF export** — download the full research report as a PDF
- **Competitor analysis** — auto-identify and research 2–3 competitors for context
- **LangGraph StateGraph** — replace ReAct with explicit state machine for more control

---

## 📋 Example Runs

### 1. Apple Inc (AAPL) → INVEST ✅

```
🔍 Searched: "Apple Inc latest news 2025"
🔍 Searched: "Apple AAPL earnings Q4 2024 results"
📊 Financial: P/E 28x, Revenue $391B, Profit Margin 26%, Analyst: Strong Buy
🧠 Sentiment: +0.82 (positive) — Services growth, AI features momentum

Bull Case: Services revenue growing 15% YoY, $110B cash, Apple Intelligence rollout
Bear Case: China sales declining, premium valuation at 28x P/E
Red Flags: None identified

DECISION: INVEST | Confidence: HIGH | Risk: MEDIUM
```

---

### 2. WeWork → PASS 🚫

```
🔍 Searched: "WeWork company news 2024"
🔍 Searched: "WeWork bankruptcy filing financial crisis"
📊 Financial: Negative EBITDA, massive debt load, post-bankruptcy restructuring
🧠 Sentiment: -0.91 (very negative) — Chapter 11, leadership failure, model collapse

Bull Case: Global real estate brand, post-bankruptcy restructuring opportunity
Bear Case: Filed Chapter 11 in 2023, negative unit economics, WeWork model fundamentally broken
Red Flags: 🚩 Bankruptcy filing 🚩 Accounting controversies 🚩 SoftBank write-down

DECISION: PASS | Confidence: HIGH | Risk: VERY HIGH
```

---

### 3. Zomato → HOLD AND MONITOR 👁️

```
🔍 Searched: "Zomato stock 2025 earnings"
🔍 Searched: "Zomato Blinkit quick commerce growth India"
📊 Financial: Revenue growing 70% YoY, first profitable quarter, high P/E ~200x
🧠 Sentiment: +0.45 (mildly positive) — profitability improving, Blinkit scaling well

Bull Case: Market leader India food delivery, Blinkit quick commerce expanding fast
Bear Case: Still richly valued at 200x P/E, Swiggy competition intensifying
Red Flags: High cash burn in quick commerce segment

DECISION: HOLD AND MONITOR | Confidence: MEDIUM | Risk: HIGH
```

---

### 4. Nvidia (NVDA) → INVEST ✅

```
DECISION: INVEST | Confidence: HIGH | Risk: MEDIUM
AI infrastructure supercycle, data center revenue up 200% YoY, dominant GPU market share
```

---

### 5. Reliance Industries → HOLD AND MONITOR 👁️

```
DECISION: HOLD AND MONITOR | Confidence: MEDIUM | Risk: MEDIUM
Strong conglomerate, Jio growth solid, but retail segment facing margin pressure
```

---

## 🔮 What I Would Improve With More Time

1. **LangGraph StateGraph** — replace the ReAct agent with an explicit state machine defining research stages (news → financials → sentiment → synthesis) with conditional edges based on company type

2. **RAG on SEC / SEBI filings** — index 10-K and annual reports into a vector store for deep fundamental analysis beyond surface metrics

3. **Competitor benchmarking** — auto-identify 2–3 competitors and research them in parallel for relative valuation

4. **Multi-timeframe verdicts** — separate short-term (3-month trader) and long-term (3-year investor) recommendations

5. **Confidence calibration** — track verdicts over time, measure accuracy, retrain the system prompt

6. **Fallback data sources** — if Alpha Vantage hits rate limit, fall back to Yahoo Finance or Polygon.io automatically

7. **Portfolio tracker** — let users save multiple verdicts and track how the agent's predictions age

---

## 📁 Project Structure

```
investment-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analyze/
│   │   │       └── route.ts          # SSE streaming API endpoint
│   │   ├── globals.css               # Tailwind + custom styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Main UI page
│   ├── components/
│   │   ├── AgentSteps.tsx            # Live tool call feed (terminal-style)
│   │   ├── VerdictBadge.tsx          # INVEST/PASS/HOLD verdict card
│   │   └── ResearchReport.tsx        # Full markdown report renderer
│   └── lib/
│       ├── agent/
│       │   └── investmentAgent.ts    # LangGraph ReAct agent core
│       └── tools/
│           ├── webSearch.ts          # Tavily web search tool
│           ├── financialData.ts      # Alpha Vantage financial data tool
│           └── sentimentAnalysis.ts  # Groq sentiment analysis tool
├── .env.local.example                # Environment variables template
├── .gitignore
├── next.config.js                    # Next.js config
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15 (App Router) | Full-stack in one repo, SSE support |
| Language | TypeScript | Type safety for agent/tool contracts |
| AI Framework | LangGraph.js (`createReactAgent`) | ReAct pattern, autonomous tool use |
| LLM | Groq — llama-3.3-70b-versatile | Fast, free, strong reasoning |
| Web Search | Tavily API | Purpose-built for AI agents |
| Financial Data | Alpha Vantage API | Free, comprehensive stock data |
| Streaming | Server-Sent Events (SSE) | Simple, native, one-directional |
| Styling | Tailwind CSS | Rapid dark-mode UI |
| Markdown | react-markdown | Render LLM report output |
| Deployment | Vercel | Zero-config Next.js deployment |

---

## 👨‍💻 Built By

**Avinash Reddy** — CS Student, Lovely Professional University  
GitHub: [@avinashreddy09](https://github.com/avinashreddy09)  
Assignment: InsideIIM × Altuni AI Labs — AI Product Engineer Intern  
Deadline: 29 June 2026

---

> ⚠️ **Disclaimer:** This tool is for educational purposes only. Not financial advice. Always do your own research before making investment decisions.
