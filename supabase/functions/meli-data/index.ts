
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper para procesar respuestas con CORS
const responseWithCors = (body: any, status = 200) => {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
};

// Función para generar datos de prueba
function generateTestData(dateRange?: { begin?: string; end?: string }) {
  console.log("🧪 Generando datos de prueba para:", dateRange);
  
  // Generar resumen básico
  const summary = {
    gmv: 1234567.89,
    orders: 123,
    units: 156,
    visits: 3500,
    conversion: 4.46,
    avgTicket: 10037.14,
    commissions: 86420,
    shipping: 25000,
    taxes: 58900,
    advertising: 12500,
    productCosts: 650000,
  };
  
  // Periodo anterior un 10% menos
  const prevSummary = {
    gmv: summary.gmv * 0.9,
    orders: Math.floor(summary.orders * 0.9),
    units: Math.floor(summary.units * 0.9),
    visits: Math.floor(summary.visits * 0.9),
    conversion: summary.conversion * 0.9,
    avgTicket: summary.avgTicket * 0.9,
    commissions: summary.commissions * 0.9,
    shipping: summary.shipping * 0.9,
    taxes: summary.taxes * 0.9,
    advertising: summary.advertising * 0.9,
    productCosts: summary.productCosts * 0.9,
  };
  
  // Generar ventas por mes
  const salesByMonth = [
    { name: "Ene", value: 850000 },
    { name: "Feb", value: 920000 },
    { name: "Mar", value: 1050000 },
    { name: "Abr", value: 980000 },
    { name: "May", value: 1120000 },
    { name: "Jun", value: 1250000 },
  ];
  
  // Generar distribución de costos
  const costDistribution = [
    { name: "Comisiones", value: summary.commissions },
    { name: "Impuestos", value: summary.taxes },
    { name: "Envíos", value: summary.shipping },
    { name: "IVA", value: summary.gmv * 0.21 },
    { name: "Publicidad", value: summary.advertising },
    { name: "Costo de productos", value: summary.productCosts }
  ];
  
  // Generar top productos
  const topProducts = [
    { id: "MLA123456", name: "Smartphone XYZ", units: 43, revenue: 430000 },
    { id: "MLA234567", name: "Auriculares Bluetooth", units: 38, revenue: 114000 },
    { id: "MLA345678", name: "Smartwatch", units: 25, revenue: 175000 },
    { id: "MLA456789", name: "Cargador USB-C", units: 67, revenue: 53600 },
    { id: "MLA567890", name: "Funda Protectora", units: 89, revenue: 44500 },
  ];
  
  // Generar ventas por provincia
  const salesByProvince = [
    { name: "Buenos Aires", value: 450000 },
    { name: "CABA", value: 320000 },
    { name: "Córdoba", value: 200000 },
    { name: "Santa Fe", value: 150000 },
    { name: "Mendoza", value: 85000 },
    { name: "Otros", value: 120000 },
  ];
  
  // Generar órdenes de ejemplo
  const orders = Array(50).fill(null).map((_, index) => {
    const productIndex = Math.floor(Math.random() * topProducts.length);
    const product = topProducts[productIndex];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const unitPrice = product.revenue / product.units;
    
    const order = {
      id: `TEST-ORDER-${1000 + index}`,
      status: "paid",
      date_created: new Date().toISOString(),
      total_amount: unitPrice * quantity,
      buyer: {
        id: `TEST-USER-${5000 + index}`,
        nickname: `test_user_${5000 + index}`,
        first_name: "Usuario",
        last_name: "Test",
        shipping_address: {
          state: {
            name: salesByProvince[Math.floor(Math.random() * salesByProvince.length)].name
          }
        }
      },
      order_items: [
        {
          item: {
            id: product.id,
            title: product.name,
            seller_custom_field: product.id,
          },
          quantity,
          unit_price: unitPrice,
        }
      ],
      shipping: {
        shipping_option: {
          cost: Math.floor(Math.random() * 3000) + 500,
        }
      },
      fee_details: [
        {
          type: "mercadopago_fee",
          amount: Math.floor(unitPrice * quantity * 0.05)
        },
        {
          type: "sales_fee",
          amount: Math.floor(unitPrice * quantity * 0.02)
        }
      ],
      taxes: {
        amount: Math.floor(unitPrice * quantity * 0.03)
      }
    };
    
    return order;
  });
  
  return {
    summary,
    prevSummary,
    salesByMonth,
    costDistribution,
    topProducts,
    salesByProvince,
    orders
  };
}

// Función para procesar órdenes y extraer métricas
function processOrders(orders, salesByProduct = {}) {
  if (!orders || !orders.length) {
    console.warn("⚠️ No se encontraron órdenes para procesar");
    return {
      summary: {},
      salesByMonth: [],
      salesByProvince: [],
      topProducts: [],
      costDistribution: []
    };
  }
  
  console.log(`🛒 Procesando ${orders.length} órdenes`);
  
  const summary = {
    gmv: 0,
    orders: orders.length,
    units: 0,
    commissions: 0,
    shipping: 0,
    taxes: 0,
    visits: 0
  };
  
  // Contadores para agrupamientos
  const monthlyData = {};
  const provincesData = {};
  const productsData = {};
  
  // Procesar cada orden
  orders.forEach(order => {
    if (!order.order_items || order.status === "cancelled") return;
    
    let orderTotal = 0;
    let orderUnits = 0;
    
    // Procesar items de la orden según documentación de MeLi
    order.order_items.forEach(orderItem => {
      const { item, quantity, unit_price } = orderItem;
      
      // Calcular GMV: precio unitario * cantidad (NO usar total_amount)
      const itemTotal = unit_price * quantity;
      orderTotal += itemTotal;
      orderUnits += quantity;
      
      // Acumular datos por producto
      if (item && item.id) {
        if (!productsData[item.id]) {
          productsData[item.id] = {
            id: item.id,
            name: item.title,
            units: 0,
            revenue: 0,
            seller_custom_field: item.seller_custom_field
          };
        }
        
        productsData[item.id].units += quantity;
        productsData[item.id].revenue += itemTotal;
        
        // Añadir ventas por producto para visitas
        if (salesByProduct && item.id) {
          if (!salesByProduct[item.id]) {
            salesByProduct[item.id] = {
              units: 0,
              revenue: 0
            };
          }
          salesByProduct[item.id].units += quantity;
          salesByProduct[item.id].revenue += itemTotal;
        }
      }
    });
    
    // Actualizar GMV y unidades vendidas
    summary.gmv += orderTotal;
    summary.units += orderUnits;
    
    // Extraer comisiones según documentación
    if (order.fee_details && Array.isArray(order.fee_details)) {
      order.fee_details.forEach(fee => {
        summary.commissions += fee.amount || 0;
      });
    }
    
    // Extraer costos de envío
    if (order.shipping && order.shipping.shipping_option) {
      summary.shipping += order.shipping.shipping_option.cost || 0;
    }
    
    // Extraer impuestos
    if (order.taxes) {
      // API de MeLi puede devolver tanto un objeto con amount como un array de taxes
      if (typeof order.taxes === 'object' && order.taxes.amount) {
        summary.taxes += order.taxes.amount;
      } else if (Array.isArray(order.taxes)) {
        order.taxes.forEach(tax => {
          summary.taxes += tax.amount || 0;
        });
      }
    }
    
    // Agrupar ventas por mes
    const date = new Date(order.date_created);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        name: monthNames[date.getMonth()],
        value: 0
      };
    }
    monthlyData[monthKey].value += orderTotal;
    
    // Agrupar ventas por provincia
    const province = order.buyer?.shipping_address?.state?.name || "No especificada";
    if (!provincesData[province]) {
      provincesData[province] = {
        name: province,
        value: 0
      };
    }
    provincesData[province].value += orderTotal;
  });
  
  // Ordenar productos por revenue
  const topProducts = Object.values(productsData)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10);
  
  // Ordenar ventas por mes
  const salesByMonth = Object.values(monthlyData)
    .sort((a: any, b: any) => {
      const monthIndex = (month: string) => ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].indexOf(month);
      return monthIndex(a.name) - monthIndex(b.name);
    });
  
  // Ordenar ventas por provincia
  const salesByProvince = Object.values(provincesData)
    .sort((a: any, b: any) => b.value - a.value);
  
  // Distribución de costos
  const costDistribution = [
    { name: "Comisiones", value: summary.commissions },
    { name: "Impuestos", value: summary.taxes },
    { name: "Envíos", value: summary.shipping },
  ];

  return {
    summary,
    salesByMonth,
    salesByProvince,
    topProducts,
    costDistribution
  };
}

// Función para procesar datos de visitas - FIX: Ahora procesa requests individuales
async function processVisits(visitResponses, itemIds = []) {
  let totalVisits = 0;
  const itemVisits = {};
  
  // Primero procesamos las respuestas batch que pudieron funcionar (para compatibilidad)
  if (visitResponses && visitResponses.length > 0) {
    console.log(`👁️ Procesando ${visitResponses.length} respuestas de visitas batch`);
    
    visitResponses.forEach(visitResponse => {
      if (visitResponse && visitResponse.success && visitResponse.data) {
        const visitsData = visitResponse.data;
        
        // Extraer visitas por item
        if (Array.isArray(visitsData)) {
          visitsData.forEach(visitItem => {
            if (visitItem && visitItem.id && visitItem.total_visits) {
              itemVisits[visitItem.id] = visitItem.total_visits;
              totalVisits += visitItem.total_visits;
            }
          });
        }
      }
    });
  }
  
  console.log(`👁️ Visitas totales procesadas del batch: ${totalVisits}`);
  return { totalVisits, itemVisits };
}

// FIX: Nueva función para obtener visitas de forma individual
async function getItemVisitsIndividually(token, itemIds) {
  if (!itemIds || !itemIds.length) {
    return { totalVisits: 0, itemVisits: {} };
  }
  
  console.log(`👁️ Obteniendo visitas individualmente para ${itemIds.length} productos`);
  
  let totalVisits = 0;
  const itemVisits = {};
  const promises = [];
  let completedRequests = 0;
  
  // Procesar hasta 5 items a la vez para no saturar la API (rate limiting)
  const batchSize = 5;
  
  for (let i = 0; i < Math.min(itemIds.length, 50); i += batchSize) {
    const batch = itemIds.slice(i, i + batchSize);
    
    // Crear promesas para cada item y esperar por ellas
    const batchPromises = batch.map(async (itemId) => {
      try {
        const url = new URL(`https://api.mercadolibre.com/visits/items`);
        url.searchParams.append('item_id', itemId);
        
        const response = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });
        
        if (!response.ok) {
          console.warn(`⚠️ Error al obtener visitas para item ${itemId}: ${response.status}`);
          return;
        }
        
        const visitData = await response.json();
        completedRequests++;
        
        if (visitData && Array.isArray(visitData) && visitData.length > 0 && visitData[0].total_visits) {
          const visits = visitData[0].total_visits;
          itemVisits[itemId] = visits;
          totalVisits += visits;
          
          if (completedRequests % 10 === 0) {
            console.log(`👁️ Progreso: ${completedRequests}/${Math.min(itemIds.length, 50)} requests completados`);
          }
        }
      } catch (error) {
        console.error(`❌ Error obteniendo visitas para ${itemId}:`, error.message);
      }
    });
    
    promises.push(...batchPromises);
    
    // Pequeña pausa entre batches para evitar rate limiting
    if (i + batchSize < itemIds.length) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  
  // Esperar a que todas las promesas se resuelvan
  await Promise.allSettled(promises);
  
  console.log(`👁️ Visitas totales obtenidas individualmente: ${totalVisits} de ${completedRequests} productos procesados`);
  return { totalVisits, itemVisits };
}

// Función para procesar datos de publicidad - FIX: Ahora usa el endpoint correcto
async function processAdvertising(adResponses, token, meliUserId) {
  let totalSpent = 0;
  
  // Primero intentamos procesar las respuestas que pudieran haber funcionado
  if (adResponses && adResponses.length > 0) {
    console.log(`📣 Procesando ${adResponses.length} respuestas de publicidad`);
    
    adResponses.forEach(adResponse => {
      if (adResponse && adResponse.success && adResponse.data) {
        const campaignsData = adResponse.data;
        
        // Sumar gastos de campañas activas
        if (Array.isArray(campaignsData)) {
          campaignsData.forEach(campaign => {
            if (campaign && campaign.status === 'ACTIVE' && campaign.spent) {
              totalSpent += campaign.spent;
            }
          });
        }
      }
    });
    
    if (totalSpent > 0) {
      console.log(`📣 Gastos en publicidad procesados (endpoint original): ${totalSpent}`);
      return totalSpent;
    }
  }
  
  // Si no tenemos datos de publicidad, intentamos con el endpoint correcto
  try {
    if (!token || !meliUserId) {
      return 0;
    }
    
    console.log(`📣 Intentando obtener datos de publicidad desde endpoint correcto para usuario ${meliUserId}`);
    
    // FIX: Usar el endpoint correcto para campañas de publicidad
    const url = new URL(`https://api.mercadolibre.com/advertising/campaigns/search`);
    url.searchParams.append('seller_id', meliUserId);
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      console.warn(`⚠️ No se pudo obtener data de publicidad: ${response.status}. Esto es normal si el vendedor no tiene campañas.`);
      return 0;
    }
    
    const campaignData = await response.json();
    
    if (campaignData && campaignData.results) {
      campaignData.results.forEach(campaign => {
        if (campaign && campaign.status === 'ACTIVE' && campaign.spent) {
          totalSpent += campaign.spent;
        }
      });
    }
    
    console.log(`📣 Gastos en publicidad procesados (endpoint correcto): ${totalSpent}`);
    return totalSpent;
  } catch (error) {
    console.error("❌ Error procesando datos de publicidad:", error.message);
    return 0; // Devolvemos 0 para no romper el dashboard
  }
}

// Función principal para obtener un token válido
async function getValidToken(userId, supabaseClient) {
  try {
    // Buscar token existente
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('meli_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (tokenError) {
      console.error("❌ Error obteniendo token:", tokenError.message);
      return { success: false, error: "Error obteniendo token: " + tokenError.message };
    }
    
    if (!tokenData) {
      console.error("❌ No se encontró token para usuario:", userId);
      return { success: false, error: "No existe conexión con MercadoLibre" };
    }
    
    console.log(`✅ Token encontrado para meli_user_id: ${tokenData.meli_user_id}`);
    
    // Verificar si el token expiró
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    console.log(`⏰ Token actual expira en: ${expiresAt.toISOString()}`);
    console.log(`⏰ Hora actual: ${now.toISOString()}`);
    
    // Si el token está por expirar o ya expiró
    if (expiresAt.getTime() - now.getTime() < 10 * 60 * 1000) {
      console.log("⚠️ Token expirando pronto o ya expirado, refrescando...");
      
      // Actualizar con refresh token
      const clientId = Deno.env.get("MERCADOLIBRE_APP_ID");
      const clientSecret = Deno.env.get("MERCADOLIBRE_CLIENT_SECRET");
      
      if (!clientId || !clientSecret) {
        return { success: false, error: "Faltan credenciales de MercadoLibre" };
      }
      
      const refreshUrl = "https://api.mercadolibre.com/oauth/token";
      const refreshResponse = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokenData.refresh_token,
        })
      });
      
      if (!refreshResponse.ok) {
        const refreshError = await refreshResponse.text();
        console.error("❌ Error refrescando token:", refreshError);
        return { success: false, error: "Error refrescando token: " + refreshError };
      }
      
      const refreshData = await refreshResponse.json();
      
      // Calcular expiración
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshData.expires_in);
      
      // Actualizar en Supabase
      const { error: updateError } = await supabaseClient
        .from('meli_tokens')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tokenData.id);
      
      if (updateError) {
        console.error("❌ Error actualizando token:", updateError.message);
        return { success: false, error: "Error actualizando token: " + updateError.message };
      }
      
      console.log("✅ Token actualizado correctamente");
      
      return {
        success: true,
        token: refreshData.access_token,
        meliUserId: tokenData.meli_user_id
      };
    }
    
    // Si el token sigue siendo válido
    console.log("✅ Token válido, usando el existente");
    return {
      success: true,
      token: tokenData.access_token,
      meliUserId: tokenData.meli_user_id
    };
  } catch (error) {
    console.error("❌ Error inesperado obteniendo token:", error);
    return { success: false, error: "Error inesperado obteniendo token: " + error.message };
  }
}

// Función para hacer batch de requests a la API de MeLi
async function batchRequests(token, requests) {
  const results = [];
  
  if (!requests || !Array.isArray(requests) || requests.length === 0) {
    return results;
  }
  
  // Iterar sobre cada solicitud
  for (const request of requests) {
    try {
      const { endpoint, params = {} } = request;
      
      // Construir URL con parámetros
      const url = new URL(`https://api.mercadolibre.com${endpoint}`);
      
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      }
      
      console.log(`🌐 Llamando a ${endpoint}:`, url.toString());
      
      // Realizar solicitud
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error en ${endpoint}: ${response.status}`, errorText);
        results.push({
          endpoint,
          url: url.toString(),
          success: false,
          status: response.status,
          error: errorText
        });
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ ${endpoint} respondió correctamente`);
      
      results.push({
        endpoint,
        url: url.toString(),
        success: true,
        status: response.status,
        data
      });
    } catch (error) {
      console.error(`❌ Error en ${request.endpoint}:`, error.message);
      results.push({
        endpoint: request.endpoint,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// Función para procesar datos del periodo previo
function calculatePreviousPeriod(currentPeriod, dateRange, batchResults) {
  // Implementación simple para prueba - en producción habría que hacer llamadas adicionales
  const prevSummary = { ...currentPeriod.summary };
  // Reducir valores en 10-20% para simular diferencia con periodo anterior
  Object.keys(prevSummary).forEach(key => {
    if (typeof prevSummary[key] === 'number') {
      prevSummary[key] *= (0.8 + Math.random() * 0.1);
    }
  });
  
  return prevSummary;
}

serve(async (req) => {
  // Manejar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Crear cliente de Supabase
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      throw new Error("Faltan credenciales de Supabase");
    }
    
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    
    // Parsear body de la petición
    const body = await req.json();
    const { user_id, batch_requests, date_range, timezone, prev_period, use_cache, disable_test_data } = body;
    
    console.log(`🔷 Solicitud recibida para user_id: ${user_id}, timezone: ${timezone}`);
    console.log(`🔷 Rango de fechas:`, date_range);
    console.log(`🔷 Batch requests:`, batch_requests ? `${batch_requests.length} solicitudes` : "N/A");
    console.log(`🔷 Generar test data:`, !disable_test_data);
    
    // Si no hay user_id, verificar solo la conexión
    if (!user_id && !batch_requests) {
      const { data: userData, error } = await supabaseClient
        .from('meli_tokens')
        .select('meli_user_id')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return responseWithCors({
        success: !error,
        is_connected: !!userData,
        meli_user_id: userData?.meli_user_id
      });
    }
    
    // Obtener token válido
    const tokenResult = await getValidToken(user_id, supabaseClient);
    
    if (!tokenResult.success) {
      return responseWithCors({
        success: false,
        error: tokenResult.error
      }, 400);
    }
    
    // Si no hay batch_requests, solo verificar conexión
    if (!batch_requests) {
      return responseWithCors({
        success: true,
        is_connected: true,
        meli_user_id: tokenResult.meliUserId
      });
    }
    
    // Realizar batch de solicitudes
    const batchResults = await batchRequests(tokenResult.token, batch_requests);
    
    // Extraer datos relevantes de las respuestas
    const ordersResponses = batchResults.filter(res => 
      res.success && 
      (res.endpoint === '/orders/search' || res.endpoint === '/orders/search/recent')
    );
    
    // FIX: Las respuestas de visitas mediante batch probablemente fallaron
    // Las mantenemos para compatibilidad pero ahora usaremos solicitudes individuales
    const visitsResponses = batchResults.filter(res => 
      res.success && res.endpoint === '/visits/items'
    );
    
    // FIX: Las respuestas de publicidad probablemente fallaron
    // Las mantenemos para compatibilidad pero intentaremos con el endpoint correcto
    const adResponses = batchResults.filter(res => 
      res.success && 
      (res.endpoint.includes('/ads/campaigns') || res.endpoint.includes('/advertising/campaigns'))
    );
    
    // ---- Procesamiento de datos ----
    let dashboardData = null;
    let isTestData = false;
    
    // Extraer las órdenes de todas las páginas
    let allOrders = [];
    ordersResponses.forEach(orderResponse => {
      if (orderResponse.data && orderResponse.data.results) {
        const validOrders = orderResponse.data.results.filter(order => 
          order && order.status !== 'cancelled' && order.order_items
        );
        allOrders = [...allOrders, ...validOrders];
      }
    });
    
    console.log(`🛒 Se encontraron ${allOrders.length} órdenes válidas de ${ordersResponses.reduce((acc, res) => acc + (res.data?.results?.length || 0), 0)} totales`);
    
    // Extrae todos los product IDs de las órdenes que necesitamos para visitas
    const orderProductIds = [];
    allOrders.forEach(order => {
      if (order.order_items) {
        order.order_items.forEach(item => {
          if (item.item && item.item.id && !orderProductIds.includes(item.item.id)) {
            orderProductIds.push(item.item.id);
          }
        });
      }
    });
    
    console.log(`🔍 Productos únicos encontrados en órdenes: ${orderProductIds.length}`);
    
    // Extraer también los product IDs de las respuestas de productos del vendedor
    const productsResponse = batchResults.find(res => 
      res.success && res.endpoint.includes('/users/') && res.endpoint.includes('/items/search')
    );
    
    let sellerProductIds = [];
    
    if (productsResponse && productsResponse.data && productsResponse.data.results) {
      sellerProductIds = productsResponse.data.results.filter(id => !orderProductIds.includes(id));
    }
    
    // Combinar ambos conjuntos de IDs para visitas
    const allProductIds = [...orderProductIds, ...sellerProductIds];
    
    console.log(`🔍 Total products IDs para procesar visitas: ${allProductIds.length}`);
    
    // Si hay órdenes, procesarlas; de lo contrario, usar datos de prueba si están permitidos
    if (allOrders.length > 0) {
      // FIX: Proceso de visitas mejorado para obtener datos por item_id individualmente
      let visitsData;
      
      // Primero intentamos procesar las respuestas batch que pudieron haber funcionado
      const batchVisitsData = await processVisits(visitsResponses);
      
      // Si no hay suficientes visitas del batch, intentamos individualmente
      if (batchVisitsData.totalVisits === 0 && allProductIds.length > 0) {
        visitsData = await getItemVisitsIndividually(tokenResult.token, allProductIds);
      } else {
        visitsData = batchVisitsData;
      }
      
      // FIX: Proceso de publicidad mejorado con el endpoint correcto
      const advertisingSpent = await processAdvertising(
        adResponses, 
        tokenResult.token, 
        tokenResult.meliUserId
      );
      
      // Procesar órdenes para obtener métricas
      const salesByProduct = {}; // Para cruzar con visitas
      const processedData = processOrders(allOrders, salesByProduct);
      
      // Actualizar campos adicionales
      processedData.summary.visits = visitsData.totalVisits;
      processedData.summary.advertising = advertisingSpent;
      
      // Calcular conversión si hay visitas
      if (visitsData.totalVisits > 0) {
        processedData.summary.conversion = (processedData.summary.units / visitsData.totalVisits) * 100;
      }
      
      // Calcular ticket promedio
      if (processedData.summary.orders > 0) {
        processedData.summary.avgTicket = processedData.summary.gmv / processedData.summary.orders;
      }
      
      // Calcular datos de periodo anterior si se solicita
      let prevSummary = {};
      if (prev_period) {
        prevSummary = calculatePreviousPeriod(processedData, date_range, batchResults);
      }
      
      dashboardData = {
        ...processedData,
        orders: allOrders,
        prev_summary: prevSummary
      };
      
      console.log("📊 Dashboard data generada con datos reales");
    } else if (!disable_test_data) {
      // Si no hay órdenes y se permiten datos de prueba
      dashboardData = generateTestData(date_range);
      isTestData = true;
      console.log("🧪 Usando datos de prueba al no encontrar órdenes reales");
    } else {
      console.log("⚠️ No se encontraron órdenes y los datos de prueba están desactivados");
    }
    
    return responseWithCors({
      success: true,
      batch_results: batchResults,
      dashboard_data: dashboardData,
      is_test_data: isTestData
    });
    
  } catch (error) {
    console.error("❌ Error en el servidor:", error);
    return responseWithCors({
      success: false,
      error: `Error en el servidor: ${error.message}`
    }, 500);
  }
});
