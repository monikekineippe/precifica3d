import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    console.log("Greenn webhook payload:", JSON.stringify(payload));

    // Extract email and status from Greenn payload
    const email = payload?.customer?.email || payload?.client?.email;
    const status = payload?.currentStatus || payload?.status;
    const subscriptionId = payload?.subscription?.id || payload?.id || "";

    if (!email) {
      console.error("No email found in payload");
      return new Response(JSON.stringify({ error: "No email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by email
    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData?.users?.find((u) => u.email === email);

    if (!user) {
      console.error(`User not found for email: ${email}`);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let plano = "free";
    let planoExpiracao: string | null = null;

    switch (status) {
      case "paid":
      case "active":
        plano = "pro";
        // Set expiration to 35 days from now (monthly + buffer)
        const exp = new Date();
        exp.setDate(exp.getDate() + 35);
        planoExpiracao = exp.toISOString();
        break;

      case "unpaid":
        // Keep pro for 3 more days
        plano = "pro";
        const grace = new Date();
        grace.setDate(grace.getDate() + 3);
        planoExpiracao = grace.toISOString();
        break;

      case "canceled":
      case "finished":
      case "refunded":
        plano = "free";
        planoExpiracao = null;
        break;

      default:
        console.log(`Unhandled status: ${status}`);
        return new Response(JSON.stringify({ ok: true, message: "Status ignored" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        plano,
        plano_expiracao: planoExpiracao,
        greenn_assinatura_id: String(subscriptionId),
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Update error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Updated user ${email} to plan: ${plano}`);
    return new Response(JSON.stringify({ ok: true, plano }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
