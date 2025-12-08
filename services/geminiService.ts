import { GoogleGenAI } from "@google/genai";
import { SectionType, PredictionResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchPredictions = async (type: SectionType, count: number = 4, market: string = "Any"): Promise<PredictionResponse> => {
  const model = "gemini-2.5-flash";

  const now = new Date();
  const dateString = now.toDateString(); // e.g. "Fri Oct 27 2023"
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const isVip = type === SectionType.VIP;
  
  // Ensure count is within reasonable bounds
  const safeCount = Math.max(1, Math.min(count, 50));

  // Optimized System Instructions (Token Efficient)
  const systemInstruction = isVip 
    ? `Role: Elite Sports Data Scientist. Methodology: Rigorous, risk-averse.
       Protocol:
       1. DATE CHECK: STRICTLY TODAY (${dateString}) ONLY. Reject tomorrow's/yesterday's games.
       2. TIME CHECK: REJECT if match started/finished. Upcoming only.
       3. ANALYZE: Form, H2H, Injuries (WAR), Motivation, xG Regression.
       4. FILTER: Select ONLY matches with AI Confidence > 85%.
       Output: Calculated, high-confidence data.`
    : `Role: Conservative football analyst. Goal: Safety on UPCOMING matches for TODAY (${dateString}) only. Ignore played games. Confidence must be > 80%.`;

  let constraints = "";
  if (isVip) {
    if (market !== "Any") {
      let oddsRange = "1.60 - 3.50";
      
      if (market === "Correct Score") oddsRange = "5.00 - 25.00";
      else if (market === "HT/FT") oddsRange = "2.50 - 15.00";
      else if (market === "BTTS & Over 2.5") oddsRange = "2.00 - 3.50";
      else if (market.includes("Win &")) oddsRange = "2.00 - 5.00";
      else if (market.includes("Draw")) oddsRange = "2.80 - 4.50";
      else if (market === "Over 1.5 Goals") oddsRange = "1.20 - 1.60";
      else if (market === "Home or Away Win") oddsRange = "1.50 - 3.00";
      else if (market === "BTTS") oddsRange = "1.60 - 2.60";
      else if (market === "1up") oddsRange = "2.00 - 3.20";
      else if (market === "2up") oddsRange = "1.80 - 2.80";
      else if (market === "Build the Bet") oddsRange = "3.00 - 8.00";
      else if (market === "Home Team Over 1.5 Goals") oddsRange = "1.50 - 2.50";
      else if (market === "Away Team Over 1.5 Goals") oddsRange = "1.90 - 3.20";
      else if (market === "Safe Market") oddsRange = "1.15 - 1.50";

      let marketNameForPrompt = market;
      if (market === "Home or Away Win") marketNameForPrompt = "Full Time Result (Home Win OR Away Win)";
      else if (market === "BTTS") marketNameForPrompt = "Both Teams to Score (Yes OR No)";
      else if (market === "1up") marketNameForPrompt = "1st Half Winner";
      else if (market === "2up") marketNameForPrompt = "Early Payout (Dominant Team)";
      else if (market === "Build the Bet") marketNameForPrompt = "Same Game Multi (Winner + Goals)";
      else if (market === "Safe Market") marketNameForPrompt = "Safe Bet (Over 1.5, DC, or Team Over 0.5)";

      constraints = `Strictly predict "${marketNameForPrompt}" ONLY. Value Range: ${oddsRange}.`;
    } else {
      constraints = "Focus on high value: Home Wins, BTTS, Over 2.5. Odds 1.8 - 3.5.";
    }
  } else {
    constraints = "Strictly predict: FT Result, Double Chance, or Over 1.5 Goals. Odds 1.2 - 1.7.";
  }

  // Optimized Prompt (Token Efficient)
  const prompt = `
  Context: Today is ${dateString}, Current Time: ${timeString} (${userTimezone})

  Task:
  1. Search "https://www.flashscore.com.gh/", "https://radyolisten.cc/correct-score2", "https://onemillionpredictions.com/", "https://primatips.com/tips". Find today's schedule.
  2. DATE FILTER: Keep ONLY matches scheduled for TODAY (${dateString}). Exclude tomorrow's games.
  3. TIME FILTER: Compare Kickoff vs ${timeString}. REJECT finished/live matches.
  4. Select ${safeCount} UPCOMING matches for TODAY.
  5. ANALYZE: Form, H2H, Trends, Injuries, Morale.
  6. Market: ${constraints}
  7. SCORING: Assign AI Confidence between 85 and 99.

  Output JSON ONLY:
  {
    "predictions": [
      {
        "homeTeam": "string",
        "awayTeam": "string",
        "league": "string",
        "prediction": "string",
        "odds": number,
        "confidence": number (85-99),
        "analysis": "concise reasoning",
        "kickoffTime": "HH:MM",
        "riskLevel": "Low"|"Medium"|"High"
      }
    ]
  }
  `;

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        }
      });

      // 1. Extract JSON
      let jsonString = response.text || "{}";
      jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      
      let predictions = [];
      if (firstBrace !== -1 && lastBrace !== -1) {
        const cleanJson = jsonString.substring(firstBrace, lastBrace + 1);
        try {
          const parsed = JSON.parse(cleanJson);
          predictions = parsed.predictions || [];
        } catch (e) {
          console.error("JSON Parse error:", e);
        }
      }

      // 2. Extract Sources
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => {
          if (chunk.web) {
            return {
              title: chunk.web.title || "Source",
              url: chunk.web.uri
            };
          }
          return null;
        })
        .filter((source: any) => source !== null && source.url) || [];

      const uniqueSources = Array.from(new Map(sources.map((s: any) => [s.url, s])).values());

      return {
        predictions,
        sources: uniqueSources as any[]
      };

    } catch (error: any) {
      // Handle Rate Limits (429)
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`Attempt ${attempts + 1} failed with 429/Quota. Retrying...`);
        attempts++;
        if (attempts >= maxAttempts) {
             throw new Error("⚠️ High Traffic: Daily AI Quota Exceeded. Please try again tomorrow.");
        }
        await sleep(2000 * Math.pow(2, attempts)); // Exponential backoff: 4s, 8s...
        continue;
      }
      
      console.error("Error fetching predictions:", error);
      throw error; // Propagate other errors
    }
  }
  
  throw new Error("Failed to connect to AI Service.");
};