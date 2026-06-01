import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { conversationTokenModule } from "../ai/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TAG = "[voice-token]";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const requestId = crypto.randomUUID().slice(0, 8);
  const start = performance.now();
  console.log(`${TAG} ▶ Invoked [req=${requestId}]`);

  try {
    const result = await conversationTokenModule.getToken();

    const elapsed = (performance.now() - start).toFixed(0);
    console.log(`${TAG} ✔ Token obtained — total: ${elapsed}ms`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const elapsed = (performance.now() - start).toFixed(0);
    console.error(`${TAG} ✘ FATAL [req=${requestId}] after ${elapsed}ms:`, error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
