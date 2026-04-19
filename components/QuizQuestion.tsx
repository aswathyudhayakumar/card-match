"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Q4_OPTIONS } from "@/lib/constants";
import type { Q4Answer } from "@/lib/types";

interface SingleSelectProps {
  question: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}

export function SingleSelectQuestion({ question, options, value, onChange }: SingleSelectProps) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold leading-snug">{question}</p>
      <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
        {options.map((opt) => (
          <div
            key={opt.value}
            className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent ${
              value === opt.value ? "border-primary bg-primary/5" : "border-border"
            }`}
            onClick={() => onChange(opt.value)}
          >
            <RadioGroupItem value={opt.value} id={opt.value} />
            <Label htmlFor={opt.value} className="cursor-pointer font-normal text-base">
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

interface MultiSelectProps {
  question: string;
  subtitle?: string;
  value: Q4Answer[];
  onChange: (v: Q4Answer[]) => void;
  maxSelect?: number;
}

export function MultiSelectQuestion({ question, subtitle, value, onChange, maxSelect = 2 }: MultiSelectProps) {
  function toggle(opt: Q4Answer) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else if (value.length < maxSelect) {
      onChange([...value, opt]);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-semibold leading-snug">{question}</p>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-2">
        {Q4_OPTIONS.map((opt) => {
          const checked = value.includes(opt.value);
          const disabled = !checked && value.length >= maxSelect;
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
                id={`q4-${opt.value}`}
              />
              <Label
                htmlFor={`q4-${opt.value}`}
                className={`font-normal text-base ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
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
