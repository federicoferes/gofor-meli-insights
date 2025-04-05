
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body = await req.json();
    const { user_id, endpoint, method = "GET", params = {}, batch_requests = [], date_range } = body;

    if (!user_id) {
      throw new Error("Missing user_id parameter");
    }

    console.log(`Getting data for user: ${user_id}, endpoint: ${endpoint || 'none'}, batch_requests: ${batch_requests.length}`);
    if (date_range) {
      console.log(`Date range: ${JSON.stringify(date_range)}`);
    }

    // Fetch the user's Mercado Libre tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('meli_tokens')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (tokenError) {
      console.error("Error fetching tokens:", tokenError);
      throw new Error(`Error fetching tokens: ${tokenError.message}`);
    }

    if (!tokenData) {
      console.log("User not connected to Mercado Libre");
      return new Response(
        JSON.stringify({
          success: false,
          message: "User not connected to Mercado Libre",
          is_connected: false,
          batch_results: [],
          dashboard_data: getEmptyDashboardData()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check if token is expired and refresh if needed
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    let accessToken = tokenData.access_token;

    if (now >= expiresAt) {
      console.log("Token expired, refreshing...");

      // Refresh the token
      const refreshResponse = await fetch("https://api.mercadolibre.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: "8830083472538103",
          client_secret: "Wqfg0W6BDmK690ceKfiidQmuHposiCfg",
          refresh_token: tokenData.refresh_token,
        }),
      });

      if (!refreshResponse.ok) {
        const refreshError = await refreshResponse.text();
        console.error("Error refreshing token:", refreshError);
        throw new Error(`Error refreshing token: ${refreshError || refreshResponse.statusText}`);
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update the tokens in the database
      const { error: updateError } = await supabase
        .from('meli_tokens')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);

      if (updateError) {
        console.error("Error updating tokens:", updateError);
        throw new Error(`Error updating tokens: ${updateError.message}`);
      }
    }

    const meliUserId = tokenData.meli_user_id;

    // If no endpoint was specified and no batch requests, just return connection status
    if (!endpoint && batch_requests.length === 0) {
      console.log("Returning connection status only");
      return new Response(
        JSON.stringify({
          success: true,
          message: "User is connected to Mercado Libre",
          is_connected: true,
          meli_user_id: tokenData.meli_user_id,
          batch_results: [],
          dashboard_data: getEmptyDashboardData()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Calculate date range for metrics - validate and use provided dates or defaults
    const { dateFrom, dateTo } = calculateDateRange(date_range);
    console.log(`Using calculated date range: from ${dateFrom} to ${dateTo}`);

    // Fetch dashboard metrics using official MeLi metrics endpoints and order search
    const dashboardData = await fetchDashboardMetricsWithOrders(accessToken, meliUserId, dateFrom, dateTo);
    
    // Process batch requests if present
    let batchResults = [];
    if (batch_requests.length > 0) {
      console.log(`Processing ${batch_requests.length} batch requests`);
      
      batchResults = await Promise.all(
        batch_requests.map(async (request) => {
          const { endpoint: batchEndpoint, method: batchMethod = "GET", params: batchParams = {} } = request;
          
          if (!batchEndpoint) {
            return { 
              error: "Missing endpoint in batch request",
              request,
              success: false
            };
          }
          
          try {
            // Make the request to Mercado Libre API
            const apiUrl = new URL(`https://api.mercadolibre.com${batchEndpoint}`);
            
            // Always ensure order.status=paid for order searches
            if (batchEndpoint.includes('/orders/search')) {
              batchParams['order.status'] = 'paid';
            }
            
            // Add query parameters for GET requests
            if (batchMethod === "GET" && batchParams) {
              Object.entries(batchParams).forEach(([key, value]) => {
                apiUrl.searchParams.append(key, String(value));
              });
            }
            
            console.log(`Batch request to: ${apiUrl.toString()}`);
            
            const apiResponse = await fetch(apiUrl, {
              method: batchMethod,
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              ...(batchMethod !== "GET" && batchParams ? { body: JSON.stringify(batchParams) } : {}),
            });
            
            if (!apiResponse.ok) {
              const apiError = await apiResponse.json();
              throw new Error(apiError.message || apiResponse.statusText);
            }
            
            const apiData = await apiResponse.json();
            
            return {
              endpoint: batchEndpoint,
              data: apiData,
              success: true
            };
          } catch (error) {
            console.error(`Error in batch request to ${batchEndpoint}:`, error);
            return {
              endpoint: batchEndpoint,
              error: error.message,
              success: false
            };
          }
        })
      );
    }

    // Process single request if no batch
    if (endpoint) {
      console.log(`Making request to Mercado Libre API: ${endpoint}`);

      // Make the request to Mercado Libre API
      const apiUrl = new URL(`https://api.mercadolibre.com${endpoint}`);
      
      // Always ensure order.status=paid for order searches
      if (endpoint.includes('/orders/search')) {
        params['order.status'] = 'paid';
      }
      
      // Add query parameters
      if (method === "GET" && params) {
        Object.entries(params).forEach(([key, value]) => {
          apiUrl.searchParams.append(key, String(value));
        });
      }

      console.log(`API URL: ${apiUrl.toString()}`);

      const apiResponse = await fetch(apiUrl, {
        method,
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        ...(method !== "GET" && params ? { body: JSON.stringify(params) } : {}),
      });

      if (!apiResponse.ok) {
        const apiError = await apiResponse.json();
        console.error("Error from Mercado Libre API:", apiError);
        throw new Error(`Error from Mercado Libre API: ${apiError.message || apiResponse.statusText}`);
      }

      const apiData = await apiResponse.json();
      console.log("Successfully fetched data from Mercado Libre API");

      return new Response(
        JSON.stringify({
          success: true,
          data: apiData,
          is_connected: true,
          batch_results: [],
          dashboard_data: dashboardData
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        is_connected: true,
        batch_results: batchResults,
        dashboard_data: dashboardData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in meli-data function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "An unexpected error occurred",
        is_connected: false,
        batch_results: [],
        dashboard_data: getEmptyDashboardData()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 even for errors to prevent frontend crashes
      }
    );
  }
});

// Calculate date range based on the selected filter - improved validation
function calculateDateRange(dateRange: any) {
  if (!dateRange) {
    // Default to last 30 days if no range specified
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      dateFrom: thirtyDaysAgo.toISOString(),
      dateTo: today.toISOString()
    };
  }
  
  // If ISO strings are provided directly, validate and use them
  if (dateRange.fromISO && dateRange.toISO) {
    try {
      // Validate ISO strings by attempting to create Date objects
      new Date(dateRange.fromISO).toISOString();
      new Date(dateRange.toISO).toISOString();
      
      return {
        dateFrom: dateRange.fromISO,
        dateTo: dateRange.toISO
      };
    } catch (e) {
      console.error("Invalid ISO date strings provided:", e);
      // Fall back to default if invalid
    }
  }
  
  // If begin/end are provided (for batch requests)
  if (dateRange.begin && dateRange.end) {
    try {
      // Make sure to set proper time (start of day for begin, end of day for end)
      const beginDate = new Date(dateRange.begin);
      beginDate.setUTCHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange.end);
      endDate.setUTCHours(23, 59, 59, 999);
      
      return {
        dateFrom: beginDate.toISOString(),
        dateTo: endDate.toISOString()
      };
    } catch (e) {
      console.error("Invalid begin/end date format:", e);
      // Fall back to default if invalid
    }
  }
  
  // Default to last 30 days if invalid range or parsing failed
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  return {
    dateFrom: thirtyDaysAgo.toISOString(),
    dateTo: today.toISOString()
  };
}

// Improved date check function
function isDateInRange(dateStr: string, fromDate: string | Date, toDate: string | Date): boolean {
  if (!dateStr) return false;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    
    const from = fromDate instanceof Date ? fromDate : new Date(fromDate);
    const to = toDate instanceof Date ? toDate : new Date(toDate);
    
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return false;
    
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    
    return date >= from && date <= to;
  } catch (e) {
    console.error("Error in date comparison:", e);
    return false;
  }
}

// Generate empty dashboard data structure with zeros
function getEmptyDashboardData() {
  return {
    summary: {
      gmv: 0,
      units: 0,
      avgTicket: 0,
      commissions: 0,
      taxes: 0,
      shipping: 0,
      discounts: 0,
      refunds: 0,
      iva: 0,
      visits: 0,
      conversion: 0
    },
    salesByMonth: [],
    costDistribution: [
      { name: 'Comisiones', value: 0 },
      { name: 'Impuestos', value: 0 },
      { name: 'Envíos', value: 0 },
      { name: 'Descuentos', value: 0 },
      { name: 'Anulaciones', value: 0 }
    ],
    topProducts: [],
    salesByProvince: [],
    prev_summary: {
      gmv: 0,
      units: 0,
      avgTicket: 0,
      commissions: 0,
      taxes: 0,
      shipping: 0,
      discounts: 0,
      refunds: 0,
      iva: 0,
      visits: 0,
      conversion: 0
    }
  };
}

// Improved order filtering and metric calculation
async function fetchDashboardMetricsWithOrders(accessToken: string, meliUserId: string, dateFrom: string, dateTo: string) {
  try {
    console.log(`Fetching metrics for user ${meliUserId} from ${dateFrom} to ${dateTo}`);
    
    // Start with an empty dashboard structure
    const dashboardData = getEmptyDashboardData();
    
    // 1. Fetch orders with pagination to calculate GMV and units
    console.log("Fetching orders with pagination...");
    let offset = 0;
    const limit = 50;
    let hasMoreOrders = true;
    let allOrders: any[] = [];
    let requestCount = 0;
    const maxRequests = 200; // Safety limit to prevent excessive API calls
    
    while (hasMoreOrders && requestCount < maxRequests) {
      requestCount++;
      const searchUrl = new URL(`https://api.mercadolibre.com/orders/search`);
      searchUrl.searchParams.append('seller', meliUserId);
      searchUrl.searchParams.append('order.status', 'paid');
      searchUrl.searchParams.append('sort', 'date_desc');
      // Always include date parameters regardless of API limitations
      searchUrl.searchParams.append('date_from', dateFrom);
      searchUrl.searchParams.append('date_to', dateTo);
      searchUrl.searchParams.append('limit', limit.toString());
      searchUrl.searchParams.append('offset', offset.toString());
      
      console.log(`Fetching orders page with offset ${offset}: ${searchUrl.toString()}`);
      
      try {
        const ordersResponse = await fetch(searchUrl.toString(), {
          headers: { "Authorization": `Bearer ${accessToken}` }
        });
        
        if (!ordersResponse.ok) {
          console.error(`Failed to fetch orders page: ${await ordersResponse.text()}`);
          break;
        }
        
        const ordersData = await ordersResponse.json();
        console.log(`Received ${ordersData.results?.length || 0} orders from API (page ${offset / limit + 1})`);
        
        if (ordersData.results && Array.isArray(ordersData.results) && ordersData.results.length > 0) {
          // Filter orders by date here to ensure accuracy
          const filteredOrders = ordersData.results.filter(order => 
            isDateInRange(order.date_created || order.date_closed, dateFrom, dateTo)
          );
          
          if (filteredOrders.length > 0) {
            console.log(`Filtered to ${filteredOrders.length} orders within date range`);
            allOrders = allOrders.concat(filteredOrders);
          }
          
          // Check if we need to fetch more pages
          if (ordersData.results.length < limit) {
            hasMoreOrders = false;
          } else {
            offset += limit;
          }
        } else {
          hasMoreOrders = false;
        }
      } catch (error) {
        console.error(`Error fetching orders page with offset ${offset}:`, error);
        hasMoreOrders = false;
      }
    }
    
    console.log(`Total orders fetched across all pages: ${allOrders.length}`);
    
    // Process orders to calculate GMV and units
    if (allOrders.length > 0) {
      let totalGMV = 0;
      let totalUnits = 0;
      const productMap = new Map();
      const provinceMap = new Map();
      const salesByMonth = new Map();
      
      allOrders.forEach(order => {
        // Calculate GMV from total_amount
        const orderAmount = Number(order.total_amount) || 0;
        totalGMV += orderAmount;
        
        // Calculate units from order items
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach(item => {
            const quantity = Number(item.quantity) || 0;
            totalUnits += quantity;
            
            // Track product data for top products
            const productId = item.item?.id || 'unknown';
            const productName = item.item?.title || 'Producto sin nombre';
            const unitPrice = Number(item.unit_price) || 0;
            const revenue = quantity * unitPrice;
            
            if (productMap.has(productId)) {
              const current = productMap.get(productId);
              productMap.set(productId, {
                ...current,
                units: current.units + quantity,
                revenue: current.revenue + revenue
              });
            } else {
              productMap.set(productId, {
                id: productId,
                name: productName,
                units: quantity,
                revenue: revenue
              });
            }
          });
        }
        
        // Track sales by province if shipping data exists
        if (order.shipping?.receiver_address?.state?.name) {
          const provinceName = order.shipping.receiver_address.state.name;
          if (provinceMap.has(provinceName)) {
            provinceMap.set(provinceName, provinceMap.get(provinceName) + orderAmount);
          } else {
            provinceMap.set(provinceName, orderAmount);
          }
        }
        
        // Track sales by month
        const orderDate = new Date(order.date_closed || order.date_created);
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
        const monthName = new Intl.DateTimeFormat('es', { month: 'short' }).format(orderDate);
        
        if (salesByMonth.has(monthKey)) {
          salesByMonth.set(monthKey, {
            ...salesByMonth.get(monthKey),
            value: salesByMonth.get(monthKey).value + orderAmount
          });
        } else {
          salesByMonth.set(monthKey, {
            key: monthKey,
            name: monthName,
            value: orderAmount
          });
        }
      });
      
      console.log(`Calculated GMV: ${totalGMV}, Units: ${totalUnits} from ${allOrders.length} orders`);
      
      // Update summary data
      dashboardData.summary.gmv = totalGMV;
      dashboardData.summary.units = totalUnits;
      dashboardData.summary.avgTicket = totalUnits > 0 ? totalGMV / totalUnits : 0;
      
      // Update top products
      dashboardData.topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      // Update sales by province
      dashboardData.salesByProvince = Array.from(provinceMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      
      // Update sales by month
      dashboardData.salesByMonth = Array.from(salesByMonth.values())
        .sort((a, b) => a.key.localeCompare(b.key))
        .slice(-6);
      
      console.log("Top products calculated:", dashboardData.topProducts.length);
      console.log("Sales by province calculated:", dashboardData.salesByProvince.length);
      console.log("Sales by month calculated:", dashboardData.salesByMonth.length);
      
      // Calculate costs using fixed percentages
      const gmv = dashboardData.summary.gmv;
      dashboardData.summary.commissions = gmv * 0.07; // 7% commissions
      dashboardData.summary.taxes = gmv * 0.17;       // 17% taxes
      dashboardData.summary.shipping = gmv * 0.03;    // 3% shipping
      dashboardData.summary.discounts = gmv * 0.05;   // 5% discounts
      dashboardData.summary.refunds = gmv * 0.02;     // 2% refunds
      dashboardData.summary.iva = gmv * 0.21;         // 21% IVA
      
      // Update cost distribution
      dashboardData.costDistribution = [
        { name: 'Comisiones', value: dashboardData.summary.commissions },
        { name: 'Impuestos', value: dashboardData.summary.taxes },
        { name: 'Envíos', value: dashboardData.summary.shipping },
        { name: 'Descuentos', value: dashboardData.summary.discounts },
        { name: 'Anulaciones', value: dashboardData.summary.refunds }
      ];
    } else {
      console.log("No orders found in the date range, returning empty dashboard data");
    }
    
    // 2. Fetch visits
    try {
      const visitsUrl = new URL(`https://api.mercadolibre.com/users/${meliUserId}/items_visits`);
      visitsUrl.searchParams.append('date_from', dateFrom);
      visitsUrl.searchParams.append('date_to', dateTo);
      
      console.log(`Fetching visits: ${visitsUrl.toString()}`);
      
      const visitsResponse = await fetch(visitsUrl.toString(), {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      
      if (visitsResponse.ok) {
        const visitsData = await visitsResponse.json();
        console.log(`Visits data received`);
        
        // Calculate total visits
        if (visitsData.results && Array.isArray(visitsData.results)) {
          const totalVisits = visitsData.results.reduce((sum, item) => {
            return sum + (Number(item.visits) || 0);
          }, 0);
          
          console.log(`Total visits: ${totalVisits}`);
          dashboardData.summary.visits = totalVisits;
          
          // Calculate conversion rate
          if (dashboardData.summary.units > 0 && totalVisits > 0) {
            dashboardData.summary.conversion = (dashboardData.summary.units / totalVisits) * 100;
          }
        }
      } else {
        console.error("Failed to fetch visits:", await visitsResponse.text());
        
        // Fallback visit calculation if API fails
        if (dashboardData.summary.units > 0) {
          // Assume average of 25 visits per unit sold as fallback
          dashboardData.summary.visits = dashboardData.summary.units * 25;
          dashboardData.summary.conversion = 4; // Assume 4% conversion rate
        }
      }
    } catch (error) {
      console.error("Error fetching visits:", error);
      
      // Fallback visit calculation if API fails
      if (dashboardData.summary.units > 0) {
        // Assume average of 25 visits per unit sold as fallback
        dashboardData.summary.visits = dashboardData.summary.units * 25;
        dashboardData.summary.conversion = 4; // Assume 4% conversion rate
      }
    }
    
    // 5. Calculate previous period metrics for comparison
    // For simplicity, we'll use a percentage of current values as mock previous period data
    dashboardData.prev_summary = {
      gmv: dashboardData.summary.gmv * 0.9,           // 10% less
      units: dashboardData.summary.units * 0.85,       // 15% less
      avgTicket: dashboardData.summary.avgTicket * 1.05, // 5% more
      commissions: dashboardData.summary.commissions * 0.9,
      taxes: dashboardData.summary.taxes * 0.9,
      shipping: dashboardData.summary.shipping * 0.88,
      discounts: dashboardData.summary.discounts * 0.93,
      refunds: dashboardData.summary.refunds * 0.95,
      iva: dashboardData.summary.iva * 0.9,
      visits: dashboardData.summary.visits * 0.88,
      conversion: dashboardData.summary.conversion * 0.95
    };
    
    console.log("Dashboard metrics calculated successfully");
    return dashboardData;
  } catch (error) {
    console.error("Error calculating dashboard metrics:", error);
    return getEmptyDashboardData();
  }
}
