
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const MELI_APP_ID = "8830083472538103";
const MELI_CLIENT_SECRET = "Wqfg0W6BDmK690ceKfiidQmuHposiCfg";
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
    if (!MELI_APP_ID || !MELI_CLIENT_SECRET) {
      throw new Error("Missing MELI_APP_ID or MELI_CLIENT_SECRET environment variables");
    }

    // Create a Supabase client with the service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { code, redirect_uri, user_id } = body;

    if (!code) {
      throw new Error("Missing code parameter");
    }

    if (!redirect_uri) {
      throw new Error("Missing redirect_uri parameter");
    }

    if (!user_id) {
      throw new Error("Missing user_id parameter");
    }

    console.log(`Exchanging code for access token for user ${user_id}`);
    
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

    // Store the tokens in the database
    // First check if the user already has tokens stored
    const { data: existingTokens, error: checkError } = await supabase
      .from('meli_tokens')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for existing tokens:", checkError);
      throw new Error(`Error checking for existing tokens: ${checkError.message}`);
    }

    let dbOperation;
    
    if (existingTokens) {
      // Update existing tokens
      dbOperation = supabase
        .from('meli_tokens')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          meli_user_id: tokenData.user_id,
          expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);
    } else {
      // Insert new tokens
      dbOperation = supabase
        .from('meli_tokens')
        .insert({
          user_id: user_id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          meli_user_id: tokenData.user_id,
          expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    const { error: dbError } = await dbOperation;

    if (dbError) {
      console.error("Error storing tokens in the database:", dbError);
      throw new Error(`Error storing tokens: ${dbError.message}`);
    }

    console.log("Successfully stored tokens in database for user:", user_id);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Authentication successful",
        meli_user_id: tokenData.user_id,
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
