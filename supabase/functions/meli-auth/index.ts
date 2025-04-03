
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MELI_APP_ID = "8830083472538103";
const MELI_CLIENT_SECRET = "Wqfg0W6BDmK690ceKfiidQmuHposiCfg";

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
    if (!MELI_APP_ID || !MELI_CLIENT_SECRET) {
      throw new Error("Missing MELI_APP_ID or MELI_CLIENT_SECRET environment variables");
    }

    const body = await req.json();
    const { code, redirect_uri } = body;

    if (!code) {
      throw new Error("Missing code parameter");
    }

    if (!redirect_uri) {
      throw new Error("Missing redirect_uri parameter");
    }

    console.log("Exchanging code for access token");
    
    // Exchange code for access token with Mercado Libre
    const tokenResponse = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: MELI_APP_ID,
        client_secret: MELI_CLIENT_SECRET,
        code: code,
        redirect_uri: redirect_uri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange error:", errorData);
      throw new Error(`Error exchanging code for token: ${errorData.message || tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log("Successfully obtained access token");

    // Here you would typically store these tokens securely in your database
    // associated with the current user
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Authentication successful",
        // We don't return the actual tokens in the response for security reasons
        user_id: tokenData.user_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in meli-auth function:", error);
    
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
