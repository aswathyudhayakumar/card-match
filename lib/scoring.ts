import type {
  Card,
  QuizAnswers,
  ScoredCard,
  EffectivePricing,
  LivePricing,
} from "./types";
import { BRANCH_A_WEIGHTS, BRANCH_B_WEIGHTS } from "./constants";

function getEffectivePricing(card: Card, live: LivePricing | null): EffectivePricing {
  const f = card.fallback;

  if (!live || live.confidence === "low") {
    return {
      annual_fee: f.annual_fee,
      apr_min: f.apr_min,
      apr_max: f.apr_max,
      intro_purchase_apr_months: f.intro_purchase_apr_months,
      intro_balance_transfer_apr_months: f.intro_balance_transfer_apr_months,
      foreign_transaction_fee: f.foreign_transaction_fee,
      balance_transfer_fee_pct: f.balance_transfer_fee_pct,
      signup_bonus_value: f.signup_bonus_value,
      signup_bonus_description: f.signup_bonus_description,
      is_live: false,
      last_verified: f.last_verified,
    };
  }

  const hoursAgo = live.fetched_at
    ? Math.round((Date.now() - live.fetched_at) / 3600000)
    : null;

  return {
    annual_fee: live.annual_fee ?? f.annual_fee,
    apr_min: live.apr_min ?? f.apr_min,
    apr_max: live.apr_max ?? f.apr_max,
    intro_purchase_apr_months: live.intro_purchase_apr_months ?? f.intro_purchase_apr_months,
    intro_balance_transfer_apr_months:
      live.intro_balance_transfer_apr_months ?? f.intro_balance_transfer_apr_months,
    foreign_transaction_fee: live.foreign_transaction_fee ?? f.foreign_transaction_fee,
    balance_transfer_fee_pct: live.balance_transfer_fee_pct ?? f.balance_transfer_fee_pct,
    signup_bonus_value: live.signup_bonus_value ?? f.signup_bonus_value,
    signup_bonus_description: live.signup_bonus_description ?? f.signup_bonus_description,
    is_live: true,
    last_verified: hoursAgo !== null ? `${hoursAgo} hours ago` : "recently",
    confidence: live.confidence,
  };
}

function passesCreditFilter(card: Card, q1: QuizAnswers["q1"]): boolean {
  const req = card.credit_requirement;
  switch (q1) {
    case "no_credit":
      return req === "none";
    case "building":
      return req === "none" || req === "fair";
    case "good":
      return req === "none" || req === "fair" || req === "good";
    case "excellent":
      return true;
    case "unknown":
      return req === "none" || req === "fair" || req === "good";
  }
}

function passesFeeFilter(card: Card, q5: QuizAnswers["q5"], pricing: EffectivePricing): boolean {
  switch (q5) {
    case "zero_only":
      return pricing.annual_fee === 0;
    case "under_100":
      return pricing.annual_fee <= 99;
    case "over_100":
    case "dont_care":
      return true;
  }
}

function passesBranchBFilter(pricing: EffectivePricing): boolean {
  return !(pricing.apr_max > 22 && pricing.intro_balance_transfer_apr_months < 12);
}

function scoreDimensionA(card: Card, answers: QuizAnswers, pricing: EffectivePricing): number {
  const { q3 } = answers;
  const tags = card.tags;

  switch (q3) {
    case "build_credit":
      if (tags.includes("starter") || tags.includes("credit_building")) return 30;
      return 10;
    case "cashback":
      if (card.rewards_type === "cashback") return 25;
      return 10;
    case "travel_rewards":
      if (card.rewards_type === "travel" || card.rewards_type === "points") return 25;
      return 10;
    case "low_apr":
      if (pricing.apr_min < 17 || pricing.intro_balance_transfer_apr_months >= 15) return 30;
      return 10;
    case "signup_bonus":
      if (pricing.signup_bonus_value >= 200) return 20;
      return 10;
    case "simple":
      if (pricing.annual_fee === 0 && card.complexity === "low") return 20;
      return 10;
    default:
      return 0;
  }
}

function scoreDimensionB(card: Card, q4: QuizAnswers["q4"]): number {
  let total = 0;

  for (const category of q4) {
    if (category === "everything") {
      const rate = card.rewards_flat_rate;
      if (rate >= 2) total += 20;
      else if (rate >= 1.5) total += 10;
      else total += 5;
      continue;
    }

    const match = card.rewards_categories.find((rc) => rc.category === category);
    const rate = match?.rate ?? card.rewards_flat_rate;

    if (rate >= 5) total += 20;
    else if (rate >= 3) total += 15;
    else if (rate >= 2) total += 10;
    else if (rate >= 1) total += 5;
  }

  return total;
}

function scoreDimensionC(card: Card, q5: QuizAnswers["q5"], pricing: EffectivePricing): number {
  const fee = pricing.annual_fee;
  const tags = card.tags;
  const hasHighRewards = card.rewards_categories.some((rc) => rc.rate >= 3);

  switch (q5) {
    case "zero_only":
      return fee === 0 ? 10 : 0;
    case "under_100":
      if (fee === 0) return 5;
      if (fee >= 50 && fee <= 99 && hasHighRewards) return 15;
      return 0;
    case "over_100":
      if (fee === 0) return 0;
      if (fee >= 95 && fee <= 250 && (tags.includes("travel_perks") || tags.includes("premium")))
        return 15;
      return 0;
    case "dont_care":
      if (tags.includes("premium")) return 10;
      return 0;
    default:
      return 0;
  }
}

function scoreDimensionCWithTravel(
  card: Card,
  q4: QuizAnswers["q4"],
  q5: QuizAnswers["q5"],
  pricing: EffectivePricing
): number {
  let score = scoreDimensionC(card, q5, pricing);
  const fee = pricing.annual_fee;

  if (q5 === "over_100" && fee >= 450 && q4.includes("travel")) {
    score += 10;
  }

  return score;
}

function scoreDimensionD(card: Card, q6: QuizAnswers["q6"]): number {
  if (q6 === "none") return 0;
  return card.issuer === q6 ? 10 : 0;
}

function scoreDimensionE(card: Card, q1: QuizAnswers["q1"]): number {
  const tags = card.tags;
  switch (q1) {
    case "no_credit":
      if (tags.includes("student") || tags.includes("starter")) return 15;
      return 0;
    case "building":
      if (tags.includes("credit_building")) return 10;
      return 0;
    case "excellent":
      if (tags.includes("premium")) return 5;
      return 0;
    default:
      return 0;
  }
}

function scoreDimensionF(pricing: EffectivePricing): number {
  let score = 0;

  if (pricing.apr_min < 15) score += 40;
  else if (pricing.apr_min < 18) score += 25;
  else if (pricing.apr_min <= 22) score += 10;

  if (pricing.intro_purchase_apr_months >= 15) score += 15;
  if (pricing.intro_balance_transfer_apr_months >= 15) score += 20;

  return score;
}

function scoreCard(
  card: Card,
  answers: QuizAnswers,
  pricing: EffectivePricing,
  branch: "A" | "B"
): ScoredCard {
  const A = scoreDimensionA(card, answers, pricing);
  const B = scoreDimensionB(card, answers.q4);
  const C = scoreDimensionCWithTravel(card, answers.q4, answers.q5, pricing);
  const D = scoreDimensionD(card, answers.q6);
  const E = scoreDimensionE(card, answers.q1);
  const F = branch === "B" ? scoreDimensionF(pricing) : 0;

  const weights = branch === "A" ? BRANCH_A_WEIGHTS : BRANCH_B_WEIGHTS;
  const score =
    weights.A * A +
    weights.B * B +
    weights.C * C +
    weights.D * D +
    weights.E * E +
    weights.F * F;

  return {
    card,
    score,
    scoreBreakdown: { A, B, C, D, E, F },
    effectivePricing: pricing,
  };
}

export function determineBranch(answers: QuizAnswers): "A" | "B" {
  return answers.q2 === "always" || answers.q2 === "most_months" ? "A" : "B";
}

export function applyHardFilters(
  cards: Card[],
  answers: QuizAnswers,
  branch: "A" | "B"
): Card[] {
  const fallbackPricingMap = new Map(
    cards.map((c) => [
      c.id,
      getEffectivePricing(c, null),
    ])
  );

  return cards.filter((card) => {
    const pricing = fallbackPricingMap.get(card.id)!;

    if (!passesCreditFilter(card, answers.q1)) return false;
    if (!passesFeeFilter(card, answers.q5, pricing)) return false;
    if (branch === "B" && !passesBranchBFilter(pricing)) return false;

    return true;
  });
}

export function scoreCards(
  cards: Card[],
  answers: QuizAnswers,
  livePricingMap: Map<string, LivePricing | null>,
  branch: "A" | "B"
): ScoredCard[] {
  return cards
    .map((card) => {
      const live = livePricingMap.get(card.id) ?? null;
      const pricing = getEffectivePricing(card, live);
      return scoreCard(card, answers, pricing, branch);
    })
    .sort((a, b) => b.score - a.score);
}

export { getEffectivePricing };
