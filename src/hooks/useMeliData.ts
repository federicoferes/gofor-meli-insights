
import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AppSettingsContext } from '@/App';

import { MeliDataOptions, UseMeliDataReturn } from '@/types/meli';
import { createEmptySalesSummary, clearDataCache } from '@/utils/meliDataProcessor';
import { getCachedResponse, setCachedResponse, removeCachedResponse } from '@/utils/apiCache';
import { buildMeliDataPayload, fetchMeliData } from '@/utils/meliApiRequests';
import { useMeliResponseProcessor } from './useMeliResponseProcessor';

/**
 * Custom hook to fetch and process Mercado Libre data
 * Following SOLID principles: Single Responsibility, Open-closed, Dependency Inversion
 */
export function useMeliData({
  userId,
  meliUserId,
  dateFilter,
  dateRange,
  isConnected,
  productCostsCalculator,
  disableTestData
}: MeliDataOptions): UseMeliDataReturn {
  const { disableTestData: globalDisableTestData } = useContext(AppSettingsContext);
  
  // Determine whether to disable test data based on prop or global context
  const finalDisableTestData = disableTestData !== undefined ? disableTestData : globalDisableTestData;
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for managing component lifecycle and request state
  const isMounted = useRef(true);
  const requestInProgress = useRef<string | null>(null);
  const lastRequestPayload = useRef<string | null>(null);
  const { toast } = useToast();
  const requestAttempts = useRef(0);

  // Use the response processor hook
  const {
    processResponseData,
    salesData,
    salesSummary,
    topProducts,
    costData,
    provinceData,
    prevSalesSummary,
    ordersData,
    isTestData
  } = useMeliResponseProcessor({
    dateFilter,
    dateRange,
    finalDisableTestData,
    productCostsCalculator
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Generate a cache key based on current filters
  const getCacheKey = useCallback(() => {
    let key = `${userId}-${dateFilter}`;
    if (dateFilter === 'custom' && dateRange.fromISO && dateRange.toISO) {
      key += `-${dateRange.fromISO}-${dateRange.toISO}`;
    }
    if (finalDisableTestData) {
      key += '-no-test-data';
    }
    return key;
  }, [userId, dateFilter, dateRange, finalDisableTestData]);

  // Main function to load data
  const loadData = useCallback(async (retryCount = 0) => {
    // Early return if prerequisites aren't met
    if (!userId || !isConnected || !meliUserId) {
      return;
    }
    
    setError(null);
    
    const cacheKey = getCacheKey();
    
    // Prevent duplicate requests
    if (requestInProgress.current === cacheKey) {
      return;
    }

    // Check cache first
    const cachedData = getCachedResponse(cacheKey);
    if (cachedData) {
      if (isMounted.current) {
        processResponseData(cachedData);
      }
      return;
    }

    try {
      if (isMounted.current) setIsLoading(true);
      requestInProgress.current = cacheKey;
      
      // Build the payload
      const requestPayload = buildMeliDataPayload(
        userId, 
        meliUserId, 
        dateRange, 
        finalDisableTestData
      );
      
      console.log('useMeliData - dateFilter:', dateFilter);
      console.log('useMeliData - dateRange completo:', JSON.stringify(dateRange, null, 2));
      
      // Check for duplicate requests
      const payloadString = JSON.stringify(requestPayload);
      if (payloadString === lastRequestPayload.current && requestAttempts.current > 0) {
        if (isMounted.current) setIsLoading(false);
        requestInProgress.current = null;
        return;
      }

      lastRequestPayload.current = payloadString;
      requestAttempts.current++;
      
      // Fetch data
      const { data: batchData, error: fetchError } = await fetchMeliData(
        requestPayload,
        toast
      );
      
      if (fetchError) {
        setError(fetchError);
        return;
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
            
            return loadData(retryCount + 1);
          }
        }
        throw new Error(batchData?.message || batchData?.error || 'Error desconocido al obtener datos');
      }
      
      // Save response to cache
      setCachedResponse(cacheKey, batchData);
      
      if (isMounted.current) {
        processResponseData(batchData);
      }
    } catch (error: any) {
      setError(error.message || "No se pudieron cargar los datos de Mercado Libre.");
      toast({
        variant: "destructive",
        title: "Error cargando datos",
        description: error.message || "No se pudieron cargar los datos de Mercado Libre.",
        duration: 5000
      });
    } finally {
      if (isMounted.current) setIsLoading(false);
      requestInProgress.current = null;
    }
  }, [userId, meliUserId, dateFilter, dateRange, finalDisableTestData, isConnected, getCacheKey, processResponseData, toast]);

  // Load data when dependencies change
  useEffect(() => {
    const validDateRange = dateFilter !== 'custom' || 
                          (dateRange.fromISO && dateRange.toISO);
    
    if (validDateRange && userId && isConnected && meliUserId) {
      loadData();
    }
  }, [userId, meliUserId, dateFilter, dateRange.fromISO, dateRange.toISO, isConnected, loadData]);

  // Public method to force refresh data
  const refresh = async () => {
    const cacheKey = getCacheKey();
    removeCachedResponse(cacheKey);
    
    toast({
      title: "Actualizando datos",
      description: "Recuperando datos más recientes de Mercado Libre...",
      duration: 3000,
    });
    
    return loadData(0);
  };

  return {
    isLoading,
    salesData,
    salesSummary,
    topProducts,
    costData,
    provinceData,
    prevSalesSummary,
    ordersData,
    refresh,
    error,
    isTestData
  };
}
