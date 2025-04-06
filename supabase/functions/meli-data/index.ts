// Supabase Edge function para interactuar con la API de Mercado Libre
// sin dependencia de date-fns-tz

// Importar función para manejar fechas con la sintaxis correcta de Deno
import { isWithinInterval, parseISO } from "npm:date-fns";

// Helper para determinar si una fecha está en un rango
const isDateInRange = (dateStr: string, fromStr: string, toStr: string) => {
  try {
    const date = parseISO(dateStr);
    const from = parseISO(fromStr);
    const to = parseISO(toStr);
    
    return isWithinInterval(date, { start: from, end: to });
  } catch (error) {
    console.error("Error validando rango de fechas:", error);
    return false;
  }
};

// Ajustar una fecha a la zona horaria de Argentina (UTC-3)
const applyArgentinaOffset = (date: Date): Date => {
  // No es necesario manipular la zona horaria en el servidor
  // ya que las fechas ya vienen ajustadas desde el cliente
  return date;
};

// Función para procesar órdenes y calcular métricas
const processOrders = (ordersData, dateFrom, dateTo) => {
  console.log(`Procesando órdenes con rango: ${dateFrom} a ${dateTo}`);
  
  // Filtrar órdenes por estado y fecha de cierre (cuando se confirmó el pago)
  const validOrders = ordersData.results?.filter(order => {
    // Solo incluir órdenes pagadas o entregadas
    const validStatus = ['paid', 'delivered'].includes(order.status);
    
    // Preferir date_closed o la fecha de aprobación del pago
    const dateToCheck = order.date_closed || 
                       (order.payments && order.payments[0]?.date_approved) || 
                       order.date_created;
    
    const isInRange = isDateInRange(dateToCheck, dateFrom, dateTo);
    
    if (!validStatus) {
      console.log(`Orden ${order.id} ignorada: estado inválido (${order.status})`);
    } else if (!isInRange) {
      console.log(`Orden ${order.id} ignorada: fuera de rango (${dateToCheck})`);
    }
    
    return validStatus && isInRange;
  }) || [];

  console.log(`Se encontraron ${validOrders.length} órdenes válidas de ${ordersData.results?.length || 0} totales`);

  let totalGMV = 0;
  let totalCommissions = 0;
  let totalTaxes = 0;
  let totalShipping = 0;
  let totalDiscounts = 0;
  let totalRefunds = 0;
  let totalUnits = 0;
  let orderCount = 0;
  
  const soldItems = {};
  const salesByProvince = {};
  
  validOrders.forEach(order => {
    // Usar total_amount para el GMV
    const orderAmount = Number(order.total_amount) || 0;
    totalGMV += orderAmount;
    
    // Extraer comisiones, impuestos, envíos, etc.
    const commission = Number(order.marketplace_fee) || 0;
    totalCommissions += commission;
    
    // Impuestos
    const taxes = Number(order.taxes?.amount) || 0;
    totalTaxes += taxes;
    
    // Envíos
    const shipping = Number(order.shipping?.cost) || 0;
    totalShipping += shipping;
    
    // Descuentos
    const discount = Number(order.coupon?.amount) || 0;
    totalDiscounts += discount;
    
    // Reembolsos (si hay)
    const refund = Number(order.refund?.total) || 0;
    totalRefunds += refund;
    
    // Unidades vendidas
    const units = order.order_items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;
    totalUnits += units;
    
    // Contar órdenes
    orderCount++;
    
    // Procesar items vendidos para top products
    order.order_items?.forEach(item => {
      const itemId = item.item?.id;
      if (itemId) {
        if (!soldItems[itemId]) {
          soldItems[itemId] = {
            id: itemId,
            name: item.item.title,
            units: 0,
            revenue: 0
          };
        }
        soldItems[itemId].units += Number(item.quantity) || 0;
        soldItems[itemId].revenue += Number(item.unit_price * item.quantity) || 0;
      }
    });
    
    // Procesar ventas por provincia
    const province = order.shipping?.receiver_address?.state?.name || 'Desconocida';
    if (province) {
      if (!salesByProvince[province]) {
        salesByProvince[province] = {
          name: province,
          value: 0
        };
      }
      salesByProvince[province].value += orderAmount;
    }
  });
  
  // Convertir objetos a arrays para los gráficos
  const topProductsArray = Object.values(soldItems)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
    
  const salesByProvinceArray = Object.values(salesByProvince)
    .sort((a, b) => b.value - a.value);
    
  // Calcular distribución de costos
  const costDistribution = [
    { name: 'Comisiones', value: totalCommissions },
    { name: 'Impuestos', value: totalTaxes },
    { name: 'Envíos', value: totalShipping },
    { name: 'Descuentos', value: totalDiscounts },
    { name: 'Reembolsos', value: totalRefunds }
  ].filter(item => item.value > 0);
  
  return {
    orders: validOrders,
    summary: {
      gmv: totalGMV,
      commissions: totalCommissions,
      taxes: totalTaxes,
      shipping: totalShipping,
      discounts: totalDiscounts,
      refunds: totalRefunds,
      units: totalUnits,
      orders: orderCount,
      avgTicket: orderCount > 0 ? totalGMV / orderCount : 0
    },
    topProducts: topProductsArray,
    salesByProvince: salesByProvinceArray,
    costDistribution
  };
};

// Función para procesar datos de visitas
const processVisits = (visitsData) => {
  let totalVisits = 0;
  
  if (visitsData && Array.isArray(visitsData.results)) {
    visitsData.results.forEach(day => {
      totalVisits += Number(day.total) || 0;
    });
  }
  
  return totalVisits;
};

// Función para procesar datos de publicidad
const processAdvertising = (campaignsData) => {
  let totalSpend = 0;
  
  if (campaignsData && Array.isArray(campaignsData.results)) {
    campaignsData.results.forEach(campaign => {
      totalSpend += Number(campaign.total_spend) || 0;
    });
  }
  
  return totalSpend;
};

// Función para procesar todos los datos y generar el dashboard
const processOrdersAndData = (batchResults, dateRange) => {
  // Encontrar los resultados relevantes
  const ordersResult = batchResults.find(r => r.endpoint.includes('/orders/search'));
  const visitsResult = batchResults.find(r => r.endpoint.includes('/items_visits/time_window'));
  const campaignsResult = batchResults.find(r => r.endpoint.includes('/ads/campaigns'));
  
  // Procesar órdenes
  const ordersData = ordersResult?.data;
  const dateFrom = dateRange?.begin ? `${dateRange.begin}T00:00:00.000Z` : undefined;
  const dateTo = dateRange?.end ? `${dateRange.end}T23:59:59.999Z` : undefined;
  
  const processedOrders = ordersData ? processOrders(ordersData, dateFrom, dateTo) : {
    orders: [],
    summary: {
      gmv: 0, commissions: 0, taxes: 0, shipping: 0, discounts: 0,
      refunds: 0, units: 0, orders: 0, avgTicket: 0
    },
    topProducts: [],
    salesByProvince: [],
    costDistribution: []
  };
  
  // Procesar visitas
  const visitsData = visitsResult?.data;
  const totalVisits = processVisits(visitsData);
  
  // Procesar publicidad
  const campaignsData = campaignsResult?.data;
  const totalAdvertising = processAdvertising(campaignsData);
  
  // Agregar visitas y conversión al resumen
  processedOrders.summary.visits = totalVisits;
  processedOrders.summary.conversion = totalVisits > 0 ? 
    (processedOrders.summary.units / totalVisits) * 100 : 0;
  
  // Agregar gastos de publicidad
  processedOrders.summary.advertising = totalAdvertising;
  
  // Generar datos de ventas por mes para gráfico
  const salesByMonth = [];
  // Aquí iría la lógica para agrupar ventas por mes si se tienen datos históricos
  
  return {
    summary: processedOrders.summary,
    salesByMonth,
    topProducts: processedOrders.topProducts,
    salesByProvince: processedOrders.salesByProvince,
    costDistribution: processedOrders.costDistribution,
    orders: processedOrders.orders
  };
};

// Función principal para manejar la solicitud
Deno.serve(async (req) => {
  // Habilitar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    const { user_id, batch_requests, date_range, timezone = 'America/Argentina/Buenos_Aires', prev_period, use_cache } = await req.json();
    console.log(`Solicitud recibida para user_id: ${user_id}, timezone: ${timezone}`);
    console.log(`Rango de fechas:`, date_range);
    
    // Validar que tenemos un user_id
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Se requiere user_id' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Si no hay batch_requests, verificar la conexión con MeLi
    if (!batch_requests || batch_requests.length === 0) {
      const { data: connections, error } = await supabase
        .from('meli_connections')
        .select('*')
        .eq('user_id', user_id)
        .single();
      
      if (error) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            is_connected: false,
            error: 'No se encontró conexión con MeLi' 
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          is_connected: true,
          meli_user_id: connections.meli_user_id
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener token de acceso para MeLi
    const { data: connection, error: connectionError } = await supabase
      .from('meli_connections')
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se encontró conexión con MeLi' 
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar si el token está expirado y refrescarlo si es necesario
    const now = Math.floor(Date.now() / 1000);
    let accessToken = connection.access_token;
    
    if (now >= connection.expires_at) {
      // Refrescar token
      const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: Deno.env.get('MELI_APP_ID') || '',
          client_secret: Deno.env.get('MELI_SECRET_KEY') || '',
          refresh_token: connection.refresh_token
        }).toString()
      });
      
      if (!refreshResponse.ok) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Error al refrescar token de MeLi' 
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      
      // Actualizar token en la base de datos
      await supabase
        .from('meli_connections')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: now + refreshData.expires_in
        })
        .eq('user_id', user_id);
    }
    
    // Ejecutar batch de requests a la API de MeLi
    const batchPromises = batch_requests.map(async (request) => {
      const { endpoint, params } = request;
      
      // Construir URL con parámetros
      const url = new URL(`https://api.mercadolibre.com${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      
      console.log(`Ejecutando request a: ${url.toString()}`);
      
      // Hacer la petición a MeLi
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return {
          endpoint,
          success: false,
          status: response.status,
          error: errorText
        };
      }
      
      const data = await response.json();
      return {
        endpoint,
        success: true,
        data
      };
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    // Procesar los datos para el dashboard
    const dashboardData = processOrdersAndData(batchResults, date_range);
    console.log(`Datos procesados: ${dashboardData.orders?.length || 0} órdenes`);
    
    // Si se solicita período anterior, calcularlo también
    if (prev_period && date_range?.begin && date_range?.end) {
      // Calcular fechas del período anterior
      const beginDate = new Date(date_range.begin);
      const endDate = new Date(date_range.end);
      const daysDiff = Math.floor((endDate.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const prevBeginDate = new Date(beginDate);
      prevBeginDate.setDate(prevBeginDate.getDate() - daysDiff - 1);
      const prevEndDate = new Date(beginDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      
      const prevDateRange = {
        begin: prevBeginDate.toISOString().split('T')[0],
        end: prevEndDate.toISOString().split('T')[0]
      };
      
      // Buscar órdenes del período anterior
      const prevFromDate = `${prevDateRange.begin}T00:00:00.000Z`;
      const prevToDate = `${prevDateRange.end}T23:59:59.999Z`;
      
      // Encontrar el resultado de órdenes
      const ordersResult = batchResults.find(r => r.endpoint.includes('/orders/search'));
      if (ordersResult?.data) {
        // Procesar órdenes del período anterior con las mismas funciones
        const prevProcessedOrders = processOrders(ordersResult.data, prevFromDate, prevToDate, timezone);
        
        // Agregar al dashboard
        dashboardData.prev_summary = prevProcessedOrders.summary;
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        batch_results: batchResults,
        dashboard_data: dashboardData
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en meli-data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
});
