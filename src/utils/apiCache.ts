
// Cache implementation for API responses

// Cache time in milliseconds (5 minutes)
export const CACHE_TIME = 5 * 60 * 1000;

// Cache for API responses
export const responseCache = new Map<string, { 
  timestamp: number, 
  data: any 
}>();

/**
 * Gets data from cache if it exists and is not expired
 * @param key Cache key
 * @returns Cached data if valid, null otherwise
 */
export const getCachedResponse = (key: string): any | null => {
  const cachedResponse = responseCache.get(key);
  const now = Date.now();
  
  if (cachedResponse && now - cachedResponse.timestamp < CACHE_TIME) {
    return cachedResponse.data;
  }
  
  return null;
};

/**
 * Sets data in the cache
 * @param key Cache key
 * @param data Data to cache
 */
export const setCachedResponse = (key: string, data: any): void => {
  responseCache.set(key, {
    timestamp: Date.now(),
    data
  });
};

/**
 * Removes a specific entry from cache
 * @param key Cache key to remove
 */
export const removeCachedResponse = (key: string): void => {
  responseCache.delete(key);
};
