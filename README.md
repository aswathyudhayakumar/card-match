# CardMatch

An AI-powered credit card recommendation tool that asks you 7 questions and gives you 3 ranked picks with reasoning for why each one fits.

**Live demo:** [Link](https://card-match-ochre.vercel.app/)

---

## Why I built this

CardMatch started as a spinoff from a different project I'd been thinking about, a financial jargon buster. That idea came from my time at Axis Bank, where I worked on a digital lending product for farmers. I travelled to Madhya Pradesh for the launch and realised a lot of the users we served didn't understand basic loan terms like APR or interest from the terms and conditions they were signing. I also knew, honestly, that when I got my first credit card, I didn't understand most of that language either. All I knew was what my father had told me: keep your balance low, pay on time, protect your credit score.

That made me want to build something that could flag risky language and explain key terms so people knew what they were actually signing up for. I scoped it to US credit cards because credit cards are a huge part of how people here build credit and spend.

But as I built it out using RAG on actual cardholder agreements, the project started to feel overengineered and, more importantly, not that useful. The thing I kept coming back to was: *who actually has the terms and conditions open when they're trying to decide which card to get?* Nobody. People usually see the T&Cs after they've already picked a card. The decision point happens earlier, when someone is comparing options, wondering which card fits their life.

So I pivoted. Instead of explaining a card you've already chosen, CardMatch helps you choose. You answer a few questions about where you are in your credit journey, what you care about, and how you spend. The app returns three cards ranked for you, with an explanation for each.

---

## What the product does

The quiz is 7 questions:

1. **What brings you here today?** (first card, adding one, consolidating, upgrading)
2. **What's your credit situation?**
3. **Will you pay off your balance in full every month?**
4. **Why do you want this card?** (multi-select, up to 3)
5. **Where do you spend the most?** (up to 2 categories)
6. **How do you feel about annual fees?**
7. **Do you already bank with a major US bank or credit union?**

From those answers, CardMatch filters and scores 15 US credit cards, fetches current pricing live from issuer websites for the top candidates, and returns three ranked recommendations with a plain-English reason for each.

---

## The people I was imagining when I built this

I kept four kinds of users in my head while designing the scoring logic and writing the reasoning prompts. These aren't personas from research, they're the people I imagined picking up the app and expecting it to "get them."

**The first-timer.** Someone in their early twenties, no credit history, scared of messing up their credit. They don't care about travel perks or sign-up bonuses. They want a card that won't punish them for being new to this.

**The optimizer.** Someone who already has one card and wants to add a second to earn more cashback on their actual spending. They're not new, they just want better category coverage.

**The consolidator.** Someone with three or four cards who's tired of remembering which one to use where. They want one card that covers most of their life, even if it has a fee.

**The balance-carrier.** Someone carrying debt on their cards who's trying to find a low-APR option or a balance transfer card. Rewards don't matter here. Interest does.

The scoring logic is designed so that each of these people gets different recommendations even if some of their answers overlap. A first-timer asking for cashback should get a starter cashback card, not a premium one. A consolidator asking for cashback should get a broad-category card, not a rotating-category one. The segmentation question at the start does most of this work.

---

## How it works

### Scoring

There are two scoring "branches" based on whether the user pays in full or carries a balance.

If you pay in full, the scoring rewards cards that match your goals, spending categories, and fee tolerance. If you carry a balance, the scoring prioritizes low APR and long 0% intro offers, and deprioritizes rewards, because CFPB research shows rewards almost never offset interest on a carried balance. When Branch B triggers, the results page also shows a banner explaining why the recommendations look different.

On top of the base scoring, there's a segment multiplier based on the first question. First-timers get starter cards boosted and premium cards suppressed. Consolidators get broad-category cards boosted and rotating-category cards penalized. Upgraders have starter cards filtered out entirely.

I decided to keep all of this as clean deterministic scoring in code, not an LLM decision. The LLM only generates the "why this fits you" reasoning at the end, once the ranking is already locked in. That means two users with the same answers get the same recommendations, which matters for a product that affects financial decisions.

### Data architecture

This was the piece I thought about hardest, because credit card pricing changes all the time. APRs shift with Fed rate decisions. Sign-up bonuses come and go. I didn't want to maintain a static JSON file that would go stale within a month.

What I landed on is a hybrid: the stable stuff (which credit tier a card requires, what categories it rewards, who issues it) lives in `cards.json`. The volatile stuff (current APR, current sign-up bonus, current intro offer) gets fetched at runtime via Gemini with a web search tool. The fetched data is cached for 24 hours so a burst of users doesn't trigger a burst of API calls.

The same extraction function powers two things: a runtime live-fetch for the top three recommendations per user, and a batch verification script that can update the fallback values in `cards.json` periodically. I liked this because it meant the data could stay fresh without me running a backend or manually updating JSON every week.

If the live fetch fails (rate limits, issuer site changes, whatever), the app falls back to the most recently verified data in `cards.json` and shows the user a "last verified" date. I'd rather tell someone the data is from April than pretend stale data is live.

---

## What I decided not to build

Every time I almost added a feature, I asked myself whether it made the core decision better. Most of them didn't, so they got cut or pushed to v2.

**Letting users upload their own T&Cs.** This was the original project. I eventually realised most people don't have the T&Cs in hand when they're still choosing a card, which is the moment I want to serve. If someone already has an offer they're evaluating, that's a different product.

**Expanding beyond 15 cards.** There's a whole world of local credit unions and employer-specific cards (like BECU for Boeing employees in Washington) that I know users would benefit from. But adding them requires a state and employer database, and the scoring logic stays the same. It's a data problem, not an algorithm problem, so I scoped it out.

**Dynamic question branching.** Some testers suggested the later questions should adapt to earlier answers. I agree, but I wanted to ship a simple static quiz first, see what broke, and then decide if branching was worth the added complexity. Currently in the v1.2 backlog.

**User accounts, saved quizzes, analytics.** None of it adds value for a decision tool you use once every few years.

---

## What I learned from user testing

I gave the v1 app to a few friends and had them walk through it while I watched. Three things came up consistently.

First, the questions felt too beginner-focused. One friend with three cards said "your questions are treating me like I'm starting from zero." Fair. I added the segmentation question at the front so the product can tell a first-timer from a consolidator.

Second, single-select on "why do you want this card?" was too restrictive. People wanted to say "cashback AND travel rewards AND sign-up bonus," not pick one. I made it multi-select with a max of three.

Third, the card coverage felt small. I noted this as a real limitation but didn't expand the universe in v1.1 because it's a data problem, not a scoring problem. When I add more cards, the existing logic handles them.

The bigger takeaway: I shipped v1 faster than I was comfortable with. But having a working app in front of real people got me better feedback in 30 minutes than I would have gotten in a week of polishing. I'd do that again.

---

## What's next

Things I'd add in v2, roughly in priority order:

- Multi-select on the bank question (some people bank with more than one major bank)
- Dynamic branching: skip questions that become irrelevant based on earlier answers
- Expanded card universe including credit unions and employer-specific products
- Location and employer inputs to surface local CU cards
- "Already have a card offer? Upload the T&Cs and I'll tell you how it compares": bringing the original jargon-buster idea back in a more scoped way

---

## Running it locally

```bash
git clone https://github.com/aswathyudhayakumar/card-match.git
cd card-match
npm install
cp .env.local.example .env.local
# Add your Gemini API key to .env.local
# KV credentials are optional — the app falls back gracefully without caching
npm run verify-cards   # optional: refresh card data from issuer sites (~2 min)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Get a Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey).

### Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| LLM | Google Gemini 1.5 Flash |
| Cache | Vercel KV (Upstash Redis) |
| Deploy | Vercel |

---

## Project structure
```
app/
page.tsx              Landing page
quiz/page.tsx         7-question quiz
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
---

## A note on accuracy

Credit card terms change often. I've tried to build this so the data stays reasonably fresh — live fetch at runtime, 24-hour caching, graceful fallback to verified static data. But for a real financial decision, always verify the current terms on the issuer's own website before applying. CardMatch is a decision-support tool, not a replacement for reading the actual offer.

Questionnaire design informed by the CFPB's ["How to find the best credit card for you"](https://files.consumerfinance.gov/f/documents/cfpb_adult-fin-ed_how-to-find-the-best-credit-card.pdf) guidance.
