// API response caching utility to reduce jitter/flicker
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class ApiCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private inFlightRequests = new Map<string, Promise<unknown>>();

    // Cache for 1-2s to reduce jitter/flicker
    private readonly DEFAULT_TTL = 1500; // 1.5 seconds

    async get<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number = this.DEFAULT_TTL
    ): Promise<T> {
        const now = Date.now();
        
        // Check if we have a valid cache entry
        const cached = this.cache.get(key);
        if (cached && now < cached.expiresAt) {
            return cached.data as T;
        }

        // Check if there's already a request in flight for this key
        if (this.inFlightRequests.has(key)) {
            return this.inFlightRequests.get(key)! as Promise<T>;
        }

        // Make the request and cache it
        const promise = fetcher().then(data => {
            this.cache.set(key, {
                data,
                timestamp: now,
                expiresAt: now + ttl
            });
            this.inFlightRequests.delete(key);
            return data;
        }).catch(error => {
            this.inFlightRequests.delete(key);
            throw error;
        });

        this.inFlightRequests.set(key, promise);
        return promise;
    }

    // Invalidate cache entry
    invalidate(key: string): void {
        this.cache.delete(key);
        this.inFlightRequests.delete(key);
    }

    // Clear all cache entries
    clear(): void {
        this.cache.clear();
        this.inFlightRequests.clear();
    }

    // Get cache stats for debugging
    getStats() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries());
        const valid = entries.filter(([, entry]) => now < entry.expiresAt).length;
        const expired = entries.length - valid;
        
        return {
            total: entries.length,
            valid,
            expired,
            inFlight: this.inFlightRequests.size
        };
    }
}

// Singleton instance
export const apiCache = new ApiCache();

// Helper function for creating cache keys
export function createCacheKey(prefix: string, ...parts: (string | number | boolean)[]): string {
    return `${prefix}:${parts.join(':')}`;
}