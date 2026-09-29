import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TAG = "[chat]";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 🔁 Convert OpenAI-style messages → Gemini format
const toGeminiContents = (messages: any[]) => {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : m.role,
    parts: [{ text: m.content }],
  }));
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    console.log(`${TAG} GEMINI_API_KEY: ✔`);

    console.log(`${TAG} Calling Gemini API...`);
    const aiStart = performance.now();

    // 🧠 System prompt (as first message)
    const SYSTEM_PROMPT = `You are Tarek's AI assistant on the Tarek Buys Houses website. You help homeowners who need to sell their house fast for cash. You are friendly, empathetic, and knowledgeable about:
- How cash home buying works (no repairs, no agents, close in as little as 7 days)
- Common situations: divorce, foreclosure, inherited property, tax liens, downsizing, relocation, code violations, fire damage, probate, bankruptcy, behind on payments, bad tenants, hoarder houses, and more
- Markets we serve across Florida and other states
- The process: Submit info → Get a fair cash offer → Choose your closing date → Get paid

Key facts:
- We buy houses in ANY condition — no repairs or cleaning needed
- Zero fees, zero commissions — we cover all closing costs
- We can close in as little as 7 days or on your timeline
- No obligation — get a free, no-pressure cash offer
- Call us: (866) 407-3411
- Text us: (949) 295-2842

Be helpful and concise. If someone seems ready to sell, encourage them to fill out the form on the page, text us at (949) 295-2842, or call us at (866) 407-3411. Never give legal or financial advice — suggest they consult a professional for those questions. Keep responses under 150 words unless the question requires more detail.

Never state or imply a deadline for a cash offer, and never promise when the homeowner will hear back with an offer. This covers a 24-hour deadline ("in 24 hours", "within 24 hours"), a 24-48 hour range ("24-48 hours", "24 to 48 hours"), and any sub-48-hour promise ("within a day", "within one day", "same day", "same-day"). Do not soften them into "in just a day", "by tomorrow", or "often the same day". An offer follows the property walkthrough, so say the team will review their property and follow up. Closing speed is fine to mention — "close in as little as 7 days", "7-14 days", or "on your timeline".`;

    const geminiMessages = toGeminiContents(messages || []);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: SYSTEM_PROMPT }],
            },
            ...geminiMessages,
          ],
        }),
      }
    );

    const aiElapsed = (performance.now() - aiStart).toFixed(0);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`${TAG} ✘ Rate limited [429] after ${aiElapsed}ms`);
        return new Response(
          JSON.stringify({ error: "We're getting a lot of questions right now. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const t = await response.text();
      console.error(`${TAG} ✘ Gemini error [${response.status}] after ${aiElapsed}ms:`, t.substring(0, 300));

      return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log(`${TAG} ✔ Gemini response received after ${aiElapsed}ms`);

    const totalElapsed = (performance.now() - start).toFixed(0);
    console.log(`${TAG} Total time: ${totalElapsed}ms [req=${requestId}]`);

    // ✅ Return JSON instead of stream
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const elapsed = (performance.now() - start).toFixed(0);
    console.error(`${TAG} ✘ FATAL [req=${requestId}] after ${elapsed}ms:`, e);

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});