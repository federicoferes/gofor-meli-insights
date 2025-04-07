
import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AppSettingsContext } from '@/App';
import { formatDateForMeLi } from '@/utils/date';

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

const CACHE_TIME = 5 * 60 * 1000;

const responseCache = new Map<string, { 
  timestamp: number, 
  data: any 
}>();

/**
 * Crea un objeto con campos inicializados para el resumen de ventas
 */
const createEmptySalesSummary = () => ({
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
  
  const finalDisableTestData = disableTestData !== undefined ? disableTestData : globalDisableTestData;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState(createEmptySalesSummary());
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [costData, setCostData] = useState<any[]>([]);
  const [provinceData, setProvinceData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [prevSalesSummary, setPrevSalesSummary] = useState(createEmptySalesSummary());
  const [isTestData, setIsTestData] = useState(false);

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
    if (finalDisableTestData) {
      key += '-no-test-data';
    }
    return key;
  }, [userId, dateFilter, dateRange, finalDisableTestData]);

  const loadData = useCallback(async (retryCount = 0) => {
    if (!userId || !isConnected || !meliUserId) {
      console.log("Requisitos de carga no cumplidos", { userId, isConnected, meliUserId });
      return;
    }
    
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
          
          setIsTestData(!!cachedResponse.data.is_test_data);
          
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
      console.log("🚫 Datos de prueba desactivados:", finalDisableTestData);
      console.log("🌐 TimeZone: ", Intl.DateTimeFormat().resolvedOptions().timeZone);

      // Construir fechas en formato correcto para MeLi API (con zona horaria Argentina)
      let fromArg, toArg;
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromArg = formatDateForMeLi(fromDate);
        console.log(`📅 Fecha inicio formateada para MeLi: ${fromArg}`);
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toArg = formatDateForMeLi(toDate, true);
        console.log(`📅 Fecha fin formateada para MeLi: ${toArg}`);
      }

      // Lista de IDs de productos para el endpoint de visitas
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('item_id')
        .eq('user_id', userId);
      
      if (productsError) {
        console.warn("⚠️ Error al obtener IDs de productos:", productsError.message);
      }
      
      const productIds = productsData?.map(p => p.item_id) || [];
      console.log(`📊 Obtenidos ${productIds.length} IDs de productos para consulta de visitas`);

      const batchRequests = [
        // Búsqueda principal de órdenes con filtro por fecha
        {
          endpoint: '/orders/search',
          params: {
            seller: meliUserId,
            sort: 'date_desc',
            limit: 50,
            // Aplicar filtros de fecha formateados correctamente para MeLi
            ...((fromArg && toArg) ? {
              'order.date_created.from': fromArg,
              'order.date_created.to': toArg
            } : {})
          }
        },
        
        // Consulta de productos publicados
        {
          endpoint: `/users/${meliUserId}/items/search`,
          params: {
            limit: 100
          }
        },
        
        // FIX: Campañas de publicidad con el endpoint correcto
        {
          endpoint: `/advertising/campaigns/search`,
          params: {
            seller_id: meliUserId
          }
        },
        
        // Órdenes recientes sin filtro de fecha para garantizar que capturamos algo
        {
          endpoint: `/orders/search/recent`,
          params: {
            seller: meliUserId,
            limit: 50,
            // También aplicar filtros de fecha aquí
            ...((fromArg && toArg) ? {
              'order.date_created.from': fromArg,
              'order.date_created.to': toArg
            } : {})
          }
        },
        
        // FIX: Ya no enviamos batches de visitas sino solo los IDs para procesamiento individual
        {
          endpoint: `/visits/items`,
          params: {
            // Los IDs se procesan individualmente en el backend
            _productIds: productIds
          }
        }
      ];

      const requestPayload = {
        user_id: userId,
        batch_requests: batchRequests,
        date_range: {
          begin: dateFrom ? new Date(dateFrom).toISOString().split('T')[0] : undefined,
          end: dateTo ? new Date(dateTo).toISOString().split('T')[0] : undefined
        },
        timezone: 'America/Argentina/Buenos_Aires',
        prev_period: true,
        use_cache: false,
        disable_test_data: finalDisableTestData,
        product_ids: productIds // Enviamos los IDs por separado para procesamiento individual 
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
      console.log("📦 Payload completo:", JSON.stringify(requestPayload));
      
      const { data: batchData, error: batchError } = await supabase.functions.invoke('meli-data', {
        body: requestPayload
      });
      
      if (batchError) {
        console.error("❌ Error en invoke meli-data:", batchError);
        throw new Error(`Error al obtener datos: ${batchError.message}`);
      }
      
      if (!batchData) {
        throw new Error("No se recibieron datos de la función meli-data");
      }

      console.log("📩 Respuesta recibida de meli-data:", JSON.stringify({
        success: batchData.success,
        has_dashboard_data: !!batchData.dashboard_data,
        has_batch_results: !!batchData.batch_results,
        error: batchData.error,
        is_test_data: !!batchData.is_test_data
      }));

      // Imprimir URLs completas para debug
      if (batchData.batch_results) {
        console.log("🌐 URLs completas utilizadas:");
        batchData.batch_results.forEach(r => {
          if (r.url) {
            console.log(`- ${r.endpoint}: ${r.url}`);
          }
        });
      }

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
        dashboardData: batchData.dashboard_data ? "presente" : "ausente",
        isTestData: batchData.is_test_data ? "sí" : "no"
      });
      
      const failedResults = batchData.batch_results?.filter(r => !r.success);
      if (failedResults?.length > 0) {
        console.warn(`⚠️ ${failedResults.length} requests fallidos:`, 
          failedResults.map(r => `${r.endpoint}: ${r.error || r.status}`).join(', '));
      }
      
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        data: batchData
      });
      
      if (isMounted.current) {
        console.log("✅ Datos recibidos correctamente");
        
        // FIX: Manejamos correctamente el caso donde hay dashboard_data pero vacío
        if (batchData.dashboard_data) {
          setIsTestData(!!batchData.is_test_data);
          
          if (batchData.dashboard_data.salesByMonth?.length > 0) {
            setSalesData(batchData.dashboard_data.salesByMonth);
          }
          
          if (batchData.dashboard_data.summary) {
            // Calculamos las métricas basadas en datos reales recibidos
            const summary = batchData.dashboard_data.summary;
            
            // Calculamos la conversión (unidades / visitas) * 100
            if (summary.visits > 0 && summary.units > 0) {
              summary.conversion = (summary.units / summary.visits) * 100;
            } else {
              summary.conversion = 0;
            }
            
            // Ticket promedio (GMV / órdenes)
            if (summary.gmv > 0 && summary.orders > 0) {
              summary.avgTicket = summary.gmv / summary.orders;
            } else {
              summary.avgTicket = 0;
            }
            
            console.log("Resumen actualizado:", {
              gmv: summary.gmv,
              orders: summary.orders,
              units: summary.units,
              visits: summary.visits,
              conversion: summary.conversion,
              commissions: summary.commissions,
              shipping: summary.shipping,
              taxes: summary.taxes
            });
            
            setSalesSummary(summary);
          }
          
          if (batchData.dashboard_data.prev_summary) {
            // Aplicamos la misma lógica para el resumen del periodo anterior
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
          
          // Mostrar datos de prueba si están permitidos
          if (!batchData.is_test_data && !disable_test_data) {
            console.log("📊 No hay datos reales, generando datos de prueba...");
            // Usar una función para generar datos de prueba
            const testData = {
              summary: createEmptySalesSummary(),
              prev_summary: createEmptySalesSummary(),
              salesByMonth: [],
              costDistribution: [],
              topProducts: [],
              salesByProvince: [],
              orders: []
            };
            
            setIsTestData(true);
            
            toast({
              title: "Mostrando datos de prueba",
              description: "No se encontraron órdenes reales para el período seleccionado",
              duration: 5000
            });
            
            // Configurar datos básicos para que la UI no se rompa
            setSalesSummary(testData.summary);
            setPrevSalesSummary(testData.prev_summary);
            setSalesData(testData.salesByMonth);
            setCostData(testData.costDistribution);
            setTopProducts(testData.topProducts);
            setProvinceData(testData.salesByProvince);
            setOrdersData(testData.orders);
          } else {
            setError("No se encontraron datos para el período seleccionado");
            
            // Mostrar el error solo si datos de prueba no están permitidos
            if (disable_test_data) {
              toast({
                title: "Sin datos del dashboard",
                description: "No se encontraron órdenes para el período seleccionado",
                variant: "destructive",
                duration: 5000
              });
            }
          }
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
  }, [userId, meliUserId, dateFilter, dateRange, isConnected, getCacheKey, toast, productCostsCalculator, finalDisableTestData]);

  useEffect(() => {
    const validDateRange = dateFilter !== 'custom' || 
                          (dateRange.fromISO && dateRange.toISO);
    
    if (validDateRange && userId && isConnected && meliUserId) {
      const requestKey = `${userId}-${meliUserId}-${dateFilter}-${dateRange.fromISO || ''}-${dateRange.toISO || ''}`;
      
      console.log(`🔍 Verificando carga de datos para: ${requestKey}`);
      loadData();
    }
  }, [userId, meliUserId, dateFilter, dateRange.fromISO, dateRange.toISO, isConnected, loadData]);

  const refresh = async () => {
    console.log("Forzando actualización de datos...");
    
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
