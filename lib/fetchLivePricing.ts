import type { LivePricing } from "./types";
import { extractCardPricing } from "./extractCardPricing";
import { LIVE_PRICING_TTL_SECONDS, LIVE_PRICING_CACHE_PREFIX } from "./constants";

async function getKVClient() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token || url === "your_vercel_kv_url") return null;

  try {
    const { Redis } = await import("@upstash/redis");
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

export async function fetchLivePricing(
  cardId: string,
  cardName: string,
  officialUrl: string
): Promise<LivePricing | null> {
  const cacheKey = `${LIVE_PRICING_CACHE_PREFIX}${cardId}`;

  try {
    const kv = await getKVClient();

    if (kv) {
      try {
        const cached = await kv.get<LivePricing>(cacheKey);
        if (cached) {
          console.log(`[fetchLivePricing] Cache hit for ${cardId}`);
          return cached;
        }
      } catch (cacheErr) {
        console.warn(`[fetchLivePricing] Cache read error for ${cardId}:`, cacheErr);
      }
    }

    console.log(`[fetchLivePricing] Fetching live pricing for ${cardId}`);
    const pricing = await extractCardPricing(cardId, cardName, officialUrl);

    if (kv && (pricing.confidence === "high" || pricing.confidence === "medium")) {
      try {
        await kv.set(cacheKey, pricing, { ex: LIVE_PRICING_TTL_SECONDS });
        console.log(`[fetchLivePricing] Cached ${cardId} (confidence: ${pricing.confidence})`);
      } catch (cacheErr) {
        console.warn(`[fetchLivePricing] Cache write error for ${cardId}:`, cacheErr);
      }
    }

    return pricing;
  } catch (error) {
    console.error(`[fetchLivePricing] Error for ${cardId}:`, error);
    return null;
  }
}
