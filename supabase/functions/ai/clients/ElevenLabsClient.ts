/// <reference lib="deno.ns" />

import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const TAG = "[elevenlabs-client]";

export class ElevenLabsClient {
  async getConversationToken(): Promise<string> {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is not configured");

    const ELEVENLABS_AGENT_ID = Deno.env.get("ELEVENLABS_AGENT_ID");
    if (!ELEVENLABS_AGENT_ID) throw new Error("ELEVENLABS_AGENT_ID is not configured");

    console.log(`${TAG} Env: ELEVENLABS_API_KEY=✔, ELEVENLABS_AGENT_ID=✔`);
    console.log(`${TAG} Requesting token from ElevenLabs API...`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(ELEVENLABS_AGENT_ID)}`,
      {
        headers: { "xi-api-key": ELEVENLABS_API_KEY },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ElevenLabs API error [${response.status}]: ${errorData}`);
    }

    const data = await response.json();
    const TokenSchema = z.object({ token: z.string().min(1) });
    const parsed = TokenSchema.safeParse(data);

    if (!parsed.success) {
      console.error(`${TAG} Token validation FAILED — response keys:`, Object.keys(data));
      throw new Error("Invalid token response from ElevenLabs");
    }

    return parsed.data.token;
  }
}
