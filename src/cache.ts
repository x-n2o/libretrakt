export type RuntimeContext = {
  waitUntil?: (promise: Promise<unknown>) => void;
};

const CACHE_VERSION = "2026-04-26.2";

export async function withEdgeCache(
  request: Request,
  context: RuntimeContext | undefined,
  producer: () => Promise<Response>,
): Promise<Response> {
  if (request.method !== "GET" || typeof globalThis.caches === "undefined") {
    return producer();
  }

  const cache = (globalThis.caches as CacheStorage & { default: Cache }).default;
  const cacheKey = cacheRequest(request);
  const cached = await cache.match(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await producer();

  if (response.status === 200) {
    const put = cache.put(cacheKey, response.clone());

    if (context?.waitUntil) {
      context.waitUntil(put);
    } else {
      await put;
    }
  }

  return response;
}

function cacheRequest(request: Request): Request {
  const url = new URL(request.url);
  url.searchParams.set("__libretrakt_cache", CACHE_VERSION);

  return new Request(url, { method: "GET" });
}
