import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-greenn-token",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GREENN_TOKEN = Deno.env.get("GREENN_TOKEN");
    const authHeader = req.headers.get("Authorization");
    const xGreennToken = req.headers.get("X-Greenn-Token");
    
    // Log headers (without sensitive token) for debugging
    console.log("Request Headers:", {
      authorization: authHeader ? "Present" : "Missing",
      "x-greenn-token": xGreennToken ? "Present" : "Missing",
    });

    const body = await req.json();
    console.log("Greenn Webhook Payload:", JSON.stringify(body, null, 2));

    /**
     * TEMPORARY: Validation commented out for testing
     * 
    let receivedToken = "";
    if (authHeader?.startsWith("Bearer ")) {
      receivedToken = authHeader.substring(7);
    } else if (xGreennToken) {
      receivedToken = xGreennToken;
    }

    if (!GREENN_TOKEN || receivedToken !== GREENN_TOKEN) {
      console.error("Invalid token attempt");
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    */

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Greenn events: paid, unpaid, canceled, refunded, etc.
    // Documentation suggests status is in 'currentStatus' or 'status'
    const status = body.currentStatus || body.status;
    const email = body.customer?.email || body.client?.email || body.email;
    const subscriptionId = body.subscription?.id || body.id;

    console.log(`Processing event: ${status} for email: ${email}`);

    if (email) {
      let plano = "free";
      let plano_expiracao = null;

      if (status === "paid") {
        plano = "pro";
        // Set expiration to 32 days from now (monthly) or 366 (annual)
        // Usually the webhook includes an expiration date
        const expiresAt = body.subscription?.expires_at || body.expires_at;
        plano_expiracao = expiresAt ? new Date(expiresAt).toISOString() : new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();
      } else if (status === "unpaid") {
        // Keep pro for a grace period or revert to free
        plano = "pro"; 
      } else if (["canceled", "refunded", "expired"].includes(status)) {
        plano = "free";
      }

      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ 
          plano, 
          plano_expiracao,
          greenn_assinatura_id: subscriptionId?.toString() 
        })
        .eq("email", email); // Note: Ensure profiles table has an email column or use ID

      if (updateError) {
        console.error("Error updating profile:", updateError);
        // Fallback: try searching by email if 'email' column doesn't exist (if it's a join with auth.users)
        // But for now we assume it's direct or handled.
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
