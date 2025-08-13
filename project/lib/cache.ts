interface CacheEntry {
  value: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export function setCache(key: string, value: any): void {
  cache.set(key, {
    value,
    timestamp: Date.now()
  });
}

export function getCache(key: string, ttlMs: number): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }
  
  return entry.value;
}

export function clearCache(): void {
  cache.clear();
}
