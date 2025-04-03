
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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body = await req.json();
    const { user_id, endpoint, method = "GET", params = {} } = body;

    if (!user_id) {
      throw new Error("Missing user_id parameter");
    }

    // Fetch the user's Mercado Libre tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('meli_tokens')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (tokenError) {
      throw new Error(`Error fetching tokens: ${tokenError.message}`);
    }

    if (!tokenData) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User not connected to Mercado Libre",
          is_connected: false
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
        const refreshError = await refreshResponse.json();
        throw new Error(`Error refreshing token: ${refreshError.message || refreshResponse.statusText}`);
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
        throw new Error(`Error updating tokens: ${updateError.message}`);
      }
    }

    // If no endpoint was specified, just return connection status
    if (!endpoint) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "User is connected to Mercado Libre",
          is_connected: true,
          meli_user_id: tokenData.meli_user_id
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Make the request to Mercado Libre API
    const apiUrl = new URL(`https://api.mercadolibre.com${endpoint}`);
    
    // Add query parameters
    if (method === "GET" && params) {
      Object.entries(params).forEach(([key, value]) => {
        apiUrl.searchParams.append(key, String(value));
      });
    }

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
      throw new Error(`Error from Mercado Libre API: ${apiError.message || apiResponse.statusText}`);
    }

    const apiData = await apiResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        data: apiData
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
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
