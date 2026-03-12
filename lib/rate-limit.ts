import { NextResponse } from "next/server";

type RateLimitResult = {
  limited: boolean;
  retryAfter: number;
};

const allMaps: Map<string, number[]>[] = [];

export function createRateLimiter(maxRequests: number, windowSeconds: number) {
  const windowMs = windowSeconds * 1000;
  const store = new Map<string, number[]>();
  allMaps.push(store);

  return function check(key: string): RateLimitResult {
    const now = Date.now();
    const timestamps = (store.get(key) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      const oldestInWindow = timestamps[0];
      const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
      store.set(key, timestamps);
      return { limited: true, retryAfter };
    }

    timestamps.push(now);
    store.set(key, timestamps);
    return { limited: false, retryAfter: 0 };
  };
}

// Cleanup stale entries every 60s
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const store of allMaps) {
    for (const [key, timestamps] of store) {
      if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > 900_000) {
        store.delete(key);
      }
    }
  }
}, 60_000);
cleanupInterval.unref?.();

// Pre-configured limiters
export const chatLimiter = createRateLimiter(20, 60);
export const analyzeLimiter = createRateLimiter(5, 60);
export const realtimeLimiter = createRateLimiter(3, 60);
export const signupLimiter = createRateLimiter(5, 900);

export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
