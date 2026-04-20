import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ScoredCard, QuizAnswers, UserSegment } from "./types";
import {
  Q1_LABELS,
  Q2_LABELS,
  Q3_LABELS,
  Q4_LABELS,
  Q5_LABELS,
  Q6_LABELS,
} from "./constants";

const segmentContext: Record<UserSegment, string> = {
  first_card:
    "This is their first credit card. Explain how this card helps them build credit responsibly without unnecessary complexity or fees.",
  adding_card:
    "They already have credit card(s) and are adding another to their wallet. Focus on how this card complements what they likely have.",
  consolidating:
    "They have multiple cards and want to simplify. Explain how this card could replace or reduce the need for several cards they might currently juggle.",
  upgrading:
    "They want to upgrade from their current card. Explain what this card offers beyond what a typical starter or entry-level card provides.",
};

function formatRewards(card: ScoredCard): string {
  const { card: c, effectivePricing: p } = card;
  const parts: string[] = [];

  if (c.rewards_categories.length > 0) {
    for (const rc of c.rewards_categories) {
      parts.push(`${rc.rate}% on ${rc.category}${rc.cap ? ` (up to $${rc.cap}/yr)` : ""}`);
    }
  }
  if (c.rewards_flat_rate > 0) {
    parts.push(`${c.rewards_flat_rate}% on everything else`);
  }

  return parts.length > 0 ? parts.join(", ") : "No rewards";
}

function buildReasoningPrompt(card: ScoredCard, answers: QuizAnswers): string {
  const { card: c, effectivePricing: p } = card;
  const q4Labels = answers.q4.map((cat) => Q4_LABELS[cat]).join(", ");
  const purposeLabels = answers.q3.map((p) => Q3_LABELS[p]).join(", ");

  const rewards = formatRewards(card);
  const annualFee = p.annual_fee === 0 ? "No annual fee" : `$${p.annual_fee}/year`;
  const aprRange =
    p.apr_min === 0 && p.apr_max === 0
      ? "N/A (charge card)"
      : `${p.apr_min}%–${p.apr_max}%`;

  return `You are a friendly credit card advisor.
Situation: ${segmentContext[answers.segment]}

The user has these priorities:
- Credit situation: ${Q1_LABELS[answers.q1]}
- Balance behavior: ${Q2_LABELS[answers.q2]}
- Primary goals: ${purposeLabels}
- Top spending categories: ${q4Labels}
- Fee tolerance: ${Q5_LABELS[answers.q5]}
- Existing bank: ${Q6_LABELS[answers.q6]}

The recommended card is:
- Name: ${c.name}
- Issuer: ${c.issuer}
- Annual fee: ${annualFee}
- APR range: ${aprRange}
- Rewards: ${rewards}
- Sign-up bonus: ${p.signup_bonus_description || "None"}

Write 2-3 sentences explaining why this card fits the user given their situation. Be specific — cite actual features that match their stated priorities. Acknowledge tradeoffs honestly (e.g., if they want low APR but this card has medium APR, don't pretend otherwise). Write in second person ("you'll"), conversational but professional tone. No emojis, no bullet points, no headers.`;
}

export async function generateReasoning(
  card: ScoredCard,
  answers: QuizAnswers
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return buildFallbackReasoning(card, answers);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = buildReasoningPrompt(card, answers);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text;
  } catch (error) {
    console.error(`[generateReasoning] Error for ${card.card.id}:`, error);
    return buildFallbackReasoning(card, answers);
  }
}

function buildFallbackReasoning(card: ScoredCard, answers: QuizAnswers): string {
  const { card: c, effectivePricing: p } = card;
  const fee = p.annual_fee === 0 ? "no annual fee" : `a $${p.annual_fee} annual fee`;
  const purposeLabels = answers.q3.map((q) => Q3_LABELS[q]).join(", ").toLowerCase();
  return `The ${c.name} is a strong match for your profile — it offers ${
    c.rewards_type !== "none" ? `${c.rewards_type} rewards` : "straightforward terms"
  } with ${fee}. Given your goals of ${purposeLabels}, this card's features align well with your stated priorities. Verify current terms directly with ${c.issuer} before applying.`;
}
