
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
  productCostsCalculator?: (orders: any[]) => number;
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
}

// Cache para datos - 5 minutos por defecto
const CACHE_TIME = 5 * 60 * 1000; // 5 minutos para desarrollo
const responseCache = new Map<string, { 
  timestamp: number, 
  data: any 
}>();

export function useMeliData({
  userId,
  meliUserId,
  dateFilter,
  dateRange,
  isConnected,
  productCostsCalculator
}: MeliDataOptions): UseMeliDataReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState([]);
  const [salesSummary, setSalesSummary] = useState({
    gmv: 0, commissions: 0, taxes: 0, shipping: 0, discounts: 0,
    refunds: 0, iva: 0, units: 0, avgTicket: 0, visits: 0, conversion: 0,
    advertising: 0, productCosts: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [costData, setCostData] = useState([]);
  const [provinceData, setProvinceData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [prevSalesSummary, setPrevSalesSummary] = useState({
    gmv: 0, commissions: 0, taxes: 0, shipping: 0, discounts: 0,
    refunds: 0, iva: 0, units: 0, avgTicket: 0, visits: 0, conversion: 0,
    advertising: 0, productCosts: 0
  });

  const isMounted = useRef(true);
  const requestInProgress = useRef<string | null>(null);
  const lastRequestPayload = useRef<string | null>(null);
  const { toast } = useToast();
  const requestAttempts = useRef(0);

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
    
    // Limpiar error anterior
    setError(null);
    
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
          if (dashData.orders?.length > 0) setOrdersData(dashData.orders);
          
          if (productCostsCalculator && dashData.orders?.length > 0) {
            const productCosts = productCostsCalculator(dashData.orders);
            setSalesSummary(prev => ({ ...prev, productCosts }));
          }
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
        dateFrom = dateRange.fromISO;
        dateTo = dateRange.toISO;
      }
      
      console.log("🟣 Cargando datos para filtro:", dateFilter);
      console.log("📅 Rango de fechas:", { dateFrom, dateTo });

      // Endpoints para la búsqueda de datos
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
        
        // Endpoint para visitas - primero intentamos con el más específico
        {
          endpoint: `/visits/items`,
          params: {
            user_id: meliUserId,
            date_from: dateFrom ? dateFrom.split('T')[0] : undefined,
            date_to: dateTo ? dateTo.split('T')[0] : undefined
          }
        },
        
        // Alternativa para visitas
        {
          endpoint: `/visits/search`,
          params: {
            user_id: meliUserId
          }
        },
        
        // Intentar obtener datos de campañas
        {
          endpoint: `/users/${meliUserId}/ads/campaigns`,
          params: {}
        },

        // Intentar obtener órdenes recientes
        {
          endpoint: `/orders/search/recent`,
          params: {
            seller: meliUserId,
            limit: 50
          }
        }
      ];

      const requestPayload = {
        user_id: userId,
        batch_requests: batchRequests,
        date_range: {
          begin: dateFrom ? dateFrom.split('T')[0] : null,
          end: dateTo ? dateTo.split('T')[0] : null
        },
        timezone: 'America/Argentina/Buenos_Aires',
        prev_period: true,
        use_cache: false // Desactivar caché para depuración
      };

      const payloadString = JSON.stringify(requestPayload);
      if (payloadString === lastRequestPayload.current && requestAttempts.current > 0) {
        console.log("🔄 Ignorando solicitud duplicada con el mismo payload");
        if (isMounted.current) setIsLoading(false);
        requestInProgress.current = null;
        return;
      }

      lastRequestPayload.current = payloadString;
      requestAttempts.current++;
      
      console.log("📦 Enviando batch requests:", batchRequests.map(r => r.endpoint));
      console.log("Payload completo:", JSON.stringify(requestPayload));
      
      const { data: batchData, error: batchError } = await supabase.functions.invoke('meli-data', {
        body: requestPayload
      });
      
      if (batchError) {
        console.error("Error en invoke meli-data:", batchError);
        throw new Error(`Error al obtener datos: ${batchError.message}`);
      }
      
      if (!batchData) {
        throw new Error("No se recibieron datos de la función meli-data");
      }

      console.log("Respuesta recibida de meli-data:", JSON.stringify({
        success: batchData.success,
        has_dashboard_data: !!batchData.dashboard_data,
        has_batch_results: !!batchData.batch_results,
        error: batchData.error
      }));

      if (!batchData.success) {
        if (batchData?.error?.includes('429') || batchData?.message?.includes('rate limit')) {
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`⏱️ API rate limit alcanzado, reintentando en ${delay}ms`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return loadData(retryCount + 1);
          }
        }
        throw new Error(batchData?.message || batchData?.error || 'Error desconocido al obtener datos');
      }
      
      console.log("✅ Respuesta de batch recibida:", {
        success: batchData.success,
        batchResults: batchData.batch_results?.length || 0,
        dashboardData: batchData.dashboard_data ? "presente" : "ausente"
      });
      
      // Verificar si hay resultados fallidos
      const failedResults = batchData.batch_results?.filter(r => !r.success);
      if (failedResults?.length > 0) {
        console.warn(`⚠️ ${failedResults.length} requests fallidos:`, 
          failedResults.map(r => `${r.endpoint}: ${r.error || r.status}`).join(', '));
      }
      
      // Verificar que hay datos útiles
      const ordersResult = batchData.batch_results?.find(r => r.endpoint.includes('/orders/search'));
      const ordersData = ordersResult?.data?.results || [];
      
      // También probar con órdenes recientes si lo primero no funciona
      const recentOrdersResult = batchData.batch_results?.find(r => r.endpoint.includes('/orders/search/recent'));
      const recentOrdersData = recentOrdersResult?.data?.results || [];
      
      const allOrdersData = [...ordersData, ...recentOrdersData];
      
      console.log(`📊 Se encontraron ${allOrdersData.length} órdenes en la respuesta (${ordersData.length} normales + ${recentOrdersData.length} recientes)`);

      if (allOrdersData.length === 0) {
        console.log("⚠️ No se encontraron órdenes en el período seleccionado");
        // Verificar si hay datos en el dashboard a pesar de no tener órdenes
        if (!batchData.dashboard_data?.summary?.gmv && !batchData.dashboard_data?.orders?.length) {
          console.log("🔍 No hay datos financieros para mostrar en este período");
          toast({
            title: "Sin datos para mostrar",
            description: "No se encontraron órdenes o métricas para el período seleccionado",
            variant: "destructive",
          });
        }
      }
      
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        data: batchData
      });
      
      if (isMounted.current) {
        console.log("✅ Datos recibidos correctamente");
        
        if (batchData.dashboard_data) {
          // Logueamos los datos del dashboard para debugging
          console.log("Dashboard data:", {
            summary: batchData.dashboard_data.summary ? "presente" : "ausente",
            prev_summary: batchData.dashboard_data.prev_summary ? "presente" : "ausente",
            orders: batchData.dashboard_data.orders?.length || 0,
            topProducts: batchData.dashboard_data.topProducts?.length || 0,
            costDistribution: batchData.dashboard_data.costDistribution?.length || 0,
            salesByProvince: batchData.dashboard_data.salesByProvince?.length || 0,
            date_range: batchData.dashboard_data.date_range ? "presente" : "ausente"
          });
          
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
            
            console.log("Resumen actualizado:", {
              gmv: summary.gmv,
              orders: summary.orders,
              units: summary.units,
              visits: summary.visits,
              conversion: summary.conversion
            });
            
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
          
          if (batchData.dashboard_data.orders) {
            setOrdersData(batchData.dashboard_data.orders);
            
            if (productCostsCalculator) {
              const productCosts = productCostsCalculator(batchData.dashboard_data.orders);
              setSalesSummary(prev => ({ ...prev, productCosts }));
            }
          }
        } else {
          console.warn("⚠️ No se recibieron datos del dashboard");
          setError("No se recibieron datos para el período seleccionado");
          toast({
            title: "Sin datos del dashboard",
            description: "No se recibieron datos para el período seleccionado",
            variant: "destructive",
            duration: 5000
          });
        }
      }
    } catch (error: any) {
      console.error("❌ Error cargando datos de Mercado Libre:", error);
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
  }, [userId, meliUserId, dateFilter, dateRange, isConnected, getCacheKey, toast, productCostsCalculator]);

  useEffect(() => {
    const validDateRange = dateFilter !== 'custom' || 
                          (dateRange.fromISO && dateRange.toISO);
    
    if (validDateRange && userId && isConnected && meliUserId) {
      const requestKey = `${userId}-${meliUserId}-${dateFilter}-${dateRange.fromISO || ''}-${dateRange.toISO || ''}`;
      
      console.log(`🔍 Verificando carga de datos para: ${requestKey}`);
      loadData();
    }
  }, [userId, meliUserId, dateFilter, dateRange.fromISO, dateRange.toISO, isConnected, loadData]);

  // Función de utilidad para depuración
  const refresh = async () => {
    console.log("Forzando actualización de datos...");
    
    // Limpiar caché para este key
    const cacheKey = getCacheKey();
    responseCache.delete(cacheKey);
    
    // Recargar datos
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
    error
  };
}
