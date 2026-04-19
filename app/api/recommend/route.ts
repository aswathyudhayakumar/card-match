import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import type { CardsFile, QuizAnswers, RecommendationResponse, LivePricing } from "@/lib/types";
import { determineBranch, applyHardFilters, scoreCards, getEffectivePricing } from "@/lib/scoring";
import { fetchLivePricing } from "@/lib/fetchLivePricing";
import { generateReasoning } from "@/lib/reasoning";

function loadCards(): CardsFile {
  const path = join(process.cwd(), "data", "cards.json");
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as CardsFile;
}

export async function POST(req: NextRequest) {
  try {
    const answers = (await req.json()) as QuizAnswers;

    const cardsFile = loadCards();
    const allCards = cardsFile.cards;

    const branch = determineBranch(answers);

    const filtered = applyHardFilters(allCards, answers, branch);

    const emptyLiveMap = new Map<string, LivePricing | null>();
    const initialScored = scoreCards(filtered, answers, emptyLiveMap, branch)
      .slice(0, 5);

    const liveResults = await Promise.all(
      initialScored.map((sc) =>
        fetchLivePricing(sc.card.id, sc.card.name, sc.card.official_url).catch(() => null)
      )
    );

    const liveMap = new Map<string, LivePricing | null>();
    initialScored.forEach((sc, i) => {
      liveMap.set(sc.card.id, liveResults[i]);
    });

    const rescored = scoreCards(
      initialScored.map((sc) => sc.card),
      answers,
      liveMap,
      branch
    ).slice(0, 3);

    const withReasoning = await Promise.all(
      rescored.map(async (sc) => {
        const reasoning = await generateReasoning(sc, answers);
        return { ...sc, reasoning };
      })
    );

    const response: RecommendationResponse = {
      cards: withReasoning,
      branch,
      limitedResults: withReasoning.length < 3,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/recommend] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations", details: String(error) },
      { status: 500 }
    );
  }
}
