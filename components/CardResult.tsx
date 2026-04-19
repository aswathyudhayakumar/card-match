"use client";

import { ExternalLink, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RecommendedCard } from "@/lib/types";

interface CardResultProps {
  card: RecommendedCard;
  rank: number;
}

function formatFee(fee: number): string {
  return fee === 0 ? "No annual fee" : `$${fee}/year`;
}

function formatAPR(min: number, max: number): string {
  if (min === 0 && max === 0) return "N/A (charge card)";
  if (min === max) return `${min}% APR`;
  return `${min}%–${max}% APR`;
}

function formatBonus(value: number, desc: string): string | null {
  if (!value && !desc) return null;
  if (!value) return desc;
  return desc || `$${value} value`;
}

export function CardResult({ card, rank }: CardResultProps) {
  const { card: c, effectivePricing: p, reasoning } = card;

  const bonus = formatBonus(p.signup_bonus_value, p.signup_bonus_description);
  const topRewards = c.rewards_categories.slice(0, 3);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {rank}
              </span>
              <CardTitle className="text-xl">{c.name}</CardTitle>
            </div>
            <CardDescription className="text-sm">{c.issuer}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBlock label="Annual Fee" value={formatFee(p.annual_fee)} />
          <StatBlock label="APR" value={formatAPR(p.apr_min, p.apr_max)} />
          {p.intro_purchase_apr_months > 0 && (
            <StatBlock label="Intro APR" value={`0% for ${p.intro_purchase_apr_months} mo`} />
          )}
          {p.intro_balance_transfer_apr_months > 0 && (
            <StatBlock
              label="0% BT"
              value={`${p.intro_balance_transfer_apr_months} months`}
            />
          )}
        </div>

        {/* Rewards */}
        {topRewards.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Rewards
            </p>
            <div className="flex flex-wrap gap-2">
              {topRewards.map((rc) => (
                <span
                  key={rc.category}
                  className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                >
                  {rc.rate}% {rc.category}
                </span>
              ))}
              {c.rewards_flat_rate > 0 && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {c.rewards_flat_rate}% everything else
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sign-up bonus */}
        {bonus && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            <span className="font-semibold">Sign-up bonus:</span> {bonus}
          </div>
        )}

        {/* Reasoning */}
        <blockquote className="border-l-4 border-primary/30 pl-4 italic text-sm text-muted-foreground leading-relaxed">
          {reasoning}
        </blockquote>

        {/* Data freshness */}
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {p.is_live
            ? `Live data verified ${p.last_verified}`
            : `Using fallback data from ${p.last_verified} — verify current terms with issuer`}
        </p>

        {/* CTA */}
        <Button asChild className="w-full">
          <a href={c.official_url} target="_blank" rel="noopener noreferrer">
            Apply on {c.issuer}&rsquo;s site
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
