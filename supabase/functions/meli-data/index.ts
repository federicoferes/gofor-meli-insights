
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
          batch_results: [] // Always include batch_results, even if empty
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

    // If no endpoint was specified and no batch requests, just return connection status
    if (!endpoint && batch_requests.length === 0) {
      console.log("Returning connection status only");
      return new Response(
        JSON.stringify({
          success: true,
          message: "User is connected to Mercado Libre",
          is_connected: true,
          meli_user_id: tokenData.meli_user_id,
          batch_results: [] // Always include batch_results, even if empty
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Process batch requests if present
    if (batch_requests.length > 0) {
      console.log(`Processing ${batch_requests.length} batch requests`);
      
      try {
        const batchResults = await Promise.all(
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
        
        // Process and calculate metrics if we have the dashboard data
        const dashboardData = processDashboardData(batchResults, date_range);
        
        return new Response(
          JSON.stringify({
            success: true,
            batch_results: batchResults,
            dashboard_data: dashboardData
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      } catch (error) {
        console.error("Error processing batch requests:", error);
        
        // Return a consistent response even in case of error
        return new Response(
          JSON.stringify({
            success: false,
            message: error.message || "Error processing batch requests",
            batch_results: [] // Always include batch_results, even if empty
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    }

    // Process single request if no batch
    console.log(`Making request to Mercado Libre API: ${endpoint}`);

    // Make the request to Mercado Libre API
    try {
      const apiUrl = new URL(`https://api.mercadolibre.com${endpoint}`);
      
      // Add query parameters
      if (method === "GET" && params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            apiUrl.searchParams.append(key, String(value));
          }
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
          batch_results: [] // Always include batch_results, even if empty
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (error) {
      console.error("Error in single request:", error);
      
      // Return a consistent response even in case of error
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message || "Error making single request",
          batch_results: [] // Always include batch_results, even if empty
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("Error in meli-data function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "An unexpected error occurred",
        batch_results: [] // Always include batch_results, even if empty
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function isDateInRange(dateStr: string, dateRange: any): boolean {
  if (!dateStr || !dateRange || !dateRange.begin || !dateRange.end) return true;
  
  try {
    // Parse the input date
    const date = new Date(dateStr);
    
    // Parse the range dates
    let from, to;
    
    // Handle both ISO string and date object formats
    if (typeof dateRange.begin === 'string') {
      from = new Date(dateRange.begin);
    } else {
      from = dateRange.begin;
    }
    
    if (typeof dateRange.end === 'string') {
      to = new Date(dateRange.end);
    } else {
      to = dateRange.end;
    }
    
    // Adjust the hours for correct comparison
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    
    console.log(`Checking if ${date.toISOString()} is between ${from.toISOString()} and ${to.toISOString()}: ${date >= from && date <= to}`);
    
    return date >= from && date <= to;
  } catch (error) {
    console.error("Error in isDateInRange:", error);
    return false;
  }
}

function processDashboardData(batchResults: any[], dateRange: any) {
  try {
    // Initialize dashboard data structure
    const dashboardData = {
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
      costDistribution: [],
      topProducts: [],
      salesByProvince: []
    };
    
    // Find orders data in batch results
    if (!batchResults || !Array.isArray(batchResults)) {
      console.log("No valid batch results found");
      return dashboardData;
    }
    
    const ordersResult = batchResults.find(result => 
      result && result.endpoint && result.endpoint.includes('/orders/search') && result.success
    );
    
    if (!ordersResult || !ordersResult.data || !ordersResult.data.results) {
      console.log("No valid orders data found in batch results");
      return dashboardData;
    }
    
    // Filtramos las órdenes por el rango de fechas
    const allOrders = ordersResult.data.results;
    console.log(`Total orders before filtering: ${allOrders.length}`);
    
    const orders = dateRange ? 
      allOrders.filter(order => isDateInRange(order.date_created, dateRange)) : 
      allOrders;
    
    console.log(`Processing ${orders.length} orders for dashboard metrics (filtered from ${allOrders.length})`);
    console.log(`Date range used for filtering: ${JSON.stringify(dateRange)}`);
    
    if (orders.length === 0) {
      return dashboardData;
    }
    
    // Calculate GMV and units
    let totalAmount = 0;
    let totalUnits = 0;
    const productSales = new Map(); // For tracking top products
    const monthSales = new Map(); // For tracking sales by month
    const provinceSales = new Map(); // For tracking sales by province
    
    // Process each order
    orders.forEach(order => {
      if (!order) return;
      
      // Calculate order amount - this is the key calculation for GMV
      const orderAmount = Number(order.total_amount) || 0;
      totalAmount += orderAmount;
      
      // Calculate total units in this order
      let orderUnits = 0;
      if (order.order_items) {
        orderUnits = order.order_items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      }
      totalUnits += orderUnits;
      
      // Track products for top products calculation
      if (order.order_items) {
        order.order_items.forEach(item => {
          const productId = item.item?.id;
          const productName = item.item?.title || 'Producto sin nombre';
          const quantity = item.quantity || 0;
          const unitPrice = item.unit_price || 0;
          const revenue = quantity * unitPrice;
          
          if (productId) {
            if (productSales.has(productId)) {
              const current = productSales.get(productId);
              productSales.set(productId, {
                ...current,
                units: current.units + quantity,
                revenue: current.revenue + revenue
              });
            } else {
              productSales.set(productId, {
                id: productId,
                name: productName,
                units: quantity,
                revenue: revenue
              });
            }
          }
        });
      }
      
      // Track sales by month
      if (order.date_created) {
        const orderDate = new Date(order.date_created);
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
        const monthName = new Intl.DateTimeFormat('es', { month: 'short' }).format(orderDate);
        
        if (monthSales.has(monthKey)) {
          monthSales.set(monthKey, {
            ...monthSales.get(monthKey),
            value: monthSales.get(monthKey).value + orderAmount
          });
        } else {
          monthSales.set(monthKey, {
            key: monthKey,
            name: monthName,
            value: orderAmount
          });
        }
      }
      
      // Track sales by province if shipping data exists
      if (order.shipping && order.shipping.receiver_address && order.shipping.receiver_address.state && order.shipping.receiver_address.state.name) {
        const provinceName = order.shipping.receiver_address.state.name;
        
        if (provinceSales.has(provinceName)) {
          provinceSales.set(provinceName, provinceSales.get(provinceName) + orderAmount);
        } else {
          provinceSales.set(provinceName, orderAmount);
        }
      }
    });
    
    // Calculate average ticket
    const avgTicket = totalUnits > 0 ? totalAmount / totalUnits : 0;
    
    // Calculate estimated costs based on percentages
    const commissions = totalAmount * 0.07; // 7% commissions
    const taxes = totalAmount * 0.17;      // 17% taxes
    const shipping = totalAmount * 0.03;   // 3% shipping
    const discounts = totalAmount * 0.05;  // 5% discounts
    const refunds = totalAmount * 0.02;    // 2% refunds
    const iva = totalAmount * 0.21;        // 21% IVA
    
    // Estimate visits and conversion
    const visits = totalUnits * 25; // Roughly 25 visits per unit sold
    const conversion = visits > 0 ? (totalUnits / visits) * 100 : 0;
    
    // Set summary data
    dashboardData.summary = {
      gmv: totalAmount,
      units: totalUnits,
      avgTicket,
      commissions,
      taxes,
      shipping,
      discounts,
      refunds,
      iva,
      visits,
      conversion
    };
    
    // Set sales by month (last 6 months or all if less)
    dashboardData.salesByMonth = Array.from(monthSales.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6); // Last 6 months
    
    // Set cost distribution
    dashboardData.costDistribution = [
      { name: 'Comisiones', value: commissions },
      { name: 'Impuestos', value: taxes },
      { name: 'Envíos', value: shipping },
      { name: 'Descuentos', value: discounts },
      { name: 'Anulaciones', value: refunds }
    ];
    
    // Set top products (top 5 by revenue)
    dashboardData.topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Set sales by province
    dashboardData.salesByProvince = Array.from(provinceSales.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    console.log("Successfully calculated dashboard metrics");
    console.log(`GMV calculated: ${totalAmount} from ${orders.length} orders`);
    return dashboardData;
  } catch (error) {
    console.error("Error processing dashboard data:", error);
    // Return empty dashboard data structure on error
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
      costDistribution: [],
      topProducts: [],
      salesByProvince: []
    };
  }
}
