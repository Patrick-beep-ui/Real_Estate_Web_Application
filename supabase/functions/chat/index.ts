import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chatModule } from "../ai/index.ts";

const TAG = "[chat]";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID().slice(0, 8);
  const start = performance.now();
  console.log(`${TAG} ▶ Invoked [req=${requestId}]`);

  try {
    const { messages } = await req.json();
    console.log(`${TAG} Messages: ${messages?.length || 0} total`);

    const lastUserMsg = [...(messages || [])].reverse().find((m: any) => m.role === "user");
    if (lastUserMsg) {
      const truncated = lastUserMsg.content?.substring(0, 100) || "(empty)";
      console.log(`${TAG} Last user message: "${truncated}${lastUserMsg.content?.length > 100 ? "..." : ""}"`);
    }

    const aiStart = performance.now();
    const aiResponse = await chatModule.chat(messages);
    const aiElapsed = (performance.now() - aiStart).toFixed(0);
    console.log(`${TAG} ✔ Gemini response received after ${aiElapsed}ms`);

    const totalElapsed = (performance.now() - start).toFixed(0);
    console.log(`${TAG} Total time: ${totalElapsed}ms [req=${requestId}]`);

    return new Response(JSON.stringify({ text: aiResponse.text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const elapsed = (performance.now() - start).toFixed(0);
    console.error(`${TAG} ✘ FATAL [req=${requestId}] after ${elapsed}ms:`, e);

    const status = (e as any)?.status;
    if (status === 429) {
      console.warn(`${TAG} ✘ Rate limited [429]`);
      return new Response(
        JSON.stringify({ error: "We're getting a lot of questions right now. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
