import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
}

interface UseMeliDataReturn {
  isLoading: boolean;
  salesData: any[];
  salesSummary: any;
  topProducts: any[];
  costData: any[];
  provinceData: any[];
  prevSalesSummary: any;
  refresh: () => Promise<void>;
}

const CACHE_TIME = 10 * 60 * 1000;

const responseCache = new Map<string, { 
  timestamp: number, 
  data: any 
}>();

export function useMeliData({
  userId,
  meliUserId,
  dateFilter,
  dateRange,
  isConnected
}: MeliDataOptions): UseMeliDataReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [salesSummary, setSalesSummary] = useState({
    gmv: 0, commissions: 0, taxes: 0, shipping: 0, discounts: 0,
    refunds: 0, iva: 0, units: 0, avgTicket: 0, visits: 0, conversion: 0,
    advertising: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [costData, setCostData] = useState([]);
  const [provinceData, setProvinceData] = useState([]);
  const [prevSalesSummary, setPrevSalesSummary] = useState({
    gmv: 0, commissions: 0, taxes: 0, shipping: 0, discounts: 0,
    refunds: 0, iva: 0, units: 0, avgTicket: 0, visits: 0, conversion: 0,
    advertising: 0
  });

  const isMounted = useRef(true);
  const requestInProgress = useRef<string | null>(null);
  const lastRequestPayload = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getCacheKey = useCallback(() => {
    let key = `${userId}-${dateFilter}`;
    if (dateFilter === 'custom' && dateRange.fromISO && dateRange.toISO) {
      key += `-${dateRange.fromISO}-${dateRange.toISO}`;
    }
    return key;
  }, [userId, dateFilter, dateRange]);

  const loadData = useCallback(async (retryCount = 0) => {
    if (!userId || !isConnected || !meliUserId) {
      console.log("Requisitos de carga no cumplidos", { userId, isConnected, meliUserId });
      return;
    }
    
    const cacheKey = getCacheKey();
    
    if (requestInProgress.current === cacheKey) {
      console.log("🔒 Request already in progress for:", cacheKey);
      return;
    }

    const cachedResponse = responseCache.get(cacheKey);
    const now = Date.now();
    if (cachedResponse && now - cachedResponse.timestamp < CACHE_TIME) {
      console.log("🔄 Usando datos en caché para:", cacheKey);
      if (isMounted.current) {
        if (cachedResponse.data.dashboard_data) {
          const dashData = cachedResponse.data.dashboard_data;
          
          if (dashData.salesByMonth?.length > 0) setSalesData(dashData.salesByMonth);
          if (dashData.summary) setSalesSummary(dashData.summary);
          if (dashData.prev_summary) setPrevSalesSummary(dashData.prev_summary);
          if (dashData.costDistribution?.length > 0) setCostData(dashData.costDistribution);
          if (dashData.topProducts?.length > 0) setTopProducts(dashData.topProducts);
          if (dashData.salesByProvince?.length > 0) setProvinceData(dashData.salesByProvince);
        }
      }
      return;
    }

    try {
      if (isMounted.current) setIsLoading(true);
      requestInProgress.current = cacheKey;
      
      let dateFrom, dateTo;
      
      if (dateFilter === 'custom' && dateRange.fromISO && dateRange.toISO) {
        dateFrom = dateRange.fromISO;
        dateTo = dateRange.toISO;
      } else {
        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0];
        
        let fromDate = new Date(today);
        switch(dateFilter) {
          case 'today':
            break;
          case 'yesterday':
            fromDate.setDate(today.getDate() - 1);
            break;
          case '7d':
            fromDate.setDate(today.getDate() - 7);
            break;
          case '30d':
          default:
            fromDate.setDate(today.getDate() - 30);
        }
        
        const formattedFrom = fromDate.toISOString().split('T')[0];
        dateFrom = `${formattedFrom}T00:00:00.000Z`;
        dateTo = `${formattedToday}T23:59:59.999Z`;
      }
      
      console.log("🟣 Cargando datos para filtro:", dateFilter);
      console.log("📅 Rango de fechas:", { dateFrom, dateTo });

      const batchRequests = [
        {
          endpoint: '/orders/search',
          params: {
            seller: meliUserId,
            'order.status': 'paid',
            sort: 'date_desc',
            date_from: dateFrom,
            date_to: dateTo,
            limit: 50
          }
        },
        
        {
          endpoint: `/users/${meliUserId}/items/search`,
          params: {
            limit: 100
          }
        },
        
        {
          endpoint: `/users/${meliUserId}/items_visits/time_window`,
          params: {
            date_from: dateFrom?.split('T')[0],
            date_to: dateTo?.split('T')[0],
            time_window: 'day'
          }
        },
        
        {
          endpoint: `/users/${meliUserId}/ads/campaigns`,
          params: {}
        }
      ];

      const requestPayload = {
        user_id: userId,
        batch_requests: batchRequests,
        date_range: {
          begin: dateFrom ? dateFrom.split('T')[0] : null,
          end: dateTo ? dateTo.split('T')[0] : null
        },
        prev_period: true,
        use_cache: true
      };

      const payloadString = JSON.stringify(requestPayload);
      if (payloadString === lastRequestPayload.current) {
        console.log("🔄 Ignorando solicitud duplicada con el mismo payload");
        if (isMounted.current) setIsLoading(false);
        requestInProgress.current = null;
        return;
      }

      lastRequestPayload.current = payloadString;
      
      console.log("📦 Enviando batch requests:", batchRequests.map(r => r.endpoint));
      
      const { data: batchData, error: batchError } = await supabase.functions.invoke('meli-data', {
        body: requestPayload
      });
      
      if (batchError) {
        throw new Error(`Error al obtener datos: ${batchError.message}`);
      }
      
      if (!batchData || !batchData.success) {
        if (batchData?.error?.includes('429') || batchData?.message?.includes('rate limit')) {
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`⏱️ API rate limit alcanzado, reintentando en ${delay}ms`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return loadData(retryCount + 1);
          }
        }
        throw new Error(batchData?.message || 'Error al obtener datos');
      }
      
      console.log("✅ Respuesta de batch recibida:", {
        success: batchData.success,
        batchResults: batchData.batch_results?.length || 0,
        dashboardData: batchData.dashboard_data ? "presente" : "ausente"
      });
      
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        data: batchData
      });
      
      if (isMounted.current) {
        console.log("✅ Datos recibidos correctamente");
        
        if (batchData.dashboard_data) {
          if (batchData.dashboard_data.salesByMonth?.length > 0) {
            setSalesData(batchData.dashboard_data.salesByMonth);
          }
          
          if (batchData.dashboard_data.summary) {
            const summary = batchData.dashboard_data.summary;
            
            if (summary.visits && summary.units) {
              summary.conversion = (summary.units / summary.visits) * 100;
            } else {
              summary.conversion = 0;
            }
            
            if (summary.gmv > 0 && summary.orders > 0) {
              summary.avgTicket = summary.gmv / summary.orders;
            }
            
            setSalesSummary(summary);
          }
          
          if (batchData.dashboard_data.prev_summary) {
            const prevSummary = batchData.dashboard_data.prev_summary;
            
            if (prevSummary.visits && prevSummary.units) {
              prevSummary.conversion = (prevSummary.units / prevSummary.visits) * 100;
            } else {
              prevSummary.conversion = 0;
            }
            
            if (prevSummary.gmv > 0 && prevSummary.orders > 0) {
              prevSummary.avgTicket = prevSummary.gmv / prevSummary.orders;
            }
            
            setPrevSalesSummary(prevSummary);
          }
          
          if (batchData.dashboard_data.costDistribution?.length > 0) {
            setCostData(batchData.dashboard_data.costDistribution);
          }
          
          if (batchData.dashboard_data.topProducts?.length > 0) {
            setTopProducts(batchData.dashboard_data.topProducts);
          }
          
          if (batchData.dashboard_data.salesByProvince?.length > 0) {
            setProvinceData(batchData.dashboard_data.salesByProvince);
          }
        } else {
          console.warn("⚠️ No se recibieron datos del dashboard");
        }
      }
    } catch (error: any) {
      console.error("❌ Error cargando datos de Mercado Libre:", error);
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
  }, [userId, meliUserId, dateFilter, dateRange, isConnected, getCacheKey, toast]);

  useEffect(() => {
    const validDateRange = dateFilter !== 'custom' || 
                          (dateRange.fromISO && dateRange.toISO);
    
    if (validDateRange && userId && isConnected && meliUserId) {
      const requestKey = `${userId}-${meliUserId}-${dateFilter}-${dateRange.fromISO || ''}-${dateRange.toISO || ''}`;
      
      console.log(`🔍 Verificando carga de datos para: ${requestKey}`);
      loadData();
    }
  }, [userId, meliUserId, dateFilter, dateRange.fromISO, dateRange.toISO, isConnected, loadData]);

  return {
    isLoading,
    salesData,
    salesSummary,
    topProducts,
    costData,
    provinceData,
    prevSalesSummary,
    refresh: () => loadData(0)
  };
}
