import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Load env vars from .env.local manually since this runs outside Next.js
import { config } from "dotenv";
config({ path: join(process.cwd(), ".env.local") });

import type { CardsFile, Card, LivePricing } from "../lib/types";
import { extractCardPricing } from "../lib/extractCardPricing";
import { CARD_FETCH_DELAY_MS } from "../lib/constants";

const STALE_DAYS = 30;
const CARDS_PATH = join(process.cwd(), "data", "cards.json");

function isStale(lastVerified: string): boolean {
  if (lastVerified === "NEEDS_VERIFICATION") return true;

  const date = new Date(lastVerified);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > STALE_DAYS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyLivePricing(card: Card, live: LivePricing): Card {
  const f = card.fallback;
  return {
    ...card,
    fallback: {
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
      last_verified: new Date().toISOString().split("T")[0],
    },
  };
}

async function main() {
  console.log("CardMatch — Card Pricing Verifier\n");

  const raw = readFileSync(CARDS_PATH, "utf-8");
  const cardsFile: CardsFile = JSON.parse(raw);
  const cards = cardsFile.cards;

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const updatedCards: Card[] = [];

  for (const card of cards) {
    if (!isStale(card.fallback.last_verified)) {
      console.log(`  SKIP  ${card.id} (verified ${card.fallback.last_verified})`);
      skipped++;
      updatedCards.push(card);
      continue;
    }

    console.log(`  FETCH ${card.id}...`);

    try {
      const live = await extractCardPricing(card.id, card.name, card.official_url);

      if (live.confidence === "low") {
        console.warn(`  WARN  ${card.id} — low confidence, keeping old fallback`);
        console.warn(`        Notes: ${live.notes}`);
        skipped++;
        updatedCards.push(card);
      } else {
        const updated_card = applyLivePricing(card, live);
        updatedCards.push(updated_card);
        updated++;
        console.log(`  OK    ${card.id} (confidence: ${live.confidence})`);
        if (live.notes) console.log(`        Notes: ${live.notes}`);
      }
    } catch (err) {
      console.error(`  FAIL  ${card.id}:`, err);
      failed++;
      updatedCards.push(card);
    }

    if (cards.indexOf(card) < cards.length - 1) {
      await sleep(CARD_FETCH_DELAY_MS);
    }
  }

  const output: CardsFile = {
    ...cardsFile,
    last_updated: new Date().toISOString().split("T")[0],
    cards: updatedCards,
  };

  writeFileSync(CARDS_PATH, JSON.stringify(output, null, 2));

  console.log("\n--- Summary ---");
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`\nWrote updated cards.json`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
