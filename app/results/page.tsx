"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardResult } from "@/components/CardResult";
import { DisclosureBanner } from "@/components/DisclosureBanner";
import type { RecommendationResponse } from "@/lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("cardmatch_results");
      if (!raw) {
        setError("No results found. Please complete the quiz first.");
        return;
      }
      setResults(JSON.parse(raw) as RecommendationResponse);
    } catch {
      setError("Failed to load results. Please try again.");
    }
  }, []);

  function handleStartOver() {
    sessionStorage.removeItem("cardmatch_results");
    router.push("/quiz");
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-4 gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push("/quiz")}>Take the quiz</Button>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-2xl mx-auto w-full px-4 py-10 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Your top matches</h1>
          <p className="text-muted-foreground text-sm">
            Based on your answers, here are the cards that fit you best.
          </p>
        </div>

        {/* Branch B disclosure */}
        {results.branch === "B" && (
          <DisclosureBanner
            message="Based on your answers, we've prioritized low-APR cards. Rewards rarely outweigh interest costs when you carry a balance."
            variant="warning"
          />
        )}

        {/* Limited results notice */}
        {results.limitedResults && (
          <DisclosureBanner
            message="Fewer than 3 cards matched your filters. Consider relaxing your annual fee preference or credit requirements."
            variant="info"
          />
        )}

        {/* Cards */}
        <div className="space-y-6">
          {results.cards.map((card, i) => (
            <CardResult key={card.card.id} card={card} rank={i + 1} />
          ))}
        </div>

        {/* Footer */}
        <div className="space-y-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            This tool is informational only and does not constitute financial advice. Verify all
            terms directly with the card issuer before applying. Approval is not guaranteed.
          </p>
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleStartOver}>
              <RefreshCw className="mr-2 h-4 w-4" /> Start over
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
