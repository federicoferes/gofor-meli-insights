
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { buildMeliDataPayload, fetchMeliData } from '@/utils/meliApiRequests';
import { useMeliCache } from './useMeliCache';
import { DateRange } from '@/types/meli';

interface UseMeliDataFetcherProps {
  userId: string | undefined;
  meliUserId: string | null;
  dateFilter: string;
  dateRange: DateRange;
  disableTestData: boolean;
  isMounted: React.MutableRefObject<boolean>;
}

export function useMeliDataFetcher({
  userId,
  meliUserId,
  dateFilter,
  dateRange,
  disableTestData,
  isMounted
}: UseMeliDataFetcherProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for managing request state
  const requestInProgress = useRef<string | null>(null);
  const lastRequestPayload = useRef<string | null>(null);
  const requestAttempts = useRef(0);
  const { toast } = useToast();
  
  // Cache hook
  const { getCacheKey, checkCache, saveToCache, clearCache } = useMeliCache({
    userId,
    dateFilter,
    fromISO: dateRange.fromISO,
    toISO: dateRange.toISO,
    disableTestData
  });

  // Fetch data from API or cache
  const fetchData = useCallback(async (retryCount = 0) => {
    // Early return if prerequisites aren't met
    if (!userId || !meliUserId) {
      return { data: null, fromCache: false };
    }
    
    setError(null);
    
    const cacheKey = getCacheKey();
    
    // Prevent duplicate requests
    if (requestInProgress.current === cacheKey) {
      return { data: null, fromCache: false };
    }

    // Check cache first
    const cachedData = checkCache();
    if (cachedData) {
      return { data: cachedData, fromCache: true };
    }

    try {
      if (isMounted.current) setIsLoading(true);
      requestInProgress.current = cacheKey;
      
      // Build the payload
      const requestPayload = buildMeliDataPayload(
        userId, 
        meliUserId, 
        dateRange, 
        disableTestData
      );
      
      console.log('useMeliDataFetcher - dateFilter:', dateFilter);
      console.log('useMeliDataFetcher - dateRange completo:', JSON.stringify(dateRange, null, 2));
      
      // Check for duplicate requests
      const payloadString = JSON.stringify(requestPayload);
      if (payloadString === lastRequestPayload.current && requestAttempts.current > 0) {
        if (isMounted.current) setIsLoading(false);
        requestInProgress.current = null;
        return { data: null, fromCache: false };
      }

      lastRequestPayload.current = payloadString;
      requestAttempts.current++;
      
      // Fetch data
      const { data: batchData, error: fetchError } = await fetchMeliData(
        requestPayload,
        { toast }
      );
      
      if (fetchError) {
        setError(fetchError);
        return { data: null, fromCache: false };
      }
      
      if (!batchData) {
        throw new Error("No se recibieron datos");
      }

      // Handle rate limiting
      if (!batchData.success) {
        if (batchData?.error?.includes('429') || batchData?.message?.includes('rate limit')) {
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchData(retryCount + 1);
          }
        }
        throw new Error(batchData?.message || batchData?.error || 'Error desconocido al obtener datos');
      }
      
      // Save response to cache
      saveToCache(batchData);
      
      return { data: batchData, fromCache: false };
    } catch (error: any) {
      setError(error.message || "No se pudieron cargar los datos de Mercado Libre.");
      toast({
        variant: "destructive",
        title: "Error cargando datos",
        description: error.message || "No se pudieron cargar los datos de Mercado Libre.",
        duration: 5000
      });
      return { data: null, fromCache: false };
    } finally {
      if (isMounted.current) setIsLoading(false);
      requestInProgress.current = null;
    }
  }, [userId, meliUserId, dateFilter, dateRange, disableTestData, getCacheKey, checkCache, saveToCache, isMounted, toast]);

  // Public method to force refresh data
  const refreshData = useCallback(async () => {
    clearCache();
    
    toast({
      title: "Actualizando datos",
      description: "Recuperando datos más recientes de Mercado Libre...",
      duration: 3000,
    });
    
    return fetchData(0);
  }, [clearCache, fetchData, toast]);

  return {
    isLoading,
    error,
    fetchData,
    refreshData
  };
}
