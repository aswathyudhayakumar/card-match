import type { Q1Answer, Q2Answer, Q3Answer, Q4Answer, Q5Answer, Q6Answer } from "./types";

export const BRANCH_A_WEIGHTS = {
  A: 1.0,
  B: 1.0,
  C: 1.0,
  D: 0.5,
  E: 0.5,
  F: 0.0,
};

export const BRANCH_B_WEIGHTS = {
  A: 0.5,
  B: 0.3,
  C: 1.0,
  D: 0.5,
  E: 0.5,
  F: 1.5,
};

export const LIVE_PRICING_TTL_SECONDS = 86400; // 24 hours
export const LIVE_PRICING_CACHE_PREFIX = "card:";
export const CARD_FETCH_DELAY_MS = 1000;

export const Q1_LABELS: Record<Q1Answer, string> = {
  no_credit: "No credit history yet",
  building: "Building credit (limited history)",
  good: "Good credit (620–740)",
  excellent: "Excellent credit (740+)",
  unknown: "Not sure",
};

export const Q2_LABELS: Record<Q2Answer, string> = {
  always: "Yes, always",
  most_months: "Most months, but I sometimes carry a balance",
  plan_to_carry: "I plan to carry a balance",
  unsure: "Not sure yet",
};

export const Q3_LABELS: Record<Q3Answer, string> = {
  build_credit: "Build or rebuild my credit",
  cashback: "Earn cashback on everyday spending",
  travel_rewards: "Earn travel rewards or perks",
  low_apr: "Low APR / transfer an existing balance",
  signup_bonus: "Big sign-up bonus for an upcoming purchase",
  simple: "Simple, safe card with no surprises",
};

export const Q4_OPTIONS: Array<{ value: Q4Answer; label: string }> = [
  { value: "groceries", label: "Groceries" },
  { value: "dining", label: "Dining" },
  { value: "gas", label: "Gas" },
  { value: "travel", label: "Travel" },
  { value: "online_shopping", label: "Online shopping" },
  { value: "streaming", label: "Streaming" },
  { value: "everything", label: "It's spread out" },
];

export const Q4_LABELS: Record<Q4Answer, string> = {
  groceries: "Groceries",
  dining: "Dining",
  gas: "Gas",
  travel: "Travel",
  online_shopping: "Online shopping",
  streaming: "Streaming",
  everything: "It's spread out",
};

export const Q5_LABELS: Record<Q5Answer, string> = {
  zero_only: "No way — must be $0",
  under_100: "Okay if under $100 and worth it",
  over_100: "Happy to pay $100+ for strong rewards",
  dont_care: "Don't care, I want the best card",
};

export const Q6_OPTIONS: Array<{ value: Q6Answer; label: string }> = [
  { value: "Chase", label: "Chase" },
  { value: "Bank of America", label: "Bank of America" },
  { value: "Wells Fargo", label: "Wells Fargo" },
  { value: "Capital One", label: "Capital One" },
  { value: "Citi", label: "Citi" },
  { value: "Amex", label: "American Express" },
  { value: "credit-union", label: "A credit union" },
  { value: "none", label: "None of the above" },
];

export const Q6_LABELS: Record<Q6Answer, string> = {
  Chase: "Chase",
  "Bank of America": "Bank of America",
  "Wells Fargo": "Wells Fargo",
  "Capital One": "Capital One",
  Citi: "Citi",
  Amex: "American Express",
  Discover: "Discover",
  "credit-union": "A credit union",
  "US Bank": "US Bank",
  other: "Other",
  none: "None of the above",
};
