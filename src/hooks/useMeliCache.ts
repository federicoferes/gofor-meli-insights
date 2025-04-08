
import { useState, useCallback } from 'react';
import { getCachedResponse, setCachedResponse, removeCachedResponse } from '@/utils/apiCache';

interface UseMeliCacheProps {
  userId: string | undefined;
  dateFilter: string;
  fromISO?: string;
  toISO?: string;
  disableTestData: boolean;
}

export function useMeliCache({
  userId,
  dateFilter,
  fromISO,
  toISO,
  disableTestData
}: UseMeliCacheProps) {

  // Generate a cache key based on current filters
  const getCacheKey = useCallback(() => {
    let key = `${userId}-${dateFilter}`;
    if (dateFilter === 'custom' && fromISO && toISO) {
      key += `-${fromISO}-${toISO}`;
    }
    if (disableTestData) {
      key += '-no-test-data';
    }
    return key;
  }, [userId, dateFilter, fromISO, toISO, disableTestData]);

  // Check cache for data
  const checkCache = useCallback(() => {
    const cacheKey = getCacheKey();
    return getCachedResponse(cacheKey);
  }, [getCacheKey]);

  // Save data to cache
  const saveToCache = useCallback((data: any) => {
    const cacheKey = getCacheKey();
    setCachedResponse(cacheKey, data);
  }, [getCacheKey]);

  // Clear cache
  const clearCache = useCallback(() => {
    const cacheKey = getCacheKey();
    removeCachedResponse(cacheKey);
  }, [getCacheKey]);

  return {
    getCacheKey,
    checkCache,
    saveToCache,
    clearCache
  };
}
