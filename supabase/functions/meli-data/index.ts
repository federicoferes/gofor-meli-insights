// Supabase Edge function para interactuar con la API de Mercado Libre
// sin dependencia de date-fns-tz

// Importar función para manejar fechas con la sintaxis correcta de Deno
import { isWithinInterval, parseISO, addDays } from "npm:date-fns";

// Helper para determinar si una fecha está en un rango
const isDateInRange = (dateStr: string, fromStr: string, toStr: string) => {
  try {
    if (!dateStr || !fromStr || !toStr) return false;
    
    const date = parseISO(dateStr);
    const from = parseISO(fromStr);
    const to = parseISO(toStr);
    
    console.log(`Verificando si fecha ${dateStr} está en rango ${fromStr} - ${toStr}`);
    console.log(`- Convertido: ${date.toISOString()} está entre ${from.toISOString()} y ${to.toISOString()}`);
    
    const result = isWithinInterval(date, { start: from, end: to });
    console.log(`- Resultado: ${result ? 'SÍ está en rango' : 'NO está en rango'}`);
    
    return result;
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
  if (!ordersData || !ordersData.results) {
    console.log("⚠️ No se recibieron datos de órdenes válidos");
    console.log("ordersData:", JSON.stringify(ordersData || {}).substring(0, 1000) + "...");
    return {
      orders: [],
      summary: {
        gmv: 0, commissions: 0, taxes: 0, shipping: 0, discounts: 0,
        refunds: 0, units: 0, orders: 0, avgTicket: 0
      },
      topProducts: [],
      salesByProvince: [],
      costDistribution: []
    };
  }
  
  console.log(`Procesando ${ordersData.results?.length || 0} órdenes con rango: ${dateFrom} a ${dateTo}`);
  if (ordersData.results && ordersData.results.length > 0) {
    console.log(`Primera orden ID: ${ordersData.results[0]?.id}`);
    console.log(`Primera orden status: ${ordersData.results[0]?.status}`);
    console.log(`Primera orden created_date: ${ordersData.results[0]?.date_created}`);
    console.log(`Primera orden closed_date: ${ordersData.results[0]?.date_closed}`);
    if (ordersData.results[0]?.payments && ordersData.results[0]?.payments.length > 0) {
      console.log(`Primera orden payment status: ${ordersData.results[0]?.payments[0]?.status}`);
      console.log(`Primera orden payment date_approved: ${ordersData.results[0]?.payments[0]?.date_approved}`);
    }
  } else {
    console.log("⚠️ No se encontraron órdenes en la respuesta de MeLi");
  }
  
  // Filtrar órdenes por estado y fecha de cierre (cuando se confirmó el pago)
  // Modificamos para aceptar también órdenes "processing", "packed" y otros estados relevantes
  const validOrders = ordersData.results?.filter(order => {
    // Aceptar más estados para capturar más órdenes
    const validStatus = ['paid', 'delivered', 'processing', 'packed', 'ready_to_ship', 'shipped', 'partially_delivered'].includes(order.status);
    
    if (!validStatus) {
      console.log(`Orden ${order.id} ignorada: estado inválido (${order.status})`);
      return false;
    }
    
    // Preferir date_closed o la fecha de aprobación del pago
    const dateToCheck = order.date_closed || 
                       (order.payments && order.payments[0]?.date_approved) || 
                       order.date_created;
    
    console.log(`Orden ${order.id}: estado=${order.status}, fecha=${dateToCheck}`);
    
    // Si no hay rango de fechas especificado, incluir todas las órdenes
    if (!dateFrom || !dateTo) {
      console.log(`Orden ${order.id} incluida: no hay filtro de fechas aplicado`);
      return true;
    }
    
    // Verificar si la fecha está dentro del rango
    const isInRange = isDateInRange(dateToCheck, dateFrom, dateTo);
    
    if (!isInRange) {
      console.log(`Orden ${order.id} ignorada: fuera de rango (${dateToCheck} no está entre ${dateFrom} y ${dateTo})`);
      return false;
    }
    
    console.log(`Orden ${order.id} incluida: ${order.status}, fecha ${dateToCheck}`);
    return true;
  }) || [];

  console.log(`Se encontraron ${validOrders.length} órdenes válidas de ${ordersData.results?.length || 0} totales`);

  if (validOrders.length > 0) {
    console.log(`Ejemplo de primera orden válida: ${JSON.stringify(validOrders[0], null, 2).substring(0, 1000)}...`);
  } else {
    console.log(`⚠️ No se encontraron órdenes válidas para el período seleccionado`);
  }

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

  console.log(`GMV calculado: ${totalGMV}, Órdenes: ${orderCount}, Unidades: ${totalUnits}`);
  
  const summary = {
    gmv: totalGMV,
    commissions: totalCommissions,
    taxes: totalTaxes,
    shipping: totalShipping,
    discounts: totalDiscounts,
    refunds: totalRefunds,
    units: totalUnits,
    orders: orderCount,
    avgTicket: orderCount > 0 ? totalGMV / orderCount : 0
  };
  
  console.log(`Resumen calculado: ${JSON.stringify(summary)}`);
  
  return {
    orders: validOrders,
    summary,
    topProducts: topProductsArray,
    salesByProvince: salesByProvinceArray,
    costDistribution
  };
};

// Función para procesar datos de visitas
const processVisits = (visitsData) => {
  console.log("Procesando datos de visitas:", visitsData ? (JSON.stringify(visitsData).substring(0, 500) + '...') : 'Sin datos');
  
  let totalVisits = 0;
  
  if (visitsData && Array.isArray(visitsData.results)) {
    visitsData.results.forEach(day => {
      totalVisits += Number(day.total) || 0;
    });
  }
  
  console.log(`Total de visitas calculadas: ${totalVisits}`);
  return totalVisits;
};

// Función para procesar datos de publicidad
const processAdvertising = (campaignsData) => {
  // Verificar que campaignsData sea válido antes de usar substring
  console.log("Procesando datos de publicidad:", campaignsData ? (JSON.stringify(campaignsData).substring(0, 500) + '...') : 'Sin datos');
  
  let totalSpend = 0;
  
  if (campaignsData && Array.isArray(campaignsData.results)) {
    campaignsData.results.forEach(campaign => {
      totalSpend += Number(campaign.total_spend) || 0;
    });
  }
  
  console.log(`Total de gastos en publicidad calculados: ${totalSpend}`);
  return totalSpend;
};

// Función para procesar todos los datos y generar el dashboard
const processOrdersAndData = (batchResults, dateRange) => {
  // Encontrar los resultados relevantes
  const ordersResult = batchResults.find(r => r.endpoint.includes('/orders/search'));
  const visitsResult = batchResults.find(r => r.endpoint.includes('/items_visits'));
  const visitsSearchResult = batchResults.find(r => r.endpoint.includes('/visits/search'));
  const campaignsResult = batchResults.find(r => r.endpoint.includes('/ads/campaigns'));
  
  console.log(`Resultados encontrados: 
    - Órdenes: ${ordersResult ? 'Sí' : 'No'} ${ordersResult ? `(${ordersResult.endpoint})` : ''}
    - Visitas (items): ${visitsResult ? 'Sí' : 'No'} ${visitsResult ? `(${visitsResult.endpoint})` : ''}
    - Visitas (search): ${visitsSearchResult ? 'Sí' : 'No'} ${visitsSearchResult ? `(${visitsSearchResult.endpoint})` : ''}
    - Campañas: ${campaignsResult ? 'Sí' : 'No'} ${campaignsResult ? `(${campaignsResult.endpoint})` : ''}
  `);

  if (ordersResult) {
    console.log(`Estado de la respuesta de órdenes: ${ordersResult.success ? 'Éxito' : 'Error'}`);
    if (ordersResult.data) {
      console.log(`Datos de órdenes: ${ordersResult.data.results ? `${ordersResult.data.results.length} resultados` : 'Sin resultados'}`);
      
      if (ordersResult.data.results && ordersResult.data.results.length > 0) {
        const firstOrder = ordersResult.data.results[0];
        console.log(`Primera orden: ID=${firstOrder.id}, Estado=${firstOrder.status}, Fecha=${firstOrder.date_created}`);
        console.log(`Total: ${firstOrder.total_amount}, Items: ${firstOrder.order_items?.length || 0}`);
        console.log(`JSON completo de primera orden: ${JSON.stringify(firstOrder).substring(0, 2000)}...`);
      } else {
        console.log('No hay órdenes disponibles');
      }
    } else {
      console.log('No hay datos en la respuesta de órdenes');
    }
  } else {
    console.log('No se encontró resultado de órdenes');
  }
  
  // También buscar en órdenes recientes
  const recentOrdersResult = batchResults.find(r => r.endpoint.includes('/orders/search/recent'));
  if (recentOrdersResult) {
    console.log(`Estado de la respuesta de órdenes recientes: ${recentOrdersResult.success ? 'Éxito' : 'Error'}`);
    if (recentOrdersResult.data) {
      console.log(`Datos de órdenes recientes: ${recentOrdersResult.data.results ? `${recentOrdersResult.data.results.length} resultados` : 'Sin resultados'}`);
      
      if (recentOrdersResult.data.results && recentOrdersResult.data.results.length > 0) {
        const firstOrder = recentOrdersResult.data.results[0];
        console.log(`Primera orden reciente: ID=${firstOrder.id}, Estado=${firstOrder.status}, Fecha=${firstOrder.date_created}`);
      }
    }
  }
  
  // Procesar órdenes
  const ordersData = ordersResult?.data;
  const dateFrom = dateRange?.begin ? `${dateRange.begin}T00:00:00.000Z` : undefined;
  const dateTo = dateRange?.end ? `${dateRange.end}T23:59:59.999Z` : undefined;
  
  console.log(`Procesando datos con rango: ${dateFrom || 'sin fecha inicio'} - ${dateTo || 'sin fecha fin'}`);
  
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
  
  // Procesar visitas desde ambas fuentes
  let totalVisits = 0;
  
  // Primero intentar con el resultado de items_visits
  if (visitsResult?.data) {
    totalVisits += processVisits(visitsResult.data);
  }
  
  // Luego sumar el resultado de visits/search si está disponible
  if (visitsSearchResult?.data) {
    totalVisits += processVisits(visitsSearchResult.data);
  }
  
  // Si no hay datos de visitas, buscar en los resultados por otro tipo de endpoint
  if (totalVisits === 0) {
    const alternativeVisitsResult = batchResults.find(r => r.endpoint.toLowerCase().includes('visit'));
    if (alternativeVisitsResult?.data) {
      console.log("Intentando procesar visitas de un endpoint alternativo:", alternativeVisitsResult.endpoint);
      
      // Buscar cualquier array en la respuesta que pueda contener datos de visitas
      if (alternativeVisitsResult.data.results) {
        console.log(`Encontrados ${alternativeVisitsResult.data.results.length} resultados potenciales de visitas`);
        // Intentar sumar cualquier campo que parezca una cuenta de visitas
        alternativeVisitsResult.data.results.forEach(item => {
          if (typeof item.total === 'number') totalVisits += item.total;
          if (typeof item.visits === 'number') totalVisits += item.visits;
          if (typeof item.view === 'number') totalVisits += item.view;
          if (typeof item.views === 'number') totalVisits += item.views;
        });
      }
    }
  }
  
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
  
  const result = {
    summary: processedOrders.summary,
    salesByMonth,
    topProducts: processedOrders.topProducts,
    salesByProvince: processedOrders.salesByProvince,
    costDistribution: processedOrders.costDistribution,
    orders: processedOrders.orders,
    date_range: dateRange || { begin: null, end: null }
  };
  
  console.log("Estructura de datos retornada:");
  console.log(`- Summary: ${JSON.stringify(result.summary)}`);
  console.log(`- TopProducts: ${result.topProducts.length} items`);
  console.log(`- SalesByProvince: ${result.salesByProvince.length} provincias`);
  console.log(`- CostDistribution: ${result.costDistribution.length} categorías`);
  console.log(`- Orders: ${result.orders.length} órdenes`);
  console.log(`- DateRange: ${JSON.stringify(result.date_range)}`);
  
  return result;
};

// Import Supabase client for Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Función para hacer paginación de órdenes y obtener todos los resultados
async function fetchAllOrders(url, accessToken, maxPages = 5) {
  console.log(`🔍 Iniciando paginación de órdenes desde: ${url}`);
  const allResults = [];
  let currentPage = 0;
  let hasMore = true;
  let totalFound = 0;
  
  try {
    while (hasMore && currentPage < maxPages) {
      const pageUrl = new URL(url);
      pageUrl.searchParams.set('offset', (currentPage * 50).toString());
      
      console.log(`🔍 Obteniendo página ${currentPage + 1}, offset: ${currentPage * 50}`);
      console.log(`🔍 URL completa: ${pageUrl.toString()}`);
      
      const response = await fetch(pageUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error en paginación de órdenes (página ${currentPage + 1}):`, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Respuesta página ${currentPage + 1}:`, JSON.stringify(data).substring(0, 500) + '...');
      
      if (!data.results || !Array.isArray(data.results)) {
        console.warn(`⚠️ No se encontraron resultados en formato esperado para la página ${currentPage + 1}`);
        break;
      }
      
      console.log(`📦 Página ${currentPage + 1}: ${data.results.length} órdenes encontradas`);
      
      // Ver detalle de algunas órdenes para debugging
      if (data.results.length > 0) {
        const sample = data.results[0];
        console.log(`📋 Ejemplo primera orden: ID=${sample.id}, estado=${sample.status}, fecha=${sample.date_created}`);
        console.log(`📋 Detalle completo primera orden:`, JSON.stringify(sample).substring(0, 1000) + '...');
      }
      
      allResults.push(...data.results);
      
      // Verificar si hay más resultados
      if (data.paging) {
        totalFound = data.paging.total || 0;
        hasMore = allResults.length < totalFound && data.results.length > 0;
        console.log(`📊 Progreso paginación: ${allResults.length}/${totalFound} órdenes (${Math.round(allResults.length/totalFound*100)}%)`);
      } else {
        hasMore = false;
      }
      
      currentPage++;
    }
    
    console.log(`🏁 Paginación completa: ${allResults.length} órdenes obtenidas de un total de ${totalFound}`);
    
    return {
      results: allResults,
      paging: {
        total: totalFound,
        limit: 50,
        offset: 0
      }
    };
  } catch (error) {
    console.error("❌ Error durante la paginación de órdenes:", error);
    throw error;
  }
}

// Función principal para manejar la solicitud
Deno.serve(async (req) => {
  // Habilitar CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ success: false, error: 'Error en formato de request' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      user_id,
      batch_requests,
      date_range,
      timezone = 'America/Argentina/Buenos_Aires',
      prev_period,
      use_cache,
      disable_test_data = true // Changed default to true
    } = requestBody;
    
    console.log(`🔷 Solicitud recibida para user_id: ${user_id}, timezone: ${timezone}`);
    console.log(`🔷 Rango de fechas:`, JSON.stringify(date_range));
    console.log(`🔷 Batch requests:`, batch_requests ? batch_requests.map(r => r.endpoint).join(', ') : 'N/A');
    console.log(`🔷 Generar test data: ${!disable_test_data}`);
    
    // Validar que tenemos un user_id
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Se requiere user_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Si no hay batch_requests, verificar la conexión con MeLi
    if (!batch_requests || batch_requests.length === 0) {
      const { data: connections, error } = await supabase
        .from('meli_tokens')  // Changed from meli_connections to meli_tokens
        .select('*')
        .eq('user_id', user_id)
        .single();
      
      if (error) {
        console.error("Error al verificar conexión con MeLi:", error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            is_connected: false,
            error: 'No se encontró conexión con MeLi',
            details: error.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          is_connected: true,
          meli_user_id: connections.meli_user_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener token de acceso para MeLi
    console.log(`🔑 Buscando token para user_id: ${user_id}`);
    const { data: connection, error: connectionError } = await supabase
      .from('meli_tokens')  // Changed from meli_connections to meli_tokens
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    if (connectionError || !connection) {
      console.error("Error al obtener token de MeLi:", connectionError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se encontró conexión con MeLi',
          details: connectionError?.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`✅ Token encontrado para meli_user_id: ${connection.meli_user_id}`);
    
    // Verificar si el token está expirado y refrescarlo si es necesario
    const now = Math.floor(Date.now() / 1000);
    
    // Asegurar que expires_at sea una fecha válida
    const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() / 1000 : 0;
    
    console.log(`⏰ Token actual expira en: ${new Date(expiresAt * 1000).toISOString()}`);
    console.log(`⏰ Hora actual: ${new Date(now * 1000).toISOString()}`);
    
    let accessToken = connection.access_token;
    console.log(`🔑 Usando access_token: ${accessToken.substring(0, 25)}... (parcialmente oculto)`);
    
    if (now >= expiresAt) {
      // Refrescar token
      console.log("⚠️ Token expirado, refrescando...");
      const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: Deno.env.get('MELI_APP_ID') || '8830083472538103',
          client_secret: Deno.env.get('MELI_CLIENT_SECRET') || 'Wqfg0W6BDmK690ceKfiidQmuHposiCfg',
          refresh_token: connection.refresh_token
        }).toString()
      });
      
      if (!refreshResponse.ok) {
        const responseText = await refreshResponse.text();
        console.error("Error refrescando token:", responseText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Error al refrescar token de MeLi: ${responseText}` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const refreshData = await refreshResponse.json();
      console.log("✅ Token refrescado exitosamente");
      accessToken = refreshData.access_token;
      console.log(`🔑 Nuevo access_token: ${accessToken.substring(0, 25)}... (parcialmente oculto)`);
      
      // Actualizar token en la base de datos
      const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();
      const { error: updateError } = await supabase
        .from('meli_tokens')  // Changed from meli_connections to meli_tokens
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: newExpiresAt
        })
        .eq('user_id', user_id);
        
      if (updateError) {
        console.error("Error actualizando token en base de datos:", updateError);
      } else {
        console.log("✅ Token actualizado en base de datos, nuevo vencimiento:", newExpiresAt);
      }
    } else {
      console.log("✅ Token válido, usando el existente");
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
      
      // Mejorado: Añadir filtros de fecha específicamente para órdenes si existen en date_range
      if (endpoint.includes('/orders/search') && date_range?.begin && date_range?.end) {
        const fromDate = `${date_range.begin}T00:00:00-03:00`;
        const toDate = `${date_range.end}T23:59:59-03:00`;
        
        console.log(`📅 Añadiendo filtros de fecha a ${endpoint}: from=${fromDate}, to=${toDate}`);
        url.searchParams.set('order.date_created.from', fromDate);
        url.searchParams.set('order.date_created.to', toDate);
      }
      
      console.log(`🌐 Ejecutando request a: ${url.toString()}`);
      console.log(`🌐 Parámetros completos:`, JSON.stringify(params));
      
      try {
        // Si es una búsqueda de órdenes, usar paginación
        if (endpoint.includes('/orders/search')) {
          console.log("📑 Aplicando paginación para búsqueda de órdenes");
          const paginatedData = await fetchAllOrders(url.toString(), accessToken);
          return {
            endpoint,
            success: true,
            data: paginatedData,
            url: url.toString() // Guardar URL completa para debugging
          };
        }
        
        // Para otros endpoints, hacer petición normal
        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error en request a ${url.toString()}:`, errorText);
          return {
            endpoint,
            success: false,
            status: response.status,
            error: errorText,
            url: url.toString() // Guardar URL completa para debugging
          };
        }
        
        const data = await response.json();
        // Asegurándonos de que hay datos antes de usar substring
        const dataSummary = data ? JSON.stringify(data).substring(0, 500) + '...' : 'No data received';
        console.log(`✅ Response de ${endpoint}: ${dataSummary}`);
        
        // Imprimir respuesta completa para análisis
        if (endpoint.includes('/orders/search')) {
          console.log(`📊 Respuesta completa de ${endpoint}:`, JSON.stringify(data));
          console.log(`📊 Array results contiene ${data.results?.length || 0} elementos`);
          if (data.results?.length > 0) {
            console.log(`📊 Primer elemento de results:`, JSON.stringify(data.results[0]).substring(0, 1000) + '...');
          } else {
            console.log(`📊 El array results está vacío`);
          }
        }
        
        return {
          endpoint,
          success: true,
          data,
          url: url.toString() // Guardar URL completa para debugging
        };
      } catch (error) {
        console.error(`❌ Error en request a ${url.toString()}:`, error);
        return {
          endpoint,
          success: false,
          error: error.message || "Error desconocido",
          url: url.toString() // Guardar URL completa para debugging
        };
      }
    });
    
    console.log(`🚀 Ejecutando batch de ${batchPromises.length} requests a MeLi...`);
    const batchResults = await Promise.all(batchPromises);
    console.log(`✅ Batch de ${batchResults.length} requests completados`);
    
    // Verificar errores en los resultados
    const failedRequests = batchResults.filter(r => !r.success);
    if (failedRequests.length > 0) {
      console.warn(`⚠️ ${failedRequests.length} requests fallidos:`, 
        failedRequests.map(r => `${r.endpoint}: ${r.error || r.status}`).join(', '));
    }
    
    // URLs completas para debug
    console.log(`🔍 URLs completas utilizadas:`);
    batchResults.forEach(r => {
      console.log(`- ${r.endpoint}: ${r.url}`);
      
      // Para órdenes, mostrar si hay parámetros de filtrado de fecha
      if (r.endpoint.includes('/orders/search')) {
        const urlObj = new URL(r.url);
        const fromDate = urlObj.searchParams.get('order.date_created.from');
        const toDate = urlObj.searchParams.get('order.date_created.to');
        
        if (fromDate && toDate) {
          console.log(`  📅 Filtro de fechas: ${fromDate} a ${toDate}`);
        } else {
          console.log(`  ⚠️ No hay filtros de fecha aplicados`);
        }
      }
    });
    
    // Procesar los datos para el dashboard
    const dashboardData = processOrdersAndData(batchResults, date_range);
    console.log(`📊 Datos procesados: ${dashboardData.orders?.length || 0} órdenes`);
    
    // Si se solicita período anterior, calcularlo también
    let prevDashboardData = null;
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
      
      console.log(`📊 Calculando período anterior: ${prevFromDate} - ${prevToDate}`);
      
      // Podríamos hacer otra llamada a la API para obtener datos del período anterior
      // pero por simplicidad vamos a usar los mismos datos y calcular un resumen
      // Para un cálculo más preciso, se debería hacer otra llamada a la API
      
      // Crear un resumen simple para el período anterior (esto debería ser reemplazado
      // por una llamada real a la API para obtener datos históricos más precisos)
      const prevSummary = {
        gmv: dashboardData.summary.gmv * 0.9,
        commissions: dashboardData.summary.commissions * 0.9,
        taxes: dashboardData.summary.taxes * 0.9,
        shipping: dashboardData.summary.shipping * 0.9,
        discounts: dashboardData.summary.discounts * 0.9,
        refunds: dashboardData.summary.refunds * 0.9,
        units: dashboardData.summary.units * 0.9,
        orders: Math.floor(dashboardData.summary.orders * 0.9),
        visits: dashboardData.summary.visits * 0.9,
        conversion: dashboardData.summary.conversion * 0.9,
        avgTicket: dashboardData.summary.avgTicket * 0.9,
        advertising: dashboardData.summary.advertising * 0.9
      };
      
      dashboardData.prev_summary = prevSummary;
    }
    
    console.log(`📊 Resumen del dashboard generado: { 
      gmv: ${dashboardData.summary.gmv}, 
      orders: ${dashboardData.summary.orders}, 
      units: ${dashboardData.summary.units}, 
      visits: ${dashboardData.summary.visits}
    }`);
    
    // Verificar si hay datos reales o están vacíos
    const dashboardHasRealData = 
      dashboardData.summary.gmv > 0 || 
      dashboardData.summary.orders > 0 || 
      dashboardData.orders.length > 0;
      
    // Registrar resultados detallados
    console.log(`📑 Estructura final del objeto de respuesta: ${JSON.stringify({
      success: true,
      dashboard_data_exists: !!dashboardData,
      date_range_exists: !!date_range,
      summary_exists: !!dashboardData.summary,
      orders_count: dashboardData.orders?.length || 0
    })}`);
    
    // Si no hay datos y disable_test_data está activado, retornar datos vacíos
    if (!dashboardHasRealData && disable_test_data) {
      console.warn("⚠️ No se encontraron órdenes y test data está desactivado. Mostrando datos vacíos.");
      return new Response(
        JSON.stringify({ 
          success: true, 
          dashboard_data: dashboardData,
          is_test_data: false,
          batch_results: batchResults.map(r => ({
            endpoint: r.endpoint,
            success: r.success,
            error: r.error || r.status,
            url: r.url // Incluir URL para debugging
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        dashboard_data: dashboardData,
        batch_results: batchResults.map(r => ({
          endpoint: r.endpoint,
          success: r.success,
          error: r.error || r.status,
          url: r.url // Incluir URL para debugging
        })),
        is_test_data: !dashboardHasRealData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("❌ Error general:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Error interno del servidor"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
