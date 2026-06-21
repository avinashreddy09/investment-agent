// src/lib/tools/financialData.ts
// Alpha Vantage Tool — fetches real stock price, overview, and financials

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";

const BASE_URL = "https://www.alphavantage.co/query";

async function fetchCompanyOverview(symbol: string) {
  const { data } = await axios.get(BASE_URL, {
    params: {
      function: "OVERVIEW",
      symbol,
      apikey: process.env.ALPHA_VANTAGE_API_KEY,
    },
  });
  return data;
}

async function fetchGlobalQuote(symbol: string) {
  const { data } = await axios.get(BASE_URL, {
    params: {
      function: "GLOBAL_QUOTE",
      symbol,
      apikey: process.env.ALPHA_VANTAGE_API_KEY,
    },
  });
  return data["Global Quote"] || {};
}

async function fetchIncomeStatement(symbol: string) {
  const { data } = await axios.get(BASE_URL, {
    params: {
      function: "INCOME_STATEMENT",
      symbol,
      apikey: process.env.ALPHA_VANTAGE_API_KEY,
    },
  });
  // Return only the most recent annual report to save tokens
  return data?.annualReports?.[0] || {};
}

export const financialDataTool = tool(
  async ({ ticker }) => {
    try {
      const [overview, quote, income] = await Promise.all([
        fetchCompanyOverview(ticker),
        fetchGlobalQuote(ticker),
        fetchIncomeStatement(ticker),
      ]);

      if (!overview || Object.keys(overview).length === 0) {
        return `Could not find financial data for ticker: ${ticker}. This might be an invalid ticker symbol or a private company.`;
      }

      const summary = {
        // Company basics
        name: overview.Name,
        sector: overview.Sector,
        industry: overview.Industry,
        description: overview.Description?.slice(0, 300) + "...",
        // Valuation metrics
        marketCap: overview.MarketCapitalization,
        peRatio: overview.PERatio,
        pbRatio: overview.PriceToBookRatio,
        psRatio: overview.PriceToSalesRatioTTM,
        evToEbitda: overview.EVToEBITDA,
        // Performance metrics
        revenueGrowthYOY: overview.RevenueGrowthYOY,
        profitMargin: overview.ProfitMargin,
        operatingMargin: overview.OperatingMarginTTM,
        returnOnEquity: overview.ReturnOnEquityTTM,
        returnOnAssets: overview.ReturnOnAssetsTTM,
        // Financial health
        debtToEquity: overview.DebtToEquityRatio || "N/A",
        currentRatio: overview.CurrentRatio || "N/A",
        quickRatio: overview.QuickRatio || "N/A",
        // Dividends & growth
        dividendYield: overview.DividendYield,
        dividendPerShare: overview.DividendPerShare,
        eps: overview.EPS,
        revenuePerShareTTM: overview.RevenuePerShareTTM,
        // Price data
        currentPrice: quote["05. price"],
        priceChange: quote["09. change"],
        priceChangePercent: quote["10. change percent"],
        high52Week: overview["52WeekHigh"],
        low52Week: overview["52WeekLow"],
        fiftyDayMA: overview["50DayMovingAverage"],
        twoHundredDayMA: overview["200DayMovingAverage"],
        // Analyst targets
        analystTargetPrice: overview.AnalystTargetPrice,
        analystRatingStrongBuy: overview.AnalystRatingStrongBuy,
        analystRatingBuy: overview.AnalystRatingBuy,
        analystRatingHold: overview.AnalystRatingHold,
        analystRatingSell: overview.AnalystRatingSell,
        // Recent income
        recentAnnualRevenue: income.totalRevenue,
        recentAnnualNetIncome: income.netIncome,
        recentAnnualEbitda: income.ebitda,
      };

      return JSON.stringify(summary, null, 2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return `Error fetching financial data: ${message}`;
    }
  },
  {
    name: "get_financial_data",
    description:
      "Fetch real financial data for a publicly listed company using its stock ticker symbol. Returns valuation ratios, profitability, analyst ratings, and price data. Use this for any company listed on a major stock exchange.",
    schema: z.object({
      ticker: z
        .string()
        .describe(
          "Stock ticker symbol, e.g. 'AAPL' for Apple, 'RELIANCE.BSE' for Reliance Industries, 'TCS.BSE' for TCS"
        ),
    }),
  }
);
