export type RuntimeContext = {
  waitUntil?: (promise: Promise<unknown>) => void;
};

export async function withEdgeCache(
  request: Request,
  context: RuntimeContext | undefined,
  producer: () => Promise<Response>,
): Promise<Response> {
  if (request.method !== "GET" || typeof globalThis.caches === "undefined") {
    return producer();
  }

  const cache = (globalThis.caches as CacheStorage & { default: Cache }).default;
  const cacheKey = new Request(request.url, { method: "GET" });
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
