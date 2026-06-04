import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Greenn Webhook Payload:", JSON.stringify(body, null, 2));

    // Basic validation of required fields
    const status = body.currentStatus || body.status;
    const email = body.customer?.email || body.client?.email || body.email;
    const event = body.event; // Some webhooks use an 'event' field

    if (!email && !event) {
      console.error("Missing mandatory fields in payload");
      return new Response(JSON.stringify({ error: "Missing mandatory fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const subscriptionId = body.subscription?.id || body.id;

    console.log(`Processing event: ${status || event} for email: ${email}`);

    if (email) {
      let plano = "free";
      let plano_expiracao = null;

      // Map Greenn statuses to local plan logic
      if (status === "paid") {
        plano = "pro";
        const expiresAt = body.subscription?.expires_at || body.expires_at;
        plano_expiracao = expiresAt ? new Date(expiresAt).toISOString() : new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();
      } else if (status === "unpaid") {
        plano = "pro"; // Maintain access for a grace period
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
        .eq("email", email);

      if (updateError) {
        console.error("Error updating profile:", updateError);
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Webhook processed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook processing error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
