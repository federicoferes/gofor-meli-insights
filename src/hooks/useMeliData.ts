
import { useState, useEffect, useRef, useContext } from 'react';
import { AppSettingsContext } from '@/App';
import { MeliDataOptions, UseMeliDataReturn } from '@/types/meli';
import { createEmptySalesSummary } from '@/utils/meliDataProcessor';
import { useMeliResponseProcessor } from './useMeliResponseProcessor';
import { useMeliDataFetcher } from './useMeliDataFetcher';

/**
 * Custom hook to fetch and process Mercado Libre data
 * Following SOLID principles: Single Responsibility, Open-closed, Dependency Inversion
 */
export function useMeliData({
  userId,
  meliUserId,
  dateFilter,
  dateRange,
  isConnected = false,
  productCostsCalculator,
  disableTestData
}: MeliDataOptions): UseMeliDataReturn {
  const { disableTestData: globalDisableTestData } = useContext(AppSettingsContext);
  
  // Determine whether to disable test data based on prop or global context
  const finalDisableTestData = disableTestData !== undefined ? disableTestData : globalDisableTestData;
  
  // Refs for managing component lifecycle
  const isMounted = useRef(true);

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

  // Use the data fetcher hook
  const {
    isLoading,
    error,
    fetchData,
    refreshData
  } = useMeliDataFetcher({
    userId,
    meliUserId,
    dateFilter,
    dateRange,
    disableTestData: finalDisableTestData,
    isMounted
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load data when dependencies change
  useEffect(() => {
    const validDateRange = dateFilter !== 'custom' || 
                          (dateRange.fromISO && dateRange.toISO);
    
    if (validDateRange && userId && isConnected && meliUserId) {
      console.log('Fetching data with params:', { userId, meliUserId, dateFilter, dateRange });
      fetchData().then(({ data, fromCache }) => {
        if (data && isMounted.current) {
          console.log('Processing fetched data', { fromCache });
          processResponseData(data);
        } else {
          console.log('No data returned from fetchData or component unmounted');
        }
      }).catch(err => {
        console.error('Error fetching data:', err);
      });
    } else {
      console.log('Skipping data fetch, missing required parameters:', {
        validDateRange,
        userId: !!userId,
        isConnected,
        meliUserId: !!meliUserId
      });
    }
  }, [userId, meliUserId, dateFilter, dateRange.fromISO, dateRange.toISO, isConnected, fetchData, processResponseData]);

  // Public method to force refresh data
  const refresh = async () => {
    console.log('Manual refresh requested');
    const { data } = await refreshData();
    
    if (data && isMounted.current) {
      processResponseData(data);
      return true;
    }
    return false;
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
