import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AppSettingsContext } from '@/App';
import { formatDateForMeLi } from '@/utils/date';

// Define types for better code maintainability
interface DateRange {
  from?: Date;
  to?: Date;
  fromISO?: string;
  toISO?: string;
}

interface MeliDataOptions {
  userId: string | undefined;
  meliUserId: string | null;
  dateFilter: string;
  dateRange: DateRange;
  isConnected: boolean;
  productCostsCalculator?: (orders: any[]) => number;
  disableTestData?: boolean;
}

interface UseMeliDataReturn {
  isLoading: boolean;
  salesData: any[];
  salesSummary: any;
  topProducts: any[];
  costData: any[];
  provinceData: any[];
  prevSalesSummary: any;
  ordersData: any[];
  refresh: () => Promise<void>;
  error: string | null;
  isTestData: boolean;
}

interface SalesSummary {
  gmv: number;
  commissions: number;
  taxes: number;
  shipping: number;
  discounts: number;
  refunds: number;
  iva: number;
  units: number;
  orders: number;
  avgTicket: number;
  visits: number;
  conversion: number;
  advertising: number;
  productCosts: number;
}

// Cache implementation for better performance
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

const responseCache = new Map<string, { 
  timestamp: number, 
  data: any 
}>();

/**
 * Creates an object with initialized fields for sales summary
 */
const createEmptySalesSummary = (): SalesSummary => ({
  gmv: 0, 
  commissions: 0, 
  taxes: 0, 
  shipping: 0, 
  discounts: 0,
  refunds: 0, 
  iva: 0, 
  units: 0, 
  orders: 0,
  avgTicket: 0, 
  visits: 0, 
  conversion: 0,
  advertising: 0, 
  productCosts: 0
});

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
  const [salesData, setSalesData] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>(createEmptySalesSummary());
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [costData, setCostData] = useState<any[]>([]);
  const [provinceData, setProvinceData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [prevSalesSummary, setPrevSalesSummary] = useState<SalesSummary>(createEmptySalesSummary());
  const [isTestData, setIsTestData] = useState(false);

  // Refs for managing component lifecycle and request state
  const isMounted = useRef(true);
  const requestInProgress = useRef<string | null>(null);
  const lastRequestPayload = useRef<string | null>(null);
  const { toast } = useToast();
  const requestAttempts = useRef(0);

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

  // Process the response data and update state
  const processResponseData = useCallback((batchData: any) => {
    // Explicitly set isTestData based on the response
    setIsTestData(!!batchData.is_test_data);
    
    if (batchData.dashboard_data) {
      // Process sales by month
      if (batchData.dashboard_data.salesByMonth?.length > 0) {
        setSalesData(batchData.dashboard_data.salesByMonth);
      }
      
      // Process summary
      if (batchData.dashboard_data.summary) {
        const summary = batchData.dashboard_data.summary;
        
        // Calculate conversion rate
        if (summary.visits > 0 && summary.units > 0) {
          summary.conversion = (summary.units / summary.visits) * 100;
        } else {
          summary.conversion = 0;
        }
        
        // Calculate average ticket
        if (summary.gmv > 0 && summary.orders > 0) {
          summary.avgTicket = summary.gmv / summary.orders;
        } else {
          summary.avgTicket = 0;
        }
        
        setSalesSummary(summary);
      }
      
      // Process previous period summary
      if (batchData.dashboard_data.prev_summary) {
        const prevSummary = batchData.dashboard_data.prev_summary;
        
        if (prevSummary.visits > 0 && prevSummary.units > 0) {
          prevSummary.conversion = (prevSummary.units / prevSummary.visits) * 100;
        } else {
          prevSummary.conversion = 0;
        }
        
        if (prevSummary.gmv > 0 && prevSummary.orders > 0) {
          prevSummary.avgTicket = prevSummary.gmv / prevSummary.orders;
        } else {
          prevSummary.avgTicket = 0;
        }
        
        setPrevSalesSummary(prevSummary);
      }
      
      // Process cost distribution
      if (batchData.dashboard_data.costDistribution?.length > 0) {
        setCostData(batchData.dashboard_data.costDistribution);
      }
      
      // Process top products
      if (batchData.dashboard_data.topProducts?.length > 0) {
        setTopProducts(batchData.dashboard_data.topProducts);
      }
      
      // Process province data
      if (batchData.dashboard_data.salesByProvince?.length > 0) {
        setProvinceData(batchData.dashboard_data.salesByProvince);
      }
      
      // Process orders and calculate product costs if applicable
      if (batchData.dashboard_data.orders) {
        setOrdersData(batchData.dashboard_data.orders);
        
        if (productCostsCalculator) {
          const productCosts = productCostsCalculator(batchData.dashboard_data.orders);
          setSalesSummary(prev => ({ ...prev, productCosts }));
        }
      }
    } else if (!batchData.has_dashboard_data) {
      // Handle case when no dashboard data is returned
      setError("No se encontraron datos para el período seleccionado");
      
      // Clear all data
      setSalesSummary(createEmptySalesSummary());
      setPrevSalesSummary(createEmptySalesSummary());
      setSalesData([]);
      setCostData([]);
      setTopProducts([]);
      setProvinceData([]);
      setOrdersData([]);
      
      if (finalDisableTestData) {
        toast({
          title: "Sin datos del dashboard",
          description: "No se encontraron órdenes para el período seleccionado",
          variant: "destructive",
          duration: 5000
        });
      } else if (batchData.is_test_data) {
        // Test data scenario
        setIsTestData(true);
        
        toast({
          title: "Mostrando datos de prueba",
          description: "No se encontraron órdenes reales para el período seleccionado",
          duration: 5000
        });
      }
    }
  }, [finalDisableTestData, productCostsCalculator, toast]);

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
    const cachedResponse = responseCache.get(cacheKey);
    const now = Date.now();
    if (cachedResponse && now - cachedResponse.timestamp < CACHE_TIME) {
      if (isMounted.current) {
        processResponseData(cachedResponse.data);
      }
      return;
    }

    try {
      if (isMounted.current) setIsLoading(true);
      requestInProgress.current = cacheKey;
      
      // Prepare date parameters
      let dateFrom, dateTo;
      
      if (dateFilter === 'custom' && dateRange.fromISO && dateRange.toISO) {
        dateFrom = dateRange.fromISO;
        dateTo = dateRange.toISO;
      } else {
        dateFrom = dateRange.fromISO;
        dateTo = dateRange.toISO;
      }

      console.log('useMeliData - dateFilter:', dateFilter);
      console.log('useMeliData - dateRange completo:', JSON.stringify(dateRange, null, 2));
      console.log('useMeliData - dateFrom (sin procesar):', dateFrom);
      console.log('useMeliData - dateTo (sin procesar):', dateTo);

      // Obtener IDs de productos para datos de visitas
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('item_id')
        .eq('user_id', userId);
      
      const productIds = productsData?.map(p => p.item_id) || [];

      // Preparar batch requests siguiendo la estructura de la API de MeLi
      const batchRequests = [
        {
          endpoint: '/orders/search',
          params: {
            seller: meliUserId,
            sort: 'date_desc',
            limit: 50,
            // Date parameters will be processed on the server
          }
        },
        
        {
          endpoint: `/users/${meliUserId}/items/search`,
          params: {
            limit: 100
          }
        },
        
        {
          endpoint: `/advertising/campaigns/search`,
          params: {
            seller_id: meliUserId
          }
        },
        
        {
          endpoint: `/orders/search/recent`,
          params: {
            seller: meliUserId,
            limit: 50,
            // Date parameters will be processed on the server
          }
        },
        
        // Note: We now handle visits individually in the backend
        // to comply with MeLi's API restriction of 1 item per request
        {
          endpoint: `/visits/items`,
          params: {
            _productIds: productIds
          }
        }
      ];

      // Preparar payload para la función edge
      const requestPayload = {
        user_id: userId,
        batch_requests: batchRequests,
        date_range: {
          begin: dateFrom ? new Date(dateFrom).toISOString() : undefined,
          end: dateTo ? new Date(dateTo).toISOString() : undefined
        },
        timezone: 'America/Argentina/Buenos_Aires',
        prev_period: true,
        use_cache: false,
        disable_test_data: finalDisableTestData,
        product_ids: productIds
      };

      console.log('useMeliData - Payload date_range:', JSON.stringify(requestPayload.date_range, null, 2));
      console.log('useMeliData - Payload date_range.begin (procesado):', requestPayload.date_range.begin);
      console.log('useMeliData - Payload date_range.end (procesado):', requestPayload.date_range.end);

      // Check for duplicate requests
      const payloadString = JSON.stringify(requestPayload);
      if (payloadString === lastRequestPayload.current && requestAttempts.current > 0) {
        if (isMounted.current) setIsLoading(false);
        requestInProgress.current = null;
        return;
      }

      lastRequestPayload.current = payloadString;
      requestAttempts.current++;
      
      // Call the edge function to fetch data from MeLi
      const { data: batchData, error: batchError } = await supabase.functions.invoke('meli-data', {
        body: requestPayload
      });
      
      if (batchError) {
        throw new Error(`Error al obtener datos: ${batchError.message}`);
      }
      
      if (!batchData) {
        throw new Error("No se recibieron datos de la función meli-data");
      }

      // Handle API errors and rate limiting
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
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        data: batchData
      });
      
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
  }, [finalDisableTestData, productCostsCalculator, toast, getCacheKey, loadData]);

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
    responseCache.delete(cacheKey);
    
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
