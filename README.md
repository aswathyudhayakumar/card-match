# CardMatch

> Find your next credit card in 60 seconds — personalized recommendations powered by Gemini AI.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/card-match)

---

## What it does

Users answer 6 questions about their credit situation, spending habits, and fee preferences. CardMatch returns 3 ranked credit card recommendations with LLM-generated reasoning explaining exactly why each card fits the user's profile.

**No account required. No data stored. Results in ~10 seconds.**

---

## Architecture

```
User → Quiz (6 questions) → POST /api/recommend
                               │
                  ┌────────────┴──────────────┐
                  ▼                           ▼
         Hard filter (credit,         Determine branch
         fee, APR constraints)        A = rewards-optimized
                  │                   B = APR-optimized
                  ▼
         Score all passing cards
         (using static fallback data)
                  │
                  ▼
         Top 5 candidates
                  │
                  ▼
         Fetch live pricing in parallel
         (Gemini 1.5 Flash + googleSearchRetrieval)
         → cached in Vercel KV for 24h
                  │
                  ▼
         Re-score with live data → Top 3
                  │
                  ▼
         Generate "why this fits you" reasoning
         (Gemini 1.5 Flash, no web search)
                  │
                  ▼
         Return to UI → Results page
```

### Self-maintaining data pattern

Card metadata (rewards structure, tags, issuers) is stored statically in `data/cards.json` — this rarely changes and is safe to version. Pricing data (APR, fees, bonuses) is fetched live at recommendation time via Gemini's web search tool and cached in Redis (Vercel KV) for 24 hours. A `verify-cards` script batch-updates the static fallback values periodically so stale data never exceeds 30 days old.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| LLM | Google Gemini 1.5 Flash |
| Cache | Vercel KV (Upstash Redis) |
| Deploy | Vercel |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/card-match.git
cd card-match
npm install
```

### 2. Set environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
GEMINI_API_KEY=your_gemini_api_key_here
KV_REST_API_URL=your_vercel_kv_url        # optional, falls back gracefully
KV_REST_API_TOKEN=your_vercel_kv_token    # optional
```

Get a Gemini API key at [Google AI Studio](https://aistudio.google.com/).

### 3. Verify card data (optional but recommended)

```bash
npm run verify-cards
```

This fetches live pricing for all 15 cards from issuer websites and updates `data/cards.json`. Takes ~2 minutes due to rate limiting.

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

Deploy to Vercel with one click using the button above, or:

```bash
npm i -g vercel
vercel
```

Add `GEMINI_API_KEY` (and optionally `KV_REST_API_URL` / `KV_REST_API_TOKEN`) in your Vercel project's environment variables.

For Vercel KV: create a KV database in your Vercel dashboard and link it to the project — the environment variables will be set automatically.

---

## Key design decisions

**Why Gemini 1.5 Flash over GPT-4o?** The `googleSearchRetrieval` grounding tool gives Gemini native access to real-time web data without a separate search API integration. Pricing extraction and live web search in one API call.

**Why static metadata + live pricing?** Card rewards structures (category rates, tags) are stable for months. APR and bonus offers change quarterly. Separating them avoids stale scoring logic while keeping live data fetches targeted and cheap.

**Why no auth / database?** This is a portfolio project focused on the AI + data pipeline. Results are ephemeral by design — stored in `sessionStorage` and discarded when the tab closes.

**Why two scoring branches?** Recommending a 25% APR rewards card to someone carrying a balance is actively harmful. Branch B hard-filters and heavily weights APR instead of rewards, which is the recommendation a good financial advisor would make.

**Tradeoff — LLM pricing accuracy:** Gemini may occasionally return stale or incorrect pricing from web search. The UI always shows data freshness, and every card links to the issuer's official terms. The `verify-cards` script keeps static fallbacks current so the worst case is 30-day-old data, not hallucination.

---

## Data accuracy disclaimer

Pricing data (APR, annual fees, sign-up bonuses) is fetched from issuer websites via AI-assisted web search and may not reflect the most current terms. All data is for informational purposes only. **Verify all terms directly with the card issuer before applying.** CardMatch does not guarantee approval and is not a financial advisor.

Questionnaire design informed by the CFPB's ["How to find the best credit card for you"](https://www.consumerfinance.gov/consumer-tools/credit-cards/) guidance.

---

## Project structure

```
app/
  page.tsx              Landing page
  quiz/page.tsx         6-question quiz
  results/page.tsx      Recommendations display
  api/recommend/        Main orchestration endpoint
components/
  QuizQuestion.tsx      Single + multi-select question components
  CardResult.tsx        Card recommendation display
  ProgressBar.tsx       Quiz progress indicator
  DisclosureBanner.tsx  Warning/info banners
lib/
  types.ts              Shared TypeScript interfaces
  constants.ts          Scoring weights, labels, thresholds
  extractCardPricing.ts Gemini web search extraction
  fetchLivePricing.ts   Caching wrapper
  scoring.ts            Hard filters + scoring engine
  reasoning.ts          LLM "why this fits you" generator
data/
  cards.json            15 cards with static metadata + fallback pricing
scripts/
  verify-cards.ts       Batch pricing verifier
```
