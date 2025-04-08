
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
    console.log("Initializing meli-disconnect function");

    // Create a Supabase client with the service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Extract user_id from request body
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      throw new Error("Missing user_id parameter");
    }

    console.log(`Processing disconnect request for user ${user_id}`);

    // Get the user's tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('meli_tokens')
      .select('access_token, refresh_token')
      .eq('user_id', user_id)
      .single();

    if (tokenError) {
      console.error("Error fetching token data:", tokenError);
      throw new Error(`Error fetching token data: ${tokenError.message}`);
    }

    if (!tokenData || !tokenData.access_token) {
      console.log("No tokens found for user, nothing to revoke");
      // Delete any potential token records anyway
      await supabase
        .from('meli_tokens')
        .delete()
        .eq('user_id', user_id);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "No tokens found to revoke",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Call MeLi's revocation endpoint
    console.log("Calling Mercado Libre's token revocation endpoint");
    try {
      const revokeResponse = await fetch(`https://api.mercadolibre.com/oauth/revoke?access_token=${tokenData.access_token}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!revokeResponse.ok) {
        const errorData = await revokeResponse.text();
        console.error("Token revocation failed:", errorData);
        // Continue with token deletion anyway, even if revocation fails
        console.log("Proceeding with token deletion despite revocation failure");
      } else {
        console.log("Token successfully revoked on Mercado Libre");
      }
    } catch (revokeError) {
      console.error("Error calling revocation endpoint:", revokeError);
      // Continue with token deletion anyway
    }

    // Delete the tokens from database
    console.log("Deleting tokens from database");
    const { error: deleteError } = await supabase
      .from('meli_tokens')
      .delete()
      .eq('user_id', user_id);

    if (deleteError) {
      console.error("Error deleting tokens:", deleteError);
      throw new Error(`Error deleting tokens: ${deleteError.message}`);
    }

    console.log("Successfully disconnected Mercado Libre for user:", user_id);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Mercado Libre account disconnected successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in meli-disconnect function:", error);
    
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
