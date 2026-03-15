import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pieceName, filamentType } = await req.json();
    if (!pieceName || !filamentType) {
      return new Response(JSON.stringify({ error: "pieceName and filamentType required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um consultor de precificação de impressão 3D no Brasil. Responda APENAS com JSON válido, sem markdown."
          },
          {
            role: "user",
            content: `Sou um vendedor de peças impressas em 3D no Brasil. Estou precificando uma peça do tipo '${pieceName}' feita em ${filamentType}. Qual a margem de lucro percentual praticada no mercado brasileiro para este tipo de peça? Considere os perfis: decorativo, funcional/industrial, miniatura/colecionável e customizado/personalizado. Responda APENAS com JSON no formato: { "categoria": "decorativo|funcional|miniatura|customizado", "margem_minima": 0, "margem_sugerida": 0, "margem_maxima": 0, "justificativa": "texto curto explicando a sugestão" }`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      // fallback
    }

    return new Response(JSON.stringify({
      categoria: "decorativo",
      margem_minima: 80,
      margem_sugerida: 150,
      margem_maxima: 250,
      justificativa: "Margem padrão sugerida. A IA não retornou resultado específico.",
      fallback: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("margin-suggestion error:", e);
    return new Response(JSON.stringify({
      categoria: "decorativo",
      margem_minima: 80,
      margem_sugerida: 150,
      margem_maxima: 250,
      justificativa: "Margem padrão aplicada. Ajuste conforme sua experiência.",
      fallback: true,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
