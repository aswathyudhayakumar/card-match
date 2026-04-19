"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar";
import { SingleSelectQuestion, MultiSelectQuestion } from "@/components/QuizQuestion";
import type { QuizAnswers, Q1Answer, Q2Answer, Q3Answer, Q4Answer, Q5Answer, Q6Answer } from "@/lib/types";
import { Q1_LABELS, Q2_LABELS, Q3_LABELS, Q5_LABELS, Q6_OPTIONS } from "@/lib/constants";

const TOTAL_QUESTIONS = 6;

const q1Options = Object.entries(Q1_LABELS).map(([value, label]) => ({ value, label }));
const q2Options = Object.entries(Q2_LABELS).map(([value, label]) => ({ value, label }));
const q3Options = Object.entries(Q3_LABELS).map(([value, label]) => ({ value, label }));
const q5Options = Object.entries(Q5_LABELS).map(([value, label]) => ({ value, label }));

function makeEmptyAnswers(): Partial<QuizAnswers> {
  return { q4: [] };
}

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>(makeEmptyAnswers());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function canAdvance(): boolean {
    switch (step) {
      case 1: return !!answers.q1;
      case 2: return !!answers.q2;
      case 3: return !!answers.q3;
      case 4: return (answers.q4?.length ?? 0) >= 1;
      case 5: return !!answers.q5;
      case 6: return !!answers.q6;
      default: return false;
    }
  }

  async function handleNext() {
    if (step < TOTAL_QUESTIONS) {
      setStep((s) => s + 1);
      return;
    }

    // Submit
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
            <SingleSelectQuestion
              question="What's your credit situation?"
              options={q1Options}
              value={answers.q1 ?? ""}
              onChange={(v) => setAnswers((a) => ({ ...a, q1: v as Q1Answer }))}
            />
          )}

          {step === 2 && (
            <SingleSelectQuestion
              question="Will you pay off your balance in full every month?"
              options={q2Options}
              value={answers.q2 ?? ""}
              onChange={(v) => setAnswers((a) => ({ ...a, q2: v as Q2Answer }))}
            />
          )}

          {step === 3 && (
            <SingleSelectQuestion
              question="Why do you want this credit card?"
              options={q3Options}
              value={answers.q3 ?? ""}
              onChange={(v) => setAnswers((a) => ({ ...a, q3: v as Q3Answer }))}
            />
          )}

          {step === 4 && (
            <MultiSelectQuestion
              question="Where do you spend the most?"
              subtitle="Pick up to 2 categories"
              value={answers.q4 ?? []}
              onChange={(v) => setAnswers((a) => ({ ...a, q4: v }))}
              maxSelect={2}
            />
          )}

          {step === 5 && (
            <SingleSelectQuestion
              question="How do you feel about annual fees?"
              options={q5Options}
              value={answers.q5 ?? ""}
              onChange={(v) => setAnswers((a) => ({ ...a, q5: v as Q5Answer }))}
            />
          )}

          {step === 6 && (
            <SingleSelectQuestion
              question="Do you already bank with a major US bank or credit union?"
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
