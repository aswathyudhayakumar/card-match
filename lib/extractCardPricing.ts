import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LivePricing } from "./types";

const PROMPT_TEMPLATE = `You are a credit card data extraction agent.

Task: Find the CURRENT pricing terms for the following US credit card. Use web search to get real-time data from the official issuer website. Do NOT use training data — verify everything via search.

Card: {cardName}
Official URL: {officialUrl}

Extract these fields and return ONLY valid JSON (no markdown, no commentary):

{
  "annual_fee": <number in dollars, 0 if no fee>,
  "apr_min": <minimum variable APR as a number, e.g. 18.24>,
  "apr_max": <maximum variable APR as a number, e.g. 28.24>,
  "intro_purchase_apr_months": <number of months for 0% intro APR on purchases, 0 if none>,
  "intro_balance_transfer_apr_months": <number of months for 0% intro APR on balance transfers, 0 if none>,
  "foreign_transaction_fee": <percentage as number, 0 if none>,
  "balance_transfer_fee_pct": <percentage as number, 0 if no balance transfers>,
  "signup_bonus_value": <dollar value of sign-up bonus, 0 if none>,
  "signup_bonus_description": "<short description of the bonus and its spend requirement>",
  "source_url": "<the actual URL you got the data from>",
  "confidence": "high" | "medium" | "low",
  "notes": "<any caveats, e.g. 'limited-time offer', 'APR as of date X', 'charge card - no standard APR'>"
}

Confidence rules:
- "high": all fields found directly on the issuer's page
- "medium": some fields inferred from Schumer Box or similar disclosures
- "low": significant fields missing or only found on third-party sites

If a field genuinely doesn't apply (e.g., charge card has no APR), return 0 and note it.
If you cannot find a field, return null for that field and lower confidence.

Return ONLY the JSON object.`;

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

export async function extractCardPricing(
  cardId: string,
  cardName: string,
  officialUrl: string
): Promise<LivePricing> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    tools: [{ googleSearchRetrieval: {} } as never],
  });

  const prompt = PROMPT_TEMPLATE.replace("{cardName}", cardName).replace(
    "{officialUrl}",
    officialUrl
  );

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const cleaned = stripMarkdownFences(text);

    let parsed: LivePricing;
    try {
      parsed = JSON.parse(cleaned) as LivePricing;
    } catch {
      console.error(`[extractCardPricing] JSON parse error for ${cardId}:`, cleaned.slice(0, 200));
      return {
        annual_fee: null,
        apr_min: null,
        apr_max: null,
        intro_purchase_apr_months: null,
        intro_balance_transfer_apr_months: null,
        foreign_transaction_fee: null,
        balance_transfer_fee_pct: null,
        signup_bonus_value: null,
        signup_bonus_description: null,
        source_url: null,
        confidence: "low",
        notes: "Failed to parse LLM response as JSON",
        fetched_at: Date.now(),
      };
    }

    return { ...parsed, fetched_at: Date.now() };
  } catch (error) {
    console.error(`[extractCardPricing] Error fetching ${cardId}:`, error);
    return {
      annual_fee: null,
      apr_min: null,
      apr_max: null,
      intro_purchase_apr_months: null,
      intro_balance_transfer_apr_months: null,
      foreign_transaction_fee: null,
      balance_transfer_fee_pct: null,
      signup_bonus_value: null,
      signup_bonus_description: null,
      source_url: null,
      confidence: "low",
      notes: `Extraction failed: ${error instanceof Error ? error.message : String(error)}`,
      fetched_at: Date.now(),
    };
  }
}
