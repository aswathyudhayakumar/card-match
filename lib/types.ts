export type Issuer =
  | "Chase"
  | "Amex"
  | "Bank of America"
  | "Wells Fargo"
  | "Capital One"
  | "Citi"
  | "Discover"
  | "US Bank"
  | "credit-union"
  | "other";

export type CreditRequirement = "none" | "fair" | "good" | "excellent";
export type RewardsType = "cashback" | "travel" | "points" | "none";
export type SpendingCategory =
  | "groceries"
  | "dining"
  | "gas"
  | "travel"
  | "online_shopping"
  | "streaming"
  | "everything";
export type Complexity = "low" | "medium" | "high";
export type Confidence = "high" | "medium" | "low";

export interface RewardsCategory {
  category: SpendingCategory;
  rate: number;
  cap?: number;
  notes?: string;
}

export interface CardFallback {
  annual_fee: number;
  apr_min: number;
  apr_max: number;
  intro_purchase_apr_months: number;
  intro_balance_transfer_apr_months: number;
  foreign_transaction_fee: number;
  balance_transfer_fee_pct: number;
  signup_bonus_value: number;
  signup_bonus_description: string;
  last_verified: string;
}

export interface Card {
  id: string;
  name: string;
  issuer: Issuer;
  official_url: string;
  image_url: string | null;
  credit_requirement: CreditRequirement;
  rewards_type: RewardsType;
  rewards_flat_rate: number;
  rewards_categories: RewardsCategory[];
  tags: string[];
  complexity: Complexity;
  best_for: string[];
  fallback: CardFallback;
}

export interface CardsFile {
  schema_version: string;
  last_updated: string;
  data_policy: string;
  cards: Card[];
}

export interface LivePricing {
  annual_fee: number | null;
  apr_min: number | null;
  apr_max: number | null;
  intro_purchase_apr_months: number | null;
  intro_balance_transfer_apr_months: number | null;
  foreign_transaction_fee: number | null;
  balance_transfer_fee_pct: number | null;
  signup_bonus_value: number | null;
  signup_bonus_description: string | null;
  source_url: string | null;
  confidence: Confidence;
  notes: string | null;
  fetched_at?: number;
}

export interface EffectivePricing {
  annual_fee: number;
  apr_min: number;
  apr_max: number;
  intro_purchase_apr_months: number;
  intro_balance_transfer_apr_months: number;
  foreign_transaction_fee: number;
  balance_transfer_fee_pct: number;
  signup_bonus_value: number;
  signup_bonus_description: string;
  is_live: boolean;
  last_verified: string;
  confidence?: Confidence;
}

// Quiz answer types
export type Q1Answer = "no_credit" | "building" | "good" | "excellent" | "unknown";
export type Q2Answer = "always" | "most_months" | "plan_to_carry" | "unsure";
export type Q3Answer =
  | "build_credit"
  | "cashback"
  | "travel_rewards"
  | "low_apr"
  | "signup_bonus"
  | "simple";
export type Q4Answer = SpendingCategory;
export type Q5Answer = "zero_only" | "under_100" | "over_100" | "dont_care";
export type Q6Answer = Issuer | "none";

export interface QuizAnswers {
  q1: Q1Answer;
  q2: Q2Answer;
  q3: Q3Answer;
  q4: Q4Answer[];
  q5: Q5Answer;
  q6: Q6Answer;
}

export interface ScoredCard {
  card: Card;
  score: number;
  scoreBreakdown: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
    F: number;
  };
  effectivePricing: EffectivePricing;
}

export interface RecommendedCard extends ScoredCard {
  reasoning: string;
}

export interface RecommendationResponse {
  cards: RecommendedCard[];
  branch: "A" | "B";
  limitedResults: boolean;
}
