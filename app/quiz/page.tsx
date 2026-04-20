"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar";
import { QuizQuestion } from "@/components/QuizQuestion";
import type {
  QuizAnswers,
  UserSegment,
  Q1Answer,
  Q2Answer,
  Q3Answer,
  Q4Answer,
  Q5Answer,
  Q6Answer,
} from "@/lib/types";
import {
  Q1_LABELS,
  Q2_LABELS,
  Q3_LABELS,
  Q4_OPTIONS,
  Q5_LABELS,
  Q6_OPTIONS,
} from "@/lib/constants";

const TOTAL_QUESTIONS = 7;

const q0Options = [
  {
    value: "first_card",
    label: "This would be my first credit card",
    description: "Building credit from scratch",
  },
  {
    value: "adding_card",
    label: "I have card(s) and want to add another",
    description: "Expanding your wallet",
  },
  {
    value: "consolidating",
    label: "I have multiple cards and want to simplify",
    description: "Finding one card to replace several",
  },
  {
    value: "upgrading",
    label: "I want to upgrade to a better card",
    description: "Graduating from your current card",
  },
];

const q1Options = Object.entries(Q1_LABELS).map(([value, label]) => ({ value, label }));
const q2Options = Object.entries(Q2_LABELS).map(([value, label]) => ({ value, label }));
const q3Options = Object.entries(Q3_LABELS).map(([value, label]) => ({ value, label }));
const q5Options = Object.entries(Q5_LABELS).map(([value, label]) => ({ value, label }));

function makeEmptyAnswers(): Partial<QuizAnswers> {
  return { q3: [], q4: [] };
}

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>(makeEmptyAnswers());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function canAdvance(): boolean {
    switch (step) {
      case 1: return !!answers.segment;
      case 2: return !!answers.q1;
      case 3: return !!answers.q2;
      case 4: return (answers.q3?.length ?? 0) >= 1;
      case 5: return (answers.q4?.length ?? 0) >= 1;
      case 6: return !!answers.q5;
      case 7: return !!answers.q6;
      default: return false;
    }
  }

  async function handleNext() {
    if (step < TOTAL_QUESTIONS) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      sessionStorage.setItem("cardmatch_results", JSON.stringify(data));
      router.push("/results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-4 py-8 gap-8">
        <ProgressBar current={step} total={TOTAL_QUESTIONS} />

        <div className="flex-1">
          {step === 1 && (
            <QuizQuestion
              question="What brings you here today?"
              type="single"
              options={q0Options}
              value={answers.segment ?? ""}
              onChange={(v) => setAnswers((a) => ({ ...a, segment: v as UserSegment }))}
            />
          )}

          {step === 2 && (
            <QuizQuestion
              question="What's your credit situation?"
              type="single"
              options={q1Options}
              value={answers.q1 ?? ""}
              onChange={(v) => setAnswers((a) => ({ ...a, q1: v as Q1Answer }))}
            />
          )}

          {step === 3 && (
            <QuizQuestion
              question="Will you pay off your balance in full every month?"
              type="single"
              options={q2Options}
              value={answers.q2 ?? ""}
              onChange={(v) => setAnswers((a) => ({ ...a, q2: v as Q2Answer }))}
            />
          )}

          {step === 4 && (
            <QuizQuestion
              question="Why do you want this credit card?"
              subtitle="Select all that apply (up to 3)"
              type="multi"
              options={q3Options}
              value={answers.q3 ?? []}
              onChange={(v) => setAnswers((a) => ({ ...a, q3: v as Q3Answer[] }))}
              maxSelections={3}
            />
          )}

          {step === 5 && (
            <QuizQuestion
              question="Where do you spend the most?"
              subtitle="Pick up to 2 categories"
              type="multi"
              options={Q4_OPTIONS}
              value={answers.q4 ?? []}
              onChange={(v) => setAnswers((a) => ({ ...a, q4: v as Q4Answer[] }))}
              maxSelections={2}
            />
          )}

          {step === 6 && (
            <QuizQuestion
              question="How do you feel about annual fees?"
              type="single"
              options={q5Options}
              value={answers.q5 ?? ""}
              onChange={(v) => setAnswers((a) => ({ ...a, q5: v as Q5Answer }))}
            />
          )}

          {step === 7 && (
            <QuizQuestion
              question="Do you already bank with a major US bank or credit union?"
              type="single"
              options={Q6_OPTIONS}
              value={answers.q6 ?? ""}
              onChange={(v) => setAnswers((a) => ({ ...a, q6: v as Q6Answer }))}
            />
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-between gap-4">
          <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Button onClick={handleNext} disabled={!canAdvance() || loading} className="flex-1 max-w-xs">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding your matches…
              </>
            ) : step < TOTAL_QUESTIONS ? (
              <>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Find my cards <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
