"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface QuizQuestionOption {
  value: string;
  label: string;
  description?: string;
}

interface QuizQuestionProps {
  question: string;
  subtitle?: string;
  type: "single" | "multi";
  options: QuizQuestionOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  maxSelections?: number;
}

export function QuizQuestion({
  question,
  subtitle,
  type,
  options,
  value,
  onChange,
  maxSelections = Infinity,
}: QuizQuestionProps) {
  if (type === "single") {
    const selected = value as string;
    const hasDescriptions = options.some((o) => o.description);

    return (
      <div className="space-y-4">
        <p className={`font-semibold leading-snug ${hasDescriptions ? "text-xl" : "text-lg"}`}>
          {question}
        </p>
        <RadioGroup value={selected} onValueChange={(v) => onChange(v)} className="space-y-3">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`flex items-start gap-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                hasDescriptions ? "p-5" : "p-4 items-center"
              } ${selected === opt.value ? "border-primary bg-primary/5" : "border-border"}`}
              onClick={() => onChange(opt.value)}
            >
              <RadioGroupItem
                value={opt.value}
                id={opt.value}
                className={hasDescriptions ? "mt-0.5" : ""}
              />
              <div className="flex flex-col gap-0.5">
                <Label
                  htmlFor={opt.value}
                  className={`cursor-pointer ${
                    hasDescriptions ? "font-semibold text-base" : "font-normal text-base"
                  }`}
                >
                  {opt.label}
                </Label>
                {opt.description && (
                  <span className="text-sm text-muted-foreground">{opt.description}</span>
                )}
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  }

  // Multi-select
  const selected = value as string[];

  function toggle(optValue: string) {
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue));
    } else if (selected.length < maxSelections) {
      onChange([...selected, optValue]);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-semibold leading-snug">{question}</p>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-2">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          const disabled = !checked && selected.length >= maxSelections;
          return (
            <div
              key={opt.value}
              className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-accent"
              } ${checked ? "border-primary bg-primary/5" : "border-border"}`}
              onClick={() => !disabled && toggle(opt.value)}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => !disabled && toggle(opt.value)}
                id={`multi-${opt.value}`}
              />
              <Label
                htmlFor={`multi-${opt.value}`}
                className={`font-normal text-base ${
                  disabled ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {opt.label}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Backward-compat wrappers used by quiz/page.tsx before v1.1
export function SingleSelectQuestion({
  question,
  options,
  value,
  onChange,
}: {
  question: string;
  options: QuizQuestionOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <QuizQuestion
      question={question}
      type="single"
      options={options}
      value={value}
      onChange={(v) => onChange(v as string)}
    />
  );
}

export function MultiSelectQuestion({
  question,
  subtitle,
  options,
  value,
  onChange,
  maxSelect = 2,
}: {
  question: string;
  subtitle?: string;
  options: QuizQuestionOption[];
  value: string[];
  onChange: (v: string[]) => void;
  maxSelect?: number;
}) {
  return (
    <QuizQuestion
      question={question}
      subtitle={subtitle}
      type="multi"
      options={options}
      value={value}
      onChange={(v) => onChange(v as string[])}
      maxSelections={maxSelect}
    />
  );
}
