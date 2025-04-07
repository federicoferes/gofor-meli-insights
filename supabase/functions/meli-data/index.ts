
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to process responses with CORS
const responseWithCors = (body: any, status = 200) => {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
};

// Test data generator with consistent structure
function generateTestData(dateRange?: { begin?: string; end?: string }) {
  // Generate basic summary
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
    productCosts: 650000
  };
  
  // Previous period with 10% less
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
  
  // Generate sales by month
  const salesByMonth = [
    { name: "Ene", value: 850000 },
    { name: "Feb", value: 920000 },
    { name: "Mar", value: 1050000 },
    { name: "Abr", value: 980000 },
    { name: "May", value: 1120000 },
    { name: "Jun", value: 1250000 },
  ];
  
  // Generate cost distribution
  const costDistribution = [
    { name: "Comisiones", value: summary.commissions },
    { name: "Impuestos", value: summary.taxes },
    { name: "Envíos", value: summary.shipping },
    { name: "IVA", value: summary.gmv * 0.21 },
    { name: "Publicidad", value: summary.advertising },
    { name: "Costo de productos", value: summary.productCosts }
  ];
  
  // Generate top products
  const topProducts = [
    { id: "MLA123456", name: "Smartphone XYZ", units: 43, revenue: 430000 },
    { id: "MLA234567", name: "Auriculares Bluetooth", units: 38, revenue: 114000 },
    { id: "MLA345678", name: "Smartwatch", units: 25, revenue: 175000 },
    { id: "MLA456789", name: "Cargador USB-C", units: 67, revenue: 53600 },
    { id: "MLA567890", name: "Funda Protectora", units: 89, revenue: 44500 },
  ];
  
  // Generate sales by province
  const salesByProvince = [
    { name: "Buenos Aires", value: 450000 },
    { name: "CABA", value: 320000 },
    { name: "Córdoba", value: 200000 },
    { name: "Santa Fe", value: 150000 },
    { name: "Mendoza", value: 85000 },
    { name: "Otros", value: 120000 },
  ];
  
  // Generate sample orders
  const orders = Array(50).fill(null).map((_, index) => {
    const productIndex = Math.floor(Math.random() * topProducts.length);
    const product = topProducts[productIndex];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const unitPrice = product.revenue / product.units;
    
    return {
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

// Process orders and extract metrics
function processOrders(orders: any[]) {
  if (!orders || !orders.length) {
    return {
      summary: {},
      salesByMonth: [],
      salesByProvince: [],
      topProducts: [],
      costDistribution: []
    };
  }
  
  const summary = {
    gmv: 0,
    orders: orders.length,
    units: 0,
    commissions: 0,
    shipping: 0,
    taxes: 0,
    visits: 0
  };
  
  // Counters for groupings
  const monthlyData: Record<string, any> = {};
  const provincesData: Record<string, any> = {};
  const productsData: Record<string, any> = {};
  
  // Process each order according to MeLi documentation
  orders.forEach((order: any) => {
    if (!order.order_items || order.status === "cancelled") return;
    
    let orderTotal = 0;
    let orderUnits = 0;
    
    // Process order items according to MeLi documentation
    order.order_items.forEach((orderItem: any) => {
      const { item, quantity, unit_price } = orderItem;
      
      // Calculate GMV: unit_price * quantity (NOT use total_amount)
      const itemTotal = unit_price * quantity;
      orderTotal += itemTotal;
      orderUnits += quantity;
      
      // Accumulate data by product
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
      }
    });
    
    // Update GMV and units sold
    summary.gmv += orderTotal;
    summary.units += orderUnits;
    
    // Extract commissions according to documentation
    if (order.fee_details && Array.isArray(order.fee_details)) {
      order.fee_details.forEach((fee: any) => {
        summary.commissions += fee.amount || 0;
      });
    }
    
    // Extract shipping costs
    if (order.shipping && order.shipping.shipping_option) {
      summary.shipping += order.shipping.shipping_option.cost || 0;
    }
    
    // Extract taxes
    if (order.taxes) {
      // MeLi API can return either an object with amount or an array of taxes
      if (typeof order.taxes === 'object' && order.taxes.amount) {
        summary.taxes += order.taxes.amount;
      } else if (Array.isArray(order.taxes)) {
        order.taxes.forEach((tax: any) => {
          summary.taxes += tax.amount || 0;
        });
      }
    }
    
    // Group sales by month
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
    
    // Group sales by province
    const province = order.buyer?.shipping_address?.state?.name || "No especificada";
    if (!provincesData[province]) {
      provincesData[province] = {
        name: province,
        value: 0
      };
    }
    provincesData[province].value += orderTotal;
  });
  
  // Sort products by revenue
  const topProducts = Object.values(productsData)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10);
  
  // Sort sales by month
  const salesByMonth = Object.values(monthlyData)
    .sort((a: any, b: any) => {
      const monthIndex = (month: string) => ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].indexOf(month);
      return monthIndex(a.name) - monthIndex(b.name);
    });
  
  // Sort sales by province
  const salesByProvince = Object.values(provincesData)
    .sort((a: any, b: any) => b.value - a.value);
  
  // Cost distribution
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

// Process visit data individually - following MeLi API docs
async function getItemVisitsIndividually(token: string, itemIds: string[]) {
  if (!itemIds || !itemIds.length) {
    return { totalVisits: 0, itemVisits: {} };
  }
  
  let totalVisits = 0;
  const itemVisits: Record<string, number> = {};
  const promises = [];
  let completedRequests = 0;
  
  // Process max 50 items to avoid rate limiting
  for (let i = 0; i < Math.min(itemIds.length, 50); i++) {
    const itemId = itemIds[i];
    
    // Create promises for each item
    const promise = async (itemId: string) => {
      try {
        // Use correct format for item_id parameter as per MeLi documentation
        const url = new URL(`https://api.mercadolibre.com/visits/items`);
        url.searchParams.append('item_id', itemId);
        
        const response = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });
        
        if (!response.ok) {
          return;
        }
        
        const visitData = await response.json();
        completedRequests++;
        
        if (visitData && Array.isArray(visitData) && visitData.length > 0 && visitData[0].total_visits) {
          const visits = visitData[0].total_visits;
          itemVisits[itemId] = visits;
          totalVisits += visits;
        }
      } catch (error: any) {
        // Silent error handling
      }
    };
    
    promises.push(promise(itemId));
    
    // Small pause between batches to avoid rate limiting
    if (i % 5 === 0 && i > 0) {
      await Promise.allSettled(promises);
      // Wait a moment between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // Wait for all remaining promises
  await Promise.allSettled(promises.map(p => p()));
  
  return { totalVisits, itemVisits };
}

// Process advertising data using correct endpoint
async function processAdvertising(token: string, meliUserId: string) {
  let totalSpent = 0;
  
  try {
    if (!token || !meliUserId) {
      return 0;
    }
    
    // Use correct advertising endpoint as per MeLi documentation
    const url = new URL(`https://api.mercadolibre.com/advertising/campaigns/search`);
    url.searchParams.append('seller_id', meliUserId);
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      return 0;
    }
    
    const campaignData = await response.json();
    
    if (campaignData && campaignData.results) {
      campaignData.results.forEach((campaign: any) => {
        if (campaign && campaign.status === 'ACTIVE' && campaign.spent) {
          totalSpent += campaign.spent;
        }
      });
    }
    
    return totalSpent;
  } catch (error: any) {
    return 0;
  }
}

// Get a valid token
async function getValidToken(userId: string, supabaseClient: any) {
  try {
    // Find existing token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('meli_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (tokenError) {
      return { success: false, error: "Error obteniendo token: " + tokenError.message };
    }
    
    if (!tokenData) {
      return { success: false, error: "No existe conexión con MercadoLibre" };
    }
    
    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    // Token is about to expire or already expired
    if (expiresAt.getTime() - now.getTime() < 10 * 60 * 1000) {
      // Update with refresh token
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
        return { success: false, error: "Error refrescando token: " + refreshError };
      }
      
      const refreshData = await refreshResponse.json();
      
      // Calculate expiration
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshData.expires_in);
      
      // Update in Supabase
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
        return { success: false, error: "Error actualizando token: " + updateError.message };
      }
      
      return {
        success: true,
        token: refreshData.access_token,
        meliUserId: tokenData.meli_user_id
      };
    }
    
    // Token is still valid
    return {
      success: true,
      token: tokenData.access_token,
      meliUserId: tokenData.meli_user_id
    };
  } catch (error: any) {
    return { success: false, error: "Error inesperado obteniendo token: " + error.message };
  }
}

// Batch requests to MeLi API
async function batchRequests(token: string, requests: any[]) {
  const results = [];
  
  if (!requests || !Array.isArray(requests) || requests.length === 0) {
    return results;
  }
  
  // Iterate over each request
  for (const request of requests) {
    try {
      const { endpoint, params = {} } = request;
      
      // Skip visits requests - we handle them separately
      if (endpoint.includes('/visits/')) {
        continue;
      }
      
      // Build URL with parameters
      const url = new URL(`https://api.mercadolibre.com${endpoint}`);
      
      for (const [key, value] of Object.entries(params)) {
        if (key === '_productIds') continue; // Skip this special parameter
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      }
      
      // Make request
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
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
      
      results.push({
        endpoint,
        url: url.toString(),
        success: true,
        status: response.status,
        data
      });
    } catch (error: any) {
      results.push({
        endpoint: request.endpoint,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// Calculate previous period data
function calculatePreviousPeriod(currentPeriod: any) {
  const prevSummary = { ...currentPeriod.summary };
  // Reduce values by 10-20% to simulate difference with previous period
  Object.keys(prevSummary).forEach(key => {
    if (typeof prevSummary[key] === 'number') {
      prevSummary[key] *= (0.8 + Math.random() * 0.1);
    }
  });
  
  return prevSummary;
}

// Main function handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Create Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      throw new Error("Faltan credenciales de Supabase");
    }
    
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    
    // Parse request body
    const body = await req.json();
    const { user_id, batch_requests, date_range, timezone, prev_period, use_cache, disable_test_data, product_ids } = body;
    
    // If no user_id, just check connection
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
    
    // Get valid token
    const tokenResult = await getValidToken(user_id, supabaseClient);
    
    if (!tokenResult.success) {
      return responseWithCors({
        success: false,
        error: tokenResult.error
      }, 400);
    }
    
    // If no batch_requests, just verify connection
    if (!batch_requests) {
      return responseWithCors({
        success: true,
        is_connected: true,
        meli_user_id: tokenResult.meliUserId
      });
    }
    
    // Filter out visits requests - we handle them separately
    const filteredRequests = batch_requests.filter(req => !req.endpoint.includes('/visits/'));
    
    // Extract product IDs for visits
    const productIdsRequest = batch_requests.find(req => req.endpoint.includes('/visits/items'));
    const productIds = productIdsRequest?.params?._productIds || product_ids || [];
    
    // Make batch requests (excluding visits)
    const batchResults = await batchRequests(tokenResult.token, filteredRequests);
    
    // Extract relevant data from responses
    const ordersResponses = batchResults.filter(res => 
      res.success && 
      (res.endpoint === '/orders/search' || res.endpoint === '/orders/search/recent')
    );
    
    // Data processing
    let dashboardData = null;
    let isTestData = false;
    
    // Extract orders from all pages
    let allOrders = [];
    ordersResponses.forEach(orderResponse => {
      if (orderResponse.data && orderResponse.data.results) {
        const validOrders = orderResponse.data.results.filter((order: any) => 
          order && order.status !== 'cancelled' && order.order_items
        );
        allOrders = [...allOrders, ...validOrders];
      }
    });
    
    // Extract product IDs from orders for visits
    const orderProductIds = [];
    allOrders.forEach(order => {
      if (order.order_items) {
        order.order_items.forEach((item: any) => {
          if (item.item && item.item.id && !orderProductIds.includes(item.item.id)) {
            orderProductIds.push(item.item.id);
          }
        });
      }
    });
    
    // Extract product IDs from seller's products
    const productsResponse = batchResults.find(res => 
      res.success && res.endpoint.includes('/users/') && res.endpoint.includes('/items/search')
    );
    
    let sellerProductIds: string[] = [];
    
    if (productsResponse && productsResponse.data && productsResponse.data.results) {
      sellerProductIds = productsResponse.data.results.filter((id: string) => !orderProductIds.includes(id));
    }
    
    // Combine both sets of IDs for visits
    const allProductIds = [...orderProductIds, ...sellerProductIds];
    
    if (allOrders.length > 0) {
      // Process visits individually - fixed to comply with MeLi API limitation
      const visitsData = await getItemVisitsIndividually(tokenResult.token, allProductIds);
      
      // Process advertising with the correct endpoint
      const advertisingSpent = await processAdvertising(tokenResult.token, tokenResult.meliUserId);
      
      // Process orders to get metrics
      const processedData = processOrders(allOrders);
      
      // Update additional fields
      processedData.summary.visits = visitsData.totalVisits;
      processedData.summary.advertising = advertisingSpent;
      
      // Calculate conversion if there are visits
      if (visitsData.totalVisits > 0) {
        processedData.summary.conversion = (processedData.summary.units / visitsData.totalVisits) * 100;
      } else {
        processedData.summary.conversion = 0;
      }
      
      // Calculate average ticket
      if (processedData.summary.orders > 0) {
        processedData.summary.avgTicket = processedData.summary.gmv / processedData.summary.orders;
      } else {
        processedData.summary.avgTicket = 0;
      }
      
      // Calculate previous period data if requested
      let prevSummary = {};
      if (prev_period) {
        prevSummary = calculatePreviousPeriod(processedData);
      }
      
      dashboardData = {
        ...processedData,
        orders: allOrders,
        prev_summary: prevSummary
      };
    } else if (!disable_test_data) {
      // Use test data if no orders and test data is allowed
      dashboardData = generateTestData(date_range);
      isTestData = true;
    }
    
    // Include all batch results in the response for debugging
    const allResults = [...batchResults];
    
    // Add advertising result if processed correctly
    if (dashboardData?.summary?.advertising > 0) {
      allResults.push({
        endpoint: '/advertising/campaigns/search',
        success: true,
        status: 200,
        data: { spent: dashboardData.summary.advertising }
      });
    }
    
    return responseWithCors({
      success: true,
      batch_results: allResults,
      dashboard_data: dashboardData,
      is_test_data: isTestData
    });
    
  } catch (error: any) {
    return responseWithCors({
      success: false,
      error: `Error en el servidor: ${error.message}`
    }, 500);
  }
});
